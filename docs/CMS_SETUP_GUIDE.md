# CMS Setup and Deployment Guide

This guide provides complete instructions for setting up and deploying the Content Management System (CMS) module.

## Prerequisites

- Node.js 18+ 
- npm or pnpm package manager
- Database (SQLite for development, PostgreSQL/MySQL for production)
- Next.js 14+
- TypeScript

## Initial Setup

### 1. Environment Configuration

Create a `.env.local` file in your project root:

```env
# Database
DATABASE_URL="file:./dev.db"  # SQLite for development
# DATABASE_URL="postgresql://username:password@localhost:5432/cms_db"  # PostgreSQL for production

# NextAuth Configuration
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Admin User (for initial setup)
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="secure-admin-password"

# File Upload Settings
MAX_FILE_SIZE="50MB"
UPLOAD_DIR="public/uploads"

# Redis (optional, for caching)
REDIS_URL="redis://localhost:6379"

# Email Configuration (for notifications)
SMTP_HOST="smtp.yourdomain.com"
SMTP_PORT="587"
SMTP_USER="your-email@yourdomain.com"
SMTP_PASS="your-email-password"
```

### 2. Database Setup

#### For SQLite (Development)

The database will be created automatically when you run migrations.

#### For PostgreSQL (Production)

1. Create a new database:
```sql
CREATE DATABASE cms_db;
CREATE USER cms_user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE cms_db TO cms_user;
```

2. Update your `DATABASE_URL` in `.env.local`:
```env
DATABASE_URL="postgresql://cms_user:your-password@localhost:5432/cms_db"
```

### 3. Database Schema

Add the CMS schema to your `prisma/schema.prisma`:

```prisma
// User model (if not already exists)
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // CMS Relations
  createdContent Content[] @relation("ContentAuthor")
  updatedContent Content[] @relation("ContentUpdater")
  activityLogs   ActivityLog[]

  @@map("users")
}

enum Role {
  USER
  ADMIN
  SUPER_ADMIN
}

// Content Type Model
model ContentType {
  id          String    @id @default(cuid())
  name        String
  slug        String    @unique
  description String?
  fields      Json      // Array of field definitions
  isSystem    Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  content Content[]

  @@map("content_types")
}

// Content Model
model Content {
  id            String      @id @default(cuid())
  title         String
  slug          String      @unique
  excerpt       String?
  fields        Json        // Dynamic content fields
  status        ContentStatus @default(DRAFT)
  publishedAt   DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Relations
  contentType   ContentType @relation(fields: [contentTypeId], references: [id], onDelete: Cascade)
  contentTypeId String
  author        User        @relation("ContentAuthor", fields: [authorId], references: [id])
  authorId      String
  updatedBy     User?       @relation("ContentUpdater", fields: [updatedById], references: [id])
  updatedById   String?

  // Indexes
  @@index([contentTypeId])
  @@index([status])
  @@index([publishedAt])
  @@map("content")
}

enum ContentStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
  SCHEDULED
}

// Media Asset Model
model MediaAsset {
  id          String   @id @default(cuid())
  filename    String
  originalName String
  mimeType    String
  size        Int
  width       Int?
  height      Int?
  alt         String?
  caption     String?
  metadata    Json?    // Additional metadata
  path        String   // File path
  url         String   // Public URL
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  uploadedBy  User     @relation(fields: [uploadedById], references: [id])
  uploadedById String

  @@map("media_assets")
}

// Activity Log Model
model ActivityLog {
  id         String   @id @default(cuid())
  action     String   // CREATE, UPDATE, DELETE, PUBLISH, etc.
  entityType String   // CONTENT, CONTENT_TYPE, MEDIA
  entityId   String
  details    Json?    // Additional details about the action
  createdAt  DateTime @default(now())

  // Relations
  user       User     @relation(fields: [userId], references: [id])
  userId     String

  @@index([entityType, entityId])
  @@index([userId])
  @@map("activity_logs")
}
```

### 4. Run Database Migrations

```bash
# Generate migration
npx prisma migrate dev --name init-cms

# Generate Prisma client
npx prisma generate
```

### 5. Install Dependencies

If not already installed, add the required dependencies:

```bash
npm install @prisma/client prisma zod sharp multer
npm install -D @types/multer
```

### 6. Create Initial Admin User

Create a script to set up your initial admin user:

```bash
# Run the admin creation script
npx tsx scripts/create-admin-user.ts
```

Or create the admin user manually through the database.

## File Structure

Ensure your project has the following CMS-related files:

```
project-root/
├── app/
│   ├── api/
│   │   └── admin/
│   │       └── cms/
│   │           ├── content/
│   │           │   ├── route.ts
│   │           │   ├── [id]/
│   │           │   │   └── route.ts
│   │           │   └── bulk/
│   │           │       └── route.ts
│   │           ├── content-types/
│   │           │   ├── route.ts
│   │           │   └── [id]/
│   │           │       └── route.ts
│   │           ├── media/
│   │           │   ├── route.ts
│   │           │   └── [id]/
│   │           │       └── route.ts
│   │           └── activity/
│   │               └── route.ts
│   └── admin/
│       └── content/
│           └── page.tsx
├── components/
│   └── cms/
│       ├── ContentForm.tsx
│       ├── ContentList.tsx
│       ├── MediaUpload.tsx
│       └── ...
├── hooks/
│   └── use-cms.ts
├── lib/
│   ├── cms-validation.ts
│   ├── media-optimizer.ts
│   └── ...
├── types/
│   └── cms.ts
├── prisma/
│   └── schema.prisma
└── docs/
    ├── CMS_TESTING_GUIDE.md
    └── CMS_SETUP_GUIDE.md
```

