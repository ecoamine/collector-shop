import { test, expect } from '@playwright/test';

test('admin page forbidden for non-admin', async ({ page }) => {
  await page.goto('/');

  await page.getByText('Login').click();

  await page.getByTestId('login-form').locator('#username').fill('buyer');
  await page.getByTestId('login-form').locator('#password').fill('password');
  await page.getByTestId('login-form').locator('button[type="submit"]').click();

  await page.waitForURL('**/');

  await page.goto('/admin/categories');

  await expect(page).toHaveURL('/');
});
