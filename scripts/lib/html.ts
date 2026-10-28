import type { Product } from './products.ts';
import { availabilityLabel, formatJpy } from './products.ts';
import { POLICIES, POLICY_TITLE } from './policies.ts';
import { SCENARIOS } from './scenarios.ts';
import { productAlt } from './svg.ts';
import { absUrl, BASE, CATEGORY_LABELS, SITE_DESCRIPTION, SITE_NAME, TAG_LABELS } from './site.ts';
import {
  jsonLdScript,
  llmsEntry,
  productHtmlPath,
  productImagePath,
  productJsonLd,
  productMarkdown,
  productMdPath,
  specRows,
  tagsLabel,
} from './text.ts';

export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export type Assets = { css: string; js: string };

const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'self'",
].join('; ');

const NAV: Array<[string, string]> = [
  ['', 'カタログ'],
  ['policies.html', 'ご利用ガイド'],
  ['ai-view.html', 'AIの目で見る'],
  ['scenarios.html', '依頼シナリオ集'],
  ['about.html', 'このサイトについて'],
];

export type PageOptions = {
  path: string; // path relative to site root, '' for index
  title: string;
  description: string;
  body: string;
  markdownAlt?: string;
  jsonLd?: unknown;
};

export function layout(assets: Assets, o: PageOptions): string {
  const full = o.path === '' ? SITE_NAME : `${o.title} | ${SITE_NAME}`;
  const nav = NAV.map(([href, label]) => {
    const current = href === o.path ? ' aria-current="page"' : '';
    return `<li><a href="${BASE}${href}"${current}>${esc(label)}</a></li>`;
  }).join('');
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${esc(CSP)}">
<title>${esc(full)}</title>
<meta name="description" content="${esc(o.description)}">
<link rel="canonical" href="${absUrl(o.path)}">
<link rel="alternate" type="text/plain" title="llms.txt" href="${BASE}llms.txt">
${o.markdownAlt ? `<link rel="alternate" type="text/markdown" title="Markdown版" href="${BASE}${o.markdownAlt}">\n` : ''}<link rel="icon" href="data:,">
<link rel="stylesheet" href="${BASE}assets/${assets.css}">
<script type="module" src="${BASE}assets/${assets.js}"></script>
${o.jsonLd ? `<script type="application/ld+json">\n${jsonLdScript(o.jsonLd)}\n</script>\n` : ''}</head>
<body>
<a class="skip-link" href="#main">本文へ移動</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="${BASE}">${esc(SITE_NAME)}</a>
    <nav aria-label="メイン"><ul class="site-nav">${nav}</ul></nav>
    <label class="theme-label">テーマ
      <select id="theme-select" hidden>
        <option value="system">システム設定</option>
        <option value="light">ライト</option>
        <option value="dark">ダーク</option>
      </select>
    </label>
  </div>
</header>
<main id="main"><div class="wrap">
${o.body}
</div></main>
<footer class="site-footer"><div class="wrap">
  <p>これは AI エージェント連携の検証用に作られた架空のストアです。商品・価格・ブランドはすべて架空で、購入・決済はできません。</p>
  <p>AI 向けファイル:
    <a href="${BASE}llms.txt">llms.txt</a> ·
    <a href="${BASE}llms-full.txt">llms-full.txt</a> ·
    <a href="${BASE}products.json">products.json</a> ·
    <a href="${BASE}sitemap.xml">sitemap.xml</a>
  </p>
</div></footer>
</body>
</html>
`;
}

function notice(text: string): string {
  return `<div class="notice" role="note">${text}</div>`;
}

export function specTableHtml(p: Product): string {
  const rows = specRows(p)
    .map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`)
    .join('\n    ');
  return `<table>\n  <caption class="visually-hidden">${esc(p.name)}の仕様</caption>\n  <tbody>\n    ${rows}\n  </tbody>\n</table>`;
}

