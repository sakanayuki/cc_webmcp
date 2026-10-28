import type { Product } from './products.ts';
import { CATEGORY_LABELS } from './site.ts';

const PALETTE: Record<string, [string, string]> = {
  'true-wireless': ['#2f5d8a', '#8fb8de'],
  neckband: ['#3d7a5c', '#9fd3b8'],
  'over-ear': ['#6a4a8c', '#c0a5df'],
  sport: ['#b0572a', '#f0b48a'],
};

export function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function productAlt(p: Product): string {
  const s = p.specs;
  return `${p.name}のイメージ図（架空・プレースホルダー）。${CATEGORY_LABELS[p.category]}、${s.anc ? 'ノイズキャンセリングあり' : 'ノイズキャンセリングなし'}、再生${s.batteryHours}時間。`;
}

export function productSvg(p: Product): string {
  const [a, b] = PALETTE[p.category] ?? ['#444', '#aaa'];
  const alt = escapeXml(productAlt(p));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" role="img" aria-label="${alt}">
  <title>${alt}</title>
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
  <rect width="640" height="400" fill="url(#g)"/>
  <circle cx="250" cy="170" r="48" fill="#fff" fill-opacity="0.85"/>
  <circle cx="390" cy="170" r="48" fill="#fff" fill-opacity="0.85"/>
  <path d="M250 122 Q320 40 390 122" stroke="#fff" stroke-opacity="0.85" stroke-width="10" fill="none"/>
  <text x="320" y="300" text-anchor="middle" font-family="sans-serif" font-size="34" font-weight="700" fill="#fff">${escapeXml(p.name)}</text>
  <text x="320" y="345" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#fff" fill-opacity="0.9">SAMPLE / 架空の商品</text>
</svg>
`;
}
