import { useEffect, useState } from 'react';

const TOKEN_KEY = 'token';
const ROLE_KEY = 'role';

export function saveAuth({ token, role }) {
  window.localStorage.setItem(TOKEN_KEY, token);
  if (role) {
    window.localStorage.setItem(ROLE_KEY, role);
  }
}

export function clearAuth() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(ROLE_KEY);
}

export function getStoredAuth() {
  const token = window.localStorage.getItem(TOKEN_KEY);
  const role = window.localStorage.getItem(ROLE_KEY);
  return { token, role };
}

export function useAuth() {
  const [auth, setAuth] = useState(() => getStoredAuth());

  useEffect(() => {
    function handleStorage() {
      setAuth(getStoredAuth());
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const isAuthenticated = Boolean(auth.token);

  return { ...auth, isAuthenticated };
}

