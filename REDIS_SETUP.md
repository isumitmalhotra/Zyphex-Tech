# Redis & Encryption Configuration Guide

## Overview

This guide helps you set up Redis caching and encryption for optimal performance in the Zyphex-Tech platform.

**Status**: Redis caching is **fully implemented** and ready to use. This guide covers configuration only.

## Quick Start

### 1. Generate Keys

```bash
node scripts/generate-keys.js
```

This generates:
- `ENCRYPTION_KEY` - 64 hex characters (32 bytes) for AES-256-GCM encryption
- `NEXTAUTH_SECRET` - Base64 string for NextAuth.js sessions

Copy the generated keys to your `.env` file.

### 2. Configure Redis

#### Option A: Local Development (No Password)

```env
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
REDIS_DB="0"
```

Start Redis:
```bash
# Windows (with Redis installed)
redis-server

# Or with Docker
docker run -d -p 6379:6379 redis:latest
```

#### Option B: Production (Managed Service)

**Upstash Redis (Recommended)**:
```env
REDIS_URL="rediss://default:YOUR_PASSWORD@us1-example.upstash.io:6379"
```

**Redis Labs**:
```env
REDIS_URL="redis://:YOUR_PASSWORD@redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com:12345"
```

**AWS ElastiCache**:
```env
REDIS_HOST="your-cluster.abcdef.ng.0001.use1.cache.amazonaws.com"
REDIS_PORT="6379"
```

## How Redis is Used

### Multi-Level Cache Architecture

The platform uses a **2-tier caching system**:

1. **L1 Cache (Memory)**: Fast, in-memory cache using LRU algorithm
   - Max size: 100MB
   - Max entries: 10,000
   - TTL: 5 minutes default

2. **L2 Cache (Redis)**: Persistent, distributed cache
   - Shared across all instances
   - Survives application restarts
   - Configurable TTL per cache key

### Cache Strategies Implemented

#### 1. Cache-Aside (Lazy Loading)
```typescript
// Automatically used by the cache system
const data = await cache.get('key');
if (!data) {
  data = await fetchFromDatabase();
  await cache.set('key', data, 3600); // 1 hour TTL
}
```

#### 2. Read-Through
```typescript
// Cache handles fetching if not found
const data = await cache.getOrFetch('key', async () => {
  return await fetchFromDatabase();
}, 3600);
```

#### 3. Write-Through
```typescript
// Write to cache and database simultaneously
await cache.setWithWriteThrough('key', data, async (value) => {
  await database.save(value);
});
```

#### 4. Cache Invalidation
```typescript
// Invalidate single key
await cache.delete('user:123');

// Invalidate by pattern
await cache.deletePattern('user:*');

// Invalidate by tags
await cache.invalidateByTags(['users', 'profiles']);
```

### What Gets Cached

The following data is automatically cached:

1. **User Sessions**: 24-hour TTL
2. **API Responses**: 5-minute TTL
3. **Database Queries**: 1-hour TTL
4. **Static Content**: 24-hour TTL
5. **Project Data**: 15-minute TTL
6. **Analytics Data**: 5-minute TTL
7. **File Metadata**: 1-hour TTL

## Performance Benefits

With Redis enabled, you'll see:

- **50-90% reduction** in database queries
- **2-5x faster** API response times
- **Reduced server load** during high traffic
- **Better scalability** across multiple instances
- **Improved user experience** with faster page loads

## Configuration Reference

### Environment Variables

```env
# Required for encryption
ENCRYPTION_KEY="64-character-hex-key-here"

# Redis URL (preferred for production)
REDIS_URL="redis://[username]:[password]@[host]:[port]"

# Or individual Redis settings
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
REDIS_DB="0"

# Redis connection options (optional)
REDIS_MAX_RETRIES="10"
REDIS_RETRY_DELAY="3000"
REDIS_COMMAND_TIMEOUT="5000"
REDIS_CONNECT_TIMEOUT="10000"
```

### Redis Client Configuration

The Redis client (`lib/redis.ts`) includes:

- **Connection Pooling**: Reuses connections efficiently
- **Retry Strategy**: Exponential backoff with up to 10 retries
- **Health Checks**: Automatic connection monitoring
- **Graceful Shutdown**: Closes connections properly on exit
- **Error Handling**: Comprehensive error logging and recovery
- **Metrics**: Track hits, misses, latency, errors

## Monitoring

### View Cache Statistics

```typescript
import { cacheService } from '@/lib/cache';

// Get current statistics
const stats = cacheService.getStats();
console.log('Cache Hit Rate:', stats.hitRate);
console.log('Total Hits:', stats.hits);
console.log('Total Misses:', stats.misses);
```

### Redis Health Check

```typescript
import { getRedisClient } from '@/lib/redis';

const redis = getRedisClient();
const health = await redis.isHealthy();
console.log('Redis Status:', health ? 'Connected' : 'Disconnected');
```

### Monitor Redis Metrics

```typescript
import { getRedisClient } from '@/lib/redis';

const redis = getRedisClient();
const metrics = redis.getMetrics();
console.log('Commands Executed:', metrics.commandsExecuted);
console.log('Average Latency:', metrics.averageLatency, 'ms');
console.log('Errors:', metrics.errors);
```

## Troubleshooting

