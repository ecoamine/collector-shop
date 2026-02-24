import { test, expect } from '@playwright/test';

test('login as SELLER and create listing', async ({ page }) => {
  await page.goto('/');

  await page.getByText('Login').click();

  await page.getByTestId('login-form').locator('#username').fill('seller');
  await page.getByTestId('login-form').locator('#password').fill('password');
  await page.getByTestId('login-form').locator('button[type="submit"]').click();

  await page.waitForURL('**/');

  await page.getByText('Sell').click();

  await page.getByTestId('seller-create-form').locator('#title').fill('Playwright Item');
  await page.getByTestId('seller-create-form').locator('#price').fill('10.00');
  await page.getByTestId('seller-create-form').locator('#categoryId').selectOption('1');
  await page.getByTestId('seller-create-form').locator('button[type="submit"]').click();

  await expect(page.getByText('Item created')).toBeVisible({ timeout: 5000 });
});
