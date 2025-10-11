# 🚀 Quick Start: Phase 1 File Upload Security

## ⚡ Immediate Next Steps

### Step 1: Restart Development Server (REQUIRED)
```powershell
# Stop current server (Ctrl+C if running)
# Then restart:
npm run dev
```

**Why?** TypeScript language server needs to pick up the new Prisma Client types for the File model.

---

### Step 2: Verify Setup
```powershell
# Check environment variables
Get-Content .env | Select-String "FILE_ACCESS_SECRET|ENCRYPTION_KEY"

# Check uploads directory exists
Test-Path .\uploads

# Verify File model in database
npx prisma studio
# → Navigate to "File" model in the sidebar
```

**Expected Results:**
- ✅ FILE_ACCESS_SECRET: 64-character hex string
- ✅ ENCRYPTION_KEY: 64-character hex string
- ✅ uploads directory exists
- ✅ File model visible in Prisma Studio

---

### Step 3: Test Upload Endpoint

#### Using PowerShell (Recommended)
```powershell
# 1. Get your JWT token from browser dev tools
# Login at http://localhost:3000 → Open DevTools → Application → Cookies → next-auth.session-token

# 2. Test upload with a PDF
$token = "YOUR_JWT_TOKEN_HERE"
$headers = @{
    Authorization = "Bearer $token"
}

$filePath = "C:\path\to\test.pdf"
$form = @{
    file = Get-Item $filePath
    category = "document"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/upload" `
    -Method POST `
    -Headers $headers `
    -Form $form
```

**Expected Response:**
```json
{
  "success": true,
  "file": {
    "id": "cm28x...",
    "filename": "test_1697123456_a7b3c9d2.pdf",
    "originalFilename": "test.pdf",
    "url": "/api/files/test_1697123456_a7b3c9d2.pdf?token=abc123&expires=1697127056",
    "expiresAt": "2023-10-12T01:14:56.789Z",
    "size": 2048576,
    "mimeType": "application/pdf"
  }
}
```

#### Using cURL (Alternative)
```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test.pdf" \
  -F "category=document"
```

---

### Step 4: Test Download Endpoint

```powershell
# Use the URL from the upload response
$downloadUrl = "http://localhost:3000/api/files/test_1697123456_a7b3c9d2.pdf?token=abc123&expires=1697127056"

Invoke-RestMethod -Uri $downloadUrl `
    -Headers @{ Authorization = "Bearer $token" } `
    -OutFile "downloaded_file.pdf"

# Verify file downloaded
Get-Item .\downloaded_file.pdf
```

**Expected Result:**
- ✅ File downloads successfully
- ✅ File matches original (same size/content)

---

### Step 5: Test Security Features

#### Test 1: Malicious File Rejection
```powershell
# Create a fake .exe file
"MZ" | Out-File -FilePath "malware.exe" -Encoding ASCII -NoNewline

# Try to upload (should be rejected)
$form = @{
    file = Get-Item "malware.exe"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/upload" `
    -Method POST `
    -Headers $headers `
    -Form $form
```

**Expected Response:**
```json
{
  "error": "File validation failed",
  "details": {
    "extension": false,
    "mimeType": false,
    "size": true,
    "content": false
  }
}
```

#### Test 2: XSS Pattern Detection
```powershell
# Create a file with XSS payload
@"
<html>
<script>alert('XSS')</script>
</html>
"@ | Out-File -FilePath "xss.html" -Encoding UTF8

# Try to upload (should be rejected by malware scanner)
$form = @{ file = Get-Item "xss.html" }

Invoke-RestMethod -Uri "http://localhost:3000/api/upload" `
    -Method POST `
    -Headers $headers `
    -Form $form
```

**Expected Response:**
```json
{
  "error": "File failed security scan",
  "details": "XSS patterns detected"
}
```

#### Test 3: Rate Limiting
```powershell
# Upload 11 files quickly (should hit rate limit)
1..11 | ForEach-Object {
    Write-Host "Upload attempt $_"
    $form = @{ file = Get-Item "test.pdf" }
    
    try {
        Invoke-RestMethod -Uri "http://localhost:3000/api/upload" `
            -Method POST `
            -Headers $headers `
            -Form $form
    } catch {
        Write-Host "Rate limit hit at attempt $_" -ForegroundColor Red
        Write-Host $_.Exception.Message
    }
}
```

**Expected Result:**
- ✅ First 10 uploads succeed
- ✅ 11th upload fails with 429 (Too Many Requests)

---

## 🔍 Troubleshooting

### Issue: "Property 'file' does not exist on PrismaClient"

**Status:** Known TypeScript language server issue (non-blocking)

**Solutions:**
```powershell
# Option 1: Restart VS Code
# Ctrl+Shift+P → "Developer: Reload Window"

