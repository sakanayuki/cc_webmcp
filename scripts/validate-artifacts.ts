// Validates the built dist/ directory: AI-facing files must be consistent with
// each other and with data/products.json. Exits non-zero on any problem.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProducts } from './lib/products.ts';
import { BASE, SITE_URL } from './lib/site.ts';
import { productHtmlPath, productImagePath, productMdPath } from './lib/text.ts';

const dist = join(fileURLToPath(new URL('..', import.meta.url)), 'dist');
const errors: string[] = [];
const fail = (m: string) => errors.push(m);
const read = (rel: string): string => {
  const f = join(dist, rel);
  if (!existsSync(f)) {
    fail(`missing file: ${rel}`);
    return '';
  }
  return readFileSync(f, 'utf8');
};

/** Maps an absolute site URL to a dist-relative path, or null when external. */
function toRel(url: string): string | null {
  const noHash = url.split('#')[0]!.split('?')[0]!;
  if (noHash.startsWith(SITE_URL)) return noHash.slice(SITE_URL.length) || 'index.html';
  if (noHash.startsWith(BASE)) return noHash.slice(BASE.length) || 'index.html';
  return null;
}

const products = loadProducts();

// 1. llms.txt: structure and links
const llms = read('llms.txt');
if (!/^# .+/m.test(llms)) fail('llms.txt: missing H1');
if (!/^> .+/m.test(llms)) fail('llms.txt: missing blockquote summary');
const llmsLinks = [...llms.matchAll(/\]\((https?:[^)\s]+)\)/g)].map((m) => m[1]!);
for (const link of llmsLinks) {
  const rel = toRel(link);
  if (rel === null) fail(`llms.txt: external link not expected: ${link}`);
  else if (!existsSync(join(dist, rel))) fail(`llms.txt: dead link: ${link}`);
}
for (const p of products) {
  if (!llms.includes(SITE_URL + productMdPath(p))) fail(`llms.txt: missing product ${p.id}`);
}

// 2. per-product artifacts agree with products.json
const catalog = JSON.parse(read('products.json')) as typeof products;
if (catalog.length !== products.length) fail('products.json: count mismatch');
const llmsFull = read('llms-full.txt');
for (const p of products) {
  const price = `${p.priceJpy.toLocaleString('en-US')}円`;
  const html = read(productHtmlPath(p));
  const md = read(productMdPath(p));
  if (!existsSync(join(dist, productImagePath(p)))) fail(`${p.id}: missing image`);
  if (!html.includes(price)) fail(`${p.id}: price missing in HTML`);
  if (!md.includes(price)) fail(`${p.id}: price missing in Markdown`);
  if (!llmsFull.includes(`# ${p.name}`)) fail(`llms-full.txt: missing ${p.name}`);

  const m = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
  if (!m) {
    fail(`${p.id}: JSON-LD missing`);
    continue;
  }
  try {
    const ld = JSON.parse(m[1]!);
    if (ld['@type'] !== 'Product') fail(`${p.id}: JSON-LD @type`);
    if (ld.offers?.price !== p.priceJpy) fail(`${p.id}: JSON-LD price mismatch`);
    if (ld.offers?.priceCurrency !== 'JPY') fail(`${p.id}: JSON-LD currency`);
    const expected = `https://schema.org/${p.stock > 0 ? 'InStock' : 'OutOfStock'}`;
    if (ld.offers?.availability !== expected) fail(`${p.id}: JSON-LD availability mismatch`);
  } catch {
    fail(`${p.id}: JSON-LD is not valid JSON`);
  }
}

// 3. sitemap covers all HTML pages
const sitemap = read('sitemap.xml');
for (const p of products) {
  if (!sitemap.includes(SITE_URL + productHtmlPath(p))) fail(`sitemap.xml: missing ${p.id}`);
}
for (const page of ['policies.html', 'ai-view.html', 'scenarios.html', 'about.html']) {
  if (!sitemap.includes(SITE_URL + page)) fail(`sitemap.xml: missing ${page}`);
}

// 4. every page uses the sub-path base and no inline scripts (CSP)
const htmlFiles = ['index.html', 'policies.html', 'ai-view.html', 'scenarios.html', 'about.html', ...products.map(productHtmlPath)];
for (const f of htmlFiles) {
  const html = read(f);
  if (/href="\/(?!cc_webmcp\/)/.test(html) || /src="\/(?!cc_webmcp\/)/.test(html)) fail(`${f}: root-relative URL outside ${BASE}`);
  for (const [tag] of html.matchAll(/<script\b[^>]*>/g)) {
    if (!/\bsrc=/.test(tag) && !tag.includes('type="application/ld+json"')) fail(`${f}: inline script found`);
  }
  if (/\son[a-z]+=/.test(html)) fail(`${f}: inline event handler found`);
  if (!html.includes('Content-Security-Policy')) fail(`${f}: missing CSP meta`);
  for (const [, href] of html.matchAll(/(?:href|src)="(\/cc_webmcp\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
    const rel = href!.slice(BASE.length) || 'index.html';
    if (!existsSync(join(dist, rel))) fail(`${f}: dead internal link ${href}`);
  }
}

if (errors.length) {
  console.error(`Artifact validation failed (${errors.length}):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`Artifact validation passed: ${products.length} products, ${htmlFiles.length} pages.`);
