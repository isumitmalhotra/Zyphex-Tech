# 🔐 ZyphexTech Platform - Test User Credentials

## 🎯 Role-Based Dashboard Access

**🔑 Universal Test Password: `password123`**  
*Use this password for ALL test accounts below*

### 🔥 Super Admin Users
**Complete system access with all permissions**

| Name | Email | Password | Dashboard Access |
|------|-------|----------|------------------|
| Alex Thompson | `superadmin@zyphextech.com` | `password123` | `/admin` |
| System Administrator | `admin@zyphextech.com` | `password123` | `/admin` |

**Super Admin Dashboard Features:**
- System health monitoring
- User management across all roles
- Security metrics and audit logs
- Platform-wide analytics
- Permission management
- Database administration

---

### 👑 Admin Users
**Administrative access with management permissions**

| Name | Email | Password | Dashboard Access |
|------|-------|----------|------------------|
| Sarah Wilson | `sarah.admin@zyphextech.com` | `password123` | `/admin` |
| Mike Rodriguez | `mike.admin@zyphextech.com` | `password123` | `/admin` |

**Admin Dashboard Features:**
- User and client management
- Project oversight
- Financial reporting
- Team management
- System settings

---

### 📊 Project Manager Users
**Project leadership and team coordination**

| Name | Email | Password | Dashboard Access |
|------|-------|----------|------------------|
| John Mitchell | `pm.john@zyphextech.com` | `password123` | `/project-manager` |
| Emily Chen | `pm.emily@zyphextech.com` | `password123` | `/project-manager` |
| David Park | `pm.david@zyphextech.com` | `password123` | `/project-manager` |

**Project Manager Dashboard Features:**
- Project overview and progress tracking
- Team performance analytics
- Task assignment and monitoring
- Resource allocation
- Client communication
- Deadline management

---

### 👨‍💻 Team Member Users
**Development and execution focus**

| Name | Email | Password | Dashboard Access |
|------|-------|----------|------------------|
| Alice Johnson | `dev.alice@zyphextech.com` | `password123` | `/team-member` |
| Bob Smith | `dev.bob@zyphextech.com` | `password123` | `/team-member` |
| Carol Davis | `dev.carol@zyphextech.com` | `password123` | `/team-member` |
| Lisa Brown | `designer.lisa@zyphextech.com` | `password123` | `/team-member` |
| Tom Wilson | `qa.tom@zyphextech.com` | `password123` | `/team-member` |

**Team Member Dashboard Features:**
- Personal task management
- Time tracking
- Project participation
- Document access
- Team communication
- Progress reporting

---

### 🏢 Client Users
**Client portal and project visibility**

| Name | Email | Password | Dashboard Access |
|------|-------|----------|------------------|
| Rachel Green | `client.acme@zyphextech.com` | `password123` | `/client` |
| James Morrison | `client.techcorp@zyphextech.com` | `password123` | `/client` |
| Maria Garcia | `client.startup@zyphextech.com` | `password123` | `/client` |

**Client Dashboard Features:**
- Project status and progress
- Invoice and billing information
- Document repository
- Communication center
- Milestone tracking

---

### 👤 Regular Users
**Basic platform access**

| Name | Email | Password | Dashboard Access |
|------|-------|----------|------------------|
| Demo User | `user.demo@zyphextech.com` | `password123` | `/dashboard` |
| Guest User | `user.guest@zyphextech.com` | `password123` | `/dashboard` |

**User Dashboard Features:**
- Personal profile
- Basic notifications
- Limited system access

---

## 🏗️ Sample Data Created

### 📊 Clients
- **Acme Corporation** - Technology company
- **TechCorp Solutions** - Software development
- **StartupXYZ** - Fintech startup

### 🚀 Projects
- **E-commerce Platform Redesign** (In Progress) - Acme Corp - $50,000
- **Mobile App Development** (Planning) - TechCorp - $75,000  
- **Data Analytics Dashboard** (In Progress) - StartupXYZ - $35,000
- **Website Optimization** (Completed) - Acme Corp - $15,000

---

## 🔑 How to Test

### 1. **Login Process**
```
1. Go to: http://localhost:3000/login
2. Enter email from the tables above
3. Enter password: password123
4. Click "Sign In" 
```

### 2. **Dashboard Navigation**
- After login, users are automatically redirected to their role-specific dashboard
- Each role has different UI, features, and data access
- Navigation is restricted based on permissions

### 3. **Permission Testing**
- Try accessing different routes with different user roles
- Test RBAC by attempting unauthorized actions
- Each role has specific permissions and access levels

### 4. **Feature Testing**
- **Super Admins**: Test system monitoring, user management
- **Admins**: Test project management, financial reports
- **Project Managers**: Test team coordination, project tracking
- **Team Members**: Test task management, time tracking
- **Clients**: Test project visibility, document access

---

## 🛡️ Security Features Tested

- **Role-Based Access Control (RBAC)**
- **Permission-based route protection** 
- **Middleware authentication**
- **Dashboard data filtering by role**
- **API endpoint security**

---

## 🎮 Quick Test Scenarios

### Scenario 1: Multi-Role Testing
1. Login as Super Admin → View system health
2. Login as Project Manager → Check team performance
3. Login as Team Member → View assigned tasks
4. Login as Client → Check project progress

### Scenario 2: Permission Boundaries
1. Login as Team Member
2. Try to access `/admin` (should redirect)
3. Try to access Super Admin features (should be blocked)

### Scenario 3: Data Visibility
1. Login as different roles
2. Notice how the same data appears differently
3. Test role-specific features and restrictions

---

**🎉 All test users are ready to go! Start testing the comprehensive role-based dashboard system.**