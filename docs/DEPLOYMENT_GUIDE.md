# Deployment Guide

Complete guide for deploying the Zyphex Tech CMS to production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Redis Setup](#redis-setup)
5. [File Storage Setup](#file-storage-setup)
6. [Deployment Platforms](#deployment-platforms)
7. [Post-Deployment](#post-deployment)
8. [Monitoring](#monitoring)
9. [Backup & Recovery](#backup--recovery)

---

## Pre-Deployment Checklist

### Code Preparation

- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Code formatted (`npm run format`)
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] Build succeeds (`npm run build`)

### Security

- [ ] Secrets rotated (database passwords, API keys)
- [ ] CORS configured properly
- [ ] Rate limiting configured
- [ ] File upload limits set
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma handles this)
- [ ] XSS prevention in place

### Performance

- [ ] Images optimized
- [ ] Bundle size analyzed
- [ ] Database indexes created
- [ ] Redis caching configured
- [ ] CDN configured (if applicable)

---

## Environment Configuration

### Required Environment Variables

```env
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# Authentication
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://yourdomain.com

# Redis (optional but recommended)
REDIS_URL=redis://:password@host:6379

# File Storage - Option 1: AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET=your-bucket-name

# File Storage - Option 2: Local
UPLOAD_DIR=./uploads
NEXT_PUBLIC_UPLOAD_URL=https://yourdomain.com/uploads

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Monitoring (optional)
SENTRY_DSN=https://...
```

### Generating Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Database Setup

### Option 1: Neon (Recommended)

1. **Create Neon Project**
   - Visit [neon.tech](https://neon.tech)
   - Create new project
   - Select region closest to your deployment

2. **Get Connection String**
   ```
   postgresql://user:password@host.neon.tech/neondb?sslmode=require
   ```

3. **Run Migrations**
   ```bash
   DATABASE_URL="..." npx prisma migrate deploy
   ```

4. **Seed Database** (optional)
   ```bash
   DATABASE_URL="..." npx prisma db seed
   ```

### Option 2: Supabase

1. **Create Supabase Project**
   - Visit [supabase.com](https://supabase.com)
   - Create new project
   - Get connection string from Settings → Database

2. **Connection Pooling**
   ```env
   # Use pooling connection string for production
   DATABASE_URL=postgresql://...@db.pooler.supabase.com:6543/postgres
   ```

3. **Run Migrations**
   ```bash
   npx prisma migrate deploy
   ```

### Option 3: Self-Hosted PostgreSQL

1. **Install PostgreSQL**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql-14
   
   # Start service
   sudo systemctl start postgresql
   ```

2. **Create Database**
   ```sql
   CREATE DATABASE zyphex_prod;
   CREATE USER zyphex_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE zyphex_prod TO zyphex_user;
   ```

3. **Configure SSL**
   ```sql
   ALTER SYSTEM SET ssl = on;
   SELECT pg_reload_conf();
   ```

4. **Connection String**
   ```env
   DATABASE_URL=postgresql://zyphex_user:password@localhost:5432/zyphex_prod?sslmode=require
   ```

### Database Optimization

```sql
-- Create indexes (if not in schema)
CREATE INDEX idx_cms_pages_status ON "CmsPage"(status);
CREATE INDEX idx_cms_pages_author ON "CmsPage"("authorId");
CREATE INDEX idx_cms_pages_created ON "CmsPage"("createdAt" DESC);
CREATE INDEX idx_cms_media_type ON "CmsMediaAsset"("assetType");
CREATE INDEX idx_activity_user ON "CmsActivityLog"("userId");

-- Analyze tables
ANALYZE "CmsPage";
ANALYZE "CmsMediaAsset";
ANALYZE "CmsTemplate";
```

---

## Redis Setup

### Option 1: Redis Cloud (Recommended)

1. **Create Redis Instance**
   - Visit [redis.com/cloud](https://redis.com/cloud)
   - Create free 30MB instance
   - Get connection string

2. **Configure**
   ```env
   REDIS_URL=redis://default:password@host:port
   ```

### Option 2: Upstash

1. **Create Database**
   - Visit [upstash.com](https://upstash.com)
   - Create Redis database
   - Copy REST URL or Redis URL

2. **Configure**
   ```env
   REDIS_URL=rediss://:password@host:6379
   ```

### Option 3: Self-Hosted

1. **Install Redis**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install redis-server
   
   # Start service
   sudo systemctl start redis
   ```

2. **Configure Security**
   ```bash
   # Edit /etc/redis/redis.conf
   requirepass your_secure_password
   bind 127.0.0.1
   
   # Restart
   sudo systemctl restart redis
   ```

3. **Test Connection**
   ```bash
   redis-cli
   AUTH your_secure_password
   PING  # Should return PONG
   ```

---

## File Storage Setup

### Option 1: AWS S3 (Recommended)

1. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://your-bucket-name --region us-east-1
   ```

2. **Configure CORS**
   ```json
   {
     "CORSRules": [
       {
         "AllowedOrigins": ["https://yourdomain.com"],
         "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
         "AllowedHeaders": ["*"],
         "MaxAgeSeconds": 3000
       }
     ]
   }
   ```

3. **Create IAM User**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::your-bucket-name",
           "arn:aws:s3:::your-bucket-name/*"
         ]
       }
     ]
   }
   ```

4. **Configure Environment**
   ```env
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=us-east-1
   S3_BUCKET=your-bucket-name
   ```

### Option 2: Cloudflare R2

1. **Create R2 Bucket**
   - Visit Cloudflare Dashboard → R2
   - Create bucket

2. **Get API Token**
   - Create API token with R2 permissions
   - Get S3-compatible endpoint

3. **Configure** (same as S3)
   ```env
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_ENDPOINT=https://....r2.cloudflarestorage.com
   S3_BUCKET=your-bucket
   ```

### Option 3: Local Storage (Not Recommended for Production)

```env
UPLOAD_DIR=./public/uploads
NEXT_PUBLIC_UPLOAD_URL=https://yourdomain.com/uploads
```

---

## Deployment Platforms

### Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Link Project**
   ```bash
   vercel link
   ```

3. **Set Environment Variables**
   ```bash
   vercel env add DATABASE_URL production
   vercel env add NEXTAUTH_SECRET production
   vercel env add REDIS_URL production
   # ... add all required env vars
   ```

4. **Deploy**
   ```bash
   vercel --prod
   ```

5. **Configure Domain**
   - Visit Vercel Dashboard → Settings → Domains
   - Add your custom domain

**Benefits:**
- Zero-config deployment
- Automatic HTTPS
- Global CDN
- Edge network
- Preview deployments

### Docker

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine AS base
   
   # Dependencies
   FROM base AS deps
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   
   # Builder
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   
   ENV NEXT_TELEMETRY_DISABLED 1
   RUN npx prisma generate
   RUN npm run build
   
   # Runner
   FROM base AS runner
   WORKDIR /app
   
   ENV NODE_ENV production
   ENV NEXT_TELEMETRY_DISABLED 1
   
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs
   
   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
   
   USER nextjs
   
   EXPOSE 3000
   ENV PORT 3000
   
   CMD ["node", "server.js"]
   ```

2. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - DATABASE_URL=${DATABASE_URL}
         - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
         - REDIS_URL=redis://redis:6379
       depends_on:
         - db
         - redis
     
     db:
       image: postgres:14
       environment:
         POSTGRES_USER: zyphex
         POSTGRES_PASSWORD: password
         POSTGRES_DB: zyphex_prod
       volumes:
         - postgres_data:/var/lib/postgresql/data
     
     redis:
       image: redis:7-alpine
       command: redis-server --requirepass yourpassword
       volumes:
         - redis_data:/data
   
   volumes:
     postgres_data:
     redis_data:
   ```

3. **Deploy**
   ```bash
   docker-compose up -d
   ```

### Manual Deployment (VPS)

1. **Install Dependencies**
   ```bash
   # Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # PM2
   sudo npm install -g pm2
   ```

2. **Clone and Build**
   ```bash
   git clone <repository>
   cd zyphex-tech
   npm install
   npm run build
   ```

3. **Setup PM2**
   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'zyphex-cms',
       script: 'npm',
       args: 'start',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       }
     }]
   };
   ```

4. **Start Application**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

5. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **SSL with Let's Encrypt**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Check health endpoint
curl https://yourdomain.com/api/health

# Check database connection
curl https://yourdomain.com/api/cms/pages

# Check cache
curl https://yourdomain.com/api/cms/cache
```

### 2. Run Database Migrations

```bash
# Production migration
npx prisma migrate deploy

# Verify
npx prisma db pull
```

### 3. Create Admin User

```bash
# Option 1: Seed script
npx prisma db seed

# Option 2: Direct SQL
psql $DATABASE_URL -c "INSERT INTO users ..."
```

### 4. Configure DNS

```
Type    Name    Value               TTL
A       @       your-server-ip      3600
CNAME   www     yourdomain.com      3600
```

### 5. Test Features

- [ ] Login/Authentication
- [ ] Create page
- [ ] Upload media
- [ ] Search functionality
- [ ] Cache invalidation
- [ ] Bulk operations
- [ ] Responsive UI (mobile/desktop)

---

## Monitoring

### Application Monitoring

**Sentry**
```typescript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Performance Monitoring

```bash
# Vercel Analytics (automatic)
# Or use Google Analytics, Plausible, etc.
```

### Database Monitoring

```sql
-- Monitor slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Monitor connections
SELECT count(*) FROM pg_stat_activity;

-- Monitor table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

### Redis Monitoring

```bash
# Connect to Redis
redis-cli

# Monitor stats
INFO stats
INFO memory
DBSIZE

# Monitor commands
MONITOR
```

---

## Backup & Recovery

### Database Backup

```bash
# Automated daily backup
0 2 * * * pg_dump $DATABASE_URL > /backup/db_$(date +\%Y\%m\%d).sql

# Compress
gzip /backup/db_$(date +\%Y\%m\%d).sql

# Upload to S3
aws s3 cp /backup/db_$(date +\%Y\%m\%d).sql.gz s3://your-backup-bucket/
```

### Database Restore

```bash
# From file
psql $DATABASE_URL < backup.sql

# From S3
aws s3 cp s3://your-backup-bucket/backup.sql.gz - | gunzip | psql $DATABASE_URL
```

### File Storage Backup

```bash
# S3 to S3 backup
aws s3 sync s3://your-bucket s3://your-backup-bucket --region us-east-1

# Local to S3
aws s3 sync ./uploads s3://your-backup-bucket/uploads
```

### Disaster Recovery Plan

1. **Database Failure**
   - Switch to read replica
   - Restore from latest backup
   - Run migrations if needed

2. **Application Failure**
   - Roll back to previous deployment
   - Check logs for errors
   - Fix and redeploy

3. **Cache Failure**
   - Application continues without cache
   - Restore Redis from backup
   - Rebuild cache

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check application performance
- Review cache hit rates

**Weekly:**
- Review database performance
- Check disk space
- Update dependencies (security patches)
- Review activity logs

**Monthly:**
- Database maintenance (VACUUM, ANALYZE)
- Update all dependencies
- Review and rotate logs
- Security audit

---

**Need Help?** Check [CMS_DOCUMENTATION.md](./CMS_DOCUMENTATION.md) or contact support.
