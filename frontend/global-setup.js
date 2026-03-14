/**
 * Run before E2E tests. Ensures the backend is reachable so login tests can pass.
 * Skip by setting SKIP_BACKEND_CHECK=1 (e.g. in CI if you start backend in a previous step).
 */
export default async function globalSetup() {
  if (process.env.SKIP_BACKEND_CHECK === '1') return;

  const backendUrl = process.env.PLAYWRIGHT_API_URL || 'http://localhost:8080';
  const healthUrl = `${backendUrl.replace(/\/$/, '')}/actuator/health`;

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
    `Backend not reachable at ${backendUrl}. Login tests will fail.\n` +
      'Start the stack first: cd infra/compose && docker compose up -d\n' +
      'Then wait ~20s for backend health and run: npm run test:e2e'
  );
}
