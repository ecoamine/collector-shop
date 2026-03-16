import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUse = vi.fn();
const mockCreate = vi.fn(() => ({
  interceptors: { request: { use: mockUse } }
}));

vi.mock('axios', () => ({
  default: { create: mockCreate }
}));

describe('apiClient', () => {
  beforeEach(() => {
    global.localStorage.clear();
  });

  it('creates axios instance with baseURL', async () => {
    vi.resetModules();
    const { default: api } = await import('./apiClient.js');
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ baseURL: 'http://api.test' }));
  });

  it('registers request interceptor that adds Bearer token when present', async () => {
    vi.resetModules();
    await import('./apiClient.js');
    expect(mockUse).toHaveBeenCalled();
    const interceptorFn = mockUse.mock.calls[0][0];
    global.localStorage.setItem('token', 'secret');
    const config = { headers: {} };
    const result = interceptorFn(config);
    expect(result.headers.Authorization).toBe('Bearer secret');
  });

  it('does not add Authorization when no token', async () => {
    const interceptorFn = mockUse.mock.calls[0][0];
    const config = { headers: {} };
    interceptorFn(config);
    expect(config.headers.Authorization).toBeUndefined();
  });

  it('sets Content-Type to application/json when body is an object', async () => {
    const interceptorFn = mockUse.mock.calls[0][0];
    const config = { headers: {}, data: { name: 'test' } };
    interceptorFn(config);
    expect(config.headers['Content-Type']).toBe('application/json');
  });

  it('does not set Content-Type when body is FormData', async () => {
    const interceptorFn = mockUse.mock.calls[0][0];
    const config = { headers: {}, data: new FormData() };
    interceptorFn(config);
    expect(config.headers['Content-Type']).toBeUndefined();
  });

  it('does not set Content-Type when body is null or missing', async () => {
    const interceptorFn = mockUse.mock.calls[0][0];
    const config = { headers: {} };
    interceptorFn(config);
    expect(config.headers['Content-Type']).toBeUndefined();
  });
});
