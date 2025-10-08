import Redis from 'ioredis';

// Define types for cached content
interface ContentType {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  fields: Record<string, unknown>;
  settings: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface DynamicContentItem {
  id: string;
  contentTypeId: string;
  title: string;
  slug: string;
  data: Record<string, unknown>;
  isPublished: boolean;
  publishedAt?: Date | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

let redis: Redis | null = null;

// Initialize Redis connection
export function getRedisClient(): Redis | null {
  if (typeof window !== 'undefined') {
    // Don't initialize Redis on client side
    return null;
  }

  if (!redis) {
    try {
      // Use Redis URL from environment or fallback to local
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      // Handle errors
      redis.on('error', (error: Error) => {
        redis = null; // Reset to null on error
      });

      // Test connection
      redis.ping().catch(() => {
        redis = null;
      });
    } catch (error) {
      redis = null;
    }
  }

  return redis;
}

// Cache key generators
export const cacheKeys = {
  contentType: (id: string) => `content_type:${id}`,
  contentTypes: () => 'content_types:all',
  dynamicContent: (typeId: string) => `dynamic_content:${typeId}`,
  dynamicContentItem: (id: string) => `dynamic_content_item:${id}`,
  contentBySlug: (slug: string) => `content:slug:${slug}`,
  contentByType: (type: string) => `content:type:${type}`,
} as const;

// Cache TTL constants (in seconds)
export const cacheTTL = {
  contentType: 3600, // 1 hour
  contentTypes: 1800, // 30 minutes
  dynamicContent: 1800, // 30 minutes
  shortTerm: 300, // 5 minutes
} as const;

// Generic cache functions
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient();
    if (!client) return null;

    const cached = await client.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    return null;
  }
}

export async function cacheSet<T>(
  key: string, 
  value: T, 
  ttl: number = cacheTTL.shortTerm
): Promise<boolean> {
  try {
    const client = getRedisClient();
    if (!client) return false;

    await client.setex(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
}

export async function cacheDelete(key: string): Promise<boolean> {
  try {
    const client = getRedisClient();
    if (!client) return false;

    await client.del(key);
    return true;
  } catch (error) {
    return false;
  }
}

export async function cacheDeletePattern(pattern: string): Promise<boolean> {
  try {
    const client = getRedisClient();
    if (!client) return false;

    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
    return true;
  } catch (error) {
    return false;
  }
}

// Content-specific cache functions
export async function cacheContentType(contentType: ContentType): Promise<void> {
  await cacheSet(
    cacheKeys.contentType(contentType.id),
    contentType,
    cacheTTL.contentType
  );
}

export async function getCachedContentType(id: string): Promise<ContentType | null> {
  return await cacheGet<ContentType>(cacheKeys.contentType(id));
}

export async function cacheContentTypes(contentTypes: ContentType[]): Promise<void> {
  await cacheSet(
    cacheKeys.contentTypes(),
    contentTypes,
    cacheTTL.contentTypes
  );
}

export async function getCachedContentTypes(): Promise<ContentType[] | null> {
  return await cacheGet<ContentType[]>(cacheKeys.contentTypes());
}

export async function cacheDynamicContent(
  typeId: string, 
  items: DynamicContentItem[]
): Promise<void> {
  await cacheSet(
    cacheKeys.dynamicContent(typeId),
    items,
    cacheTTL.dynamicContent
  );
}

export async function getCachedDynamicContent(typeId: string): Promise<DynamicContentItem[] | null> {
  return await cacheGet<DynamicContentItem[]>(cacheKeys.dynamicContent(typeId));
}

export async function cacheDynamicContentItem(item: DynamicContentItem): Promise<void> {
  await cacheSet(
    cacheKeys.dynamicContentItem(item.id),
    item,
    cacheTTL.dynamicContent
  );
}

export async function getCachedDynamicContentItem(id: string): Promise<DynamicContentItem | null> {
  return await cacheGet<DynamicContentItem>(cacheKeys.dynamicContentItem(id));
}

// Cache invalidation functions
export async function invalidateContentTypeCache(id?: string): Promise<void> {
  if (id) {
    await cacheDelete(cacheKeys.contentType(id));
  }
  
  // Always invalidate the list cache when any content type changes
  await cacheDelete(cacheKeys.contentTypes());
}

export async function invalidateDynamicContentCache(
  typeId?: string, 
  itemId?: string
): Promise<void> {
  if (typeId) {
    await cacheDelete(cacheKeys.dynamicContent(typeId));
  }
  
  if (itemId) {
    await cacheDelete(cacheKeys.dynamicContentItem(itemId));
  }
}

export async function invalidateAllContentCache(): Promise<void> {
  await cacheDeletePattern('content*');
}

// Health check function
export async function checkCacheHealth(): Promise<{
  connected: boolean;
  latency?: number;
  error?: string;
}> {
  try {
    const client = getRedisClient();
    if (!client) {
      return { connected: false, error: 'Redis client not initialized' };
    }

    const start = Date.now();
    await client.ping();
    const latency = Date.now() - start;

    return { connected: true, latency };
  } catch (error) {
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}