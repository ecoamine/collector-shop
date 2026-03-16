import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Minimal localStorage for tests
const storage = {};
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: vi.fn((key) => storage[key] ?? null),
    setItem: vi.fn((key, value) => { storage[key] = String(value); }),
    removeItem: vi.fn((key) => { delete storage[key]; }),
    clear: vi.fn(() => { Object.keys(storage).forEach((k) => delete storage[k]); }),
    get length() { return Object.keys(storage).length; },
    key: vi.fn((i) => Object.keys(storage)[i] ?? null)
  },
  writable: true
});
