/**
 * Decode JWT payload without verification (client-side only for reading role).
 * Do not use for security decisions; backend validates the token.
 */
export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function getRoleFromToken(token) {
  const payload = decodeJwtPayload(token);
  const role = payload?.role;
  if (role === 'BUYER' || role === 'SELLER' || role === 'ADMIN') return role;
  return null;
}
