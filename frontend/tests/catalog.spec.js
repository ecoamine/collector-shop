import { test, expect } from '@playwright/test';

test('catalog loads and opens item details', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Collectibles', { exact: false }).or(page.getByText('Catalog')).first()).toBeVisible();

  const catalog = page.getByTestId('catalog-list');
  await expect(catalog).toBeVisible();

  const firstItemLink = page.getByTestId('item-title').first();
  await firstItemLink.click();

  await expect(page.getByTestId('item-price')).toBeVisible();
});
