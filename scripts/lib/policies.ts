// Fictional store policies. Single source for HTML, Markdown and llms-full.txt.
export type PolicySection = { heading: string; body: string[] };

export const POLICY_TITLE = 'ご利用ガイド（配送・返品・保証）';

export const POLICIES: PolicySection[] = [
  {
    heading: '重要なお知らせ',
    body: [
      'このサイトは AI エージェント連携の検証用に作られた架空のストアです。実際の販売・決済・配送は行いません。',
      'カートの内容はお使いのブラウザ内にのみ保存され、サーバーには送信されません。',
    ],
  },
  {
    heading: '配送',
    body: [
      '（架空の規定）ご注文から 2〜3 営業日で発送します。送料は全国一律 500 円、10,000 円以上のご購入で無料です。',
      '在庫切れの商品は入荷後の発送となります。',
    ],
  },
  {
    heading: '返品・交換',
    body: [
      '（架空の規定）商品到着から 14 日以内であれば、未使用品に限り返品を受け付けます。',
      'イヤーピースなど衛生上の理由で返品できない消耗品があります。',
    ],
  },
  {
    heading: '保証',
    body: ['（架空の規定）全商品に購入日から 1 年間のメーカー保証が付きます。水没・落下による故障は対象外です。'],
  },
  {
    heading: '防水性能の目安',
    body: [
      'IPX4: 水しぶきに対する保護。IPX5: 噴流水に対する保護。IPX7: 一時的な水没に対する保護。',
      '防水性能は真水での試験に基づく目安です。海水・温泉・石けん水での使用は保証対象外です。',
    ],
  },
];
