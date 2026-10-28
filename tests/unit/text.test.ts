import { describe, expect, it } from 'vitest';
import { loadProducts } from '../../scripts/lib/products.ts';
import { SCENARIOS } from '../../scripts/lib/scenarios.ts';
import { SITE_URL } from '../../scripts/lib/site.ts';
import { jsonLdScript, llmsTxt, productJsonLd, productMarkdown, robotsTxt, sitemapXml } from '../../scripts/lib/text.ts';
import { esc } from '../../scripts/lib/html.ts';

const products = loadProducts();

describe('llms.txt', () => {
  const txt = llmsTxt(products);
  it('follows the llmstxt.org shape', () => {
    expect(txt.split('\n')[0]).toMatch(/^# /);
    expect(txt).toMatch(/^> /m);
    expect(txt).toMatch(/^## Optional$/m);
  });
  it('links every product under the sub-path', () => {
    for (const p of products) expect(txt).toContain(`${SITE_URL}products/${p.id}.md`);
    expect(txt).not.toMatch(/\]\(https:\/\/sakanayuki\.github\.io\/(?!cc_webmcp\/)/);
  });
});

describe('product artifacts', () => {
  it('JSON-LD carries price, currency and availability', () => {
    const out = products.find((p) => p.stock === 0)!;
    const ld = productJsonLd(out) as { offers: Record<string, unknown> };
    expect(ld.offers.priceCurrency).toBe('JPY');
    expect(ld.offers.price).toBe(out.priceJpy);
    expect(ld.offers.availability).toBe('https://schema.org/OutOfStock');
  });
  it('JSON-LD cannot break out of a script element', () => {
    expect(jsonLdScript({ x: '</script><script>alert(1)</script>' })).not.toContain('</script>');
  });
  it('Markdown states the fictional nature and the price', () => {
    const p = products[0]!;
    const md = productMarkdown(p);
    expect(md).toContain('架空');
    expect(md).toContain(`${p.priceJpy.toLocaleString('en-US')}円`);
  });
  it('HTML escaping covers quotes and angle brackets', () => {
    expect(esc(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
  });
});

describe('sitemap and robots', () => {
  it('lists absolute URLs', () => {
    const xml = sitemapXml(['', 'about.html']);
    expect(xml).toContain(`<loc>${SITE_URL}</loc>`);
    expect(xml).toContain(`<loc>${SITE_URL}about.html</loc>`);
  });
  it('robots.txt discloses that it is ineffective under a sub-path', () => {
    expect(robotsTxt()).toContain('実効性はありません');
  });
});

describe('scenarios', () => {
  it('compute expectations from the catalog', () => {
    const result = Object.fromEntries(SCENARIOS.map((s) => [s.id, s.expect(products)]));
    expect(result['commute-anc']!.ids).toEqual(['aurora-air', 'kumo-pod-anc', 'aurora-anc-pro']);
    expect(result['compare-battery']!.answer).toContain('Aurora ANC Pro');
    expect(result['running-ipx7']!.ids).toEqual(['aurora-sprint', 'tsubame-bone']);
    expect(result['lightest-anc']!.ids).toHaveLength(1);
    expect(result['cart-total']!.answer).toContain('62,400円');
  });
});
