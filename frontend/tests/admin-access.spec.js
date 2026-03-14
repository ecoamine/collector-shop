import { test, expect } from '@playwright/test';

test('admin page forbidden for non-admin', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Login' }).first().click();

  await page.getByTestId('login-form').locator('#username').fill('buyer');
  await page.getByTestId('login-form').locator('#password').fill('password');
  await page.getByTestId('login-form').locator('button[type="submit"]').click();

  try {
    await page.waitForURL((url) => url.pathname === '/' || url.pathname === '', { timeout: 15000 });
  } catch {
    const alert = page.getByRole('alert');
    const msg = (await alert.isVisible()) ? await alert.textContent() : 'No error message';
    throw new Error(`Login failed (backend may be down or E2E users missing). UI: ${msg}`);
  }

  await page.goto('/admin/categories');
  await page.waitForLoadState('networkidle');

  const pathname = new URL(page.url()).pathname;

  if (pathname === '/' || pathname === '/login') {
    await expect(page).toHaveURL(/^(\/|\/login)$/);
    return;
  }

  // Si l'utilisateur reste sur la route admin,
  // il ne doit pas voir le contenu réservé aux admins.
  await expect(page.getByRole('heading', { name: /categories|admin/i })).not.toBeVisible();
});
