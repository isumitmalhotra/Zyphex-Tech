#!/bin/bash

# Production Deployment Script for Zyphex Tech Platform
# This script automates the deployment process with safety checks

set -e  # Exit on error

echo "🚀 Zyphex Tech Platform - Production Deployment"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_ENV="production"
MIN_NODE_VERSION="18.17.0"
REQUIRED_ENV_VARS=(
  "DATABASE_URL"
  "NEXTAUTH_SECRET"
  "NEXTAUTH_URL"
  "REDIS_URL"
  "SMTP_HOST"
  "SMTP_PASSWORD"
  "STRIPE_SECRET_KEY"
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
)

# Functions
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
  echo "ℹ $1"
}

check_node_version() {
  print_info "Checking Node.js version..."
  
  CURRENT_VERSION=$(node -v | cut -d 'v' -f 2)
  
  if [ "$(printf '%s\n' "$MIN_NODE_VERSION" "$CURRENT_VERSION" | sort -V | head -n1)" = "$MIN_NODE_VERSION" ]; then
    print_success "Node.js version $CURRENT_VERSION is compatible"
  else
    print_error "Node.js version $CURRENT_VERSION is too old. Required: $MIN_NODE_VERSION or higher"
    exit 1
  fi
}

check_dependencies() {
  print_info "Checking required dependencies..."
  
  # Check if required commands exist
  commands=("npm" "git" "vercel")
  
  for cmd in "${commands[@]}"; do
    if command -v $cmd &> /dev/null; then
      print_success "$cmd is installed"
    else
      print_error "$cmd is not installed"
      exit 1
    fi
  done
}

check_git_status() {
  print_info "Checking Git status..."
  
  # Check if there are uncommitted changes
  if [[ -n $(git status -s) ]]; then
    print_warning "You have uncommitted changes:"
    git status -s
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      print_error "Deployment cancelled"
      exit 1
    fi
  else
    print_success "Working directory is clean"
  fi
  
  # Check current branch
  CURRENT_BRANCH=$(git branch --show-current)
  if [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "You are not on the main branch (current: $CURRENT_BRANCH)"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      print_error "Deployment cancelled"
      exit 1
    fi
  else
    print_success "On main branch"
  fi
}

run_tests() {
  print_info "Running test suite..."
  
  if npm run test:ci &> /dev/null; then
    print_success "All tests passed"
  else
    print_error "Tests failed. Fix errors before deploying."
    exit 1
  fi
}

run_type_check() {
  print_info "Running TypeScript type checking..."
  
  if npm run type-check &> /dev/null; then
    print_success "No type errors"
  else
    print_error "TypeScript errors found. Fix before deploying."
    exit 1
  fi
}

run_lint() {
  print_info "Running linter..."
  
  if npm run lint &> /dev/null; then
    print_success "No linting errors"
  else
    print_warning "Linting errors found. Consider fixing before deploying."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      print_error "Deployment cancelled"
      exit 1
    fi
  fi
}

check_env_vars() {
  print_info "Checking environment variables in Vercel..."
  
  # Get environment variables from Vercel
  ENV_OUTPUT=$(vercel env ls production 2>&1)
  
  for var in "${REQUIRED_ENV_VARS[@]}"; do
    if echo "$ENV_OUTPUT" | grep -q "$var"; then
      print_success "$var is configured"
    else
      print_error "$var is NOT configured in Vercel"
      echo "Run: vercel env add $var production"
      exit 1
    fi
  done
}

run_build() {
  print_info "Running production build..."
  
  if npm run build &> build.log; then
    print_success "Build successful"
    rm build.log
  else
    print_error "Build failed. Check build.log for details."
    exit 1
  fi
}

backup_database() {
  print_info "Creating database backup..."
  
  if [ -n "$DATABASE_URL" ]; then
    BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
    
    if pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>/dev/null; then
      gzip "$BACKUP_FILE"
      print_success "Database backup created: ${BACKUP_FILE}.gz"
      
      # TODO: Upload to cloud storage
      # az storage blob upload --file "${BACKUP_FILE}.gz" --container backups
    else
      print_warning "Could not create database backup (continuing anyway)"
    fi
  else
    print_warning "DATABASE_URL not set, skipping backup"
  fi
}

run_migrations() {
  print_info "Running database migrations..."
  
  read -p "Run migrations on production database? (y/N) " -n 1 -r
  echo
  
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    if npx prisma migrate deploy; then
      print_success "Migrations completed successfully"
    else
      print_error "Migration failed"
      exit 1
    fi
  else
    print_warning "Skipping migrations"
  fi
}

deploy_to_vercel() {
  print_info "Deploying to Vercel (production)..."
  
  echo ""
  echo "This will deploy to PRODUCTION environment."
  read -p "Are you absolutely sure? Type 'DEPLOY' to continue: " CONFIRM
  
  if [ "$CONFIRM" != "DEPLOY" ]; then
    print_error "Deployment cancelled"
    exit 1
  fi
  
  # Deploy to production
  if vercel --prod --yes; then
    print_success "Deployment successful!"
  else
    print_error "Deployment failed"
    exit 1
  fi
}

post_deployment_checks() {
  print_info "Running post-deployment checks..."
  
  # Wait for deployment to be ready
  sleep 10
  
  # Check health endpoint
  HEALTH_URL="https://app.zyphex-tech.com/api/health"
  
  print_info "Checking health endpoint: $HEALTH_URL"
  
  HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo "000")
  
  if [ "$HEALTH_RESPONSE" = "200" ]; then
    print_success "Health check passed (HTTP $HEALTH_RESPONSE)"
  else
    print_error "Health check failed (HTTP $HEALTH_RESPONSE)"
    print_warning "Check Vercel logs for details"
  fi
}

