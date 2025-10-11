# Environment Variables Setup - Phase 1 File Upload Security

## Quick Setup Commands

### Option 1: PowerShell (Windows)
```powershell
# Generate FILE_ACCESS_SECRET
$secret1 = -join ((48..57) + (65..70) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Add-Content .env "`nFILE_ACCESS_SECRET=$secret1"

# Generate ENCRYPTION_KEY
$secret2 = -join ((48..57) + (65..70) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Add-Content .env "ENCRYPTION_KEY=$secret2"

# Display the added variables
Write-Host "✅ Added to .env file:" -ForegroundColor Green
Write-Host "FILE_ACCESS_SECRET=$secret1"
Write-Host "ENCRYPTION_KEY=$secret2"
```

### Option 2: OpenSSL (if installed)
```powershell
# Add to .env file
openssl rand -hex 32 | ForEach-Object { Add-Content .env "FILE_ACCESS_SECRET=$_" }
openssl rand -hex 32 | ForEach-Object { Add-Content .env "ENCRYPTION_KEY=$_" }
```

### Option 3: Manual Entry
```bash
# Add these lines to your .env file manually:

# File Upload Security (Phase 1)
FILE_ACCESS_SECRET=a7b3c9d2e1f4g8h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8f9
ENCRYPTION_KEY=f9e8d7c6b5a4z3y2x1w0v9u8t7s6r5q4p3o2n1m0l9k8j7i6h5g4f1e2d9c3b7a

# Replace the above with your own generated values
```

---

## Verification

After adding the environment variables, verify they are loaded:

```powershell
# Check if variables exist
Get-Content .env | Select-String "FILE_ACCESS_SECRET"
Get-Content .env | Select-String "ENCRYPTION_KEY"
```

---

## Security Best Practices

1. **Never commit `.env` to version control**
   - Already in `.gitignore` ✅
   
2. **Use different keys for each environment**
   - Development: Generate once, share with team securely
   - Staging: Different keys
   - Production: Different keys (rotate quarterly)

3. **Key Rotation Schedule**
   - Production: Every 90 days
   - Staging: Every 180 days
   - Development: Annually

4. **Backup Strategy**
   - Store production keys in secure password manager
   - Document key rotation dates
   - Keep previous key for 30 days during rotation

---

## What These Variables Do

### `FILE_ACCESS_SECRET`
- **Purpose:** Used to generate SHA-256 tokens for secure file download URLs
- **Security:** Prevents URL tampering and unauthorized file access
- **Usage:** Combined with filename + expiration timestamp to create HMAC signature
- **Format:** 64-character hexadecimal string (32 bytes)

### `ENCRYPTION_KEY`
- **Purpose:** Reserved for Phase 3 database field encryption
- **Future Use:** Will encrypt sensitive File model fields (path, url)
- **Security:** AES-256-GCM encryption for at-rest data protection
- **Format:** 64-character hexadecimal string (32 bytes)

---

## Troubleshooting

### Error: "FILE_ACCESS_SECRET not defined"
```powershell
# Solution: Verify variable is in .env
Get-Content .env | Select-String "FILE_ACCESS_SECRET"

# If missing, add it:
$secret = -join ((48..57) + (65..70) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Add-Content .env "FILE_ACCESS_SECRET=$secret"
```

### Error: "Invalid token" on file download
- Check that `FILE_ACCESS_SECRET` matches between upload and download
- Verify token hasn't expired (60-minute default)
- Ensure no whitespace in environment variable value

### Development vs Production
```bash
# Development (.env)
FILE_ACCESS_SECRET=dev_a7b3c9d2e1f4g8h5...

# Production (.env.production or system environment)
FILE_ACCESS_SECRET=prod_f9e8d7c6b5a4z3y2...
```

---

## Next Steps After Setup

1. ✅ Add environment variables (this guide)
2. ⏳ Restart Next.js development server
3. ⏳ Test file upload endpoint
4. ⏳ Test file download with token
5. ⏳ Proceed to Phase 2 (Token Management)

---

**Generated:** October 11, 2025  
**Status:** Phase 1 - Environment Setup Required
