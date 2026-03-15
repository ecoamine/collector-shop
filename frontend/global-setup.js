/**
 * Run before E2E tests. Ensures the backend is reachable so login tests can pass.
 * Skip by setting SKIP_BACKEND_CHECK=1 (e.g. in CI if you start backend in a previous step).
 * When PLAYWRIGHT_BASE_URL is set (e.g. https://localhost), health is checked on the same origin (API via Nginx).
 */
export default async function globalSetup() {
  if (process.env.SKIP_BACKEND_CHECK === '1') return;

  const baseUrl = process.env.PLAYWRIGHT_API_URL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080';
  const healthUrl = `${baseUrl.replace(/\/$/, '')}/actuator/health`;

  for (let i = 0; i < 3; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(healthUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  throw new Error(
    `Backend not reachable at ${baseUrl}. Login tests will fail.\n` +
      'Start the stack first: cd infra/compose && docker compose up -d\n' +
      'Then wait ~20s for backend health and run: npm run test:e2e'
  );
}
