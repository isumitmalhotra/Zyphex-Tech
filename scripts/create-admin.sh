#!/bin/bash

# Script to create admin user directly in PostgreSQL
# Usage: bash scripts/create-admin.sh

echo "Creating admin user for Zyphex Tech..."
echo "======================================="

# Database connection details
DB_USER="zyphex"
DB_NAME="zyphextech"
DB_PASSWORD="zyphex_secure_pass_2024"

# Admin user details
ADMIN_EMAIL="sumitmalhotra@zyphextech.com"
ADMIN_NAME="Sumit Malhotra"
ADMIN_ROLE="ADMIN"

# First, we need to hash the password using Node.js
# We'll create a temporary Node.js script to hash the password
cat > /tmp/hash-password.js << 'EOF'
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

hashPassword('Sumit@001').then(hash => {
  console.log(hash);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
EOF

# Generate hashed password
echo "Hashing password..."
HASHED_PASSWORD=$(cd /var/www/zyphextech && node /tmp/hash-password.js)
rm /tmp/hash-password.js

if [ -z "$HASHED_PASSWORD" ]; then
  echo "❌ Failed to hash password"
  exit 1
fi

echo "✅ Password hashed successfully"

# Create SQL to insert or update admin user
SQL=$(cat <<ENDSQL
DO \$\$
DECLARE
  user_count INTEGER;
BEGIN
  -- Check if user exists
  SELECT COUNT(*) INTO user_count FROM "User" WHERE email = '$ADMIN_EMAIL';
  
  IF user_count > 0 THEN
    -- Update existing user
    UPDATE "User" 
    SET 
      password = '$HASHED_PASSWORD',
      role = '$ADMIN_ROLE',
      "emailVerified" = NOW(),
      "updatedAt" = NOW()
    WHERE email = '$ADMIN_EMAIL';
    
    RAISE NOTICE '✅ Admin user updated: %', '$ADMIN_EMAIL';
  ELSE
    -- Insert new user
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
      '$ADMIN_NAME',
      '$ADMIN_EMAIL',
      '$HASHED_PASSWORD',
      '$ADMIN_ROLE',
      NOW(),
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '✅ Admin user created: %', '$ADMIN_EMAIL';
  END IF;
END \$\$;

-- Display the created/updated user
SELECT id, name, email, role, "emailVerified", "createdAt" 
FROM "User" 
WHERE email = '$ADMIN_EMAIL';
ENDSQL
)

# Execute SQL
echo "Executing SQL..."
PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -d "$DB_NAME" -c "$SQL"

if [ $? -eq 0 ]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ Admin user created/updated successfully!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Login Credentials:"
  echo "  Email: $ADMIN_EMAIL"
  echo "  Password: Sumit@001"
  echo ""
  echo "Login URL: https://www.zyphextech.com/login"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
  echo "❌ Failed to create admin user"
  exit 1
fi