function productCard(p: Product): string {
  const text = [p.name, p.brand, p.summary, p.tags.join(' '), tagsLabel(p), CATEGORY_LABELS[p.category]].join(' ').toLowerCase();
  const out = p.stock === 0 ? '<span class="badge out">在庫切れ</span>' : '';
  const anc = p.specs.anc ? '<span class="badge">ANC</span>' : '';
  return `<li class="card" data-product data-category="${p.category}" data-price="${p.priceJpy}" data-anc="${p.specs.anc ? 1 : 0}" data-stock="${p.stock}" data-text="${esc(text)}">
  <a href="${BASE}${productHtmlPath(p)}" tabindex="-1" aria-hidden="true"><img src="${BASE}${productImagePath(p)}" alt="" width="640" height="400" loading="lazy"></a>
  <div class="card-body">
    <h3><a href="${BASE}${productHtmlPath(p)}">${esc(p.name)}</a></h3>
    <div class="price">${formatJpy(p.priceJpy)}</div>
    <div class="meta">${anc}${out}再生${p.specs.batteryHours}時間・${p.specs.weightG}g・${esc(CATEGORY_LABELS[p.category])}</div>
    <div class="meta">${esc(tagsLabel(p))}</div>
  </div>
</li>`;
}

export function catalogPage(assets: Assets, products: Product[]): string {
  const options = Object.entries(CATEGORY_LABELS)
    .map(([k, v]) => `<option value="${k}">${esc(v)}</option>`)
    .join('');
  const body = `<h1>${esc(SITE_NAME)}</h1>
<p class="lead">${esc(SITE_DESCRIPTION)}</p>
${notice('<strong>架空のストアです。</strong> 商品・価格はすべて架空で、購入や決済はできません。このページの内容は JavaScript なしでも、<a href="' + BASE + 'llms.txt">llms.txt</a> や <a href="' + BASE + 'products.json">products.json</a> からも読めます。')}
<form id="product-search" class="search" method="get" action="${BASE}" role="search" aria-label="商品検索">
  <label>キーワード<input type="search" name="q" autocomplete="off"></label>
  <label>カテゴリ<select name="category"><option value="">すべて</option>${options}</select></label>
  <label>上限価格（円）<input type="number" name="maxPrice" min="0" step="1000" inputmode="numeric"></label>
  <label class="check"><input type="checkbox" name="anc" value="1">ノイズキャンセリングあり</label>
  <label class="check"><input type="checkbox" name="inStock" value="1">在庫ありのみ</label>
  <button type="submit">検索</button>
</form>
<noscript><p>JavaScript が無効のため絞り込みはできません。全${products.length}商品を表示しています。</p></noscript>
<p id="search-status" role="status" aria-live="polite">全${products.length}件</p>
<ul id="product-list" class="grid">
${products.map(productCard).join('\n')}
</ul>`;
  return layout(assets, {
    path: '',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    body,
    markdownAlt: 'llms.txt',
  });
}

export function productPage(assets: Assets, p: Product): string {
  const body = `<nav aria-label="パンくず"><a href="${BASE}">カタログ</a> › ${esc(CATEGORY_LABELS[p.category])} › ${esc(p.name)}</nav>
<h1>${esc(p.name)}</h1>
${notice('架空の商品です。実在の製品・ブランドではなく、購入はできません。')}
<div class="product">
  <div><img src="${BASE}${productImagePath(p)}" alt="${esc(productAlt(p))}" width="640" height="400"></div>
  <div>
    <p class="price" style="font-size:1.5rem">${formatJpy(p.priceJpy)} <span class="meta">（税込）</span></p>
    <p>${esc(availabilityLabel(p))}</p>
    <p>${esc(p.summary)}</p>
    <ul class="links">
      <li><a href="${BASE}${productMdPath(p)}">Markdown 版</a></li>
      <li><a href="${BASE}products.json">products.json</a></li>
      <li><a href="${BASE}ai-view.html">AI の目で見る</a></li>
    </ul>
  </div>
</div>
<h2>商品説明</h2>
<p>${esc(p.description)}</p>
<h2>仕様</h2>
<div class="table-wrap">${specTableHtml(p)}</div>
<p class="meta">用途: ${esc(tagsLabel(p))}</p>`;
  return layout(assets, {
    path: productHtmlPath(p),
    title: p.name,
    description: p.summary,
    body,
    markdownAlt: productMdPath(p),
    jsonLd: productJsonLd(p),
  });
}

