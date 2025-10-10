# 🎯 VPS User Creation - Step by Step Commands

**Copy and paste these commands one by one into your VPS terminal**

---

## 🔌 STEP 1: Connect to VPS

```bash
# Replace with your actual VPS IP or domain
ssh root@your-vps-ip
```

---

## 📂 STEP 2: Navigate to Project

```bash
# Navigate to your project directory (adjust path if different)
cd /var/www/zyphextech

# Or if deployed elsewhere:
# cd /home/username/zyphextech
# cd /opt/zyphextech
```

---

## ⬇️ STEP 3: Pull Latest Code

```bash
git pull origin main
```

Expected output: `Already up to date.` or shows pulled files

---

## 📦 STEP 4: Install Dependencies

```bash
npm install
```

This may take 1-2 minutes. Wait for it to complete.

---

## 🔧 STEP 5: Generate Prisma Client

```bash
npx prisma generate
```

Expected output: `✔ Generated Prisma Client`

---

## 🗄️ STEP 6: Deploy Database Migrations

```bash
npx prisma migrate deploy
```

This ensures your database schema is up to date.

---

## 👥 STEP 7: Create All Production Users

```bash
npx ts-node scripts/create-production-users.ts
```

Expected output:
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

---

## ✅ STEP 8: Verify Users Created

```bash
npx ts-node scripts/check-users.ts
```

This will show you all created users organized by role.

---

## 🔄 STEP 9: Restart Application (if needed)

If using PM2:
```bash
pm2 restart all
# Or specific app:
pm2 restart zyphextech
```

If not using PM2:
```bash
# Stop the current process (Ctrl+C) and restart
npm run build
npm start
# Or
npm run dev
```

---

## 🧪 STEP 10: Test Login

### From Your Browser:

1. Go to: `https://yourdomain.com/login` (replace with your actual domain)

2. Try Super Admin login:
   - Email: `sumitmalhotra@zyphextech.com`
   - Password: `Haryana@272002`

3. After successful login, you should be redirected to: `/super-admin`

4. Try other accounts to verify different roles work

---

## 🎉 SUCCESS! All Users Created

Your 10 production accounts are now ready:

### Super Admins (2):
- sumitmalhotra@zyphextech.com
- ishaangarg@zyphextech.com

### Admin (1):
- support@zyphextech.com

### Project Manager (1):
- prabudhpandey@zyphextech.com

### Developers (6):
- arihantjain@zyphextech.com
- abhilashatoriye@zyphextech.com
- abhinavsharma@zyphextech.com
- japleenkaur@zyphextech.com
- ishitajain@zyphextech.com
- rohittanwar@zyphextech.com

**All passwords:** `Haryana@272002`

---

## 🚨 If Something Goes Wrong

### Error: "Cannot find module"
```bash
npm install
npm install bcryptjs @types/bcryptjs ts-node typescript @types/node
npx prisma generate
```

### Error: "Database connection failed"
```bash
# Check your environment variables
cat .env | grep DATABASE_URL

# Make sure database is running
sudo systemctl status postgresql
# or
sudo systemctl status mysql
```

### Error: "Prisma schema not found"
```bash
# Make sure you're in the project root
pwd
ls -la prisma/schema.prisma
```

### Error: "Permission denied"
```bash
# Give execute permission to scripts
chmod +x scripts/*.sh
chmod +x scripts/*.ts
```

### Users already exist (not an error)
If you see this, it's normal! The script uses `upsert` which updates existing users with the new password.

---

## 🔑 Reset Password for Individual User

If you need to reset a password for any user:

```bash
npx ts-node scripts/reset-password.ts <email> <new-password>
```

Example:
```bash
npx ts-node scripts/reset-password.ts sumitmalhotra@zyphextech.com NewSecurePassword123
```

---

## 📊 Check Application Status

```bash
# If using PM2
pm2 status
pm2 logs

# Check which port the app is running on
pm2 show zyphextech

# If not using PM2, check processes
ps aux | grep node
netstat -tulpn | grep node
```

---

## 🔗 Important URLs

After deployment, these should work:

- **Login:** `https://yourdomain.com/login`
- **Super Admin Dashboard:** `https://yourdomain.com/super-admin`
- **Admin Dashboard:** `https://yourdomain.com/admin`
- **Project Manager Dashboard:** `https://yourdomain.com/project-manager`
- **Developer Dashboard:** `https://yourdomain.com/team-member`

---

## 📝 Next Steps

1. ✅ Share credentials with team members (use secure method)
2. ✅ Ask each user to login and change their password
3. ✅ Start creating projects and assigning team members
4. ✅ Configure email notifications (if not already done)
5. ✅ Set up two-factor authentication (optional but recommended)

---

## 💡 Pro Tips

1. **Keep a backup of credentials** in a secure password manager
2. **Test each role** to ensure permissions work correctly
3. **Monitor logs** for any authentication issues: `pm2 logs`
4. **Regular backups** of your database
5. **Update passwords regularly** for security

---

## 📞 Quick Support Commands

```bash
# View application logs
pm2 logs zyphextech

# Restart application
pm2 restart zyphextech

# Check database connection
npx prisma db pull

# View all users in database
npx prisma studio
# Then open browser to: http://localhost:5555
```

---

## ✨ You're All Set!

Your production environment now has all team accounts ready to use.

**Password for all accounts:** `Haryana@272002`

🎯 **Remember to change passwords after first login!**

---

**Document Version:** 1.0  
**Created:** October 10, 2025  
**Last Updated:** October 10, 2025
