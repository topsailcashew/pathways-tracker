# Testing Checklist for Pathways Tracker

Use this checklist to verify that all features are working correctly after setup.

## Prerequisites

Before starting these tests, ensure you have:
- ✅ Completed the setup in [GETTING_STARTED.md](./GETTING_STARTED.md)
- ✅ Backend running on http://localhost:4000
- ✅ Frontend running on http://localhost:3000
- ✅ Database seeded with test users

## Test Accounts

All test accounts use the password: `password123`

| Role | Email | What to Test |
|------|-------|--------------|
| **Super Admin** | `superadmin@pathways.com` | System-wide access, all features |
| **Admin** | `pastor@church.org` | Church management, settings |
| **Team Leader** | `leader@church.org` | Team coordination, analytics |
| **Volunteer** | `volunteer@church.org` | Limited access, assigned members only |

---

## 1. Authentication Tests

### 1.1 Login Flow
- [ ] Open http://localhost:3000
- [ ] You should see a login screen
- [ ] Try logging in with **incorrect credentials** → should show error
- [ ] Log in with `pastor@church.org` / `password123` → should succeed
- [ ] You should be redirected to the Dashboard

### 1.2 Session Persistence
- [ ] After logging in, refresh the page (F5)
- [ ] You should remain logged in (not redirected to login)
- [ ] Check browser localStorage → should contain `accessToken` and `refreshToken`

### 1.3 Logout
- [ ] Click your profile avatar in the top right
- [ ] Click "Sign Out" in the sidebar
- [ ] Confirm the logout dialog
- [ ] You should be redirected to the login screen

---

## 2. Role-Based Access Control (RBAC)

### 2.1 Volunteer Access (Most Restricted)
- [ ] Log in as `volunteer@church.org`
- [ ] **Sidebar Check:**
  - [ ] Should see: Overview, Pathways, Members, My Tasks
  - [ ] Should NOT see: Analytics, Integrations, Super Admin
  - [ ] Should NOT see Settings button (only profile)
- [ ] **Data Access:**
  - [ ] Navigate to "Members" → should only see members assigned to this volunteer
  - [ ] Navigate to "My Tasks" → should only see tasks assigned to this volunteer

### 2.2 Team Leader Access
- [ ] Log in as `leader@church.org`
- [ ] **Sidebar Check:**
  - [ ] Should see: Overview, Pathways, Members, My Tasks, **Analytics**
  - [ ] Should NOT see: Integrations, Super Admin
  - [ ] Should NOT see Settings button
- [ ] **Data Access:**
  - [ ] Navigate to "Members" → should see ALL members (not just assigned)
  - [ ] Navigate to "My Tasks" → should see all tasks
  - [ ] Navigate to "Analytics" → should load analytics page

### 2.3 Admin Access
- [ ] Log in as `pastor@church.org`
- [ ] **Sidebar Check:**
  - [ ] Should see: Overview, Pathways, Members, My Tasks, Analytics, **Integrations**
  - [ ] Should NOT see: Super Admin
  - [ ] **Should see Settings button** in sidebar
- [ ] **Full Access:**
  - [ ] Navigate to "Settings" → should load settings page
  - [ ] Navigate to "Integrations" → should load integrations page

### 2.4 Super Admin Access
- [ ] Log in as `superadmin@pathways.com`
- [ ] **Sidebar Check:**
  - [ ] Should see ALL menu items including **"Super Admin"** (purple badge)
  - [ ] Super Admin section should be under a "System" label
- [ ] **System Access:**
  - [ ] Navigate to "Super Admin" → should load super admin page
  - [ ] Should have access to all features

---

## 3. Core Features

### 3.1 Dashboard
- [ ] Log in as Admin (`pastor@church.org`)
- [ ] Dashboard should show:
  - [ ] KPI cards (Total People, Active Pipeline, etc.)
  - [ ] Charts/graphs for pathway analytics
  - [ ] Recent activity feed
- [ ] All data should load without errors (check browser console with F12)

### 3.2 Members Management
- [ ] Navigate to "Members" page
- [ ] Should see a list of members
- [ ] **Create New Member:**
  - [ ] Click "Add Member" or similar button
  - [ ] Fill in: First Name, Last Name, Email, Phone, Pathway
  - [ ] Save → member should appear in the list
