import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { saveAuth, clearAuth, getStoredAuth, useAuth } from './useAuth';

describe('useAuth', () => {
  beforeEach(() => {
    global.localStorage.clear();
  });

  describe('saveAuth', () => {
    it('stores token and role in localStorage', () => {
      saveAuth({ token: 'jwt123', role: 'ADMIN' });
      expect(global.localStorage.setItem).toHaveBeenCalledWith('token', 'jwt123');
      expect(global.localStorage.setItem).toHaveBeenCalledWith('role', 'ADMIN');
    });
    it('stores only token when role is missing', () => {
      saveAuth({ token: 'jwt' });
      expect(global.localStorage.setItem).toHaveBeenCalledWith('token', 'jwt');
    });
  });

  describe('clearAuth', () => {
    it('removes token and role', () => {
      clearAuth();
      expect(global.localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(global.localStorage.removeItem).toHaveBeenCalledWith('role');
    });
  });

  describe('getStoredAuth', () => {
    it('returns token and role from localStorage', () => {
      saveAuth({ token: 't', role: 'r' });
      expect(getStoredAuth()).toEqual({ token: 't', role: 'r' });
    });
    it('returns null-like when empty', () => {
      expect(getStoredAuth().token).toBeNull();
      expect(getStoredAuth().role).toBeNull();
    });
  });

  describe('useAuth hook', () => {
    it('returns initial auth from storage and isAuthenticated true when token present', () => {
      saveAuth({ token: 'abc', role: 'BUYER' });
      const { result } = renderHook(() => useAuth());
      expect(result.current.token).toBe('abc');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('returns isAuthenticated false when no token', () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
