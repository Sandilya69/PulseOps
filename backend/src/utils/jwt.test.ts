import { describe, it, expect, vi } from 'vitest';
import { generateTokens, verifyAccessToken, verifyRefreshToken } from './jwt';

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn((payload, secret, options) => {
      if (options?.expiresIn === '15m') return 'mock-access-token';
      if (options?.expiresIn === '7d') return 'mock-refresh-token';
      return 'mock-token';
    }),
    verify: vi.fn((token, secret) => {
      if (token === 'valid-access-token') return { userId: 'user-1', orgId: 'org-1', role: 'owner' };
      if (token === 'valid-refresh-token') return { userId: 'user-1', orgId: 'org-1', role: 'owner' };
      throw new Error('Invalid token');
    }),
  },
}));

describe('JWT Utilities', () => {
  describe('generateTokens', () => {
    it('should generate access and refresh token pair', () => {
      const payload = { userId: 'user-1', orgId: 'org-1', role: 'owner' };
      const tokens = generateTokens(payload);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should include userId, orgId, and role in tokens', () => {
      const payload = { userId: 'user-123', orgId: 'org-456', role: 'admin' };
      const tokens = generateTokens(payload);

      expect(tokens.accessToken).toBeTruthy();
      expect(tokens.refreshToken).toBeTruthy();
    });
  });

  describe('verifyAccessToken', () => {
    it('should return decoded payload for valid token', () => {
      const result = verifyAccessToken('valid-access-token');

      expect(result).not.toBeNull();
      expect(result).toEqual({
        userId: 'user-1',
        orgId: 'org-1',
        role: 'owner',
      });
    });

    it('should return null for invalid token', () => {
      const result = verifyAccessToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null for expired token', () => {
      const result = verifyAccessToken('expired-token');

      expect(result).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should return decoded payload for valid token', () => {
      const result = verifyRefreshToken('valid-refresh-token');

      expect(result).not.toBeNull();
      expect(result).toEqual({
        userId: 'user-1',
        orgId: 'org-1',
        role: 'owner',
      });
    });

    it('should return null for invalid token', () => {
      const result = verifyRefreshToken('invalid-token');

      expect(result).toBeNull();
    });
  });
});