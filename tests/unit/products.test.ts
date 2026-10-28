import { describe, expect, it } from 'vitest';
import { loadProducts, validateProducts } from '../../scripts/lib/products.ts';

describe('product catalog', () => {
  const products = loadProducts();

  it('has 24 unique products', () => {
    expect(products).toHaveLength(24);
    expect(new Set(products.map((p) => p.id)).size).toBe(24);
  });

  it('covers every category and includes out-of-stock items', () => {
    expect(new Set(products.map((p) => p.category)).size).toBe(4);
    expect(products.some((p) => p.stock === 0)).toBe(true);
  });

  it('rejects invalid data with all problems listed', () => {
    const bad = [{ id: 'Bad Id', name: '', priceJpy: -1 }];
    expect(() => validateProducts(bad)).toThrow(/invalid id/);
    expect(() => validateProducts(bad)).toThrow(/invalid priceJpy/);
  });

  it('rejects duplicate ids', () => {
    const p = products[0]!;
    expect(() => validateProducts([p, p])).toThrow(/duplicate id/);
  });
});