export function policiesPage(assets: Assets): string {
  const body = `<h1>${esc(POLICY_TITLE)}</h1>
${POLICIES.map((s) => `<h2>${esc(s.heading)}</h2>\n${s.body.map((b) => `<p>${esc(b)}</p>`).join('\n')}`).join('\n')}`;
  return layout(assets, {
    path: 'policies.html',
    title: POLICY_TITLE,
    description: '配送・返品・保証・防水等級の目安（すべて架空の規定）。',
    body,
    markdownAlt: 'policies.md',
  });
}

function codePanel(heading: string, note: string, code: string): string {
  return `<section><h3>${esc(heading)}</h3><p class="meta">${esc(note)}</p><pre><code>${esc(code)}</code></pre></section>`;
}

export function aiViewPage(assets: Assets, p: Product): string {
  const body = `<h1>AI の目で見る</h1>
<p class="lead">人間が検索結果を見比べる代わりに AI へ任せる場合、AI は画面ではなく下の「機械可読な面」を読みます。同じ商品「${esc(p.name)}」が、各面でどう見えるかを並べています。</p>
${notice('画像の見た目は AI にとって情報になりません。代わりに <code>alt</code> テキスト、仕様表、構造化データが判断材料になります。')}
<p>この商品の通常ページ: <a href="${BASE}${productHtmlPath(p)}">${esc(p.name)}</a></p>
<div class="panels">
${codePanel('1. HTML（JavaScript なしで読める）', '仕様表。クローラーは JS を実行しなくても読めます。', specTableHtml(p))}
${codePanel('2. Markdown（.md）', `${productMdPath(p)} — 同内容を Markdown で提供。`, productMarkdown(p))}
${codePanel('3. JSON-LD（schema.org/Product）', 'HTML の head に埋め込み。価格・在庫・ブランドが型付きで読めます。', JSON.stringify(productJsonLd(p), null, 2))}
${codePanel('4. llms.txt の該当行', '商品一覧のうち、この商品を指す1行。', llmsEntry(p))}
${codePanel('5. products.json の該当要素', '全商品の構造化データ。絞り込み・比較に最適。', JSON.stringify(p, null, 2))}
</div>`;
  return layout(assets, {
    path: 'ai-view.html',
    title: 'AIの目で見る',
    description: '同じ商品を HTML / Markdown / JSON-LD / llms.txt / products.json で並べて表示します。',
    body,
  });
}

export function scenariosPage(assets: Assets, products: Product[]): string {
  const items = SCENARIOS.map((s, i) => {
    const e = s.expect(products);
    const names = e.ids.map((id) => products.find((p) => p.id === id)?.name ?? id);
    return `<article class="scenario" id="${s.id}">
  <h2>シナリオ ${i + 1}</h2>
  <p>AI に渡す依頼文（コピーして使います）:</p>
  <blockquote>${esc(s.prompt)}</blockquote>
  <p><strong>期待される結果:</strong> ${esc(e.answer)}</p>
  <p class="meta">対象商品: ${esc(names.join('、'))}</p>
  <p class="meta">WebMCP ツールで実行する場合に期待されるツール: <code>${esc(s.expectedTools.join(', '))}</code>（${s.needsTools ? 'カート機能とツールの実装後に実行可能。現時点では未実装' : 'ツール未実装でも products.json / llms.txt からは回答可能'}）</p>
</article>`;
  }).join('\n');
  const body = `<h1>依頼シナリオ集</h1>
<p class="lead">「人間が検索しない」使い方を試すための依頼文と、このデータから導かれる期待結果です。期待結果はビルド時に products.json から計算しています。</p>
${notice('このページは AI を呼び出しません。依頼文を、ブラウジングやファイル取得ができる AI クライアントに貼り付けて試し、結果を期待結果と見比べてください。ツール経由で成功したかどうかと、AI が答えを出せたかどうかは別々に記録します。')}
${items}`;
  return layout(assets, {
    path: 'scenarios.html',
    title: '依頼シナリオ集',
    description: 'AI に任せる依頼文と、products.json から計算した期待結果。',
    body,
  });
}

