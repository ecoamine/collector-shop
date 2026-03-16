import { describe, it, expect } from 'vitest';
import { decodeJwtPayload, getRoleFromToken, normalizeRole } from './jwt';

function b64enc(obj) {
  return btoa(JSON.stringify(obj).replace(/[\u007F-\uFFFF]/g, (c) => '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4)));
}

describe('decodeJwtPayload', () => {
  it('returns null for empty token', () => {
    expect(decodeJwtPayload('')).toBeNull();
    expect(decodeJwtPayload(null)).toBeNull();
    expect(decodeJwtPayload(undefined)).toBeNull();
  });

  it('returns null for non-string', () => {
    expect(decodeJwtPayload(123)).toBeNull();
  });

  it('returns null when token has not 3 parts', () => {
    expect(decodeJwtPayload('a.b')).toBeNull();
    expect(decodeJwtPayload('a')).toBeNull();
  });

  it('decodes valid JWT payload', () => {
    const payload = { sub: 'user', role: 'BUYER' };
    const token = 'header.' + b64enc(payload) + '.sig';
    expect(decodeJwtPayload(token)).toEqual(payload);
  });

  it('returns null for invalid base64 payload', () => {
    expect(decodeJwtPayload('a.!!!.c')).toBeNull();
  });
});

describe('getRoleFromToken', () => {
  it('returns null for null payload', () => {
    expect(getRoleFromToken('')).toBeNull();
  });

  it('returns role when valid', () => {
    const token = 'h.' + b64enc({ role: 'ADMIN' }) + '.s';
    expect(getRoleFromToken(token)).toBe('ADMIN');
    const token2 = 'h.' + b64enc({ role: 'SELLER' }) + '.s';
    expect(getRoleFromToken(token2)).toBe('SELLER');
    const token3 = 'h.' + b64enc({ role: 'BUYER' }) + '.s';
    expect(getRoleFromToken(token3)).toBe('BUYER');
  });

  it('returns null for unknown role', () => {
    const token = 'h.' + b64enc({ role: 'OTHER' }) + '.s';
    expect(getRoleFromToken(token)).toBeNull();
    expect(getRoleFromToken('h.' + b64enc({}) + '.s')).toBeNull();
  });

  it('returns role when token has ROLE_ prefix', () => {
    const token = 'h.' + b64enc({ role: 'ROLE_SELLER' }) + '.s';
    expect(getRoleFromToken(token)).toBe('SELLER');
  });
});

describe('normalizeRole', () => {
  it('strips ROLE_ prefix', () => {
    expect(normalizeRole('ROLE_SELLER')).toBe('SELLER');
    expect(normalizeRole('ROLE_ADMIN')).toBe('ADMIN');
    expect(normalizeRole('ROLE_BUYER')).toBe('BUYER');
  });
  it('returns role as-is when no prefix', () => {
    expect(normalizeRole('SELLER')).toBe('SELLER');
  });
  it('returns null for invalid or empty', () => {
    expect(normalizeRole('')).toBeNull();
    expect(normalizeRole(null)).toBeNull();
    expect(normalizeRole('OTHER')).toBeNull();
  });
});
