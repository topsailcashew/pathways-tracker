# Role-Based Access Control (RBAC) System

The Pathway Tracker backend implements a comprehensive Role-Based Access Control (RBAC) system with four user roles and granular permissions.

## Table of Contents

1. [User Roles](#user-roles)
2. [Permission System](#permission-system)
3. [Role Permissions Matrix](#role-permissions-matrix)
4. [Implementation](#implementation)
5. [API Endpoints](#api-endpoints)
6. [Usage Examples](#usage-examples)

---

## User Roles

The system defines four hierarchical roles, each with specific access levels:

### 1. SUPER_ADMIN

**Highest privilege level - Full system access**

- Complete control over the entire system
- Can manage all users, including role assignment and deletion
- Can manage tenants (multi-tenant support)
- Access to all features and data across the organization
- **Use case**: System administrators, church IT leaders

### 2. ADMIN

**Administrative access without user role management**

- Full access to members, tasks, and church operations
- Can create and manage other users (but cannot delete users or change roles)
- Full communication, AI, settings, and reporting capabilities
- Cannot manage user roles or delete user accounts
- **Use case**: Church pastors, ministry directors

### 3. TEAM_LEADER

**Extended access with team management capabilities**

- Can view all members and tasks across the organization
- Can assign members and tasks to volunteers
- Full communication and AI features
- Can view and export all reports
- Limited settings access (basic configuration only)
- **Use case**: Ministry team leaders, small group coordinators

### 4. VOLUNTEER

**Basic access to assigned resources only**

- Can only view and manage members assigned to them
- Can only view and update tasks assigned to them
- Can send emails/SMS to assigned members
- Can use AI features for their members
- View-only access to settings
- Can only view reports for assigned members
- **Use case**: Church volunteers, follow-up team members

---

## Permission System

The system uses **40+ granular permissions** organized by domain:

### User Management
- `user:view` - View user profiles
- `user:create` - Create new users
- `user:update` - Update user profiles
- `user:delete` - Delete users (Super Admin only)
- `user:manage_roles` - Change user roles (Super Admin only)

### Member Management
- `member:view` - View members
- `member:create` - Add new members
- `member:update` - Update member information
- `member:delete` - Delete members
- `member:view_all` - View all members (vs only assigned)
- `member:assign` - Assign members to users

### Task Management
- `task:view` - View tasks
- `task:create` - Create tasks
- `task:update` - Update tasks
- `task:delete` - Delete tasks
- `task:view_all` - View all tasks (vs only assigned)
- `task:assign` - Assign tasks to users

### Communication
- `comm:send_email` - Send emails
- `comm:send_sms` - Send SMS messages
- `comm:view_history` - View communication history
- `comm:view_all_history` - View all communication history (vs only assigned members)

### AI Features
- `ai:generate_message` - Generate AI messages
- `ai:analyze_journey` - Analyze member journeys

### Settings & Configuration
- `settings:view` - View settings
- `settings:update` - Update basic settings
- `settings:update_church` - Update church information
- `settings:manage_integrations` - Configure integrations
- `settings:manage_automation` - Configure automation rules
- `settings:manage_pathways` - Configure pathway stages

### Reports & Analytics
- `reports:view` - View reports
- `reports:export` - Export reports
- `reports:view_all` - View all reports (vs only assigned members)

### System Administration
- `system:view_logs` - View system logs
- `system:view_health` - View system health status
- `system:manage_tenants` - Manage multiple tenants (Super Admin only)

---

## Role Permissions Matrix

| Permission | VOLUNTEER | TEAM_LEADER | ADMIN | SUPER_ADMIN |
|------------|-----------|-------------|-------|-------------|
| **User Management** |
| user:view | ✓ | ✓ | ✓ | ✓ |
| user:create | ✗ | ✗ | ✓ | ✓ |
| user:update | ✗ | ✗ | ✓ | ✓ |
| user:delete | ✗ | ✗ | ✗ | ✓ |
| user:manage_roles | ✗ | ✗ | ✗ | ✓ |
| **Member Management** |
| member:view | ✓ | ✓ | ✓ | ✓ |
| member:create | ✓ | ✓ | ✓ | ✓ |
| member:update | ✓ | ✓ | ✓ | ✓ |
| member:delete | ✗ | ✗ | ✓ | ✓ |
| member:view_all | ✗ | ✓ | ✓ | ✓ |
| member:assign | ✗ | ✓ | ✓ | ✓ |
| **Task Management** |
| task:view | ✓ | ✓ | ✓ | ✓ |
| task:create | ✓ | ✓ | ✓ | ✓ |
| task:update | ✓ | ✓ | ✓ | ✓ |
| task:delete | ✗ | ✗ | ✓ | ✓ |
| task:view_all | ✗ | ✓ | ✓ | ✓ |
| task:assign | ✗ | ✓ | ✓ | ✓ |
| **Communication** |
| comm:send_email | ✓ | ✓ | ✓ | ✓ |
| comm:send_sms | ✓ | ✓ | ✓ | ✓ |
| comm:view_history | ✓ | ✓ | ✓ | ✓ |
| comm:view_all_history | ✗ | ✓ | ✓ | ✓ |
| **AI Features** |
| ai:generate_message | ✓ | ✓ | ✓ | ✓ |
| ai:analyze_journey | ✓ | ✓ | ✓ | ✓ |
| **Settings** |
| settings:view | ✓ | ✓ | ✓ | ✓ |
| settings:update | ✗ | ✓ | ✓ | ✓ |
| settings:update_church | ✗ | ✗ | ✓ | ✓ |
| settings:manage_integrations | ✗ | ✗ | ✓ | ✓ |
| settings:manage_automation | ✗ | ✗ | ✓ | ✓ |
| settings:manage_pathways | ✗ | ✗ | ✓ | ✓ |
| **Reports** |
| reports:view | ✓ | ✓ | ✓ | ✓ |
| reports:export | ✗ | ✓ | ✓ | ✓ |
| reports:view_all | ✗ | ✓ | ✓ | ✓ |
| **System** |
| system:view_health | ✓ | ✓ | ✓ | ✓ |
| system:view_logs | ✗ | ✗ | ✓ | ✓ |
| system:manage_tenants | ✗ | ✗ | ✗ | ✓ |

---

## Implementation

### Permission Configuration

Permissions are defined in `src/config/permissions.ts`:

```typescript
export enum Permission {
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  // ... more permissions
}

export const RolePermissions: Record<string, Permission[]> = {
  SUPER_ADMIN: [...Object.values(Permission)], // All permissions
  ADMIN: [Permission.USER_VIEW, Permission.MEMBER_VIEW_ALL, ...],
  TEAM_LEADER: [Permission.MEMBER_VIEW_ALL, Permission.TASK_ASSIGN, ...],
  VOLUNTEER: [Permission.MEMBER_VIEW, Permission.TASK_VIEW, ...],
};
```

### Permission Middleware

Middleware functions in `src/middleware/permissions.middleware.ts`:

```typescript
// Require a single permission
export function requirePermission(permission: Permission)

// Require any of the specified permissions
export function requireAnyPermission(permissions: Permission[])

// Require all of the specified permissions
export function requireAllPermissions(permissions: Permission[])

// Require specific role(s)
export function requireRole(...allowedRoles: string[])

// Check resource ownership
export function checkResourceOwnership(getResourceOwnerId: (req) => Promise<string>)
```

### Using Permission Middleware

#### Example 1: Single Permission

```typescript
router.get('/members',
  authenticate,
  requirePermission(Permission.MEMBER_VIEW),
  async (req, res) => {
    // Only users with MEMBER_VIEW permission can access
  }
);
```

#### Example 2: Resource Ownership Check

```typescript
router.get('/members/:id',
  authenticate,
  requirePermission(Permission.MEMBER_VIEW),
  async (req, res) => {
    const member = await getMember(req.params.id);

    // Check if user can view this specific member
    const canViewAll = hasPermission(req.user.role, Permission.MEMBER_VIEW_ALL);
    if (!canViewAll && member.assignedToId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(member);
  }
);
```

#### Example 3: Multiple Permissions

```typescript
// User needs EITHER permission
router.get('/dashboard',
  authenticate,
  requireAnyPermission([Permission.MEMBER_VIEW_ALL, Permission.TASK_VIEW_ALL]),
  handler
);

// User needs BOTH permissions
router.post('/bulk-assign',
  authenticate,
  requireAllPermissions([Permission.MEMBER_ASSIGN, Permission.TASK_ASSIGN]),
  handler
);
```

---

## API Endpoints

### User Management Routes

```
GET    /api/users                    List all users (requires USER_VIEW)
GET    /api/users/:id                Get user by ID (requires USER_VIEW)
PUT    /api/users/:id                Update user (self or USER_UPDATE)
PUT    /api/users/:id/role           Change user role (requires USER_MANAGE_ROLES - Super Admin only)
DELETE /api/users/:id                Delete user (requires USER_DELETE - Super Admin only)
GET    /api/users/me/permissions     Get current user's permissions
```

### Member Management Routes

```
GET    /api/members                  List members (filtered by assignment for volunteers)
GET    /api/members/:id              Get member (requires ownership or MEMBER_VIEW_ALL)
POST   /api/members                  Create member (requires MEMBER_CREATE)
PUT    /api/members/:id              Update member (requires MEMBER_UPDATE + ownership)
DELETE /api/members/:id              Delete member (requires MEMBER_DELETE + ownership)
POST   /api/members/:id/notes        Add note (requires MEMBER_UPDATE + ownership)
PUT    /api/members/:id/assign       Assign member to user (requires MEMBER_ASSIGN)
```

### AI Routes

```
POST   /api/ai/generate-message      Generate AI message (requires AI_GENERATE_MESSAGE)
POST   /api/ai/analyze-journey       Analyze journey (requires AI_ANALYZE_JOURNEY)
```

### Communication Routes

```
POST   /api/communication/email      Send email (requires COMM_SEND_EMAIL + ownership)
POST   /api/communication/sms        Send SMS (requires COMM_SEND_SMS + ownership)
GET    /api/communication/history/:memberId  View history (requires COMM_VIEW_HISTORY + ownership)
```

---

## Usage Examples

### Example 1: Volunteer User

A volunteer can:
- View only members assigned to them
- Send emails/SMS to their assigned members
- Use AI features for their members
- Create and update tasks for their members

```typescript
// Volunteer makes request
GET /api/members
// Returns only members where assignedToId === volunteer.userId

GET /api/members/:id
// Returns 403 if member.assignedToId !== volunteer.userId

POST /api/communication/email
// Can only send to members.assignedToId === volunteer.userId
```

### Example 2: Team Leader User

A team leader can:
- View all members and tasks
- Assign members to volunteers
- View all reports and communication history

```typescript
// Team Leader makes request
GET /api/members
// Returns ALL members (has MEMBER_VIEW_ALL permission)

PUT /api/members/:id/assign
// Can reassign members to other users

GET /api/communication/history/:memberId
// Can view history for any member
```

### Example 3: Admin User

An admin can:
- Create new users
- Delete members
- Configure church settings
- Cannot delete users or change roles (Super Admin only)

```typescript
// Admin makes request
POST /api/users
// Can create new users

DELETE /api/members/:id
// Can delete any member

PUT /api/users/:id/role
// Returns 403 - only Super Admin can change roles
```

### Example 4: Super Admin User

A super admin has unrestricted access:

```typescript
// Super Admin makes request
PUT /api/users/:id/role
// Can change any user's role

DELETE /api/users/:id
// Can delete any user

// Has access to ALL endpoints and ALL permissions
```

---

## Testing RBAC

### Create Users with Different Roles

```bash
# Create a Super Admin (first user should be Super Admin)
POST /api/auth/register
{
  "email": "admin@church.org",
  "password": "secure_password",
  "firstName": "Super",
  "lastName": "Admin",
  "role": "ADMIN" // Will be promoted to SUPER_ADMIN by system
}

# Create a Volunteer
POST /api/auth/register
{
  "email": "volunteer@church.org",
  "password": "secure_password",
  "firstName": "John",
  "lastName": "Volunteer"
  // role defaults to VOLUNTEER
}
```

### Check Permissions

```bash
# Get current user's permissions
GET /api/users/me/permissions
Authorization: Bearer <token>

# Response:
{
  "role": "VOLUNTEER",
  "permissions": [
    "user:view",
    "member:view",
    "member:create",
    // ... all volunteer permissions
  ]
}
```

### Test Access Control

```bash
# Volunteer tries to view all members
GET /api/members
Authorization: Bearer <volunteer_token>
# Returns only assigned members

# Admin tries to view all members
GET /api/members
Authorization: Bearer <admin_token>
# Returns all members

# Volunteer tries to change user role
PUT /api/users/:id/role
Authorization: Bearer <volunteer_token>
# Returns 403 Forbidden

# Super Admin tries to change user role
PUT /api/users/:id/role
Authorization: Bearer <super_admin_token>
# Succeeds
```

---

## Security Considerations

1. **Token-Based Authentication**: All endpoints require valid JWT tokens
2. **Resource Ownership**: Users can only access resources they own or have permission to view
3. **Role Hierarchy**: Higher roles don't automatically inherit lower role restrictions
4. **Principle of Least Privilege**: Users are granted only the permissions they need
5. **Self-Protection**: Users cannot delete their own accounts or change their own roles
6. **Audit Trail**: All actions should be logged (implement in production)

---

## Future Enhancements

- [ ] Add permission-based UI rendering in frontend
- [ ] Implement audit logging for all RBAC-protected actions
- [ ] Add organization/tenant isolation for multi-tenant support
- [ ] Create permission groups for easier management
- [ ] Add time-based permissions (temporary access)
- [ ] Implement IP-based access restrictions
- [ ] Add two-factor authentication for Super Admins

---

## Troubleshooting

### "Insufficient permissions" Error

**Problem**: User receives 403 error when accessing an endpoint

**Solutions**:
1. Check user's role: `GET /api/users/me/permissions`
2. Verify the endpoint requires a permission the user has
3. For resource-specific endpoints, ensure user owns the resource or has `view_all` permission

### User Can't View Certain Members

**Problem**: Volunteer can't see all members

**Explanation**: This is expected behavior. Volunteers can only see members assigned to them.

**Solution**: Have a Team Leader or Admin assign the member to the volunteer:
```bash
PUT /api/members/:id/assign
{ "assignedToId": "volunteer_user_id" }
```

### Can't Change User Roles

**Problem**: Admin can't promote a user to Admin

**Explanation**: Only Super Admins can manage user roles.

**Solution**: Have a Super Admin perform the role change:
```bash
PUT /api/users/:id/role
{ "role": "ADMIN" }
```

---

## Contact & Support

For questions about the RBAC system or to report issues:
- GitHub Issues: https://github.com/anthropics/claude-code/issues
- Documentation: `/server/README.md`
- Integration Guide: `/server/BACKEND_INTEGRATION.md`
