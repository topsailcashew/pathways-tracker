# Supabase Setup Guide

This guide will help you set up Supabase as your PostgreSQL database for Pathways Tracker.

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub (or create account)
4. Click "New Project"
5. Fill in:
   - **Name**: `pathways-tracker` (or your choice)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free (sufficient for development)
6. Click "Create new project"
7. Wait 2-3 minutes for project to be ready

## Step 2: Get Database Connection String

1. In your Supabase project dashboard, click **Project Settings** (gear icon)
2. Click **Database** in the left sidebar
3. Scroll to **Connection String** section
4. Select **URI** tab
5. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with the password you created in Step 1

## Step 3: Configure Backend

1. Open `backend/.env` file
2. Update the `DATABASE_URL` line:
   ```env
   DATABASE_URL="postgresql://postgres:your-actual-password@db.xxxxxxxxxxxxx.supabase.co:5432/postgres"
   ```
3. Save the file

## Step 4: Run Database Migrations

```bash
cd backend
npm run prisma:migrate
```

This will:
- Create all 14 tables in your Supabase database
- Set up indexes and relationships
- Generate Prisma Client

## Step 5: Verify Database

### Option 1: Prisma Studio (Recommended)

```bash
npm run prisma:studio
```

This opens a GUI at http://localhost:5555 where you can view all tables.

### Option 2: Supabase Dashboard

1. Go to your Supabase project
2. Click **Table Editor** in left sidebar
3. You should see all tables: Tenant, User, Member, Task, etc.

## Step 6: Generate JWT Secrets

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate refresh secret
openssl rand -base64 32
```

Copy these values to your `.env` file:

```env
JWT_SECRET="paste-first-generated-secret-here"
JWT_REFRESH_SECRET="paste-second-generated-secret-here"
```

## Step 7: Start Backend Server

```bash
npm run dev
```

You should see:
```
✅ Database connected successfully
✅ Redis connected successfully
✅ Job queues initialized

╔═══════════════════════════════════════════════════════════╗
║   🚀 Pathways Tracker API Server                         ║
║   Port:        4000                                       ║
║   URL:         http://localhost:4000                      ║
╚═══════════════════════════════════════════════════════════╝
```

## Step 8: Test API

### Health Check

```bash
curl http://localhost:4000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-21T18:00:00.000Z",
  "uptime": 1.234,
  "environment": "development"
}
```

### Register First User

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourchurch.org",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Admin",
    "churchName": "My Church"
  }'
```

Expected response:
```json
{
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "admin@yourchurch.org",
      "firstName": "John",
      "lastName": "Admin",
      "role": "ADMIN",
      "onboardingComplete": false
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

## Troubleshooting

### "Database connection failed"

**Cause**: Incorrect DATABASE_URL or Supabase project not ready

**Solution**:
1. Verify DATABASE_URL is correct
2. Check password has no special characters that need URL encoding
3. Wait a few minutes if project was just created
4. Check Supabase project status in dashboard

### "Connection pooling error"

**Cause**: Supabase free tier has connection limits

**Solution**: Use connection pooling URL:
1. In Supabase, go to Project Settings → Database
2. Under Connection String, select **Connection Pooling** tab
3. Copy the pooler URL (port 6543)
4. Use this as your DATABASE_URL

### "Migration failed"

**Cause**: Database already has tables or schema conflicts

**Solution**:
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Then run migrations again
npm run prisma:migrate
```

### "Redis connection failed"

**Cause**: Redis not running locally

**Solution**:
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt install redis-server
sudo systemctl start redis

# Verify
redis-cli ping
# Should return: PONG
```

## Next Steps

1. ✅ Database connected
2. ✅ First user registered
3. 📧 Set up SendGrid for email (optional)
4. 📱 Set up Twilio for SMS (optional)
5. 🤖 Set up Gemini API for AI features (optional)
6. 🔗 Connect frontend to backend

## Optional: External Services

### SendGrid (Email)

1. Sign up at https://sendgrid.com
2. Create API key: Settings → API Keys → Create API Key
3. Add to `.env`:
   ```env
   SENDGRID_API_KEY="SG.xxxxxxxxxxxxx"
   SENDGRID_FROM_EMAIL="noreply@yourchurch.org"
   ```

### Twilio (SMS)

1. Sign up at https://twilio.com
2. Get credentials from Console Dashboard
3. Add to `.env`:
   ```env
   TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxx"
   TWILIO_AUTH_TOKEN="your-auth-token"
   TWILIO_PHONE_NUMBER="+1234567890"
   ```

### Google Gemini (AI)

1. Go to https://makersuite.google.com/app/apikey
2. Create API key
3. Add to `.env`:
   ```env
   GEMINI_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX"
   ```

## Support

If you encounter issues:
1. Check logs in `backend/logs/error.log`
2. Verify all environment variables are set
3. Ensure Supabase project is active
4. Check Redis is running
