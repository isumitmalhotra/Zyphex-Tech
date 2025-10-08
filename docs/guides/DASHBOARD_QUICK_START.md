# Quick Start Guide - Role-Based Dashboard System

## System Overview

The ZyphexTech platform now includes comprehensive role-based dashboards for all user types. Each role has a tailored dashboard experience with appropriate permissions and functionality.

## Available Dashboards

### 1. Super Admin Dashboard (`/super-admin`)
**Who can access:** Users with `SUPER_ADMIN` role
**Key Features:**
- Complete system oversight
- User management across all roles
- Security monitoring and audit logs
- System health indicators
- Revenue and business analytics

### 2. Admin Dashboard (`/admin`)  
**Who can access:** Users with `ADMIN` or `SUPER_ADMIN` role
**Key Features:**
- Business management overview
- Project and client management
- Team performance tracking
- Financial analytics

### 3. Project Manager Dashboard (`/project-manager`)
**Who can access:** Users with `PROJECT_MANAGER`, `ADMIN`, or `SUPER_ADMIN` role
**Key Features:**
- Project portfolio management
- Team performance monitoring
- Task oversight and deadline tracking
- Resource allocation

### 4. Team Member Dashboard (`/team-member`)
**Who can access:** Users with `TEAM_MEMBER`, `PROJECT_MANAGER`, `ADMIN`, or `SUPER_ADMIN` role
**Key Features:**
- Personal task management
- Time tracking and productivity
- Project involvement overview
- Communication hub

### 5. Client Portal (`/client`)
**Who can access:** Users with `CLIENT`, `ADMIN`, or `SUPER_ADMIN` role
**Key Features:**
- Project progress visibility
- Investment and payment tracking
- Communication with team
- Document access

### 6. User Dashboard (`/user`)
**Who can access:** All authenticated users
**Key Features:**
- Basic project overview
- Profile management
- Simple communication tools

## How to Use

### For End Users

1. **Login to the system**
   - Visit `/login` and authenticate
   - Upon successful login, you'll be automatically redirected to your role-specific dashboard

2. **Dashboard Navigation**
   - Main dashboard redirects you based on your role
   - Use the sidebar to navigate between different sections
   - Access permitted areas based on your role permissions

3. **Real-time Updates**
   - Dashboards refresh automatically every 30 seconds
   - Click the "Refresh" button for immediate updates
   - Data is cached for performance

### For Developers

1. **API Endpoints**
   ```
   GET /api/super-admin/dashboard     - Super admin data
   GET /api/project-manager/dashboard - Project manager data  
   GET /api/team-member/dashboard     - Team member data
   GET /api/client/dashboard          - Client portal data
   GET /api/admin/dashboard           - Admin dashboard data
   GET /api/user/dashboard            - User dashboard data
   ```

2. **Using Dashboard Hooks**
   ```typescript
   import { useSuperAdminDashboard } from '@/hooks/use-super-admin-dashboard'
   
   function MyComponent() {
     const { dashboardData, loading, error, refresh } = useSuperAdminDashboard()
     
     if (loading) return <div>Loading...</div>
     if (error) return <div>Error: {error}</div>
     
     return <div>{/* Use dashboardData */}</div>
   }
   ```

3. **Permission Checking**
   ```typescript
   import { PermissionGuard } from '@/components/auth/permission-guard'
   import { Permission } from '@/lib/auth/permissions'
   
   <PermissionGuard permission={Permission.VIEW_DASHBOARD}>
     <MyDashboardComponent />
   </PermissionGuard>
   ```

## Testing the System

### 1. Health Check
Visit `/api/health` to verify the system is running correctly.

### 2. Role Testing
Create test users with different roles:
```sql
-- Example SQL to create test users (adjust for your database)
INSERT INTO users (email, name, role) VALUES
('superadmin@test.com', 'Super Admin', 'SUPER_ADMIN'),
('admin@test.com', 'Admin User', 'ADMIN'),
('pm@test.com', 'Project Manager', 'PROJECT_MANAGER'),
('dev@test.com', 'Developer', 'TEAM_MEMBER'),
('client@test.com', 'Client User', 'CLIENT');
```

### 3. Permission Validation
- Login with each role
- Verify appropriate dashboard access
- Test that unauthorized areas are blocked
- Check that API endpoints respect permissions

## Customization

### Adding New Dashboard Widgets

1. **Create a new component**
   ```typescript
   export function CustomWidget() {
     return (
       <Card className="zyphex-card">
         <CardHeader>
           <CardTitle>Custom Widget</CardTitle>
         </CardHeader>
         <CardContent>
           {/* Your custom content */}
         </CardContent>
       </Card>
     )
   }
   ```

2. **Add to dashboard page**
   ```typescript
   import { CustomWidget } from './custom-widget'
   
   // Add to your dashboard component
   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
     <CustomWidget />
     {/* Other widgets */}
   </div>
   ```

### Modifying Data Queries

1. **Update API route**
   ```typescript
   // In /api/[role]/dashboard/route.ts
   const customData = await prisma.yourModel.findMany({
     // Your custom query
   })
   
   return NextResponse.json({
     success: true,
     data: {
       // Include customData in response
     }
   })
   ```

2. **Update hook interface**
   ```typescript
   interface DashboardData {
     // Add your new data types
     customData: CustomDataType[]
   }
   ```

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check user role in database
   - Verify permission mappings in `lib/auth/permissions.ts`
   - Ensure middleware is properly configured

2. **Dashboard Not Loading**
   - Check API endpoint responses
   - Verify database connections
   - Check browser console for errors

3. **Data Not Updating**
   - Verify SWR cache settings
   - Check if API endpoints return correct data
   - Test manual refresh functionality

### Debug Mode

Enable debug logging by setting environment variable:
```env
DEBUG=true
```

### Database Issues

1. **Check database connection**
   ```bash
   npx prisma db pull
   ```

2. **Run migrations**
   ```bash
   npx prisma migrate dev
   ```

3. **Generate Prisma client**
   ```bash
   npx prisma generate
   ```

## Security Considerations

### 1. API Security
- All endpoints are protected with permission middleware
- User context is validated on every request
- Audit logging tracks all access attempts

### 2. Frontend Security
- Components use permission guards
- Sensitive UI elements are conditionally rendered
- Route-level protection via middleware

### 3. Data Security
- Users only access their own data or permitted data
- Client data is properly isolated
- SQL injection protection via Prisma

## Performance Optimization

### 1. Database
- Ensure proper indexing on frequently queried fields
- Use connection pooling in production
- Monitor query performance

### 2. Frontend
- Components are optimized for re-rendering
- Data is cached with SWR
- Lazy loading for large datasets

### 3. API
- Efficient database queries with minimal data transfer
- Proper error handling and timeouts
- Rate limiting for production use

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] User roles and permissions seeded
- [ ] API endpoints tested with each role
- [ ] Frontend dashboards verified
- [ ] Permission guards working
- [ ] Middleware protecting routes
- [ ] Audit logging enabled
- [ ] Performance monitoring setup

## Support

For technical support or questions:
1. Check the troubleshooting section above
2. Review the comprehensive documentation in `COMPREHENSIVE_DASHBOARD_SYSTEM.md`
3. Examine the RBAC implementation details in `RBAC_IMPLEMENTATION_SUMMARY.md`

The system is designed to be maintainable and extensible, with clear separation of concerns and proper error handling throughout.