- [ ] **View Member Details:**
  - [ ] Click on a member
  - [ ] Should see member profile modal/page
  - [ ] Should show pathway progress, notes, contact info
- [ ] **Update Member:**
  - [ ] Edit member information
  - [ ] Save → changes should persist
- [ ] **Search/Filter:**
  - [ ] Try filtering by pathway (Newcomer/New Believer)
  - [ ] Try filtering by status (Active/Integrated/Inactive)

### 3.3 Tasks Management
- [ ] Navigate to "My Tasks" page
- [ ] Should see a list of tasks
- [ ] **Create New Task:**
  - [ ] Click "Add Task" or similar
  - [ ] Fill in task details (title, due date, assigned member)
  - [ ] Save → task should appear
- [ ] **Complete Task:**
  - [ ] Mark a task as complete
  - [ ] Task should move to completed section or show checkmark
- [ ] **Filter Tasks:**
  - [ ] Filter by due date
  - [ ] Filter by status (pending/completed)

### 3.4 AI Features (If Gemini API Key Configured)
- [ ] Navigate to a member's profile
- [ ] **AI Message Generation:**
  - [ ] Click "Generate AI Message" or similar
  - [ ] Should generate a personalized message based on member context
  - [ ] Message should be relevant to the member's pathway stage
- [ ] **AI Journey Analysis:**
  - [ ] Click "Analyze Journey" or similar
  - [ ] AI should provide insights about the member's progress
  - [ ] Should flag if member is "Stalled", "On Track", or "Needs Attention"

**If AI features don't work:**
- Check that `GEMINI_API_KEY` is set in `apps/api/.env`
- Check browser console and backend logs for error messages

---

## 4. API Integration Tests

### 4.1 Network Requests
- [ ] Open browser DevTools (F12) → Network tab
- [ ] Navigate to Members page
- [ ] **Check API calls:**
  - [ ] Should see request to `http://localhost:4000/api/members`
  - [ ] Response status should be `200 OK`
  - [ ] Response should contain JSON array of members

### 4.2 Authentication Headers
- [ ] In Network tab, click on any API request to `/api/*`
- [ ] Check Request Headers
- [ ] Should include: `Authorization: Bearer <token>`

### 4.3 Token Refresh (Advanced)
This test requires simulating an expired token:
- [ ] In DevTools → Application → Local Storage
- [ ] Find `accessToken` and modify it to an invalid value (e.g., add "XXX" to the end)
- [ ] Navigate to a new page (e.g., Members)
- [ ] The app should automatically:
  1. Detect the 401 error
  2. Attempt token refresh
  3. Retry the failed request
  4. OR redirect to login if refresh fails

---

## 5. Error Handling

### 5.1 Network Errors
- [ ] Stop the backend server (Ctrl+C in backend terminal)
- [ ] In the frontend, try to navigate to Members page
- [ ] Should show a user-friendly error message (not crash)
- [ ] Restart backend → should work again

### 5.2 Invalid Data
- [ ] Try creating a member with invalid email format
- [ ] Should show validation error
- [ ] Try creating a member with missing required fields
- [ ] Should show validation error

---

## 6. UI/UX Tests

### 6.1 Responsive Design
- [ ] Resize browser window to mobile size (< 768px)
- [ ] Sidebar should collapse into a hamburger menu
- [ ] Click hamburger menu → sidebar should slide in
- [ ] Click outside sidebar → should close

### 6.2 Role Badge Display
- [ ] Log in with each role
- [ ] Check profile section in sidebar
- [ ] Should show correct role badge with color:
  - Super Admin: Purple
  - Admin: Blue
  - Team Leader: Green
  - Volunteer: Gray

### 6.3 Notifications
- [ ] Check notification bell icon in header
- [ ] Should show count of pending tasks or notifications
- [ ] Click notification → should show details

---

## 7. Database Verification

### 7.1 Prisma Studio
- [ ] In a new terminal: `cd apps/api && npx prisma studio`
- [ ] Opens at http://localhost:5555
- [ ] **Check tables:**
  - [ ] `User` table should have 4 test users
  - [ ] `Tenant` table should have at least 1 tenant
  - [ ] `Member` table may be empty or have sample data
  - [ ] `Task` table may be empty or have sample data

### 7.2 Data Persistence
- [ ] Create a new member in the UI
- [ ] Refresh Prisma Studio
- [ ] The new member should appear in the `Member` table
- [ ] Restart the backend server
- [ ] Reload frontend → member should still be there (not lost)

