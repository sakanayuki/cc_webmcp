import { readFileSync } from 'node:fs';
import { CATEGORY_LABELS } from './site.ts';

export type Category = keyof typeof CATEGORY_LABELS;
export type Waterproof = 'none' | 'IPX4' | 'IPX5' | 'IPX7';

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: Category;
  priceJpy: number;
  stock: number;
  specs: {
    batteryHours: number;
    caseBatteryHours?: number;
    weightG: number;
    anc: boolean;
    waterproof: Waterproof;
    codecs: string[];
    bluetooth: string;
    multipoint: boolean;
  };
  tags: string[];
  summary: string;
  description: string;
  rating: number;
};

const WATERPROOF: Waterproof[] = ['none', 'IPX4', 'IPX5', 'IPX7'];

/** Validates the raw catalog; throws with every problem found. */
export function validateProducts(input: unknown): Product[] {
  const errors: string[] = [];
  if (!Array.isArray(input)) throw new Error('products.json must be an array');
  const seen = new Set<string>();
  for (const [i, raw] of input.entries()) {
    const p = raw as Partial<Product>;
    const at = `products[${i}] (${p?.id ?? '?'})`;
    if (typeof p.id !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id)) errors.push(`${at}: invalid id`);
    else if (seen.has(p.id)) errors.push(`${at}: duplicate id`);
    else seen.add(p.id);
    if (!p.name || p.name.length > 80) errors.push(`${at}: invalid name`);
    if (!p.brand) errors.push(`${at}: missing brand`);
    if (!p.category || !(p.category in CATEGORY_LABELS)) errors.push(`${at}: invalid category`);
    if (!Number.isInteger(p.priceJpy) || (p.priceJpy as number) <= 0) errors.push(`${at}: invalid priceJpy`);
    if (!Number.isInteger(p.stock) || (p.stock as number) < 0 || (p.stock as number) > 999) errors.push(`${at}: invalid stock`);
    const s = p.specs;
    if (!s) errors.push(`${at}: missing specs`);
    else {
      if (!(s.batteryHours > 0)) errors.push(`${at}: invalid batteryHours`);
      if (!(s.weightG > 0)) errors.push(`${at}: invalid weightG`);
      if (typeof s.anc !== 'boolean') errors.push(`${at}: invalid anc`);
      if (!WATERPROOF.includes(s.waterproof)) errors.push(`${at}: invalid waterproof`);
      if (!Array.isArray(s.codecs) || s.codecs.length === 0) errors.push(`${at}: invalid codecs`);
      if (typeof s.multipoint !== 'boolean') errors.push(`${at}: invalid multipoint`);
    }
    if (!Array.isArray(p.tags)) errors.push(`${at}: invalid tags`);
    if (!p.summary || !p.description) errors.push(`${at}: missing summary/description`);
    if (typeof p.rating !== 'number' || p.rating < 0 || p.rating > 5) errors.push(`${at}: invalid rating`);
  }
  if (errors.length) throw new Error(`Invalid catalog:\n${errors.join('\n')}`);
  return input as Product[];
}

export function loadProducts(path = new URL('../../data/products.json', import.meta.url)): Product[] {
  return validateProducts(JSON.parse(readFileSync(path, 'utf8')));
}

export function formatJpy(n: number): string {
  return `${n.toLocaleString('en-US')}円`;
}

export function waterproofLabel(w: Waterproof): string {
  return w === 'none' ? 'なし' : w;
}

export function availability(p: Product): 'InStock' | 'OutOfStock' {
  return p.stock > 0 ? 'InStock' : 'OutOfStock';
}

export function availabilityLabel(p: Product): string {
  return p.stock > 0 ? `在庫あり（${p.stock}点）` : '在庫切れ';
}
