# Quick Admin User Creation - Direct SQL Method

## Run on VPS

SSH to your VPS and run these commands:

```bash
ssh root@66.116.199.219
su - deploy
cd /var/www/zyphextech

# Generate hashed password
node -e "const bcrypt = require('./node_modules/bcryptjs'); bcrypt.hash('Sumit@001', 12).then(h => console.log(h));"
```

Copy the output (the hashed password), then:

```bash
# Connect to database
psql -U zyphex -d zyphextech
# Password: zyphex_secure_pass_2024
```

Run this SQL (replace YOUR_HASHED_PASSWORD with the hash from above):

```sql
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
  'YOUR_HASHED_PASSWORD',
  'ADMIN',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  role = 'ADMIN',
  "emailVerified" = NOW(),
  "updatedAt" = NOW();

-- Verify
SELECT id, name, email, role, "emailVerified" FROM "User" WHERE email = 'sumitmalhotra@zyphextech.com';

\q
```

## One-Line Command (Easiest!)

Or just run this single command on VPS:

```bash
ssh root@66.116.199.219 "su - deploy -c 'cd /var/www/zyphextech && bash scripts/create-admin.sh'"
```

Enter your VPS password when prompted.
