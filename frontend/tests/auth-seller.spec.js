import { test, expect } from '@playwright/test';

test('login as SELLER and create listing', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Login' }).first().click();

  await page.getByTestId('login-form').locator('#username').fill('seller');
  await page.getByTestId('login-form').locator('#password').fill('password');
  await page.getByTestId('login-form').locator('button[type="submit"]').click();

  try {
    await expect(page.getByRole('link', { name: 'Sell' })).toBeVisible({ timeout: 15000 });
  } catch {
    const alert = page.getByRole('alert');
    const msg = (await alert.isVisible()) ? await alert.textContent() : 'No error message';
    throw new Error(`Login failed (backend may be down or E2E users missing). UI: ${msg}`);
  }

  await page.getByRole('link', { name: 'Sell' }).click();

  await page.getByTestId('seller-create-form').locator('#title').fill('Playwright Item');
  await page.getByTestId('seller-create-form').locator('#price').fill('10.00');
  await page.getByTestId('seller-create-form').locator('#categoryId').selectOption('1');
  await page.getByTestId('seller-create-form').locator('button[type="submit"]').click();

  await expect(page.getByText('Item created')).toBeVisible({ timeout: 5000 });
});
