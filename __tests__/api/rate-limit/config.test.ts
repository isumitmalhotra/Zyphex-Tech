/**
 * Tests for Rate Limit Configuration
 */

import {
  getRateLimitConfig,
  getRateLimitKey,
  shouldSkipRateLimit,
  DEFAULT_RATE_LIMITS,
  ROLE_MULTIPLIERS,
} from '../../../lib/api/rate-limit/config';

describe('Rate Limit Configuration', () => {
  describe('getRateLimitConfig', () => {
    it('should return exact route config', () => {
      const config = getRateLimitConfig('/api/auth/login');

      expect(config).toEqual(DEFAULT_RATE_LIMITS.auth);
      expect(config.max).toBe(10);
    });

    it('should return auth config for auth routes', () => {
      const config = getRateLimitConfig('/api/auth/register');

      expect(config.max).toBe(10);
      expect(config.windowMs).toBe(15 * 60 * 1000);
    });

    it('should return API config for API routes', () => {
      const config = getRateLimitConfig('/api/users');

      expect(config.max).toBe(100);
      expect(config.windowMs).toBe(15 * 60 * 1000);
    });

    it('should return heavy config for resource-intensive routes', () => {
      const config = getRateLimitConfig('/api/upload');

      expect(config).toEqual(DEFAULT_RATE_LIMITS.heavy);
      expect(config.max).toBe(50);
    });

    it('should return global config for unknown routes', () => {
      const config = getRateLimitConfig('/unknown/route');

      expect(config).toEqual(DEFAULT_RATE_LIMITS.global);
      expect(config.max).toBe(1000);
    });

    it('should apply role multiplier for ADMIN', () => {
      const config = getRateLimitConfig('/api/users', 'ADMIN');

      expect(config.max).toBe(100 * ROLE_MULTIPLIERS.ADMIN);
      expect(config.max).toBe(1000); // 100 * 10
    });

    it('should apply role multiplier for MANAGER', () => {
      const config = getRateLimitConfig('/api/users', 'MANAGER');

      expect(config.max).toBe(100 * ROLE_MULTIPLIERS.MANAGER);
      expect(config.max).toBe(500); // 100 * 5
    });

    it('should not change max for MEMBER role', () => {
      const config = getRateLimitConfig('/api/users', 'MEMBER');

      expect(config.max).toBe(100); // No multiplier for MEMBER
    });

    it('should apply role multiplier for GUEST', () => {
      const config = getRateLimitConfig('/api/users', 'GUEST');

      expect(config.max).toBe(50); // 100 * 0.5
    });
  });

  describe('getRateLimitKey', () => {
    it('should generate IP-based key', () => {
      const key = getRateLimitKey('192.168.1.1', '/api/users', 'ip');

      expect(key).toBe('ratelimit:ip:/api/users:192.168.1.1');
    });

    it('should generate user-based key', () => {
      const key = getRateLimitKey('user-123', '/api/users', 'user');

      expect(key).toBe('ratelimit:user:/api/users:user-123');
    });

    it('should generate global key', () => {
      const key = getRateLimitKey('service', '/api/users', 'global');

      expect(key).toBe('ratelimit:global:/api/users:service');
    });

    it('should remove query string from path', () => {
      const key = getRateLimitKey('192.168.1.1', '/api/users?page=1&limit=20', 'ip');

      expect(key).toBe('ratelimit:ip:/api/users:192.168.1.1');
    });

    it('should default to IP scope', () => {
      const key = getRateLimitKey('192.168.1.1', '/api/users');

      expect(key).toBe('ratelimit:ip:/api/users:192.168.1.1');
    });
  });

  describe('shouldSkipRateLimit', () => {
    it('should not skip standard routes', () => {
      expect(shouldSkipRateLimit('/api/users')).toBe(false);
      expect(shouldSkipRateLimit('/api/auth/login')).toBe(false);
    });

    it('should not skip any routes by default', () => {
      // All routes currently have skip: false or undefined
      expect(shouldSkipRateLimit('/api/health')).toBe(false);
      expect(shouldSkipRateLimit('/api/status')).toBe(false);
    });
  });

  describe('DEFAULT_RATE_LIMITS', () => {
    it('should have valid global config', () => {
      expect(DEFAULT_RATE_LIMITS.global.windowMs).toBeGreaterThan(0);
      expect(DEFAULT_RATE_LIMITS.global.max).toBeGreaterThan(0);
      expect(DEFAULT_RATE_LIMITS.global.message).toBeDefined();
    });

    it('should have stricter auth limits than API', () => {
      expect(DEFAULT_RATE_LIMITS.auth.max).toBeLessThan(
        DEFAULT_RATE_LIMITS.api.max
      );
    });

    it('should have restrictive heavy operation limits', () => {
      expect(DEFAULT_RATE_LIMITS.heavy.max).toBeLessThan(
        DEFAULT_RATE_LIMITS.api.max
      );
      expect(DEFAULT_RATE_LIMITS.heavy.windowMs).toBeGreaterThan(
        DEFAULT_RATE_LIMITS.api.windowMs
      );
    });

    it('should have high webhook limits', () => {
      expect(DEFAULT_RATE_LIMITS.webhook.max).toBeGreaterThan(
        DEFAULT_RATE_LIMITS.api.max
      );
    });
  });

  describe('ROLE_MULTIPLIERS', () => {
    it('should have valid multipliers for all roles', () => {
      expect(ROLE_MULTIPLIERS.ADMIN).toBeGreaterThan(1);
      expect(ROLE_MULTIPLIERS.MANAGER).toBeGreaterThan(1);
      expect(ROLE_MULTIPLIERS.MEMBER).toBe(1);
      expect(ROLE_MULTIPLIERS.GUEST).toBeLessThan(1);
    });

    it('should have ADMIN multiplier higher than MANAGER', () => {
      expect(ROLE_MULTIPLIERS.ADMIN).toBeGreaterThan(
        ROLE_MULTIPLIERS.MANAGER
      );
    });
  });
});
