import { describe, it, expect } from 'vitest';
import { colors, spacing } from './tokens';

describe('tokens', () => {
  describe('colors', () => {
    it('has primary and primaryDim', () => {
      expect(colors.primary).toBe('#00f5d4');
      expect(colors.primaryDim).toBe('#00c4a7');
    });
    it('has surface shades', () => {
      expect(colors.surface[900]).toBe('#0a0a0f');
      expect(colors.surface[800]).toBe('#12121a');
      expect(colors.surface[700]).toBe('#1a1a26');
    });
    it('has danger and success', () => {
      expect(colors.danger).toBe('#ef4444');
      expect(colors.success).toBe('#22c55e');
    });
  });

  describe('spacing', () => {
    it('has expected spacing scale', () => {
      expect(spacing.xs).toBe('0.25rem');
      expect(spacing.sm).toBe('0.5rem');
      expect(spacing.md).toBe('1rem');
      expect(spacing.lg).toBe('1.5rem');
      expect(spacing.xl).toBe('2rem');
      expect(spacing['2xl']).toBe('3rem');
    });
  });
});