### Issue: Redis Not Connecting

**Symptoms**:
```
[Redis] Connection error: ECONNREFUSED
[Redis] Using memory cache fallback
```

**Solutions**:
1. Check Redis is running: `redis-cli ping` (should return `PONG`)
2. Verify `REDIS_HOST` and `REDIS_PORT` in `.env`
3. Check firewall rules allow connection to Redis port
4. For managed services, verify credentials and whitelist your IP

### Issue: NOAUTH Authentication Required

**Symptoms**:
```
[Redis] NOAUTH Authentication required
```

**Solutions**:
1. Set `REDIS_PASSWORD` in `.env`
2. For local Redis without password, leave `REDIS_PASSWORD` empty
3. Check Redis config file (`redis.conf`) for `requirepass` setting

### Issue: Encryption Key Warning

**Symptoms**:
```
[Encryption] ENCRYPTION_KEY not set - encryption disabled
```

**Solutions**:
1. Run: `node scripts/generate-keys.js`
2. Copy `ENCRYPTION_KEY` to `.env`
3. Restart application

### Issue: Memory Cache Only

**Symptoms**:
```
[Cache] Redis not available, using memory cache only
```

**Explanation**: This is **not an error** - the application gracefully falls back to memory cache when Redis is unavailable. Everything still works, just without persistent caching across restarts.

**To Enable Redis**:
1. Configure Redis as shown in [Quick Start](#quick-start)
2. Restart the application

## Deployment

### Local Development

```bash
# 1. Generate keys
node scripts/generate-keys.js

# 2. Update .env with generated keys
# 3. Start Redis (if using local)
redis-server

# 4. Start application
npm run dev
```

### Production (VPS)

```bash
# 1. On your local machine, generate production keys
node scripts/generate-keys.js

# 2. SSH to VPS
ssh deploy@your-vps-ip

# 3. Update production .env
cd /var/www/zyphextech
nano .env

# 4. Add generated keys:
# ENCRYPTION_KEY="..."
# NEXTAUTH_SECRET="..."
# REDIS_URL="..." (your managed Redis URL)

# 5. Deploy
git pull origin main
npm install
npm run build
pm2 restart all

# 6. Verify Redis connection
pm2 logs zyphextech | grep Redis
# Should see: [Redis] Connected successfully
```

### Production Checklist

- [ ] `ENCRYPTION_KEY` set (64 hex characters)
- [ ] `NEXTAUTH_SECRET` set
- [ ] Redis configured (managed service recommended)
- [ ] `REDIS_PASSWORD` set (if using password authentication)
- [ ] Redis accessible from VPS (check firewall/security groups)
- [ ] Application logs show "Redis Connected successfully"
- [ ] Cache hit rate > 50% after warmup period

## Best Practices

### Security

1. **Never commit `.env`** to version control
2. **Use different keys** for development and production
3. **Rotate keys periodically** (every 90 days)
4. **Use strong Redis passwords** in production (20+ characters)
5. **Enable Redis AUTH** for all production instances
6. **Use TLS/SSL** for Redis connections (`rediss://` protocol)

### Performance

1. **Set appropriate TTLs** for different data types
2. **Monitor cache hit rates** (target > 80%)
3. **Use cache tags** for efficient invalidation
4. **Implement cache warming** for frequently accessed data
5. **Avoid caching large objects** (> 1MB)
6. **Use compression** for cached data > 100KB

### Reliability

1. **Always have fallback** to memory cache (already implemented)
2. **Monitor Redis memory usage** (set `maxmemory` policy)
3. **Use connection pooling** (already implemented)
4. **Implement circuit breakers** (already implemented)
5. **Log cache errors** for debugging (already implemented)

## Redis Providers Comparison

| Provider | Free Tier | Pricing | Performance | Features |
|----------|-----------|---------|-------------|----------|
| **Upstash** | 10K requests/day | $0.20/100K requests | Excellent | Redis 6+, REST API, Multi-region |
| **Redis Labs** | 30MB | $5/mo for 500MB | Excellent | Redis 6+, Clustering, Modules |
| **AWS ElastiCache** | None | $15/mo (t3.micro) | Excellent | Auto-scaling, VPC, Backups |
| **DigitalOcean** | None | $15/mo (1GB) | Good | Managed, Automatic failover |
| **Heroku Redis** | 25MB | $15/mo for 1GB | Good | Easy setup, Auto-backups |
| **Local Redis** | Unlimited | Free | Fast | Full control, No limits |

**Recommendation**: 
- **Development**: Local Redis (free, fast)
- **Production**: Upstash (generous free tier, serverless)
- **Enterprise**: AWS ElastiCache (scaling, reliability)

## Additional Resources

- [Redis Documentation](https://redis.io/documentation)
- [ioredis Library](https://github.com/redis/ioredis)
- [Upstash Console](https://console.upstash.com/)
- [AWS ElastiCache](https://aws.amazon.com/elasticache/)

## Support

If you encounter issues:

1. Check application logs: `pm2 logs zyphextech`
2. Check Redis logs: `redis-cli MONITOR` (local) or provider dashboard
3. Review this guide's [Troubleshooting](#troubleshooting) section
4. Contact the development team with logs and error messages

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintained by**: Zyphex-Tech Development Team
