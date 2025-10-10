# 🚀 VPS User Creation - Quick Reference

## 📞 Quick Commands for VPS

### Connect to VPS
```bash
ssh root@your-vps-ip
cd /var/www/zyphextech  # or your project directory
```

### Pull Latest Code
```bash
git pull origin main
```

### Run Automated Setup (Easiest Method)
```bash
chmod +x scripts/vps-setup-users.sh
./scripts/vps-setup-users.sh
```

### OR Manual Setup

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Generate Prisma Client
```bash
npx prisma generate
```

#### 3. Deploy Database Migrations
```bash
npx prisma migrate deploy
```

#### 4. Create All Users
```bash
npx ts-node scripts/create-production-users.ts
```

#### 5. Verify Users Created
```bash
npx ts-node scripts/check-users.ts
```

---

## 👥 Created Users (10 Total)

### 🔴 Super Admins (2)
| Name | Email | Password | Dashboard |
|------|-------|----------|-----------|
| Sumit Malhotra | `sumitmalhotra@zyphextech.com` | `Haryana@272002` | `/super-admin` |
| Ishaan Garg | `ishaangarg@zyphextech.com` | `Haryana@272002` | `/super-admin` |

### 🟠 Admin (1)
| Name | Email | Password | Dashboard |
|------|-------|----------|-----------|
| Support Team | `support@zyphextech.com` | `Haryana@272002` | `/admin` |

### 🟡 Project Manager (1)
| Name | Email | Password | Dashboard |
|------|-------|----------|-----------|
| Prabudh Pandey | `prabudhpandey@zyphextech.com` | `Haryana@272002` | `/project-manager` |

### 🟢 Developers / Team Members (6)
| Name | Email | Password | Dashboard |
|------|-------|----------|-----------|
| Arihant Jain | `arihantjain@zyphextech.com` | `Haryana@272002` | `/team-member` |
| Abhilash Atoriye | `abhilashatoriye@zyphextech.com` | `Haryana@272002` | `/team-member` |
| Abhinav Sharma | `abhinavsharma@zyphextech.com` | `Haryana@272002` | `/team-member` |
| Japleen Kaur | `japleenkaur@zyphextech.com` | `Haryana@272002` | `/team-member` |
| Ishita Jain | `ishitajain@zyphextech.com` | `Haryana@272002` | `/team-member` |
| Rohit Tanwar | `rohittanwar@zyphextech.com` | `Haryana@272002` | `/team-member` |

---

## 🧪 Testing

### Test Login
Visit: `https://yourdomain.com/login`

Try logging in with any account, for example:
- Email: `sumitmalhotra@zyphextech.com`
- Password: `Haryana@272002`

### Test Each Role Dashboard
```bash
# After logging in as each user:
Super Admin: https://yourdomain.com/super-admin
Admin: https://yourdomain.com/admin
PM: https://yourdomain.com/project-manager
Developer: https://yourdomain.com/team-member
```

---

## 🛠️ Utility Commands

### Check All Users
```bash
npx ts-node scripts/check-users.ts
```

### Reset Password for Any User
```bash
npx ts-node scripts/reset-password.ts <email> <new-password>
```

Example:
```bash
npx ts-node scripts/reset-password.ts sumitmalhotra@zyphextech.com NewPassword123
```

### Check Database Directly
```bash
# PostgreSQL
psql -U your_db_user -d your_db_name -c "SELECT email, name, role FROM \"User\" WHERE email LIKE '%@zyphextech.com' ORDER BY role;"

# MySQL
mysql -u your_db_user -p your_db_name -e "SELECT email, name, role FROM User WHERE email LIKE '%@zyphextech.com' ORDER BY role;"
```

---

## 🚨 Troubleshooting

### Issue: "Cannot find module"
```bash
npm install
npm install bcryptjs @types/bcryptjs
npx prisma generate
```

### Issue: Database connection failed
Check `.env` file:
```bash
cat .env | grep DATABASE_URL
```

### Issue: Permission denied
```bash
chmod +x scripts/vps-setup-users.sh
```

### Issue: Users not showing up
```bash
# Check Prisma migrations
npx prisma migrate status

# Deploy if needed
npx prisma migrate deploy
```

---

## ✅ Quick Verification Checklist

- [ ] Connected to VPS
- [ ] Code pulled from Git (main branch)
- [ ] Dependencies installed
- [ ] Database migrations deployed
- [ ] User creation script executed
- [ ] All 10 users verified
- [ ] Login tested with each role
- [ ] Role-based dashboards accessible

---

## 📱 Share With Team

After setup, share these credentials securely (use encrypted email or password manager):

**For each team member, send:**
```
Welcome to Zyphex Tech Platform!

Your login credentials:
Email: [their email]
Password: Haryana@272002

Login URL: https://yourdomain.com/login

⚠️ IMPORTANT: Please change your password after first login!

Your dashboard: https://yourdomain.com/[their-role-path]
```

---

## 🎯 What Each Role Can Do

### Super Admin
- Full system access
- Manage all users
- View all projects
- System configuration
- Access all features

### Admin  
- Manage clients & projects
- View team performance
- Financial oversight
- User management (limited)

### Project Manager
- Manage assigned projects
- Coordinate team members
- Client communication
- Resource allocation

### Developer (Team Member)
- View assigned tasks
- Track time
- Update project progress
- Team collaboration

---

## 📞 Need Help?

If something goes wrong:
1. Check PM2 logs: `pm2 logs`
2. Check error messages in script output
3. Verify database connection
4. Review `.env` configuration

---

**Created:** October 10, 2025  
**Script Location:** `scripts/create-production-users.ts`  
**Full Guide:** `VPS_USER_CREATION_GUIDE.md`
