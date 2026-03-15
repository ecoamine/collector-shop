/**
 * Temporary network instrumentation for E2E: log API request URL, response status and body.
 * Use attachApiNetworkLogger(page) before page.goto() to capture /api/auth/login and /api/items.
 * Remove or disable after diagnosis.
 */
export function attachApiNetworkLogger(page) {
  const log = (label, data) => {
    const line = `[E2E API] ${label} ${JSON.stringify(data)}`;
    console.log(line);
  };

  page.on('request', (request) => {
    const url = request.url();
    if (!url.includes('/api/auth/login') && !url.includes('/api/items')) return;
    log('REQUEST', { url, method: request.method() });
  });

  page.on('response', async (response) => {
    const url = response.url();
    if (!url.includes('/api/auth/login') && !url.includes('/api/items')) return;
    const status = response.status();
    let body = null;
    try {
      const contentType = response.headers()['content-type'] || '';
      if (contentType.includes('json')) {
        body = await response.text();
        try {
          body = JSON.parse(body);
        } catch {
          // keep as string
        }
      }
    } catch {
      body = '(failed to read body)';
    }
    log('RESPONSE', { url, status, body });
  });

  page.on('requestfailed', (request) => {
    const url = request.url();
    if (!url.includes('/api/auth/login') && !url.includes('/api/items')) return;
    const failure = request.failure();
    log('REQUEST_FAILED', {
      url,
      error: failure?.errorText || failure?.message || String(failure),
    });
  });
}
