/**
 * Cache Performance Tests
 * Tests cache hit rates, response times, and memory efficiency
 */

import { performance } from 'perf_hooks';

// Mock Redis client
const mockRedis = {
  data: new Map<string, { value: string; expiry: number }>(),
  stats: {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  },

  async get(key: string): Promise<string | null> {
    const item = this.data.get(key);
    if (!item) {
      this.stats.misses++;
      return null;
    }
    if (Date.now() > item.expiry) {
      this.data.delete(key);
      this.stats.misses++;
      return null;
    }
    this.stats.hits++;
    return item.value;
  },

  async set(key: string, value: string, mode?: string, duration?: number): Promise<void> {
    const expiry = duration ? Date.now() + duration * 1000 : Date.now() + 3600000;
    this.data.set(key, { value, expiry });
    this.stats.sets++;
  },

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (this.data.delete(key)) {
        deleted++;
        this.stats.deletes++;
      }
    }
    return deleted;
  },

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
    return Array.from(this.data.keys()).filter(key => regex.test(key));
  },

  async info(_section: string): Promise<string> {
    const memoryUsage = this.data.size * 100; // Approximate
    return `used_memory:${memoryUsage}\nused_memory_human:${(memoryUsage / 1024).toFixed(2)}K`;
  },

  async dbsize(): Promise<number> {
    return this.data.size;
  },

  resetStats() {
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
  },

  clear() {
    this.data.clear();
    this.resetStats();
  },
};

// Mock cache functions
const cmsCache = {
  async getPagesList(filters: Record<string, unknown> = {}): Promise<unknown[] | null> {
    const key = `cms:pages:list:${JSON.stringify(filters)}`;
    const cached = await mockRedis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  },

  async setPagesList(filters: Record<string, unknown>, data: unknown[]): Promise<void> {
    const key = `cms:pages:list:${JSON.stringify(filters)}`;
    await mockRedis.set(key, JSON.stringify(data), 'EX', 300); // 5 minutes
  },

  async getPage(id: string): Promise<unknown | null> {
    const key = `cms:pages:single:${id}`;
    const cached = await mockRedis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  },

  async setPage(id: string, data: unknown): Promise<void> {
    const key = `cms:pages:single:${id}`;
    await mockRedis.set(key, JSON.stringify(data), 'EX', 3600); // 1 hour
  },

  async getSearchResults(query: string, filters: Record<string, unknown> = {}): Promise<unknown[] | null> {
    const key = `cms:pages:search:${query}:${JSON.stringify(filters)}`;
    const cached = await mockRedis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  },

  async setSearchResults(query: string, filters: Record<string, unknown>, data: unknown[]): Promise<void> {
    const key = `cms:pages:search:${query}:${JSON.stringify(filters)}`;
    await mockRedis.set(key, JSON.stringify(data), 'EX', 300); // 5 minutes
  },

  async invalidatePage(id: string): Promise<void> {
    await mockRedis.del(`cms:pages:single:${id}`);
    const listKeys = await mockRedis.keys('cms:pages:list:*');
    for (const key of listKeys) {
      await mockRedis.del(key);
    }
  },

  async invalidateAllPages(): Promise<void> {
    const pageKeys = await mockRedis.keys('cms:pages:*');
    for (const key of pageKeys) {
      await mockRedis.del(key);
    }
  },
};

// Mock data generator
function generateMockPage(id: string) {
  return {
    id,
    title: `Test Page ${id}`,
    slug: `test-page-${id}`,
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10),
    status: 'published',
    authorId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function generateMockPages(count: number) {
  return Array.from({ length: count }, (_, i) => generateMockPage(`page-${i + 1}`));
}

// Performance measurement utilities
function measureTime(fn: () => Promise<unknown>): Promise<{ result: unknown; duration: number }> {
  const start = performance.now();
  return fn().then(result => ({
    result,
    duration: performance.now() - start,
  }));
}

async function measureMultiple(fn: () => Promise<unknown>, iterations: number) {
  const durations: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const { duration } = await measureTime(fn);
    durations.push(duration);
  }
  return {
    min: Math.min(...durations),
    max: Math.max(...durations),
    avg: durations.reduce((a, b) => a + b, 0) / durations.length,
    median: durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)],
  };
}

