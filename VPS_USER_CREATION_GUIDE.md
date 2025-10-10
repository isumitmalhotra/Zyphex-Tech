# VPS Production User Creation Guide

## 📋 Overview
This guide will help you create all production users on your VPS machine.

## 👥 Users to Create

### Super Admins (Full System Access)
1. **Sumit Malhotra** - `sumitmalhotra@zyphextech.com`
2. **Ishaan Garg** - `ishaangarg@zyphextech.com`

### Admin (Business Management)
3. **Support Team** - `support@zyphextech.com`

### Project Manager
4. **Prabudh Pandey** - `prabudhpandey@zyphextech.com`

### Developers (Team Members)
5. **Arihant Jain** - `arihantjain@zyphextech.com`
6. **Abhilash Atoriye** - `abhilashatoriye@zyphextech.com`
7. **Abhinav Sharma** - `abhinavsharma@zyphextech.com`
8. **Japleen Kaur** - `japleenkaur@zyphextech.com`
9. **Ishita Jain** - `ishitajain@zyphextech.com`
10. **Rohit Tanwar** - `rohittanwar@zyphextech.com`

**Password for all accounts:** `Haryana@272002`

---

## 🚀 Step-by-Step Instructions

### Step 1: Connect to Your VPS

```bash
ssh root@your-vps-ip
# Or use your SSH key if configured
```

### Step 2: Navigate to Your Project Directory

```bash
cd /var/www/zyphextech
# Or wherever your application is deployed
```

### Step 3: Ensure You're on the Latest Code

```bash
git pull origin main
```

### Step 4: Install Dependencies (if needed)

```bash
npm install
```

### Step 5: Upload the User Creation Script

**Option A: Use Git (Recommended)**
The script is already in your repository. Just pull the latest changes:
```bash
git pull origin main
```

**Option B: Manual Upload**
If you need to upload manually, create the file on VPS:
```bash
nano scripts/create-production-users.ts
# Paste the content and save with Ctrl+X, Y, Enter
```

### Step 6: Run the User Creation Script

```bash
npx ts-node scripts/create-production-users.ts
```

**Expected Output:**
```
🚀 Creating production users for Zyphex Tech...

📝 Creating users...

✅ SUPER_ADMIN         | Sumit Malhotra        | sumitmalhotra@zyphextech.com
✅ SUPER_ADMIN         | Ishaan Garg           | ishaangarg@zyphextech.com
✅ ADMIN               | Support Team          | support@zyphextech.com
✅ PROJECT_MANAGER     | Prabudh Pandey        | prabudhpandey@zyphextech.com
✅ TEAM_MEMBER         | Arihant Jain          | arihantjain@zyphextech.com
✅ TEAM_MEMBER         | Abhilash Atoriye      | abhilashatoriye@zyphextech.com
✅ TEAM_MEMBER         | Abhinav Sharma        | abhinavsharma@zyphextech.com
✅ TEAM_MEMBER         | Japleen Kaur          | japleenkaur@zyphextech.com
✅ TEAM_MEMBER         | Ishita Jain           | ishitajain@zyphextech.com
✅ TEAM_MEMBER         | Rohit Tanwar          | rohittanwar@zyphextech.com

✨ User creation complete!

📋 Summary:
   Super Admins: 2
   Admins: 1
   Project Managers: 1
   Developers: 6
   Total: 10 users

🔐 All users have the password: Haryana@272002
```

### Step 7: Verify User Creation

Run this command to check the users:
```bash
npx ts-node scripts/check-users.ts
```

Or check directly in database:
```bash
# If using PostgreSQL
psql -U your_db_user -d your_db_name -c "SELECT email, name, role FROM \"User\" ORDER BY role, name;"

# If using MySQL
mysql -u your_db_user -p your_db_name -e "SELECT email, name, role FROM User ORDER BY role, name;"
```

### Step 8: Test Login

1. Open your browser and go to: `https://yourdomain.com/login`
2. Try logging in with each account to verify they work

**Test with Super Admin:**
- Email: `sumitmalhotra@zyphextech.com`
- Password: `Haryana@272002`

---

## 🔧 Troubleshooting

### Issue: "Cannot find module 'bcryptjs'"

**Solution:**
```bash
npm install bcryptjs @types/bcryptjs
```

### Issue: "Cannot find module '@prisma/client'"

**Solution:**
```bash
npm install @prisma/client
npx prisma generate
```

### Issue: Database Connection Error

**Solution:**
1. Check your `.env` file has correct DATABASE_URL
2. Verify database is running:
   ```bash
   # For PostgreSQL
   sudo systemctl status postgresql
   
   # For MySQL
   sudo systemctl status mysql
   ```

### Issue: "User already exists"

This is normal if running the script multiple times. The script uses `upsert` which updates existing users.

---

## 🔐 Security Notes

### Change Default Passwords
After initial setup, ask all users to change their passwords on first login.

### Set Up Password Policy (Future Enhancement)
Consider implementing:
- Password expiry
- Password complexity requirements
- Two-factor authentication

---

## 📊 User Access Levels

### Super Admin (`sumitmalhotra@zyphextech.com`, `ishaangarg@zyphextech.com`)
- Full system access
- User management
- System configuration
- All dashboards and features
- Access URL: `/super-admin`

### Admin (`support@zyphextech.com`)
- Business management
- Client & project management
- Team oversight (limited)
- Access URL: `/admin`

### Project Manager (`prabudhpandey@zyphextech.com`)
- Project oversight
- Team coordination
- Resource allocation
- Client communication
- Access URL: `/project-manager`

### Developers/Team Members (All 6 developers)
- Task management
- Time tracking
- Project collaboration
- Access URL: `/team-member`

---

## 🧪 Quick Test Commands

### Test Login Flow
```bash
# Test if authentication works
curl -X POST https://yourdomain.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"sumitmalhotra@zyphextech.com","password":"Haryana@272002"}'
```

### Check User Roles
```bash
# Connect to your database and run:
SELECT email, name, role, "emailVerified" 
FROM "User" 
WHERE email LIKE '%@zyphextech.com' 
ORDER BY role;
```

---

## 🚨 Emergency Access

If you get locked out, you can reset any password using this script:

```bash
# Create reset-password.ts
npx ts-node scripts/reset-password.ts sumitmalhotra@zyphextech.com NewPassword123
```

---

## ✅ Verification Checklist

- [ ] Connected to VPS
- [ ] Navigated to project directory
- [ ] Pulled latest code from Git
- [ ] Ran user creation script successfully
- [ ] Verified all 10 users were created
- [ ] Tested login with at least one account from each role
- [ ] Confirmed role-based dashboards are accessible
- [ ] Documented any issues encountered

---

## 📞 Support

If you encounter any issues:
1. Check the logs: `pm2 logs` or `npm run logs`
2. Verify database connection
3. Check Prisma schema is up to date: `npx prisma migrate status`
4. Review the error messages in the script output

---

## 🎉 Success!

Once all users are created and verified, you can:
1. Share login credentials with team members (securely)
2. Ask them to log in and change their passwords
3. Start using the platform for real projects

**Next Steps:**
- Set up email notifications
- Configure two-factor authentication
- Create initial projects and assign team members
- Set up client accounts as needed
