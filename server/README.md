# Pathway Tracker - Backend API

This is the backend API server for Pathway Tracker, providing authentication, database access, and secure API endpoints.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 13
- npm >= 9.0.0

### Installation

1. **Install dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up database**
   ```bash
   npm run db:push
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:4000`

## 📝 Environment Variables

Required environment variables (see `.env.example` for complete list):

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/pathway_tracker"

# JWT Secrets (generate strong secrets!)
JWT_SECRET=your_super_secure_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Email (optional but recommended)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Twilio SMS (optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

## 🔑 API Endpoints

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response:
{
  "user": { ... },
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

### Members

#### List Members
```http
GET /api/members?pathway=NEWCOMER&status=ACTIVE
Authorization: Bearer <access_token>
```

#### Get Member
```http
GET /api/members/:id
Authorization: Bearer <access_token>
```

#### Create Member
```http
POST /api/members
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "pathway": "NEWCOMER",
  "currentStageId": "stage-id",
  "tags": ["First Time Visitor"]
}
```

#### Update Member
```http
PUT /api/members/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "currentStageId": "new-stage-id",
  "status": "ACTIVE"
}
```

### AI Services

#### Generate Follow-Up Message
```http
POST /api/ai/generate-message
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "firstName": "John",
  "pathway": "Newcomer",
  "currentStageId": "stage-1",
  "joinedDate": "2024-01-01",
  "tags": ["First Time"]
}
```

#### Analyze Member Journey
```http
POST /api/ai/analyze-journey
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "firstName": "John",
  "pathway": "Newcomer",
  "currentStage": "Sunday Experience",
  "joinedDate": "2024-01-01",
  "daysSinceInteraction": 5,
  "notes": ["Attended service", "Interested in small groups"]
}
```

### Communication

#### Send Email
```http
POST /api/communication/email
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "memberId": "member-id",
  "subject": "Following up",
  "message": "Hi! Just wanted to check in..."
}
```

#### Send SMS
```http
POST /api/communication/sms
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "memberId": "member-id",
  "message": "Hi! Hope you're doing well!"
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test -- --watch
```

## 📦 Database Management

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Create migration
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio
```

## 🏗️ Project Structure

```
server/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.ts   # Database connection
│   │   └── env.ts        # Environment validation
│   ├── middleware/       # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/           # API routes
│   │   ├── auth.routes.ts
│   │   ├── members.routes.ts
│   │   ├── ai.routes.ts
│   │   └── communication.routes.ts
│   ├── services/         # Business logic
│   │   ├── auth.service.ts
│   │   ├── ai.service.ts
│   │   ├── email.service.ts
│   │   └── sms.service.ts
│   └── index.ts          # Server entry point
├── prisma/
│   └── schema.prisma     # Database schema
├── package.json
└── tsconfig.json
```

## 🔒 Security Features

- ✅ JWT authentication with refresh tokens
- ✅ Password hashing with bcrypt
- ✅ Helmet.js security headers
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Input validation with Zod
- ✅ SQL injection protection (Prisma ORM)
- ✅ API key protection (server-side only)

## 🚢 Production Deployment

### Option 1: Traditional Server

1. Build the application
   ```bash
   npm run build
   ```

2. Set environment variables on your server

3. Run migrations
   ```bash
   npm run db:migrate
   ```

4. Start the server
   ```bash
   npm start
   ```

### Option 2: Docker

See `docker-compose.yml` for containerized deployment.

### Option 3: Serverless

For serverless deployment (AWS Lambda, Vercel, etc.), you'll need to adapt the Express app to work with serverless handlers.

## 📚 Additional Documentation

- [API Reference](./docs/API.md) - Complete API documentation
- [Database Schema](./docs/SCHEMA.md) - Database structure
- [Security Guide](./docs/SECURITY.md) - Security best practices
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment

## 🆘 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
psql -U postgres -l

# Test connection
psql postgresql://user:password@localhost:5432/pathway_tracker
```

### Email Not Sending

- Check Gmail app password is correct
- Enable "Less secure app access" or use App Passwords
- Check firewall settings for port 587

### JWT Token Errors

- Ensure JWT_SECRET is at least 32 characters
- Check token expiration settings
- Verify Authorization header format: `Bearer <token>`

## 📄 License

MIT License - See LICENSE file for details
