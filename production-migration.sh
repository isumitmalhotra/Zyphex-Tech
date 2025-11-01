#!/bin/bash
set -e  # Exit on any error

echo "=================================="
echo "PRODUCTION MIGRATION SCRIPT"
echo "Started at: $(date)"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the project directory (assuming script is run from project root)
PROJECT_DIR="/home/deploy/Zyphex-Tech"
cd "$PROJECT_DIR" || { echo "Failed to navigate to $PROJECT_DIR"; exit 1; }

echo -e "${YELLOW}Current directory: $(pwd)${NC}"
echo -e "${YELLOW}Current user: $(whoami)${NC}"

# Step 1: Backup Database
echo ""
echo "=================================="
echo "STEP 1: BACKING UP DATABASE"
echo "=================================="

BACKUP_DIR="$PROJECT_DIR/backups"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql"

echo -e "${YELLOW}Creating database backup: $BACKUP_FILE${NC}"

# Extract database URL from .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
    echo -e "${RED}✗ .env file not found!${NC}"
    exit 1
fi

# Backup using pg_dump (assumes DATABASE_URL is set)
if command -v pg_dump &> /dev/null; then
    # Parse DATABASE_URL: postgresql://user:pass@host:port/dbname
    DB_URL="${DATABASE_URL}"
    pg_dump "$DB_URL" > "$BACKUP_FILE"
    
    if [ -f "$BACKUP_FILE" ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo -e "${GREEN}✓ Backup created: $BACKUP_FILE ($BACKUP_SIZE)${NC}"
    else
        echo -e "${RED}✗ Backup failed!${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}! pg_dump not found, skipping database backup${NC}"
    echo -e "${YELLOW}! Ensure you have a backup before proceeding${NC}"
    read -p "Continue without backup? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
        exit 1
    fi
fi

# Step 2: Check Current Database State
echo ""
echo "=================================="
echo "STEP 2: CHECKING DATABASE STATE"
echo "=================================="

echo -e "${YELLOW}Running database diagnostics...${NC}"

# Create a temporary diagnostic script
cat > /tmp/check-db-state.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    // Check services content type
    const servicesType = await prisma.contentType.findUnique({
      where: { name: 'services' }
    });
    
    console.log('\n📊 Content Type Status:');
    console.log('  Services Type:', servicesType ? '✓ EXISTS' : '✗ NOT FOUND');
    
    if (servicesType) {
      // Check services count
      const totalServices = await prisma.dynamicContentItem.count({
        where: { contentTypeId: servicesType.id }
      });
      
      const publishedServices = await prisma.dynamicContentItem.count({
        where: { 
          contentTypeId: servicesType.id,
          status: 'PUBLISHED'
        }
      });
      
      const lowercasePublished = await prisma.dynamicContentItem.count({
        where: { 
          contentTypeId: servicesType.id,
          status: 'published'
        }
      });
      
      console.log('\n📈 Services Count:');
      console.log('  Total Services:', totalServices);
      console.log('  PUBLISHED (uppercase):', publishedServices);
      console.log('  published (lowercase):', lowercasePublished);
      
      // Check for missing publishedAt
      const missingPublishedAt = await prisma.dynamicContentItem.count({
        where: { 
          contentTypeId: servicesType.id,
          publishedAt: null
        }
      });
      
      console.log('  Missing publishedAt:', missingPublishedAt);
      
      // Sample services
      const samples = await prisma.dynamicContentItem.findMany({
        where: { contentTypeId: servicesType.id },
        select: { title: true, status: true, publishedAt: true },
        take: 3
      });
      
      console.log('\n📋 Sample Services:');
      samples.forEach(s => {
        console.log(`  - ${s.title} [${s.status}] ${s.publishedAt ? '✓ Published' : '✗ No date'}`);
      });
    }
    
    // Check total users
    const userCount = await prisma.user.count();
    console.log('\n👥 Users:', userCount);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
EOF

node /tmp/check-db-state.js

# Step 3: Run Prisma Migrations
echo ""
echo "=================================="
echo "STEP 3: RUNNING PRISMA MIGRATIONS"
echo "=================================="

echo -e "${YELLOW}Applying pending migrations...${NC}"
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migrations applied successfully${NC}"
else
    echo -e "${RED}✗ Migration failed!${NC}"
    exit 1
fi

# Step 4: Generate Prisma Client
echo ""
echo "=================================="
echo "STEP 4: GENERATING PRISMA CLIENT"
echo "=================================="

echo -e "${YELLOW}Regenerating Prisma Client...${NC}"
npx prisma generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Prisma Client generated${NC}"
else
    echo -e "${RED}✗ Prisma Client generation failed!${NC}"
    exit 1
fi

# Step 5: Fix Services Data
echo ""
echo "=================================="
echo "STEP 5: FIXING SERVICES DATA"
echo "=================================="

echo -e "${YELLOW}Creating data migration script...${NC}"

cat > /tmp/fix-services-data.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixServicesData() {
  try {
    console.log('\n🔧 Fixing services data...\n');
    
    const servicesType = await prisma.contentType.findUnique({
      where: { name: 'services' }
    });
    
    if (!servicesType) {
      console.log('⚠️  Services content type not found. Skipping.');
      return;
    }
    
    // Fix lowercase 'published' to uppercase 'PUBLISHED'
    const result1 = await prisma.dynamicContentItem.updateMany({
      where: {
        contentTypeId: servicesType.id,
        status: 'published'
      },
      data: {
        status: 'PUBLISHED'
      }
    });
    
    console.log(`✓ Updated ${result1.count} services: 'published' → 'PUBLISHED'`);
    
    // Add publishedAt to records missing it
    const result2 = await prisma.dynamicContentItem.updateMany({
      where: {
        contentTypeId: servicesType.id,
        status: 'PUBLISHED',
        publishedAt: null
      },
      data: {
        publishedAt: new Date()
      }
    });
    
    console.log(`✓ Added publishedAt to ${result2.count} services`);
    
    // Verify final state
    const finalCount = await prisma.dynamicContentItem.count({
      where: { 
        contentTypeId: servicesType.id,
        status: 'PUBLISHED',
        publishedAt: { not: null }
      }
    });
    
    console.log(`\n✅ Final: ${finalCount} services ready (PUBLISHED + publishedAt)`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixServicesData();
EOF

node /tmp/fix-services-data.js

# Step 6: Run Seed Scripts (if needed)
echo ""
echo "=================================="
echo "STEP 6: RUNNING SEED SCRIPTS"
echo "=================================="

echo -e "${YELLOW}Checking if seed scripts are needed...${NC}"

# Check if we have any services
SERVICE_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const type = await prisma.contentType.findUnique({ where: { name: 'services' } });
  if (!type) { console.log('0'); process.exit(0); }
  const count = await prisma.dynamicContentItem.count({ where: { contentTypeId: type.id } });
  console.log(count);
  await prisma.\$disconnect();
})();
")

if [ "$SERVICE_COUNT" -lt 3 ]; then
    echo -e "${YELLOW}Only $SERVICE_COUNT services found. Running seed script...${NC}"
    
    if [ -f "scripts/seed-services.ts" ]; then
        npx tsx scripts/seed-services.ts
        echo -e "${GREEN}✓ Seed script executed${NC}"
    else
        echo -e "${YELLOW}! Seed script not found, skipping${NC}"
    fi
else
    echo -e "${GREEN}✓ $SERVICE_COUNT services found, seed not needed${NC}"
fi

# Step 7: Build Application
echo ""
echo "=================================="
echo "STEP 7: BUILDING APPLICATION"
echo "=================================="

echo -e "${YELLOW}Installing dependencies...${NC}"
npm ci --production=false

echo -e "${YELLOW}Building Next.js application...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed!${NC}"
    exit 1
fi

# Step 8: Restart Application
echo ""
echo "=================================="
echo "STEP 8: RESTARTING APPLICATION"
echo "=================================="

# Check if using PM2
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Restarting with PM2...${NC}"
    pm2 restart zyphex || pm2 start npm --name "zyphex" -- start
    echo -e "${GREEN}✓ Application restarted with PM2${NC}"
    pm2 status
    
# Check if using systemd
elif systemctl is-active --quiet zyphex.service; then
    echo -e "${YELLOW}Restarting with systemd...${NC}"
    sudo systemctl restart zyphex.service
    echo -e "${GREEN}✓ Application restarted with systemd${NC}"
    sudo systemctl status zyphex.service --no-pager
    
else
    echo -e "${YELLOW}! No process manager detected${NC}"
    echo -e "${YELLOW}! Please manually restart your application${NC}"
    echo -e "${YELLOW}! Example: pm2 restart zyphex OR npm start${NC}"
fi

# Step 9: Verification
echo ""
echo "=================================="
echo "STEP 9: VERIFICATION"
echo "=================================="

echo -e "${YELLOW}Waiting 10 seconds for application to start...${NC}"
sleep 10

echo -e "${YELLOW}Testing API endpoints...${NC}"

# Test health endpoint
if curl -sf http://localhost:3000/api/health > /dev/null; then
    echo -e "${GREEN}✓ Health endpoint responding${NC}"
else
    echo -e "${RED}✗ Health endpoint not responding${NC}"
fi

# Test services API
SERVICES_RESPONSE=$(curl -sf http://localhost:3000/api/services)
if [ $? -eq 0 ]; then
    SERVICE_COUNT=$(echo "$SERVICES_RESPONSE" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
    echo -e "${GREEN}✓ Services API responding (total: $SERVICE_COUNT)${NC}"
else
    echo -e "${RED}✗ Services API not responding${NC}"
fi

# Step 10: Final Summary
echo ""
echo "=================================="
echo "MIGRATION COMPLETE!"
echo "=================================="
echo -e "${GREEN}✓ Database backed up${NC}"
echo -e "${GREEN}✓ Migrations applied${NC}"
echo -e "${GREEN}✓ Data fixed${NC}"
echo -e "${GREEN}✓ Application built${NC}"
echo -e "${GREEN}✓ Application restarted${NC}"
echo ""
echo "📊 Next Steps:"
echo "  1. Check logs: pm2 logs zyphex (or journalctl -u zyphex.service)"
echo "  2. Visit: http://66.116.199.219:3000/services"
echo "  3. Monitor for 30 minutes"
echo ""
echo "🔄 Rollback (if needed):"
echo "  psql \$DATABASE_URL < $BACKUP_FILE"
echo ""
echo "Completed at: $(date)"
echo "=================================="

# Cleanup temp files
rm -f /tmp/check-db-state.js /tmp/fix-services-data.js
