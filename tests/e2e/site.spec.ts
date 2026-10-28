import { expect, test } from '@playwright/test';

test.describe('static content (no JavaScript)', () => {
  test.use({ javaScriptEnabled: false });

  test('product page is fully readable and carries JSON-LD', async ({ page }) => {
    await page.goto('products/aurora-anc-pro.html');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Aurora ANC Pro');
    await expect(page.getByRole('cell', { name: '29,800円' })).toBeVisible();
    const ld = await page.locator('script[type="application/ld+json"]').textContent();
    expect(JSON.parse(ld ?? '{}').offers.price).toBe(29800);
  });

  test('catalog lists all products without JS', async ({ page }) => {
    await page.goto('');
    await expect(page.locator('#product-list > li')).toHaveCount(24);
  });
});

test.describe('catalog with JavaScript', () => {
  test('filters by keyword, price and ANC', async ({ page }) => {
    await page.goto('');
    await page.getByLabel('上限価格（円）').fill('10000');
    await expect(page.locator('#product-list > li:not([hidden])')).toHaveCount(5);
    await page.getByLabel('ノイズキャンセリングあり').check();
    await expect(page.locator('#product-list > li:not([hidden])')).toHaveCount(0);
    await expect(page.locator('#search-status')).toContainText('0件');
  });

  test('restores filters from the query string', async ({ page }) => {
    await page.goto('?category=sport&inStock=1');
    await expect(page.locator('#product-list > li:not([hidden])')).toHaveCount(4);
  });

  test('theme selection persists', async ({ page }) => {
    await page.goto('');
    await page.locator('#theme-select').selectOption('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});

test.describe('AI-facing files are served under the sub-path', () => {
  for (const file of ['llms.txt', 'llms-full.txt', 'products.json', 'sitemap.xml', 'robots.txt', 'products/aurora-anc-pro.md']) {
    test(`${file} responds`, async ({ request }) => {
      const res = await request.get(file);
      expect(res.status()).toBe(200);
      expect((await res.text()).length).toBeGreaterThan(100);
    });
  }

  test('llms.txt is not served at the domain root', async ({ request }) => {
    const res = await request.get('http://127.0.0.1:4173/llms.txt');
    expect(res.status()).toBe(404);
  });
});

test('about page discloses the sub-path limitation and untested interoperability', async ({ page }) => {
  await page.goto('about.html');
  await expect(page.getByText('ドメイン直下ではなく')).toBeVisible();
  await expect(page.getByText('not tested').first()).toBeVisible();
});
