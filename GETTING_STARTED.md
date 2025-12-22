# Getting Started with Pathways Tracker

This guide will walk you through setting up and running Pathways Tracker on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **PostgreSQL** database (local or cloud-based)
- **Redis** (optional, for session management)

## Quick Start (5 minutes)

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd pathways-tracker

# Install dependencies
npm install
```

### 2. Set Up PostgreSQL Database

You have two options:

#### Option A: Supabase (Recommended - Easiest)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project"
3. Fill in:
   - **Project Name:** `pathways-tracker`
   - **Database Password:** Choose a strong password (save this!)
   - **Region:** Choose closest to you
4. Wait for project creation (~2 minutes)
5. Go to **Project Settings** → **Database** → **Connection String**
6. Copy the **URI** format connection string
7. Replace `[YOUR-PASSWORD]` with your database password

**Your connection string will look like:**
```
postgresql://postgres:your-password@db.abc123xyz.supabase.co:5432/postgres
```

#### Option B: Local PostgreSQL

```bash
# Install PostgreSQL (macOS)
brew install postgresql@15
brew services start postgresql@15

# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database
createdb pathways_tracker

# Your connection string will be:
# postgresql://postgres:postgres@localhost:5432/pathways_tracker
```

### 3. Configure Backend Environment

```bash
# Navigate to backend
cd apps/api

# The .env file already exists with defaults
# Open it and update the DATABASE_URL:
nano .env
```

**Update this line** with your database connection string:
```env
DATABASE_URL="postgresql://postgres:your-password@db.abc123xyz.supabase.co:5432/postgres"
```

**Optional but recommended:** Add your Gemini API key for AI features:
```env
GEMINI_API_KEY="your-gemini-api-key-here"
```
Get a free API key at: https://makersuite.google.com/app/apikey

### 4. Set Up Database Schema

```bash
# Still in apps/api directory
# Install Prisma CLI if not already installed
npm install

# Run database migrations (creates all tables)
npx prisma migrate dev

# Seed the database with test users
npx prisma db seed
```

You should see output like:
```
🌱 Seeding database...
✅ Admin: pastor@church.org / password123
✅ Team Leader: leader@church.org / password123
✅ Volunteer: volunteer@church.org / password123
✅ Super Admin: superadmin@pathways.com / password123
```

### 5. Start Redis (Optional)

Redis is used for session management. The app will work without it, but sessions won't persist.

```bash
# Using Docker (easiest)
docker run -d -p 6379:6379 redis:alpine

# Or install locally:
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis
```

### 6. Start the Application

Open **two terminal windows**:

#### Terminal 1 - Backend API:
```bash
cd apps/api
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:4000
✅ Database connected
✅ Redis connected (or ⚠️ Redis not available)
```

#### Terminal 2 - Frontend:
```bash
cd apps/web
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### 7. Access the Application

Open your browser and go to: **http://localhost:3000**

## Test User Accounts

Log in with any of these test accounts (all use password: `password123`):

| Role | Email | Access Level |
|------|-------|--------------|
| **Super Admin** | `superadmin@pathways.com` | Full system access across all churches |
| **Admin** | `pastor@church.org` | Full church management access |
| **Team Leader** | `leader@church.org` | Manage team members and tasks |
| **Volunteer** | `volunteer@church.org` | View and update assigned members |

## Architecture Overview

```
pathways-tracker/
├── apps/
│   ├── api/          # Express backend (Port 4000)
│   │   ├── src/
│   │   ├── prisma/   # Database schema & migrations
│   │   └── .env      # Backend configuration
│   └── web/          # React frontend (Port 3000)
│       ├── src/
│       ├── components/
│       └── .env      # Frontend configuration
└── package.json      # Monorepo root
```

## Common Issues & Solutions

### Issue: "Can't connect to database"

**Solution:**
1. Verify your DATABASE_URL in `apps/api/.env`
2. Check if PostgreSQL is running: `psql -h localhost -U postgres`
3. For Supabase, ensure your password is correct (no special URL encoding)

### Issue: "Prisma Client not generated"

**Solution:**
```bash
cd apps/api
npx prisma generate
```

### Issue: "Port 3000 or 4000 already in use"

**Solution:**
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9
lsof -ti:4000 | xargs kill -9
```

Or change the ports in:
- Frontend: `apps/web/vite.config.ts`
- Backend: `apps/api/.env` (PORT=4000)

### Issue: "Redis connection failed"

**Solution:**
This is non-critical. The app works without Redis, but:
1. Sessions won't persist across server restarts
2. Rate limiting will be in-memory only

To fix, ensure Redis is running on port 6379.

### Issue: Migration conflicts

**Solution:**
If you have migration issues, you can reset the database:
```bash
cd apps/api
npx prisma migrate reset
npx prisma db seed
```

⚠️ **Warning:** This deletes all data!

## Next Steps

Now that your app is running:

1. **Explore the UI** - Log in with different user roles to see permission differences
2. **Review the Codebase**
   - Backend API: `apps/api/src/routes/`
   - Frontend Pages: `apps/web/src/App.tsx`
   - Permissions: `apps/web/src/utils/permissions.ts`
3. **Read Implementation Status** - See `IMPLEMENTATION_STATUS.md` for what's completed and what's missing
4. **Customize Settings** - Log in as Admin and go to Settings to configure your church

## Development Commands

```bash
# Install dependencies
npm install

# Start both apps in development
npm run dev

# Start backend only
npm run dev:api

# Start frontend only
npm run dev:web

# Run database migrations
cd apps/api && npx prisma migrate dev

# View database in Prisma Studio
cd apps/api && npx prisma studio

# Seed database with test data
cd apps/api && npx prisma db seed

# Type check
npm run type-check

# Build for production
npm run build
```

## Environment Variables

### Backend (`apps/api/.env`)

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens (auto-generated for dev)

**Optional:**
- `REDIS_URL` - Redis connection (default: localhost:6379)
- `GEMINI_API_KEY` - Google Gemini for AI features
- `SENDGRID_API_KEY` - Email notifications
- `TWILIO_ACCOUNT_SID` - SMS notifications

### Frontend (`apps/web/.env`)

**Required:**
- `VITE_API_URL` - Backend API URL (default: http://localhost:4000)

**Optional:**
- `VITE_ENABLE_AI_FEATURES` - Enable/disable AI features (true/false)

## Production Deployment

See `DEPLOYMENT.md` (coming soon) for production deployment guides for:
- Vercel (frontend)
- Railway/Render (backend)
- Supabase (database)

## Getting Help

- **Documentation:** See `IMPLEMENTATION_STATUS.md` for features and roadmap
- **Issues:** Check existing issues or create a new one
- **Architecture:** See `docs/ARCHITECTURE.md` (coming soon)

## License

See LICENSE file for details.