export function aboutPage(assets: Assets): string {
  const status = [
    ['静的 HTML（JS なしで閲覧可能）', '実装済み'],
    ['llms.txt / llms-full.txt', '実装済み'],
    ['商品別 Markdown / JSON-LD / products.json', '実装済み'],
    ['sitemap.xml / robots.txt', '実装済み（robots.txt は実効性なし。下記参照）'],
    ['WebMCP 命令型ツール', '未実装（次フェーズ）'],
    ['WebMCP 宣言型フォーム', '未実装（次フェーズ・仕様未確認の実験扱い）'],
    ['カート / 比較ページ / 診断ページ', '未実装（次フェーズ）'],
    ['Agent interoperability（実エージェントでの検証）', 'not tested'],
  ]
    .map(([k, v]) => `<tr><th scope="row">${esc(k ?? '')}</th><td>${esc(v ?? '')}</td></tr>`)
    .join('\n');
  const body = `<h1>このサイトについて</h1>
<p>AI に探索・比較・操作を任せる世界を想定した、WebMCP と llms.txt の検証用サンプルです。すべて架空のデータで、サーバーもアカウントも API キーも使いません。</p>
<h2>現在の対応状況</h2>
<div class="table-wrap"><table><tbody>
${status}
</tbody></table></div>
<p class="meta">「登録できた」ことと「AI クライアントが実際に使えた」ことは別物として扱い、実際に試すまで interoperability は <code>not tested</code> のままにします。</p>
<h2>制約: サブパス公開</h2>
<p>このサイトは GitHub Pages のプロジェクトページ（<code>${esc(absUrl(''))}</code>）で公開されています。そのため <code>llms.txt</code> と <code>robots.txt</code> はドメイン直下ではなく <code>${BASE}</code> 配下にあります。</p>
<ul>
<li><code>llms.txt</code> は <a href="${BASE}llms.txt">${esc(absUrl('llms.txt'))}</a> にあります。ドメイン直下 <code>/llms.txt</code> を探す仕組みには見つかりません。代わりに各ページの <code>&lt;link rel="alternate"&gt;</code> とフッターから辿れるようにしています。</li>
<li><code>robots.txt</code> はクローラーに参照されません（ドメイン直下のみ有効）。文書化のために公開しています。</li>
<li>HTTP ヘッダーを設定できないため、CSP は <code>&lt;meta&gt;</code> タグで指定しています。</li>
</ul>
<h2>データの扱い</h2>
<p>商品・ブランド・価格・評価はすべて架空です。購入・決済・配送は行いません。実在の個人情報も扱いません。</p>
<h2>参照した仕様</h2>
<ul>
<li><a href="https://webmachinelearning.github.io/webmcp">WebMCP 公式ドラフト仕様</a>（Draft Community Group Report。W3C 標準ではありません）</li>
<li><a href="https://llmstxt.org/">llms.txt の提案</a></li>
</ul>`;
  return layout(assets, {
    path: 'about.html',
    title: 'このサイトについて',
    description: '対応状況、サブパス公開による制約、データの扱い。',
    body,
  });
}
