export const BASE = '/cc_webmcp/';
export const SITE_ORIGIN = 'https://sakanayuki.github.io';
export const SITE_URL = `${SITE_ORIGIN}${BASE}`;
export const SITE_NAME = 'Kikoe Audio（架空のオーディオストア）';
export const SITE_DESCRIPTION =
  '架空のワイヤレスイヤホン／ヘッドホン専門店。AIエージェントに探索・比較・操作を任せる使い方を検証するサンプルサイトです。実在の店舗ではなく、購入や決済はできません。';

export const CATEGORY_LABELS = {
  'true-wireless': '完全ワイヤレス',
  neckband: 'ネックバンド型',
  'over-ear': 'オーバーイヤー型ヘッドホン',
  sport: 'スポーツ向け',
} as const;

export const TAG_LABELS: Record<string, string> = {
  commute: '通勤・通学',
  'work-calls': 'オンライン会議',
  budget: 'コスパ重視',
  daily: '普段使い',
  light: '軽量',
  premium: 'ハイエンド',
  music: '音楽鑑賞',
  gym: 'ジム',
  running: 'ランニング',
  'long-battery': '長時間再生',
  'open-ear': '開放型',
  home: '自宅向け',
  cycling: 'サイクリング',
};

export function absUrl(path: string): string {
  return `${SITE_URL}${path.replace(/^\//, '')}`;
}
