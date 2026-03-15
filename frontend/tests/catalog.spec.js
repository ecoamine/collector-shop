import { test, expect } from '@playwright/test';
import { attachApiNetworkLogger } from './network-logger.js';

test('catalog loads and opens item details', async ({ page }) => {
  attachApiNetworkLogger(page);
  await page.goto('/');

  await expect(page.getByText('Collectibles', { exact: false }).or(page.getByText('Catalog')).first()).toBeVisible();

  const catalog = page.getByTestId('catalog-list');
  await expect(catalog).toBeVisible({ timeout: 15000 });

  const firstItemLink = page.getByTestId('item-title').first();
  await firstItemLink.click();

  await expect(page.getByTestId('item-price')).toBeVisible();
});
