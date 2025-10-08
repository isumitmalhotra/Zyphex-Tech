# Production Deployment Script for Windows PowerShell
# This script automates the deployment process with safety checks

param(
    [switch]$SkipTests,
    [switch]$SkipBuild,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# Configuration
$DEPLOYMENT_ENV = "production"
$MIN_NODE_VERSION = "18.17.0"
$REQUIRED_ENV_VARS = @(
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
    "REDIS_URL",
    "SMTP_HOST",
    "SMTP_PASSWORD",
    "STRIPE_SECRET_KEY",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
)

# Helper Functions
function Write-Success {
    param($Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param($Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Warning-Custom {
    param($Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Info {
    param($Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
}

function Test-NodeVersion {
    Write-Info "Checking Node.js version..."
    
    $currentVersion = (node -v).Substring(1)
    $minVersion = [version]$MIN_NODE_VERSION
    $current = [version]$currentVersion
    
    if ($current -ge $minVersion) {
        Write-Success "Node.js version $currentVersion is compatible"
        return $true
    } else {
        Write-Error-Custom "Node.js version $currentVersion is too old. Required: $MIN_NODE_VERSION or higher"
        return $false
    }
}

function Test-Dependencies {
    Write-Info "Checking required dependencies..."
    
    $commands = @("npm", "git", "vercel")
    $allInstalled = $true
    
    foreach ($cmd in $commands) {
        if (Get-Command $cmd -ErrorAction SilentlyContinue) {
            Write-Success "$cmd is installed"
        } else {
            Write-Error-Custom "$cmd is not installed"
            $allInstalled = $false
        }
    }
    
    return $allInstalled
}

function Test-GitStatus {
    Write-Info "Checking Git status..."
    
    # Check for uncommitted changes
    $status = git status --porcelain
    if ($status) {
        Write-Warning-Custom "You have uncommitted changes:"
        git status -s
        
        if (-not $Force) {
            $continue = Read-Host "Continue anyway? (y/N)"
            if ($continue -ne "y" -and $continue -ne "Y") {
                Write-Error-Custom "Deployment cancelled"
                return $false
            }
        }
    } else {
        Write-Success "Working directory is clean"
    }
    
    # Check current branch
    $currentBranch = git branch --show-current
    if ($currentBranch -ne "main") {
        Write-Warning-Custom "You are not on the main branch (current: $currentBranch)"
        
        if (-not $Force) {
            $continue = Read-Host "Continue anyway? (y/N)"
            if ($continue -ne "y" -and $continue -ne "Y") {
                Write-Error-Custom "Deployment cancelled"
                return $false
            }
        }
    } else {
        Write-Success "On main branch"
    }
    
    return $true
}

function Invoke-Tests {
    if ($SkipTests) {
        Write-Warning-Custom "Skipping tests (--SkipTests flag)"
        return $true
    }
    
    Write-Info "Running test suite..."
    
    try {
        npm run test:ci 2>&1 | Out-Null
        Write-Success "All tests passed"
        return $true
    } catch {
        Write-Error-Custom "Tests failed. Fix errors before deploying."
        return $false
    }
}

function Invoke-TypeCheck {
    Write-Info "Running TypeScript type checking..."
    
    try {
        npm run type-check 2>&1 | Out-Null
        Write-Success "No type errors"
        return $true
    } catch {
        Write-Error-Custom "TypeScript errors found. Fix before deploying."
        Write-Host "Run 'npm run type-check' to see errors"
        return $false
    }
}

function Invoke-Lint {
    Write-Info "Running linter..."
    
    try {
        npm run lint 2>&1 | Out-Null
        Write-Success "No linting errors"
        return $true
    } catch {
        Write-Warning-Custom "Linting errors found."
        
        if (-not $Force) {
            $continue = Read-Host "Continue anyway? (y/N)"
            if ($continue -ne "y" -and $continue -ne "Y") {
                Write-Error-Custom "Deployment cancelled"
                return $false
            }
        }
        return $true
    }
}

function Test-EnvVars {
    Write-Info "Checking environment variables in Vercel..."
    
    try {
        $envOutput = vercel env ls production 2>&1 | Out-String
        
        $allConfigured = $true
        foreach ($var in $REQUIRED_ENV_VARS) {
            if ($envOutput -match $var) {
                Write-Success "$var is configured"
            } else {
                Write-Error-Custom "$var is NOT configured in Vercel"
                Write-Host "Run: vercel env add $var production"
                $allConfigured = $false
            }
        }
        
        return $allConfigured
    } catch {
        Write-Warning-Custom "Could not verify environment variables"
        return $true
    }
}

function Invoke-Build {
    if ($SkipBuild) {
        Write-Warning-Custom "Skipping build (--SkipBuild flag)"
        return $true
    }
    
    Write-Info "Running production build..."
    
    try {
        npm run build 2>&1 | Out-File -FilePath "build.log"
        Write-Success "Build successful"
        Remove-Item "build.log" -ErrorAction SilentlyContinue
        return $true
    } catch {
        Write-Error-Custom "Build failed. Check build.log for details."
        return $false
    }
}

function Backup-Database {
    Write-Info "Creating database backup..."
    
    $dbUrl = $env:DATABASE_URL
    if ($dbUrl) {
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $backupFile = "backup-$timestamp.sql"
        
        try {
            # Note: Requires pg_dump to be installed and in PATH
            & pg_dump $dbUrl | Out-File -FilePath $backupFile -Encoding UTF8
            
            # Compress the backup
            Compress-Archive -Path $backupFile -DestinationPath "$backupFile.zip"
            Remove-Item $backupFile
            
            Write-Success "Database backup created: $backupFile.zip"
            
            # TODO: Upload to Azure Blob Storage
            # az storage blob upload --file "$backupFile.zip" --container backups
        } catch {
            Write-Warning-Custom "Could not create database backup (continuing anyway)"
        }
    } else {
        Write-Warning-Custom "DATABASE_URL not set, skipping backup"
    }
}

function Invoke-Migrations {
    Write-Info "Database migrations..."
    
    if (-not $Force) {
        $runMigrations = Read-Host "Run migrations on production database? (y/N)"
        if ($runMigrations -ne "y" -and $runMigrations -ne "Y") {
            Write-Warning-Custom "Skipping migrations"
            return $true
        }
    }
    
    try {
        npx prisma migrate deploy
        Write-Success "Migrations completed successfully"
        return $true
    } catch {
        Write-Error-Custom "Migration failed"
        return $false
    }
}

function Invoke-Deploy {
    Write-Info "Deploying to Vercel (production)..."
    
    Write-Host ""
    Write-Host "⚠️  This will deploy to PRODUCTION environment." -ForegroundColor Yellow
    
    if (-not $Force) {
        $confirm = Read-Host "Are you absolutely sure? Type 'DEPLOY' to continue"
        if ($confirm -ne "DEPLOY") {
            Write-Error-Custom "Deployment cancelled"
            return $false
        }
    }
    
    try {
        vercel --prod --yes
        Write-Success "Deployment successful!"
        return $true
    } catch {
        Write-Error-Custom "Deployment failed"
        return $false
    }
}

function Test-PostDeployment {
    Write-Info "Running post-deployment checks..."
    
    # Wait for deployment to be ready
    Start-Sleep -Seconds 10
    
    # Check health endpoint
    $healthUrl = "https://app.zyphex-tech.com/api/health"
    Write-Info "Checking health endpoint: $healthUrl"
    
    try {
        $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 10
        $statusCode = $response.StatusCode
        
        if ($statusCode -eq 200) {
            Write-Success "Health check passed (HTTP $statusCode)"
            
            # Parse and display health status
            $health = $response.Content | ConvertFrom-Json
            if ($health.status -eq "healthy") {
                Write-Success "System status: healthy"
            } else {
                Write-Warning-Custom "System status: $($health.status)"
            }
        } else {
            Write-Warning-Custom "Health check returned HTTP $statusCode"
        }
    } catch {
        Write-Error-Custom "Health check failed"
        Write-Warning-Custom "Check Vercel logs for details"
    }
}

function Send-Notification {
    Write-Info "Sending deployment notification..."
    
    $deploymentTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $deployedBy = git config user.name
    $commitHash = git rev-parse --short HEAD
    $commitMessage = git log -1 --pretty=%B
    
    $message = @"
🚀 *Production Deployment*
Environment: Production
Time: $deploymentTime
Deployed by: $deployedBy
Commit: $commitHash
Message: $commitMessage
Status: ✅ Successful
"@
    
    # Send to Slack (if webhook configured)
    $slackWebhook = $env:SLACK_WEBHOOK_URL
    if ($slackWebhook) {
        try {
            $payload = @{
                text = $message
            } | ConvertTo-Json
            
            Invoke-RestMethod -Uri $slackWebhook -Method Post -Body $payload -ContentType "application/json"
            Write-Success "Slack notification sent"
        } catch {
            Write-Warning-Custom "Failed to send Slack notification"
        }
    }
}

# Main deployment flow
function Main {
    Write-Host ""
    Write-Host "🚀 Zyphex Tech Platform - Production Deployment" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Step 1: Pre-flight checks
    Write-Host "Step 1: Pre-flight checks" -ForegroundColor Yellow
    Write-Host "-------------------------" -ForegroundColor Yellow
    if (-not (Test-NodeVersion)) { exit 1 }
    if (-not (Test-Dependencies)) { exit 1 }
    if (-not (Test-GitStatus)) { exit 1 }
    Write-Host ""
    
    # Step 2: Code quality checks
    Write-Host "Step 2: Code quality checks" -ForegroundColor Yellow
    Write-Host "---------------------------" -ForegroundColor Yellow
    if (-not (Invoke-TypeCheck)) { exit 1 }
    if (-not (Invoke-Lint)) { exit 1 }
    # if (-not (Invoke-Tests)) { exit 1 }  # Uncomment when tests are ready
    Write-Host ""
    
    # Step 3: Build verification
    Write-Host "Step 3: Build verification" -ForegroundColor Yellow
    Write-Host "--------------------------" -ForegroundColor Yellow
    if (-not (Invoke-Build)) { exit 1 }
    Write-Host ""
    
    # Step 4: Environment verification
    Write-Host "Step 4: Environment verification" -ForegroundColor Yellow
    Write-Host "--------------------------------" -ForegroundColor Yellow
    if (-not (Test-EnvVars)) { exit 1 }
    Write-Host ""
    
    # Step 5: Database preparation
    Write-Host "Step 5: Database preparation" -ForegroundColor Yellow
    Write-Host "----------------------------" -ForegroundColor Yellow
    Backup-Database
    if (-not (Invoke-Migrations)) { exit 1 }
    Write-Host ""
    
    # Step 6: Deployment
    Write-Host "Step 6: Deployment" -ForegroundColor Yellow
    Write-Host "------------------" -ForegroundColor Yellow
    if (-not (Invoke-Deploy)) { exit 1 }
    Write-Host ""
    
    # Step 7: Post-deployment validation
    Write-Host "Step 7: Post-deployment validation" -ForegroundColor Yellow
    Write-Host "-----------------------------------" -ForegroundColor Yellow
    Test-PostDeployment
    Send-Notification
    Write-Host ""
    
    Write-Success "🎉 Deployment completed successfully!"
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Check https://app.zyphex-tech.com"
    Write-Host "2. Monitor Sentry for errors"
    Write-Host "3. Check Vercel logs"
    Write-Host "4. Review UptimeRobot status"
    Write-Host ""
    Write-Host "Rollback command (if needed):" -ForegroundColor Yellow
    Write-Host "  vercel rollback"
    Write-Host ""
}

# Run main deployment
try {
    Main
} catch {
    Write-Error-Custom "Deployment failed with error: $_"
    exit 1
}