## Development

### 1. Start Development Server

```bash
npm run dev
```

### 2. Access CMS

Navigate to `http://localhost:3000/admin/content` to access the CMS interface.

### 3. Create Content Types

1. Go to the Content Types section
2. Click "Create Content Type"
3. Define your fields and settings
4. Save the content type

### 4. Create Content

1. Go to the Content section
2. Select a content type
3. Fill in the content fields
4. Save as draft or publish

## Production Deployment

### 1. Environment Variables

Update your production environment variables:

```env
# Production Database
DATABASE_URL="postgresql://username:password@your-db-host:5432/cms_db"

# NextAuth
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://yourdomain.com"

# File Storage (for production, consider using cloud storage)
UPLOAD_DIR="/var/www/uploads"
CDN_URL="https://cdn.yourdomain.com"

# Redis (recommended for production)
REDIS_URL="redis://your-redis-host:6379"
```

### 2. Database Migration

Run migrations on your production database:

```bash
# Set production database URL
export DATABASE_URL="postgresql://username:password@your-db-host:5432/cms_db"

# Run migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

### 3. Build Application

```bash
# Build for production
npm run build

# Start production server
npm start
```

### 4. Deploy to Vercel

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

```bash
# Using Vercel CLI
npm install -g vercel
vercel --prod
```

### 5. Deploy to Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t cms-app .
docker run -p 3000:3000 -e DATABASE_URL="your-db-url" cms-app
```

## Performance Optimization

### 1. Database Indexing

Ensure proper database indexes are in place:

```prisma
// Add indexes to frequently queried fields
model Content {
  // ... fields ...
  
  @@index([contentTypeId])
  @@index([status])
  @@index([publishedAt])
  @@index([slug])
}
```

### 2. Caching Strategy

Implement caching for frequently accessed data:

```typescript
// lib/cache.ts
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!)

export async function getCachedContent(key: string) {
  const cached = await redis.get(key)
  return cached ? JSON.parse(cached) : null
}

export async function setCachedContent(key: string, data: any, ttl = 3600) {
  await redis.setex(key, ttl, JSON.stringify(data))
}
```

### 3. Image Optimization

Configure Next.js image optimization:

```javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['your-domain.com', 'cdn.your-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
}

export default nextConfig
```

## Security Considerations

### 1. File Upload Security

- Validate file types and sizes
- Scan uploaded files for malware
- Use secure file storage locations
- Implement proper access controls

### 2. Content Sanitization

- Sanitize user input to prevent XSS
- Validate all content before saving
- Use Content Security Policy (CSP)

### 3. Access Control

- Implement proper role-based access control
- Use session management
- Regularly audit user permissions

## Monitoring and Logging

### 1. Error Tracking

Implement error tracking with services like Sentry:

```bash
npm install @sentry/nextjs
```

### 2. Performance Monitoring

Monitor API performance and database queries:

```typescript
// lib/monitoring.ts
export function logSlowQuery(query: string, duration: number) {
  if (duration > 1000) {
    console.warn(`Slow query detected: ${query} took ${duration}ms`)
  }
}
```

### 3. Audit Logging

The CMS includes built-in activity logging for all content changes.

## Backup and Recovery

### 1. Database Backups

Set up automated database backups:

```bash
# PostgreSQL backup
pg_dump -h your-host -U username -d cms_db > backup_$(date +%Y%m%d).sql
```

### 2. File Backups

Back up uploaded media files regularly:

```bash
# Sync uploads to backup location
rsync -av /var/www/uploads/ /backup/uploads/
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check DATABASE_URL format
   - Verify database server is running
   - Check network connectivity

2. **File Upload Issues**
   - Check file permissions on upload directory
   - Verify MAX_FILE_SIZE setting
   - Check available disk space

3. **Performance Issues**
   - Check database indexes
   - Monitor query performance
   - Implement caching where needed

### Debug Mode

Enable debug logging:

```env
DEBUG=true
LOG_LEVEL=debug
```

## Support and Maintenance

### Regular Maintenance Tasks

1. **Database Cleanup**
   - Remove orphaned records
   - Archive old content
   - Optimize database tables

2. **File Cleanup**
   - Remove unused media files
   - Clean up temporary files
   - Optimize images

3. **Security Updates**
   - Keep dependencies updated
   - Monitor security advisories
   - Regular security audits

### Monitoring Checklist

- [ ] Database performance
- [ ] API response times
- [ ] File storage usage
- [ ] Error rates
- [ ] User activity
- [ ] Security events

This setup guide provides everything needed to successfully deploy and maintain the CMS module in both development and production environments.