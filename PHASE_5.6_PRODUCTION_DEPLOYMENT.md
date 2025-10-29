# Phase 5.6 - Production Deployment Guide
## Zyphex Tech Platform - Complete Deployment Documentation

**Date:** October 29, 2025  
**Status:** Ready for Production Deployment  
**Platform:** Next.js 14.2.33 with PostgreSQL

---

## Table of Contents

1. [Deployment Options](#deployment-options)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Vercel Deployment (Recommended)](#vercel-deployment-recommended)
4. [AWS Deployment](#aws-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Environment Variables](#environment-variables)
7. [Database Setup](#database-setup)
8. [Post-Deployment Tasks](#post-deployment-tasks)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Deployment Options

### Option 1: Vercel (Recommended) ⭐

**Pros:**
- ✅ Zero-configuration deployment
- ✅ Automatic HTTPS/SSL
- ✅ Global CDN
- ✅ Automatic scaling
- ✅ Built-in preview deployments
- ✅ Easy rollbacks
- ✅ Vercel Postgres integration
- ✅ Free tier available

**Cons:**
- ⚠️ Vendor lock-in
- ⚠️ Limited control over infrastructure

**Best For:** Quick deployment, startups, MVP launch

---

### Option 2: AWS (Enterprise)

**Pros:**
- ✅ Full infrastructure control
- ✅ Scalable (EC2, ECS, Lambda)
- ✅ Custom networking
- ✅ Cost optimization options
- ✅ Enterprise compliance

**Cons:**
- ⚠️ Requires DevOps expertise
- ⚠️ More complex setup
- ⚠️ Higher maintenance overhead

**Best For:** Enterprise applications, custom requirements

---

### Option 3: Docker (Flexible)

**Pros:**
- ✅ Platform agnostic
- ✅ Consistent environments
- ✅ Can deploy anywhere
- ✅ Easy local testing
- ✅ Kubernetes ready

**Cons:**
- ⚠️ Requires container orchestration
- ⚠️ Manual scaling setup
- ⚠️ More DevOps overhead

**Best For:** On-premise, hybrid cloud, multi-cloud

---

## Pre-Deployment Checklist

### ✅ Code Quality
- [x] All tests passing
- [x] No TypeScript errors
- [x] ESLint warnings resolved
- [x] Build succeeds (`npm run build`)
- [x] Security audit completed

### ✅ Environment Setup
- [ ] Production environment variables prepared
- [ ] Database connection string ready
- [ ] NEXTAUTH_SECRET generated (strong random string)
- [ ] SMTP credentials configured
- [ ] Stripe keys (live) obtained
- [ ] AWS S3 credentials ready (if using)

### ✅ Database
- [ ] Production database created
- [ ] Migrations ready to run
- [ ] Backup strategy planned
- [ ] Connection pooling configured

### ✅ Security
- [ ] All secrets moved to environment variables
- [ ] Security headers configured
- [ ] CORS settings verified
- [ ] Rate limiting configured
- [ ] SSL/HTTPS enabled

### ✅ Performance
- [ ] Image optimization configured
- [ ] Caching strategy implemented
- [ ] CDN setup (if not using Vercel)
- [ ] Database indexes optimized

---

## Vercel Deployment (Recommended)

### Step 1: Prepare Your Repository

```bash
# Ensure you're on the main branch
git checkout main

# Commit any pending changes
git add .
git commit -m "Prepare for production deployment"

# Push to GitHub
git push origin main
```

### Step 2: Connect to Vercel

1. **Sign up/Login to Vercel:**
   - Go to https://vercel.com
   - Sign up with GitHub (recommended)

2. **Import Project:**
   - Click "Add New" → "Project"
   - Select your GitHub repository: `Zyphex-Tech`
   - Click "Import"

3. **Configure Project:**
   ```
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install --legacy-peer-deps
   ```

### Step 3: Set Environment Variables

In Vercel dashboard, go to **Settings → Environment Variables** and add:

#### Required Variables:

```env
# Database (Vercel Postgres or external)
DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
CONTACT_EMAIL=contact@yourdomain.com

# Stripe (Production keys)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS S3 (Optional - for file uploads)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Application URLs
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Optional: Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Step 4: Setup Vercel Postgres (Recommended)

1. **Create Database:**
   - In Vercel dashboard: **Storage** → **Create Database**
   - Select "Postgres"
   - Choose region (closest to users)
   - Click "Create"

2. **Connect to Project:**
   - Select your project
   - Copy the connection string
   - Add to environment variables as `DATABASE_URL`

3. **Initialize Database:**
   ```bash
   # Run migrations
   npx prisma migrate deploy
   
   # Generate Prisma Client
   npx prisma generate
   
   # Optional: Seed initial data
   npm run db:seed
   ```

### Step 5: Deploy

1. **Trigger Deployment:**
   - Click "Deploy" in Vercel
   - Wait for build to complete (~3-5 minutes)
   - Check build logs for errors

2. **Verify Deployment:**
   - Visit your deployment URL
   - Test authentication
   - Check API endpoints
   - Verify database connections

### Step 6: Custom Domain (Optional)

1. **Add Domain:**
   - Go to **Settings → Domains**
   - Add your custom domain
   - Follow DNS configuration instructions

2. **DNS Configuration:**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

3. **SSL Certificate:**
   - Automatically provisioned by Vercel
   - No action needed

---

## AWS Deployment

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        AWS Cloud                             │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐    ┌─────────────┐ │
│  │ Route 53     │─────▶│ CloudFront   │───▶│ ALB         │ │
│  │ (DNS)        │      │ (CDN)        │    │ (Load Bal.) │ │
│  └──────────────┘      └──────────────┘    └──────┬──────┘ │
│                                                    │        │
│                           ┌────────────────────────┴───┐    │
│                           ▼                            ▼    │
│                    ┌─────────────┐            ┌─────────────┐│
│                    │ ECS/Fargate │            │ ECS/Fargate ││
│                    │ Container 1 │            │ Container 2 ││
│                    └──────┬──────┘            └──────┬──────┘│
│                           │                          │       │
│                           └──────────┬───────────────┘       │
│                                      ▼                       │
│                              ┌──────────────┐               │
│                              │ RDS Postgres │               │
│                              │ (Database)   │               │
│                              └──────────────┘               │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │ S3           │      │ ElastiCache  │                    │
│  │ (Storage)    │      │ (Redis)      │                    │
│  └──────────────┘      └──────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### Step 1: Prerequisites

```bash
# Install AWS CLI
# Download from: https://aws.amazon.com/cli/

# Configure AWS credentials
aws configure
# AWS Access Key ID: YOUR_ACCESS_KEY
# AWS Secret Access Key: YOUR_SECRET_KEY
# Default region: us-east-1
# Default output format: json

# Install Docker
# Download from: https://www.docker.com/products/docker-desktop
```

### Step 2: Create RDS Database

```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier zyphextech-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username admin \
  --master-user-password YOUR_STRONG_PASSWORD \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxxxx \
  --db-subnet-group-name your-subnet-group \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00"

# Get connection endpoint
aws rds describe-db-instances \
  --db-instance-identifier zyphextech-prod \
  --query 'DBInstances[0].Endpoint.Address'
```

### Step 3: Create Docker Image

**Create Dockerfile:**

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

**Create .dockerignore:**

```
node_modules
.next
.git
.env
.env.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
```

### Step 4: Build and Push to ECR

```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name zyphextech-prod \
  --region us-east-1

# Get ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <your-account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t zyphextech-prod .

# Tag image
docker tag zyphextech-prod:latest <your-account-id>.dkr.ecr.us-east-1.amazonaws.com/zyphextech-prod:latest

# Push to ECR
docker push <your-account-id>.dkr.ecr.us-east-1.amazonaws.com/zyphextech-prod:latest
```

### Step 5: Deploy to ECS/Fargate

**Create ECS Cluster:**

```bash
aws ecs create-cluster --cluster-name zyphextech-prod-cluster
```

**Create Task Definition:**

```json
{
  "family": "zyphextech-prod",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "zyphextech-app",
      "image": "<your-account-id>.dkr.ecr.us-east-1.amazonaws.com/zyphextech-prod:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "NEXT_PUBLIC_BASE_URL",
          "value": "https://zyphextech.com"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:account:secret:prod/database-url"
        },
        {
          "name": "NEXTAUTH_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:account:secret:prod/nextauth-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/zyphextech-prod",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

**Create Service:**

```bash
aws ecs create-service \
  --cluster zyphextech-prod-cluster \
  --service-name zyphextech-prod-service \
  --task-definition zyphextech-prod \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:account:targetgroup/zyphextech,containerName=zyphextech-app,containerPort=3000"
```

### Step 6: Setup Load Balancer & DNS

1. **Create Application Load Balancer**
2. **Configure target groups**
3. **Setup SSL certificate (AWS Certificate Manager)**
4. **Configure Route 53 DNS**

---

## Docker Deployment

### Docker Compose Setup

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=zyphextech
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=zyphextech_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

**Deploy:**

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down

# Update and restart
docker-compose pull
docker-compose up -d --force-recreate
```

---

## Environment Variables

### Complete List

```env
# ============================================
# DATABASE
# ============================================
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# ============================================
# NEXTAUTH
# ============================================
NEXTAUTH_URL="https://zyphextech.com"
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"

# ============================================
# EMAIL / SMTP
# ============================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@zyphextech.com"
CONTACT_EMAIL="contact@zyphextech.com"
SEND_CONFIRMATION_EMAIL="true"

# ============================================
# STRIPE PAYMENTS (Production)
# ============================================
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# ============================================
# AWS S3 (File Storage)
# ============================================
AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="zyphextech-uploads"

# ============================================
# APPLICATION URLs
# ============================================
NEXT_PUBLIC_BASE_URL="https://zyphextech.com"
NEXT_PUBLIC_APP_URL="https://zyphextech.com"

# ============================================
# ANALYTICS (Optional)
# ============================================
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
NEXT_TELEMETRY_DISABLED="1"

# ============================================
# REDIS (Optional - for caching)
# ============================================
REDIS_URL="redis://localhost:6379"

# ============================================
# NODE ENVIRONMENT
# ============================================
NODE_ENV="production"
```

### Security Best Practices

1. **Never commit `.env` files to repository**
2. **Use different secrets for each environment**
3. **Rotate secrets regularly (every 90 days)**
4. **Use secrets management:**
   - Vercel: Built-in environment variables
   - AWS: AWS Secrets Manager
   - Docker: Docker secrets or HashiCorp Vault

---

## Database Setup

### Option 1: Vercel Postgres

```bash
# Already covered in Vercel deployment section
# Automatic setup via Vercel dashboard
```

### Option 2: AWS RDS

```bash
# Create database
aws rds create-db-instance \
  --db-instance-identifier zyphextech-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username admin \
  --master-user-password YOUR_PASSWORD \
  --allocated-storage 20

# Get connection string
aws rds describe-db-instances \
  --db-instance-identifier zyphextech-prod
```

### Option 3: External Providers

**Recommended Providers:**
- **Supabase** (Free tier, managed Postgres)
- **Neon** (Serverless Postgres)
- **PlanetScale** (MySQL, if switching from Postgres)
- **Railway** (Managed Postgres)

### Run Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data (optional)
npm run db:seed
```

### Database Backup Strategy

**Automated Backups:**

```bash
# Create backup script
#!/bin/bash
# backup-db.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql"

pg_dump $DATABASE_URL > $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE s3://zyphextech-backups/database/

# Keep only last 30 backups
aws s3 ls s3://zyphextech-backups/database/ | sort | head -n -30 | awk '{print $4}' | xargs -I {} aws s3 rm s3://zyphextech-backups/database/{}
```

**Schedule with cron:**

```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup-db.sh
```

---

## Post-Deployment Tasks

### 1. Verify Deployment ✅

```bash
# Check health endpoint
curl https://your-domain.com/api/health

# Test authentication
curl https://your-domain.com/api/auth/session

# Verify database connection
curl https://your-domain.com/api/users
```

### 2. Run Database Migrations ✅

```bash
npx prisma migrate deploy
```

### 3. Create Admin User ✅

```bash
# Access database
psql $DATABASE_URL

# Create admin user
INSERT INTO "User" (id, name, email, password, role, "emailVerified")
VALUES (
  'admin-001',
  'Admin User',
  'admin@zyphextech.com',
  '$2a$10$hashed_password_here', -- Use bcrypt hash
  'SUPER_ADMIN',
  NOW()
);
```

### 4. Configure DNS ✅

**Update DNS records:**

```
Type: A
Name: @
Value: <Your-Server-IP or Vercel-IP>

Type: CNAME  
Name: www
Value: your-domain.com
```

### 5. Setup SSL Certificate ✅

**Vercel:** Automatic  
**AWS:** Use AWS Certificate Manager  
**Other:** Use Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d zyphextech.com -d www.zyphextech.com
```

### 6. Configure Email Sending ✅

Test email configuration:

```bash
# Run test script
npm run test:email
```

### 7. Setup Monitoring ✅

- Enable Vercel Analytics
- Setup Sentry error tracking
- Configure uptime monitoring (Uptime Robot, Pingdom)

---

## CI/CD Pipeline

### GitHub Actions (Recommended)

**Create `.github/workflows/deploy.yml`:**

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci --legacy-peer-deps
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Vercel Auto-Deploy

1. Connect GitHub repository to Vercel
2. Enable automatic deployments
3. Configure branch deployments:
   - `main` → Production
   - `develop` → Preview
   - Feature branches → Preview

---

## Monitoring & Maintenance

### 1. Application Monitoring

**Vercel Analytics:**
- Automatic page views
- Performance metrics
- Error tracking

**Sentry (Error Tracking):**

```bash
# Install Sentry
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard -i nextjs
```

**Enable in code:**

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 2. Database Monitoring

```bash
# Check connection count
SELECT count(*) FROM pg_stat_activity;

# Monitor slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;

# Database size
SELECT pg_size_pretty(pg_database_size('zyphextech_prod'));
```

### 3. Uptime Monitoring

**Services:**
- **Uptime Robot** (Free tier available)
- **Pingdom**
- **Better Uptime**
- **StatusCake**

**Configure alerts:**
- Email notifications
- Slack/Discord webhooks
- SMS alerts (critical only)

### 4. Log Aggregation

**Options:**
- Vercel Logs (built-in)
- CloudWatch (AWS)
- Logtail
- Papertrail
- Datadog

### 5. Performance Monitoring

```bash
# Run Lighthouse audit
npm run performance-audit

# Check bundle size
npm run analyze
```

---

## Troubleshooting

### Common Issues

#### 1. Build Fails

```bash
# Clear cache
rm -rf .next node_modules
npm install --legacy-peer-deps
npm run build
```

#### 2. Database Connection Errors

```bash
# Test connection
psql $DATABASE_URL

# Check firewall rules
# Ensure database allows connections from your server IP
```

#### 3. Environment Variables Not Loading

```bash
# Verify in Vercel dashboard
# Ensure no typos in variable names
# Check that values are not wrapped in quotes
```

#### 4. Authentication Issues

```bash
# Regenerate NEXTAUTH_SECRET
openssl rand -base64 32

# Clear browser cookies
# Check NEXTAUTH_URL matches deployment domain
```

---

## Rollback Procedure

### Vercel Rollback

1. Go to Vercel dashboard
2. Select "Deployments"
3. Find previous successful deployment
4. Click "..." → "Promote to Production"

### AWS Rollback

```bash
# Update ECS service to previous task definition
aws ecs update-service \
  --cluster zyphextech-prod-cluster \
  --service zyphextech-prod-service \
  --task-definition zyphextech-prod:PREVIOUS_VERSION
```

### Docker Rollback

```bash
# Pull previous image version
docker pull zyphextech-prod:previous-tag

# Restart with previous version
docker-compose down
docker-compose up -d
```

---

## Cost Estimates

### Vercel (Recommended)

```
Free Tier:
- 100 GB bandwidth
- Unlimited projects
- Automatic HTTPS
- Preview deployments

Pro ($20/month):
- 1 TB bandwidth
- Priority support
- Advanced analytics
- Password protection

Total: $0-20/month (for small projects)
```

### AWS

```
Estimated Monthly Costs:

EC2/ECS:
- 2x t3.small instances: $30
- Load Balancer: $20
- RDS db.t3.micro: $15
- S3 Storage: $5
- Data Transfer: $10

Total: ~$80/month (scalable)
```

### Docker (Self-Hosted)

```
VPS Costs:
- DigitalOcean Droplet (2GB): $12/month
- Linode (2GB): $12/month  
- Hetzner Cloud (2GB): $6/month

Total: $6-12/month (+ domain)
```

---

## Production Checklist

### Before Launch

- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] Admin user created
- [ ] SSL certificate installed
- [ ] DNS configured and propagated
- [ ] Email sending tested
- [ ] Payment gateway tested (Stripe)
- [ ] Authentication flows tested
- [ ] Mobile responsiveness verified
- [ ] Performance audit passed
- [ ] Security audit completed
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] Error tracking enabled

### After Launch

- [ ] Monitor error logs (first 24 hours)
- [ ] Check performance metrics
- [ ] Verify all critical features
- [ ] Test user registration/login
- [ ] Test payment flows
- [ ] Monitor database performance
- [ ] Check email delivery
- [ ] Verify analytics tracking

---

## Support & Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check uptime status
- Review performance metrics

**Weekly:**
- Review analytics data
- Check database performance
- Verify backup completion

**Monthly:**
- Security updates
- Dependency updates
- Performance optimization
- Cost review

**Quarterly:**
- Security audit
- Database optimization
- Feature usage analysis
- Capacity planning

---

## Next Steps

After successful deployment:

1. **Phase 5.7:** Setup comprehensive monitoring
2. **Phase 5.8:** Complete documentation and QA
3. **Launch marketing campaign**
4. **Gather user feedback**
5. **Plan feature roadmap**

---

**Deployment Status:** Ready for Production ✅  
**Estimated Deployment Time:** 2-4 hours (Vercel) / 1-2 days (AWS)  
**Recommended Platform:** Vercel (for quick launch)

**Need Help?** Review troubleshooting section or contact DevOps team.
