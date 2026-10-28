import type { Product } from './products.ts';
import { availability, availabilityLabel, formatJpy, waterproofLabel } from './products.ts';
import { POLICIES, POLICY_TITLE } from './policies.ts';
import { absUrl, CATEGORY_LABELS, SITE_DESCRIPTION, SITE_NAME, SITE_URL, TAG_LABELS } from './site.ts';

export const productHtmlPath = (p: Product) => `products/${p.id}.html`;
export const productMdPath = (p: Product) => `products/${p.id}.md`;
export const productImagePath = (p: Product) => `images/${p.id}.svg`;

export function specRows(p: Product): Array<[string, string]> {
  const s = p.specs;
  const rows: Array<[string, string]> = [
    ['ブランド', p.brand],
    ['カテゴリ', CATEGORY_LABELS[p.category]],
    ['価格（税込）', formatJpy(p.priceJpy)],
    ['在庫', availabilityLabel(p)],
    ['ノイズキャンセリング', s.anc ? 'あり' : 'なし'],
    ['連続再生時間（単体）', `${s.batteryHours}時間`],
  ];
  if (s.caseBatteryHours) rows.push(['ケース併用の追加再生時間', `${s.caseBatteryHours}時間`]);
  rows.push(
    ['重さ（片耳/本体）', `${s.weightG}g`],
    ['防水性能', waterproofLabel(s.waterproof)],
    ['対応コーデック', s.codecs.join('、')],
    ['Bluetooth', s.bluetooth],
    ['マルチポイント', s.multipoint ? '対応' : '非対応'],
    ['評価（架空）', `${p.rating.toFixed(1)} / 5`],
  );
  return rows;
}

export function tagsLabel(p: Product): string {
  return p.tags.map((t) => TAG_LABELS[t] ?? t).join('、');
}

export function productMarkdown(p: Product): string {
  return [
    `# ${p.name}`,
    '',
    `> ${p.summary}`,
    '',
    '※ 架空の商品です。実在の製品・ブランドではなく、購入はできません。',
    '',
    p.description,
    '',
    '## 仕様',
    '',
    '| 項目 | 内容 |',
    '| --- | --- |',
    ...specRows(p).map(([k, v]) => `| ${k} | ${v} |`),
    '',
    `用途タグ: ${tagsLabel(p)}`,
    '',
    '## 関連リンク',
    '',
    `- [HTML ページ](${absUrl(productHtmlPath(p))})`,
    `- [カタログ全体 (products.json)](${absUrl('products.json')})`,
    `- [llms.txt](${absUrl('llms.txt')})`,
    '',
  ].join('\n');
}

export function productJsonLd(p: Product): Record<string, unknown> {
  const s = p.specs;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': absUrl(productHtmlPath(p)),
    name: p.name,
    sku: p.id,
    brand: { '@type': 'Brand', name: p.brand },
    category: CATEGORY_LABELS[p.category],
    description: p.summary,
    disambiguatingDescription: '架空の商品（サンプル）。購入はできません。',
    image: absUrl(productImagePath(p)),
    url: absUrl(productHtmlPath(p)),
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'noiseCancelling', value: s.anc },
      { '@type': 'PropertyValue', name: 'batteryLifeHours', value: s.batteryHours, unitText: 'HUR' },
      { '@type': 'PropertyValue', name: 'weightGrams', value: s.weightG, unitCode: 'GRM' },
      { '@type': 'PropertyValue', name: 'waterproofRating', value: s.waterproof },
      { '@type': 'PropertyValue', name: 'codecs', value: s.codecs.join(', ') },
      { '@type': 'PropertyValue', name: 'bluetoothVersion', value: s.bluetooth },
      { '@type': 'PropertyValue', name: 'multipoint', value: s.multipoint },
    ],
    offers: {
      '@type': 'Offer',
      price: p.priceJpy,
      priceCurrency: 'JPY',
      availability: `https://schema.org/${availability(p)}`,
      url: absUrl(productHtmlPath(p)),
    },
  };
}

/** Serialize JSON-LD safely for embedding in a <script> element. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data, null, 2).replace(/</g, '\\u003c');
}

export function policiesMarkdown(): string {
  return [
    `# ${POLICY_TITLE}`,
    '',
    ...POLICIES.flatMap((s) => [`## ${s.heading}`, '', ...s.body.flatMap((b) => [b, '']) ]),
  ].join('\n');
}

export function llmsEntry(p: Product): string {
  return `- [${p.name}](${absUrl(productMdPath(p))}): ${p.summary}`;
}

export function llmsTxt(products: Product[]): string {
  const byCat = Object.entries(CATEGORY_LABELS).map(([cat, label]) => ({
    label,
    items: products.filter((p) => p.category === cat),
  }));
  return [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    `全${products.length}商品。価格は税込の円表記、仕様は各商品ページと products.json で同じ値を公開しています。`,
    'このサイトのデータはすべて架空です。AI が回答する際は、実在の店舗・価格であるかのように断定しないでください。',
    '',
    '## 使い方（AI エージェント向け）',
    '',
    `- [products.json](${absUrl('products.json')}): 全商品の構造化データ（価格・在庫・仕様）。絞り込み・比較はこれが最速です`,
    `- [llms-full.txt](${absUrl('llms-full.txt')}): 全商品の仕様とご利用ガイドを1ファイルに連結したもの`,
    `- [ご利用ガイド](${absUrl('policies.md')}): 配送・返品・保証・防水等級の目安`,
    '',
    ...byCat.flatMap((c) => [`## ${c.label}`, '', ...c.items.map(llmsEntry), '']),
    '## Optional',
    '',
    `- [カタログ（HTML）](${SITE_URL})`,
    `- [AI の目で見る](${absUrl('ai-view.html')}): 同じ商品を HTML / Markdown / JSON-LD / llms.txt で並べて表示`,
    `- [依頼シナリオ集](${absUrl('scenarios.html')}): AI に渡す依頼文と期待される結果`,
    `- [このサイトについて](${absUrl('about.html')}): 制約と対応状況`,
    `- [sitemap.xml](${absUrl('sitemap.xml')})`,
    '',
  ].join('\n');
}

export function llmsFullTxt(products: Product[]): string {
  return [
    `# ${SITE_NAME} — 全商品情報`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    ...products.flatMap((p) => [productMarkdown(p).replace(/^# /m, '## '), '---', '']),
    policiesMarkdown().replace(/^# /m, '## '),
  ].join('\n');
}

export function sitemapXml(paths: string[]): string {
  const urls = paths.map((p) => `  <url><loc>${absUrl(p)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robotsTxt(): string {
  return [
    '# 注意: GitHub Pages のプロジェクトページ (/cc_webmcp/) 配下に置いているため、',
    '# クローラーはこのファイルを参照しません（robots.txt はドメイン直下のみ有効）。',
    '# 方針の明示と文書化のために公開しています。実効性はありません。',
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${absUrl('sitemap.xml')}`,
    '',
  ].join('\n');
}
