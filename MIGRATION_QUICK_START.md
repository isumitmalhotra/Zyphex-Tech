# PRODUCTION MIGRATION - QUICK START GUIDE

## 🚀 Execute Migration on VPS

### Step 1: Copy the migration script to VPS

From your local machine (PowerShell):
```powershell
scp production-migration.sh root@66.116.199.219:/tmp/
```

### Step 2: SSH to VPS and run migration

```bash
# Connect to VPS
ssh root@66.116.199.219

# Switch to deploy user
su deploy

# Navigate to project directory
cd /home/deploy/Zyphex-Tech

# Copy migration script
cp /tmp/production-migration.sh .

# Make it executable
chmod +x production-migration.sh

# Run the migration (with logging)
./production-migration.sh 2>&1 | tee migration-log-$(date +%Y%m%d_%H%M%S).log
```

---

## 📋 What the Script Does

1. **Backup Database** - Creates timestamped SQL backup in `/home/deploy/Zyphex-Tech/backups/`
2. **Check Database** - Verifies current state and counts services
3. **Run Migrations** - Executes `npx prisma migrate deploy`
4. **Generate Prisma Client** - Regenerates types with `npx prisma generate`
5. **Fix Services Data** - Updates status from 'published' → 'PUBLISHED' and adds publishedAt
6. **Run Seed Scripts** - Populates services if count < 3
7. **Build App** - Runs `npm ci && npm run build`
8. **Restart Service** - Auto-detects PM2 or systemd and restarts
9. **Verify** - Tests API endpoints and reports status
10. **Summary** - Shows results and rollback instructions

---

## ⚡ Alternative: Manual Step-by-Step Commands

If you prefer to run commands manually:

```bash
# 1. Connect and switch user
ssh root@66.116.199.219
su deploy
cd /home/deploy/Zyphex-Tech

# 2. Backup database
mkdir -p backups
pg_dump $DATABASE_URL > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Run migrations
npx prisma migrate deploy
npx prisma generate

# 4. Fix services data
node << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const type = await prisma.contentType.findUnique({ where: { name: 'services' } });
  if (type) {
    await prisma.dynamicContentItem.updateMany({
      where: { contentTypeId: type.id, status: 'published' },
      data: { status: 'PUBLISHED' }
    });
    await prisma.dynamicContentItem.updateMany({
      where: { contentTypeId: type.id, status: 'PUBLISHED', publishedAt: null },
      data: { publishedAt: new Date() }
    });
    console.log('✓ Services fixed');
  }
  await prisma.$disconnect();
})();
EOF

# 5. Build and restart
npm ci
npm run build
pm2 restart zyphex

# 6. Verify
curl http://localhost:3000/api/services
pm2 logs zyphex --lines 50
```

---

## 🔍 Verification Commands

After migration completes:

```bash
# Check service status
pm2 status
pm2 logs zyphex --lines 100

# Test API endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/services | jq

# Check database
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{const t=await p.contentType.findUnique({where:{name:'services'}});const c=await p.dynamicContentItem.count({where:{contentTypeId:t.id,status:'PUBLISHED'}});console.log('Published services:',c);await p.\$disconnect();})()"

# Check live website
curl -I http://66.116.199.219:3000/services
```

---

## 🔄 Rollback Instructions

If something goes wrong:

```bash
# Stop application
pm2 stop zyphex

# Restore database from backup
psql $DATABASE_URL < backups/backup_YYYYMMDD_HHMMSS.sql

# Revert code (if needed)
git reset --hard <previous-commit-hash>

# Rebuild and restart
npm ci
npm run build
pm2 restart zyphex
```

---

## 📊 Expected Results

After successful migration:

- ✅ Database backup created in `backups/` directory
- ✅ All Prisma migrations applied
- ✅ Services status changed to 'PUBLISHED' with publishedAt dates
- ✅ 6+ services visible on `/services` page
- ✅ API endpoint `/api/services` returns data
- ✅ Application running on port 3000
- ✅ No errors in PM2 logs

---

## 🆘 Troubleshooting

### If migration script fails:

1. **Check error logs**: Look at the output where it stopped
2. **Database connection**: Verify `.env` has correct `DATABASE_URL`
3. **Permissions**: Ensure deploy user owns the project directory
4. **Dependencies**: Run `npm ci` to ensure all packages installed
5. **Ports**: Check if port 3000 is already in use

### Common issues:

**"pg_dump: command not found"**
```bash
sudo apt-get install postgresql-client
```

**"Permission denied"**
```bash
sudo chown -R deploy:deploy /home/deploy/Zyphex-Tech
```

**"Port 3000 already in use"**
```bash
pm2 stop all
pm2 start npm --name "zyphex" -- start
```

---

## 📞 Support Checklist

After migration, monitor for 30-60 minutes:

- [ ] PM2 shows "online" status
- [ ] No errors in `pm2 logs`
- [ ] `/services` page loads with services visible
- [ ] API endpoints respond correctly
- [ ] Admin login works
- [ ] No database connection errors

If any issues persist after 1 hour, run rollback procedure.