---

## 8. Console Checks

### 8.1 Frontend Console
- [ ] Open browser DevTools → Console tab
- [ ] Should NOT see:
  - [ ] Red error messages (except expected ones like network errors during testing)
  - [ ] Warning about missing API keys (moved to backend)
  - [ ] CORS errors

### 8.2 Backend Console
- [ ] Check the backend server terminal
- [ ] Should see:
  - [ ] `🚀 Server running on http://localhost:4000`
  - [ ] `✅ Database connected` (or Prisma connection confirmation)
  - [ ] API request logs (GET /api/members, POST /api/auth/login, etc.)
- [ ] Should NOT see:
  - [ ] Database connection errors
  - [ ] Unhandled promise rejections
  - [ ] Missing environment variable warnings (unless optional like GEMINI_API_KEY)

---

## 9. Performance Tests

### 9.1 Page Load Speed
- [ ] Clear browser cache
- [ ] Refresh the Dashboard page
- [ ] Page should load in < 2 seconds (on localhost)
- [ ] No visible layout shifts or flickering

### 9.2 API Response Time
- [ ] In Network tab, check API request timing
- [ ] Requests to `/api/members` should complete in < 500ms (localhost)
- [ ] Member creation should complete in < 1 second

---

## 10. Edge Cases

### 10.1 Empty States
- [ ] Create a brand new volunteer user (or use existing volunteer with no assignments)
- [ ] Log in as that volunteer
- [ ] Navigate to Members → should show "No members assigned" message
- [ ] Navigate to Tasks → should show "No tasks assigned" message

### 10.2 Long Names
- [ ] Create a church with a very long name (e.g., 100+ characters)
- [ ] Check sidebar → name should truncate or wrap gracefully
- [ ] Hover over name → should show full name in tooltip

### 10.3 Special Characters
- [ ] Create a member with special characters in name (e.g., "O'Brien", "María García")
- [ ] Should save and display correctly
- [ ] Should not cause any errors in display or search

---

## Known Issues / Expected Failures

These features are not yet implemented (see `IMPLEMENTATION_STATUS.md`):

- ❌ **Email/SMS Notifications** - SendGrid/Twilio integration incomplete
- ❌ **Google Sheets Import** - OAuth flow not implemented
- ❌ **Pathway Stage Management** - UI for editing stages not complete
- ❌ **Analytics Page** - Charts and reports not fully built
- ❌ **Super Admin Page** - Tenant management UI not implemented
- ❌ **Integrations Page** - Integration management UI not complete

---

## Reporting Issues

If you find bugs during testing:

1. **Check the console** (browser DevTools F12 → Console) for error messages
2. **Check backend logs** in the terminal running the API server
3. **Note the steps to reproduce:**
   - What page were you on?
   - What action did you take?
   - What was the expected result?
   - What actually happened?
4. **Include your test account role** (Admin, Volunteer, etc.)
5. **Create a GitHub issue** with all the above information

---

## Success Criteria

Your setup is working correctly if:

- ✅ All 4 user roles can log in successfully
- ✅ Each role sees the appropriate menu items and data
- ✅ Members and tasks can be created, viewed, and updated
- ✅ Data persists across page refreshes and server restarts
- ✅ No critical errors in browser or server console
- ✅ API requests complete successfully (200 OK status)
- ✅ Token authentication is working (Authorization headers present)

If all these criteria are met, congratulations! Your Pathways Tracker installation is working correctly. 🎉

---

## Next Steps After Testing

Once testing is complete and everything works:

1. **Customize Your Church Settings**
   - Log in as Admin
   - Go to Settings
   - Configure your church name, contact info, and service times
   - Customize pathway stages to match your process

2. **Add Real Data**
   - Import members via CSV or add manually
   - Create tasks for your team
   - Start tracking your newcomer integration process

3. **Set Up Integrations** (Optional)
   - Configure Gemini API for AI features
   - Set up SendGrid for email notifications
   - Connect Twilio for SMS
   - Link Google Sheets for data sync

4. **Plan for Production**
   - Review `IMPLEMENTATION_STATUS.md` for missing features
   - Set up production database (Supabase recommended)
   - Configure production environment variables
   - Set up hosting (Vercel for frontend, Railway/Render for backend)

---

**Happy Testing! 🚀**
