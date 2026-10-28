import type { Product } from './products.ts';
import { formatJpy } from './products.ts';

export type Scenario = {
  id: string;
  prompt: string;
  /** Tools a WebMCP-capable agent is expected to use (implemented in later phases). */
  expectedTools: string[];
  /** Phase in which the expectation can be fulfilled through tools. */
  needsTools: boolean;
  expect: (products: Product[]) => { ids: string[]; answer: string };
};

const byId = (products: Product[], id: string): Product => {
  const p = products.find((x) => x.id === id);
  if (!p) throw new Error(`scenario references unknown product: ${id}`);
  return p;
};

export const SCENARIOS: Scenario[] = [
  {
    id: 'commute-anc',
    prompt: '通勤用で、3万円以下で、ノイズキャンセリング付きの完全ワイヤレスイヤホンを、在庫があるものから探して。',
    expectedTools: ['search_products'],
    needsTools: false,
    expect: (ps) => {
      const hit = ps
        .filter((p) => p.category === 'true-wireless' && p.specs.anc && p.priceJpy <= 30000 && p.stock > 0 && p.tags.includes('commute'))
        .sort((a, b) => a.priceJpy - b.priceJpy);
      return { ids: hit.map((p) => p.id), answer: `${hit.length}件: ${hit.map((p) => `${p.name}（${formatJpy(p.priceJpy)}）`).join('、')}` };
    },
  },
  {
    id: 'compare-battery',
    prompt: 'Aurora ANC Pro と Kumo Pod ANC を比べて、連続再生時間（単体）が長いのはどちら？ 価格差も教えて。',
    expectedTools: ['compare_products'],
    needsTools: false,
    expect: (ps) => {
      const a = byId(ps, 'aurora-anc-pro');
      const b = byId(ps, 'kumo-pod-anc');
      const longer = a.specs.batteryHours >= b.specs.batteryHours ? a : b;
      const diff = Math.abs(a.priceJpy - b.priceJpy);
      return {
        ids: [a.id, b.id],
        answer: `${longer.name}の方が長い（${a.name} ${a.specs.batteryHours}時間 / ${b.name} ${b.specs.batteryHours}時間）。価格差は${formatJpy(diff)}`,
      };
    },
  },
  {
    id: 'running-ipx7',
    prompt: 'ランニング用に、防水 IPX7 で 2万円以下のイヤホンを教えて。',
    expectedTools: ['search_products'],
    needsTools: false,
    expect: (ps) => {
      const hit = ps
        .filter((p) => p.specs.waterproof === 'IPX7' && p.priceJpy <= 20000 && p.tags.includes('running'))
        .sort((a, b) => a.priceJpy - b.priceJpy);
      return { ids: hit.map((p) => p.id), answer: `${hit.length}件: ${hit.map((p) => `${p.name}（${formatJpy(p.priceJpy)}）`).join('、')}` };
    },
  },
  {
    id: 'lightest-anc',
    prompt: '在庫があって、ノイズキャンセリング付きの完全ワイヤレスで、一番軽いのはどれ？',
    expectedTools: ['search_products', 'compare_products'],
    needsTools: false,
    expect: (ps) => {
      const hit = ps
        .filter((p) => p.category === 'true-wireless' && p.specs.anc && p.stock > 0)
        .sort((a, b) => a.specs.weightG - b.specs.weightG);
      const top = hit[0];
      if (!top) throw new Error('no lightest candidate');
      return { ids: [top.id], answer: `${top.name}（${top.specs.weightG}g）` };
    },
  },
  {
    id: 'cart-total',
    prompt: 'Aurora Air を1つと Kumo Pod ANC を2つカートに入れて、合計金額を教えて。',
    expectedTools: ['add_to_cart', 'view_cart'],
    needsTools: true,
    expect: (ps) => {
      const a = byId(ps, 'aurora-air');
      const b = byId(ps, 'kumo-pod-anc');
      return { ids: [a.id, b.id], answer: `合計 ${formatJpy(a.priceJpy + b.priceJpy * 2)}（${a.name}×1 + ${b.name}×2）` };
    },
  },
];