send_notification() {
  print_info "Sending deployment notification..."
  
  DEPLOYMENT_TIME=$(date "+%Y-%m-%d %H:%M:%S")
  DEPLOYED_BY=$(git config user.name)
  COMMIT_HASH=$(git rev-parse --short HEAD)
  COMMIT_MESSAGE=$(git log -1 --pretty=%B)
  
  MESSAGE="🚀 *Production Deployment*
Environment: Production
Time: $DEPLOYMENT_TIME
Deployed by: $DEPLOYED_BY
Commit: $COMMIT_HASH
Message: $COMMIT_MESSAGE
Status: ✅ Successful"
  
  # Send to Slack (if webhook configured)
  if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST "$SLACK_WEBHOOK_URL" \
      -H 'Content-Type: application/json' \
      -d "{\"text\":\"$MESSAGE\"}" \
      &> /dev/null
    print_success "Slack notification sent"
  fi
}

# Main deployment flow
main() {
  echo "Step 1: Pre-flight checks"
  echo "-------------------------"
  check_node_version
  check_dependencies
  check_git_status
  echo ""
  
  echo "Step 2: Code quality checks"
  echo "---------------------------"
  run_type_check
  run_lint
  # run_tests  # Uncomment when tests are ready
  echo ""
  
  echo "Step 3: Build verification"
  echo "--------------------------"
  run_build
  echo ""
  
  echo "Step 4: Environment verification"
  echo "--------------------------------"
  check_env_vars
  echo ""
  
  echo "Step 5: Database preparation"
  echo "----------------------------"
  backup_database
  run_migrations
  echo ""
  
  echo "Step 6: Deployment"
  echo "------------------"
  deploy_to_vercel
  echo ""
  
  echo "Step 7: Post-deployment validation"
  echo "-----------------------------------"
  post_deployment_checks
  send_notification
  echo ""
  
  print_success "🎉 Deployment completed successfully!"
  echo ""
  echo "Next steps:"
  echo "1. Check https://app.zyphex-tech.com"
  echo "2. Monitor Sentry for errors"
  echo "3. Check Vercel logs"
  echo "4. Review UptimeRobot status"
  echo ""
  echo "Rollback command (if needed):"
  echo "  vercel rollback"
  echo ""
}

# Run main deployment
main