# Option 2: Restart TypeScript Server
# Ctrl+Shift+P → "TypeScript: Restart TS Server"

# Option 3: Rebuild Next.js
npm run build

# Option 4: Regenerate Prisma Client (already done, but can repeat)
npx prisma generate
```

**Verification:**
```powershell
# Check Prisma Client includes File model
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); console.log('file' in p)"
# Should output: true
```

---

### Issue: "Unauthorized" when testing upload

**Cause:** JWT token missing or invalid

**Solution:**
```powershell
# 1. Login to http://localhost:3000
# 2. Open DevTools (F12)
# 3. Go to Application → Cookies
# 4. Find "next-auth.session-token"
# 5. Copy the value

# 6. Use in PowerShell
$token = "PASTE_TOKEN_HERE"
```

---

### Issue: Upload directory not found

**Cause:** Server hasn't created the directory yet

**Solution:**
```powershell
# Create manually
New-Item -Path "uploads" -ItemType Directory -Force

# Restart server
npm run dev
```

---

### Issue: File download returns 403

**Possible Causes:**
1. Token expired (60-minute limit)
2. Token invalid
3. User doesn't have access to file

**Solution:**
```powershell
# Re-upload file to get fresh token
$form = @{ file = Get-Item "test.pdf" }
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/upload" `
    -Method POST `
    -Headers @{ Authorization = "Bearer $token" } `
    -Form $form

# Use the new URL from response
$response.file.url
```

---

## 📊 Monitoring & Logs

### Check Upload Activity
```powershell
# View uploaded files
Get-ChildItem .\uploads\ | Format-Table Name, Length, LastWriteTime

# Count files by category
npx prisma studio
# → File model → Filter by category
```

### Check Server Logs
```powershell
# Look for these log messages:
# ✅ "File uploaded successfully"
# ⚠️ "File validation failed"
# 🚨 "File failed security scan" (malware detected)
# 🔐 "Invalid or expired file access token"
```

---

## 🎯 Expected Behavior

### ✅ Successful Upload
```
1. User sends POST to /api/upload with file
2. Server validates JWT token
3. Server checks rate limit (10 per 15min)
4. Server validates file (extension, MIME, size, content)
5. Server scans for malware patterns
6. Server sanitizes filename
7. Server saves to uploads/ directory
8. Server creates database record
9. Server generates secure URL with token
10. Server returns success response
```

### ✅ Successful Download
```
1. User sends GET to /api/files/[filename] with token
2. Server validates JWT token
3. Server verifies token + expiration
4. Server checks database for file record
5. Server verifies user has access (owner/admin/super_admin)
6. Server reads file from disk
7. Server detects MIME type
8. Server streams file with proper headers
```

### ❌ Failed Upload (Malware)
```
1. User sends file with XSS payload
2. Server validates extension/MIME (passes)
3. Server scans content → detects <script> tag
4. Server deletes file immediately
5. Server returns 400 with "File failed security scan"
6. No database record created
```

### ❌ Failed Download (Expired Token)
```
1. User sends GET with old token
2. Server validates JWT (passes)
3. Server checks token expiration → expired
4. Server returns 403 with "Invalid or expired file access token"
5. File not accessed
```

---

## 📚 Documentation Reference

| Document | Purpose |
|----------|---------|
| **PHASE1_IMPLEMENTATION_SUMMARY.md** | Quick overview of what was built |
| **PHASE1_FILE_UPLOAD_SECURITY_COMPLETE.md** | Comprehensive technical guide |
| **ENV_VARIABLES_SETUP.md** | Environment configuration guide |
| **SECURITY_HARDENING_TASK2_IMPLEMENTATION_PLAN.md** | Full 4-phase security plan |

---

## ✅ Success Checklist

Before moving to Phase 2, verify:

- [ ] Server restarted successfully
- [ ] TypeScript errors resolved (or will resolve on restart)
- [ ] Environment variables present in .env
- [ ] uploads/ directory exists
- [ ] File model visible in Prisma Studio
- [ ] Upload endpoint tested with valid file
- [ ] Upload endpoint rejects .exe file
- [ ] Upload endpoint rejects XSS payload
- [ ] Download endpoint works with valid token
- [ ] Download endpoint rejects expired token
- [ ] Rate limit enforced (11th upload fails)

---

## 🎉 You're Ready!

Once all tests pass, Phase 1 File Upload Security is **PRODUCTION READY**.

**Next Phase:** Phase 2 - Token Management (JWT refresh tokens, revocation, multi-device sessions)

**Estimated Time:** 4-6 hours

**To Start Phase 2:**
```powershell
# Open the security plan
code SECURITY_HARDENING_TASK2_IMPLEMENTATION_PLAN.md
# Scroll to "Phase 2: Token Management System"
```

---

**Generated:** October 11, 2025  
**Version:** 1.0  
**Status:** Ready to Test 🚀
