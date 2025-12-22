# Pathways Tracker - Backend API

Backend REST API for Pathways Tracker church integration platform.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+ (via Supabase)
- Redis 7+ (local or managed)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env and add your credentials
# - DATABASE_URL (from Supabase)
# - JWT secrets (generate with: openssl rand -base64 32)
# - API keys (SendGrid, Twilio, Gemini)
```

### Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view data
npm run prisma:studio
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Server will start on http://localhost:4000
```

### Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Database, Redis, Queue config
│   ├── middleware/      # Auth, RBAC, validation, errors
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   ├── workers/         # Background job processors
│   ├── types/           # TypeScript types
│   ├── utils/           # Helpers and utilities
│   ├── app.ts           # Express app setup
│   └── index.ts         # Server entry point
├── prisma/
│   └── schema.prisma    # Database schema
└── logs/                # Application logs
```

## 🔑 Environment Variables

See `.env.example` for all required variables.

### Required

- `DATABASE_URL` - PostgreSQL connection string from Supabase
- `JWT_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens

### Optional (for full functionality)

- `SENDGRID_API_KEY` - Email service
- `TWILIO_ACCOUNT_SID` - SMS service
- `TWILIO_AUTH_TOKEN` - SMS service
- `GEMINI_API_KEY` - AI features

## 🗄️ Database Schema

14 core tables:
- **Multi-tenancy**: Tenant
- **Auth**: User, RefreshToken
- **Members**: Member, Family, Note, MemberTag, Resource, StageHistory
- **Tasks**: Task
- **Pathways**: Stage, AutomationRule
- **Communication**: Message
- **Settings**: ChurchSettings, ServiceTime, IntegrationConfig
- **Admin**: SystemLog, AuditLog, SystemHealth

## 🔐 Authentication

JWT-based authentication with refresh token rotation:
- Access tokens: 15 minutes
- Refresh tokens: 7 days

### Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/onboarding/complete` - Complete onboarding

## 🛡️ Authorization (RBAC)

4 roles with 40+ granular permissions:
- **SUPER_ADMIN** - All permissions
- **ADMIN** - Full church management
- **TEAM_LEADER** - Team and member management
- **VOLUNTEER** - Assigned members only

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Members (TODO)
- `GET /api/members` - List members
- `POST /api/members` - Create member
- `GET /api/members/:id` - Get member
- `PATCH /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member
- `PATCH /api/members/:id/stage` - Advance stage

### Tasks (TODO)
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id/complete` - Complete task

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📝 Logging

Winston logger with multiple transports:
- Console (development)
- Files: `logs/combined.log`, `logs/error.log`
- Log rotation: 5MB per file, 5 files max

## 🚦 Health Check

```bash
GET /health

Response:
{
  "status": "ok",
  "timestamp": "2025-12-21T18:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

## 🔧 Development Tools

```bash
# Generate Prisma Client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio

# Format code
npm run format

# Lint code
npm run lint
```

## 📦 Deployment

### Supabase Setup

1. Create project at https://supabase.com
2. Go to Project Settings → Database
3. Copy connection string (URI mode)
4. Add to `.env` as `DATABASE_URL`

### Redis Setup

For local development:
```bash
# Install Redis
brew install redis  # macOS
sudo apt install redis  # Ubuntu

# Start Redis
redis-server
```

For production, use managed Redis (Upstash, Redis Cloud, etc.)

## 🐛 Troubleshooting

### Database connection fails
- Verify `DATABASE_URL` is correct
- Check Supabase project is active
- Ensure IP is whitelisted in Supabase

### Redis connection fails
- Verify Redis is running: `redis-cli ping`
- Check `REDIS_URL` in `.env`

### JWT errors
- Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are set
- Secrets should be 32+ characters

## 📚 Documentation

- [Prisma Docs](https://www.prisma.io/docs)
- [Express.js](https://expressjs.com/)
- [Supabase](https://supabase.com/docs)

## 📄 License

ISC
