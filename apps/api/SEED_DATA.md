# Database Seed Data

This seed script populates your database with realistic sample data for the Pathways Tracker application.

## What's Included

### Team Members (3)
- **Pastor John Smith** (pastor@church.org) - ADMIN role
- **Sarah Johnson** (leader@church.org) - TEAM_LEADER role
- **Mike Davis** (volunteer@church.org) - VOLUNTEER role

**Password for all:** `password123`

### Pathways & Stages

**NEWCOMER Pathway (5 stages):**
1. First Visit
2. Follow-up Call (auto-advances on task completion)
3. Second Visit
4. Connect Group
5. Regular Attender

**NEW_BELIEVER Pathway (5 stages):**
1. Decision Made
2. Baptism Class (auto-advances on task completion)
3. Baptized
4. Foundations Course (auto-advances on task completion)
5. Serving

### Automation Rules (5)
- Welcome email (1 day after first visit)
- Welcome call (3 days after first visit)
- Connect group invitation (7 days after follow-up)
- One-on-one meeting (2 days after decision)
- Baptism class enrollment (7 days after baptism class stage)

### Sample Members (6)

**Newcomers:**
1. **Emily Rodriguez** - First Visit stage
   - Tags: Youth Parent, First Time Visitor
   - Has 2 pending tasks

2. **James Chen** - Second Visit stage
   - Tags: Men's Ministry
   - Has 1 pending task

3. **Maria Santos** - Connect Group stage
   - Tags: Connect Group Leader
   - Married

**New Believers:**
4. **David Thompson** - Decision Made stage
   - Tags: New Convert
   - Has 1 high-priority task

5. **Lisa Anderson** - Baptized stage
   - Tags: Recently Baptized
   - Has 1 pending task + 1 completed task

6. **Robert Williams** - Foundations Course stage
   - Married

### Additional Data
- **Tasks**: 6 tasks (5 pending, 1 completed)
- **Notes**: 5 notes with realistic content
- **Tags**: 6 member tags
- **Church Settings**: Complete church information
- **Service Times**: 3 service times (Sunday 9am, Sunday 11am, Wednesday 7pm)

---

## How to Run

### Prerequisites
Make sure you've already:
1. Run `npm install`
2. Set up your `.env` file with DATABASE_URL
3. Run `npm run prisma:migrate` to create tables

### Run the Seed Script

```bash
npm run prisma:seed
```

### Expected Output

```
🌱 Starting database seed...
✅ Using tenant: My Church
✅ Created 3 team members
✅ Created 5 NEWCOMER stages
✅ Created 5 NEW_BELIEVER stages
✅ Created 5 automation rules
✅ Created 6 members
✅ Created 6 tasks
✅ Created 5 notes
✅ Created 6 tags
✅ Created church settings
✅ Created 3 service times

🎉 Database seeded successfully!

📊 Summary:
   - 3 team members
   - 5 NEWCOMER stages
   - 5 NEW_BELIEVER stages
   - 5 automation rules
   - 6 members
   - 6 tasks
   - 5 notes
   - 6 tags
   - 3 service times

✅ You can now login with:
   - pastor@church.org / password123 (ADMIN)
   - leader@church.org / password123 (TEAM_LEADER)
   - volunteer@church.org / password123 (VOLUNTEER)
```

---

## Testing the Data

### 1. Login to API

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pastor@church.org",
    "password": "password123"
  }'
```

Save the `accessToken` from the response.

### 2. Get Members List

```bash
curl http://localhost:4000/api/members \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Get Tasks

```bash
curl http://localhost:4000/api/tasks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. View in Prisma Studio

```bash
npm run prisma:studio
```

Opens a GUI at http://localhost:5555 to browse all data.

---

## Resetting Data

To clear and re-seed:

```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Run migrations
npm run prisma:migrate

# Seed again
npm run prisma:seed
```

---

## Customizing the Seed Data

Edit `prisma/seed.ts` to:
- Add more members
- Create different stages
- Add custom automation rules
- Modify church settings
- Add more tasks or notes

Then run `npm run prisma:seed` again.

---

## Notes

- The seed script is **idempotent** for users (uses `upsert`)
- Running it multiple times will update existing users but create duplicate members
- All members have realistic email addresses and phone numbers
- Tasks have realistic due dates (some past, some future)
- Automation rules are enabled and ready to trigger
- All data follows the multi-tenant pattern with proper `tenantId`

---

## What to Test

1. **Authentication**: Login with different roles
2. **RBAC**: Test permissions (VOLUNTEER can only see assigned members)
3. **Member Management**: Create, update, advance stages
4. **Task Management**: Complete tasks, check auto-advance
5. **Automation**: Add member to stage, verify tasks are auto-created
6. **Filtering**: Filter members by pathway, stage, assigned user
7. **Notes & Tags**: Add notes and tags to members

Enjoy testing your Pathways Tracker backend! 🎉