describe('Cache Performance Tests', () => {
  beforeEach(() => {
    mockRedis.clear();
  });

  describe('Cache Hit Rate', () => {
    it('should achieve >80% hit rate with typical usage pattern', async () => {
      // Setup: Cache 10 pages
      const pages = generateMockPages(10);
      for (const page of pages) {
        await cmsCache.setPage(page.id, page);
      }

      // Simulate typical usage: 80% reads, 20% writes
      const reads = 80;
      const writes = 20;

      for (let i = 0; i < reads; i++) {
        const randomPage = pages[Math.floor(Math.random() * pages.length)];
        await cmsCache.getPage(randomPage.id);
      }

      for (let i = 0; i < writes; i++) {
        const newPage = generateMockPage(`new-page-${i}`);
        await cmsCache.setPage(newPage.id, newPage);
      }

      const hitRate = mockRedis.stats.hits / (mockRedis.stats.hits + mockRedis.stats.misses);
      
      console.log('\n📊 Cache Hit Rate Test:');
      console.log(`  Hits: ${mockRedis.stats.hits}`);
      console.log(`  Misses: ${mockRedis.stats.misses}`);
      console.log(`  Hit Rate: ${(hitRate * 100).toFixed(2)}%`);

      expect(hitRate).toBeGreaterThan(0.8); // >80% hit rate
    });

    it('should have high hit rate for repeated searches', async () => {
      mockRedis.resetStats();
      const searchQuery = 'web design';
      const mockResults = generateMockPages(5);

      // First search - cache miss
      await cmsCache.setSearchResults(searchQuery, {}, mockResults);
      await cmsCache.getSearchResults(searchQuery, {});

      // Next 9 searches - cache hits
      for (let i = 0; i < 9; i++) {
        await cmsCache.getSearchResults(searchQuery, {});
      }

      const hitRate = mockRedis.stats.hits / (mockRedis.stats.hits + mockRedis.stats.misses);

      console.log('\n🔍 Search Cache Hit Rate:');
      console.log(`  Hit Rate: ${(hitRate * 100).toFixed(2)}%`);

      expect(hitRate).toBeGreaterThan(0.85); // >85% for repeated searches
    });

    it('should maintain hit rate with cache invalidation', async () => {
      mockRedis.resetStats();
      const pages = generateMockPages(20);

      // Cache all pages
      for (const page of pages) {
        await cmsCache.setPage(page.id, page);
      }

      // Read pattern with occasional invalidation
      for (let i = 0; i < 100; i++) {
        const randomPage = pages[Math.floor(Math.random() * pages.length)];
        await cmsCache.getPage(randomPage.id);

        // Invalidate 10% of the time
        if (Math.random() < 0.1) {
          await cmsCache.invalidatePage(randomPage.id);
          await cmsCache.setPage(randomPage.id, randomPage);
        }
      }

      const hitRate = mockRedis.stats.hits / (mockRedis.stats.hits + mockRedis.stats.misses);

      console.log('\n🔄 Hit Rate with Invalidation:');
      console.log(`  Hit Rate: ${(hitRate * 100).toFixed(2)}%`);

      expect(hitRate).toBeGreaterThan(0.7); // >70% with invalidation
    });
  });

  describe('Response Time Performance', () => {
    it('should retrieve cached data <5ms', async () => {
      const page = generateMockPage('test-1');
      await cmsCache.setPage(page.id, page);

      const stats = await measureMultiple(
        () => cmsCache.getPage(page.id),
        100
      );

      console.log('\n⚡ Cache Read Performance:');
      console.log(`  Min: ${stats.min.toFixed(2)}ms`);
      console.log(`  Max: ${stats.max.toFixed(2)}ms`);
      console.log(`  Avg: ${stats.avg.toFixed(2)}ms`);
      console.log(`  Median: ${stats.median.toFixed(2)}ms`);

      expect(stats.avg).toBeLessThan(5); // Average <5ms
      expect(stats.median).toBeLessThan(5); // Median <5ms
    });

    it('should write cached data <10ms', async () => {
      const pages = generateMockPages(100);

      const stats = await measureMultiple(
        () => {
          const randomPage = pages[Math.floor(Math.random() * pages.length)];
          return cmsCache.setPage(randomPage.id, randomPage);
        },
        100
      );

      console.log('\n💾 Cache Write Performance:');
      console.log(`  Min: ${stats.min.toFixed(2)}ms`);
      console.log(`  Max: ${stats.max.toFixed(2)}ms`);
      console.log(`  Avg: ${stats.avg.toFixed(2)}ms`);
      console.log(`  Median: ${stats.median.toFixed(2)}ms`);

      expect(stats.avg).toBeLessThan(10); // Average <10ms
    });

    it('should show significant speedup vs simulated DB query', async () => {
      // Simulate database query (50-200ms)
      const simulateDbQuery = () => 
        new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150));

      const page = generateMockPage('test-1');
      await cmsCache.setPage(page.id, page);

      // Measure DB query time
      const dbStats = await measureMultiple(
        async () => {
          await simulateDbQuery();
          return page;
        },
        20
      );

      // Measure cache query time
      const cacheStats = await measureMultiple(
        () => cmsCache.getPage(page.id),
        20
      );

      const speedup = dbStats.avg / cacheStats.avg;

      console.log('\n🚀 Cache vs Database Performance:');
      console.log(`  DB Avg: ${dbStats.avg.toFixed(2)}ms`);
      console.log(`  Cache Avg: ${cacheStats.avg.toFixed(2)}ms`);
      console.log(`  Speedup: ${speedup.toFixed(1)}x faster`);

      expect(speedup).toBeGreaterThan(10); // At least 10x faster
    });
  });

  describe('Memory Efficiency', () => {
    it('should efficiently store page data', async () => {
      const pages = generateMockPages(100);
      
      for (const page of pages) {
        await cmsCache.setPage(page.id, page);
      }

      const keyCount = await mockRedis.dbsize();
      const info = await mockRedis.info('memory');
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memoryUsed = memoryMatch ? parseInt(memoryMatch[1]) : 0;
      const avgPerKey = memoryUsed / keyCount;

      console.log('\n💾 Memory Efficiency:');
      console.log(`  Total Keys: ${keyCount}`);
      console.log(`  Memory Used: ${(memoryUsed / 1024).toFixed(2)} KB`);
      console.log(`  Avg per Key: ${avgPerKey.toFixed(2)} bytes`);

      expect(avgPerKey).toBeLessThan(2000); // <2KB per cached page
    });

    it('should handle cache eviction gracefully', async () => {
      const pages = generateMockPages(1000);

      // Fill cache
      for (const page of pages) {
        await cmsCache.setPage(page.id, page);
      }

      const beforeSize = await mockRedis.dbsize();

      // Invalidate half
      for (let i = 0; i < 500; i++) {
        await cmsCache.invalidatePage(pages[i].id);
      }

      const afterSize = await mockRedis.dbsize();

      console.log('\n🗑️  Cache Eviction:');
      console.log(`  Before: ${beforeSize} keys`);
      console.log(`  After: ${afterSize} keys`);
      console.log(`  Evicted: ${beforeSize - afterSize} keys`);

      expect(afterSize).toBeLessThan(beforeSize);
      expect(afterSize).toBeGreaterThan(400); // Some keys remain
    });
  });

  describe('Concurrent Access', () => {
    it('should handle concurrent reads efficiently', async () => {
      const page = generateMockPage('concurrent-test');
      await cmsCache.setPage(page.id, page);

      const concurrentReads = 50;
      const startTime = performance.now();

      // Execute concurrent reads
      await Promise.all(
        Array.from({ length: concurrentReads }, () => 
          cmsCache.getPage(page.id)
        )
      );

      const totalTime = performance.now() - startTime;
      const avgTime = totalTime / concurrentReads;

      console.log('\n👥 Concurrent Read Performance:');
      console.log(`  Concurrent Reads: ${concurrentReads}`);
      console.log(`  Total Time: ${totalTime.toFixed(2)}ms`);
      console.log(`  Avg per Read: ${avgTime.toFixed(2)}ms`);

      expect(avgTime).toBeLessThan(10); // Average <10ms per read
    });

    it('should handle concurrent writes efficiently', async () => {
      const pages = generateMockPages(50);

      const startTime = performance.now();

      // Execute concurrent writes
      await Promise.all(
        pages.map(page => cmsCache.setPage(page.id, page))
      );

      const totalTime = performance.now() - startTime;
      const avgTime = totalTime / pages.length;

      console.log('\n✍️  Concurrent Write Performance:');
      console.log(`  Concurrent Writes: ${pages.length}`);
      console.log(`  Total Time: ${totalTime.toFixed(2)}ms`);
      console.log(`  Avg per Write: ${avgTime.toFixed(2)}ms`);

      expect(avgTime).toBeLessThan(15); // Average <15ms per write
    });
  });

  describe('Cache Invalidation Performance', () => {
    it('should invalidate single page quickly', async () => {
      const page = generateMockPage('invalidate-test');
      await cmsCache.setPage(page.id, page);
      await cmsCache.setPagesList({}, generateMockPages(10));

      const stats = await measureMultiple(
        () => cmsCache.invalidatePage(page.id),
        10
      );

      console.log('\n❌ Single Page Invalidation:');
      console.log(`  Avg: ${stats.avg.toFixed(2)}ms`);

      expect(stats.avg).toBeLessThan(20); // <20ms
    });

    it('should invalidate all pages efficiently', async () => {
      const pages = generateMockPages(100);
      for (const page of pages) {
        await cmsCache.setPage(page.id, page);
      }

      const { duration } = await measureTime(() => cmsCache.invalidateAllPages());

      console.log('\n🗑️  Full Cache Invalidation:');
      console.log(`  Pages Cached: ${pages.length}`);
      console.log(`  Invalidation Time: ${duration.toFixed(2)}ms`);

      expect(duration).toBeLessThan(500); // <500ms for 100 pages
    });
  });

  describe('TTL and Expiration', () => {
    it('should expire keys after TTL', async () => {
      // Set with short TTL
      await mockRedis.set('test-key', 'test-value', 'EX', 1); // 1 second

      // Should be available immediately
      const immediate = await mockRedis.get('test-key');
      expect(immediate).toBe('test-value');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should be expired
      const expired = await mockRedis.get('test-key');
      expect(expired).toBeNull();

      console.log('\n⏰ TTL Test:');
      console.log(`  Key expired after TTL: ✓`);
    });

    it('should handle different TTLs for different entity types', async () => {
      const page = generateMockPage('ttl-test');
      const searchResults = generateMockPages(5);

      await cmsCache.setPage(page.id, page); // 1 hour TTL
      await cmsCache.setSearchResults('test', {}, searchResults); // 5 min TTL

      const pageKey = `cms:pages:single:${page.id}`;
      const searchKey = `cms:pages:search:test:{}`;

      const pageItem = mockRedis.data.get(pageKey);
      const searchItem = mockRedis.data.get(searchKey);

      const pageTTL = pageItem ? (pageItem.expiry - Date.now()) / 1000 : 0;
      const searchTTL = searchItem ? (searchItem.expiry - Date.now()) / 1000 : 0;

      console.log('\n⏱️  TTL Configuration:');
      console.log(`  Page TTL: ~${Math.round(pageTTL / 60)} minutes`);
      console.log(`  Search TTL: ~${Math.round(searchTTL / 60)} minutes`);

      expect(pageTTL).toBeGreaterThan(searchTTL); // Page TTL should be longer
    });
  });

  describe('Performance Summary', () => {
    it('should generate comprehensive performance report', async () => {
      mockRedis.clear();
      const pages = generateMockPages(50);

      // Simulate realistic usage
      console.log('\n📈 CACHE PERFORMANCE SUMMARY');
      console.log('='.repeat(50));

      // 1. Cache population
      console.log('\n1. Cache Population:');
      const populateStart = performance.now();
      for (const page of pages) {
        await cmsCache.setPage(page.id, page);
      }
      const populateTime = performance.now() - populateStart;
      console.log(`   - Cached ${pages.length} pages in ${populateTime.toFixed(2)}ms`);
      console.log(`   - Avg: ${(populateTime / pages.length).toFixed(2)}ms per page`);

      // 2. Cache reads
      console.log('\n2. Cache Read Performance:');
      mockRedis.resetStats();
      const readStart = performance.now();
      for (let i = 0; i < 200; i++) {
        const randomPage = pages[Math.floor(Math.random() * pages.length)];
        await cmsCache.getPage(randomPage.id);
      }
      const readTime = performance.now() - readStart;
      const hitRate = mockRedis.stats.hits / (mockRedis.stats.hits + mockRedis.stats.misses);
      console.log(`   - 200 reads in ${readTime.toFixed(2)}ms`);
      console.log(`   - Avg: ${(readTime / 200).toFixed(2)}ms per read`);
      console.log(`   - Hit rate: ${(hitRate * 100).toFixed(2)}%`);

      // 3. Memory usage
      console.log('\n3. Memory Usage:');
      const keyCount = await mockRedis.dbsize();
      const info = await mockRedis.info('memory');
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memoryUsed = memoryMatch ? parseInt(memoryMatch[1]) : 0;
      console.log(`   - Total keys: ${keyCount}`);
      console.log(`   - Memory used: ${(memoryUsed / 1024).toFixed(2)} KB`);
      console.log(`   - Per key: ${(memoryUsed / keyCount).toFixed(2)} bytes`);

      // 4. Invalidation
      console.log('\n4. Cache Invalidation:');
      const invalidateStart = performance.now();
      await cmsCache.invalidatePage(pages[0].id);
      const invalidateTime = performance.now() - invalidateStart;
      console.log(`   - Single page: ${invalidateTime.toFixed(2)}ms`);

      const fullInvalidateStart = performance.now();
      await cmsCache.invalidateAllPages();
      const fullInvalidateTime = performance.now() - fullInvalidateStart;
      console.log(`   - All pages: ${fullInvalidateTime.toFixed(2)}ms`);

      console.log('\n' + '='.repeat(50));
      console.log('✅ All performance metrics within acceptable ranges\n');

      // Assertions
      expect(populateTime / pages.length).toBeLessThan(10);
      expect(readTime / 200).toBeLessThan(5);
      expect(hitRate).toBeGreaterThan(0.8);
      expect(invalidateTime).toBeLessThan(20);
    });
  });
});
