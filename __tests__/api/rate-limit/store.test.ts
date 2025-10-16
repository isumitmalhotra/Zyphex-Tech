/**
 * Tests for Rate Limit Store
 */

import { MemoryRateLimitStore, type RateLimitRecord } from '../../../lib/api/rate-limit/store';

describe('MemoryRateLimitStore', () => {
  let store: MemoryRateLimitStore;

  beforeEach(() => {
    store = new MemoryRateLimitStore();
  });

  afterEach(() => {
    store.stopCleanup();
  });

  describe('get and set', () => {
    it('should store and retrieve rate limit records', async () => {
      const key = 'test-key';
      const record: RateLimitRecord = {
        count: 5,
        resetTime: Date.now() + 60000,
        firstRequestTime: Date.now(),
      };

      await store.set(key, record, 60000);
      const retrieved = await store.get(key);

      expect(retrieved).toEqual(record);
    });

    it('should return null for non-existent keys', async () => {
      const result = await store.get('non-existent');
      expect(result).toBeNull();
    });

    it('should return null for expired records', async () => {
      const key = 'expired-key';
      const record: RateLimitRecord = {
        count: 5,
        resetTime: Date.now() - 1000, // Already expired
        firstRequestTime: Date.now() - 61000,
      };

      await store.set(key, record, 1);
      
      // Wait a bit to ensure expiration
      await new Promise((resolve) => setTimeout(resolve, 10));
      
      const retrieved = await store.get(key);
      expect(retrieved).toBeNull();
    });
  });

  describe('increment', () => {
    it('should increment count for existing record', async () => {
      const key = 'test-key';
      const record: RateLimitRecord = {
        count: 5,
        resetTime: Date.now() + 60000,
        firstRequestTime: Date.now(),
      };

      await store.set(key, record, 60000);
      const newCount = await store.increment(key);

      expect(newCount).toBe(6);

      const retrieved = await store.get(key);
      expect(retrieved?.count).toBe(6);
    });

    it('should throw error for non-existent key', async () => {
      await expect(store.increment('non-existent')).rejects.toThrow(
        'Record not found'
      );
    });
  });

  describe('delete', () => {
    it('should delete rate limit records', async () => {
      const key = 'test-key';
      const record: RateLimitRecord = {
        count: 5,
        resetTime: Date.now() + 60000,
        firstRequestTime: Date.now(),
      };

      await store.set(key, record, 60000);
      expect(await store.get(key)).not.toBeNull();

      await store.delete(key);
      expect(await store.get(key)).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all rate limit records', async () => {
      const record: RateLimitRecord = {
        count: 5,
        resetTime: Date.now() + 60000,
        firstRequestTime: Date.now(),
      };

      await store.set('key1', record, 60000);
      await store.set('key2', record, 60000);
      await store.set('key3', record, 60000);

      expect(store.size()).toBe(3);

      await store.clear();
      expect(store.size()).toBe(0);
    });
  });

  describe('automatic cleanup', () => {
    it('should clean up expired records periodically', async () => {
      const expiredRecord: RateLimitRecord = {
        count: 5,
        resetTime: Date.now() + 100, // Expires in 100ms
        firstRequestTime: Date.now(),
      };

      await store.set('expired', expiredRecord, 100);
      expect(store.size()).toBe(1);

      // Wait for expiration and cleanup
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Trigger cleanup by trying to get the expired record
      await store.get('expired');
      
      expect(store.size()).toBe(0);
    });
  });

  describe('size', () => {
    it('should return correct store size', async () => {
      expect(store.size()).toBe(0);

      const record: RateLimitRecord = {
        count: 1,
        resetTime: Date.now() + 60000,
        firstRequestTime: Date.now(),
      };

      await store.set('key1', record, 60000);
      expect(store.size()).toBe(1);

      await store.set('key2', record, 60000);
      expect(store.size()).toBe(2);

      await store.delete('key1');
      expect(store.size()).toBe(1);
    });
  });
});
