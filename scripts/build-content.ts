// Generates every HTML page and AI-facing file into dist/ from data/products.json.
// Runs after `vite build` (which emits dist/assets/app.js and app.css).
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProducts } from './lib/products.ts';
import { POLICY_TITLE } from './lib/policies.ts';
import { productSvg } from './lib/svg.ts';
import { aboutPage, aiViewPage, catalogPage, policiesPage, productPage, scenariosPage, type Assets } from './lib/html.ts';
import {
  llmsFullTxt,
  llmsTxt,
  policiesMarkdown,
  productHtmlPath,
  productImagePath,
  productMarkdown,
  productMdPath,
  robotsTxt,
  sitemapXml,
} from './lib/text.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');

function write(rel: string, content: string): void {
  const file = join(dist, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

function stampedAsset(name: string): string {
  const file = join(dist, 'assets', name);
  if (!existsSync(file)) throw new Error(`Missing ${file}. Run "vite build" first.`);
  const hash = createHash('sha1').update(readFileSync(file)).digest('hex').slice(0, 8);
  return `${name}?v=${hash}`;
}

const assets: Assets = { css: stampedAsset('app.css'), js: stampedAsset('app.js') };
const products = loadProducts();

const pages: Array<[string, string]> = [
  ['index.html', catalogPage(assets, products)],
  ['policies.html', policiesPage(assets)],
  ['ai-view.html', aiViewPage(assets, products[0]!)],
  ['scenarios.html', scenariosPage(assets, products)],
  ['about.html', aboutPage(assets)],
];
for (const p of products) {
  pages.push([productHtmlPath(p), productPage(assets, p)]);
  write(productMdPath(p), productMarkdown(p));
  write(productImagePath(p), productSvg(p));
}
for (const [rel, html] of pages) write(rel, html);

write('policies.md', policiesMarkdown());
write('products.json', JSON.stringify(products, null, 2) + '\n');
write('llms.txt', llmsTxt(products));
write('llms-full.txt', llmsFullTxt(products));
write('robots.txt', robotsTxt());
// .nojekyll keeps GitHub Pages from running Jekyll over the artifact.
write('.nojekyll', '');
write('sitemap.xml', sitemapXml(['', ...pages.map(([rel]) => rel).filter((r) => r !== 'index.html')]));

console.log(`Generated ${pages.length} pages, ${products.length} products (${POLICY_TITLE}).`);
