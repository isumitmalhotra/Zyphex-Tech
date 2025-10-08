# Create Admin User - Instructions

## Quick Setup

Connect to your VPS and run these commands:

```bash
# SSH to VPS
ssh root@66.116.199.219

# Switch to deploy user
su - deploy

# Navigate to project directory
cd /var/www/zyphextech

# Pull latest code (includes the scripts)
git pull origin main

# Make script executable
chmod +x scripts/create-admin.sh

# Run the script
bash scripts/create-admin.sh
```

## Expected Output

```
Creating admin user for Zyphex Tech...
=======================================
Hashing password...
✅ Password hashed successfully
Executing SQL...
✅ Admin user created: sumitmalhotra@zyphextech.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Admin user created/updated successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Login Credentials:
  Email: sumitmalhotra@zyphextech.com
  Password: Sumit@001

Login URL: https://www.zyphextech.com/login
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Alternative Method (Using TypeScript Script)

If you prefer to use the TypeScript version:

```bash
cd /var/www/zyphextech
npx tsx scripts/create-admin.ts
```

## Manual Method (Direct SQL)

If scripts don't work, you can create the user manually:

```bash
# Connect to PostgreSQL
psql -U zyphex -d zyphextech
# Password: zyphex_secure_pass_2024
```

Then run this SQL:

```sql
-- First, hash the password using bcrypt with Node.js
-- Run this in a separate terminal in the project directory:
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Sumit@001', 12).then(h => console.log(h));"

-- Copy the hashed password and use it in this INSERT statement:
INSERT INTO "User" (
  id,
  name,
  email,
  password,
  role,
  "emailVerified",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'Sumit Malhotra',
  'sumitmalhotra@zyphextech.com',
  '[PASTE_HASHED_PASSWORD_HERE]',
  'ADMIN',
  NOW(),
  NOW(),
  NOW()
);

-- Verify user was created
SELECT id, name, email, role, "emailVerified" FROM "User" WHERE email = 'sumitmalhotra@zyphextech.com';

-- Exit PostgreSQL
\q
```

## Login

After creating the user:

1. Go to: https://www.zyphextech.com/login
2. Email: `sumitmalhotra@zyphextech.com`
3. Password: `Sumit@001`
4. You should be redirected to the admin dashboard

## Troubleshooting

### Issue: "Permission denied"
**Solution:** Make sure you're running as the deploy user, not root
```bash
su - deploy
cd /var/www/zyphextech
```

### Issue: "bcryptjs not found"
**Solution:** Install dependencies first
```bash
npm install
```

### Issue: "Database connection failed"
**Solution:** Check PostgreSQL is running
```bash
sudo systemctl status postgresql
```

### Issue: User already exists
The script will automatically **update** the existing user to ADMIN role and set the new password.

## Security Notes

⚠️ **IMPORTANT:** Change the password after first login!

1. Login with `Sumit@001`
2. Go to Profile Settings
3. Change password to something more secure
4. Never commit passwords to git
5. Delete the scripts after use if they contain sensitive data

## What the Script Does

1. ✅ Checks if user already exists
2. ✅ If exists: Updates password and role to ADMIN
3. ✅ If not exists: Creates new admin user
4. ✅ Automatically verifies email (no verification needed)
5. ✅ Hashes password with bcrypt (salt rounds: 12)
6. ✅ Sets role to ADMIN
7. ✅ Displays success message with login credentials

---

**Created:** October 9, 2025
**User:** sumitmalhotra@zyphextech.com
**Role:** ADMIN
**Status:** ✅ Ready to create
