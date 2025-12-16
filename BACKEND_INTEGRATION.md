# Backend Integration Guide

This guide explains how to integrate the frontend with the new backend API server.

## Overview

The application now has a proper backend API server that:
- ✅ Secures API keys on the server
- ✅ Implements real JWT authentication
- ✅ Provides PostgreSQL database persistence
- ✅ Handles email/SMS communication
- ✅ Proxies AI requests securely

## Quick Start

### 1. Set Up Database

```bash
# Install PostgreSQL (if not already installed)
# On macOS:
brew install postgresql@15

# On Ubuntu:
sudo apt install postgresql postgresql-contrib

# On Windows: Download from https://www.postgresql.org/download/

# Start PostgreSQL
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux

# Create database
createdb pathway_tracker
```

### 2. Configure Backend

```bash
cd server

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials:
# - DATABASE_URL
# - JWT_SECRET (generate: openssl rand -base64 32)
# - GEMINI_API_KEY (move from frontend .env)
# - EMAIL credentials (optional)
# - TWILIO credentials (optional)

# Push database schema
npm run db:push

# Start backend server
npm run dev
```

The backend will run on `http://localhost:4000`

### 3. Update Frontend Configuration

Create `api/client.ts` in the frontend:

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### 4. Update Authentication

Replace the simulated auth in `context/AppContext.tsx`:

```typescript
import { apiClient } from '../api/client';

const login = async (email: string, password: string) => {
  try {
    const { data } = await apiClient.post('/auth/login', {
      email,
      password,
    });

    localStorage.setItem('accessToken', data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.tokens.refreshToken);

    setCurrentUser(data.user);
    setAuthStage('APP');
  } catch (error) {
    throw new Error('Login failed');
  }
};

const register = async (userData: RegisterData) => {
  try {
    const { data } = await apiClient.post('/auth/register', userData);

    localStorage.setItem('accessToken', data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.tokens.refreshToken);

    setCurrentUser(data.user);
    setAuthStage('ONBOARDING');
  } catch (error) {
    throw new Error('Registration failed');
  }
};

const logout = async () => {
  await apiClient.post('/auth/logout');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  setAuthStage('AUTH');
};
```

### 5. Update Data Fetching

Replace mock data with API calls:

```typescript
// Fetch members
const fetchMembers = async () => {
  const { data } = await apiClient.get('/members');
  setMembers(data.members);
};

// Create member
const addMember = async (memberData: CreateMemberData) => {
  const { data } = await apiClient.post('/members', memberData);
  setMembers((prev) => [data, ...prev]);
};

// Update member
const updateMember = async (id: string, updates: Partial<Member>) => {
  const { data } = await apiClient.put(`/members/${id}`, updates);
  setMembers((prev) => prev.map((m) => (m.id === id ? data : m)));
};
```

### 6. Update AI Service

Replace direct AI calls with backend proxy:

```typescript
// services/geminiService.ts
import { apiClient } from '../api/client';

export const generateFollowUpMessage = async (member: Member): Promise<string> => {
  const { data } = await apiClient.post('/ai/generate-message', {
    firstName: member.firstName,
    pathway: member.pathway,
    currentStageId: member.currentStageId,
    joinedDate: member.joinedDate,
    tags: member.tags,
  });

  return data.message;
};

export const analyzeMemberJourney = async (
  member: Member,
  stages: Stage[]
): Promise<JourneyAnalysis> => {
  const currentStage = stages.find((s) => s.id === member.currentStageId);

  const { data } = await apiClient.post('/ai/analyze-journey', {
    firstName: member.firstName,
    pathway: member.pathway,
    currentStage: currentStage?.name || 'Unknown',
    joinedDate: member.joinedDate,
    daysSinceInteraction: calculateDaysSinceInteraction(member),
    notes: member.notes,
  });

  return data;
};
```

### 7. Update Communication

```typescript
// Send email
export const sendEmail = async (memberId: string, subject: string, message: string) => {
  await apiClient.post('/communication/email', {
    memberId,
    subject,
    message,
  });
};

// Send SMS
export const sendSMS = async (memberId: string, message: string) => {
  await apiClient.post('/communication/sms', {
    memberId,
    message,
  });
};
```

## Environment Variables

Update `.env` in the frontend root:

```env
# Remove GEMINI_API_KEY (now in backend)
VITE_API_URL=http://localhost:4000
VITE_APP_NAME=Pathway Tracker
VITE_APP_ENV=development
```

## Testing the Integration

1. **Start backend**
   ```bash
   cd server && npm run dev
   ```

2. **Start frontend**
   ```bash
   npm run dev
   ```

3. **Test authentication**
   - Register a new user
   - Login with credentials
   - Verify token is stored in localStorage

4. **Test data persistence**
   - Create a member
   - Refresh the page
   - Verify member still exists

5. **Test AI features**
   - Generate a follow-up message
   - Analyze a member's journey

6. **Test communication**
   - Send an email (check logs if not configured)
   - Send an SMS (check logs if not configured)

## Docker Deployment

For full-stack deployment with Docker:

```bash
# Copy docker environment file
cp .env.example .env.docker

# Edit .env.docker with production values

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Production Checklist

Before deploying to production:

- [ ] Generate strong JWT secrets (32+ characters)
- [ ] Set up production PostgreSQL database
- [ ] Configure email service (Gmail, SendGrid, etc.)
- [ ] Configure SMS service (Twilio)
- [ ] Set FRONTEND_URL to production domain
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Run database migrations
- [ ] Set up database backups
- [ ] Configure monitoring and logging
- [ ] Test all endpoints
- [ ] Set up CI/CD pipeline

## API Documentation

Full API documentation is available in `server/README.md`

Key endpoints:
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `GET /api/members` - List members
- `POST /api/members` - Create member
- `PUT /api/members/:id` - Update member
- `POST /api/ai/generate-message` - Generate AI message
- `POST /api/communication/email` - Send email
- `POST /api/communication/sms` - Send SMS

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
psql -l

# Check connection
psql postgresql://user:password@localhost:5432/pathway_tracker
```

### CORS Errors

Ensure backend `.env` has correct `FRONTEND_URL`:
```env
FRONTEND_URL=http://localhost:3000
```

### Authentication Failures

- Check JWT_SECRET is set and matches between sessions
- Verify token is being sent in Authorization header
- Check token hasn't expired

### AI Service Errors

- Verify GEMINI_API_KEY is set in backend `.env`
- Check API key is valid
- Review backend logs for errors

## Next Steps

1. Remove mock data from frontend
2. Add loading states for API calls
3. Add error handling for network failures
4. Implement optimistic updates
5. Add offline support with service workers
6. Set up real-time updates with WebSockets

For more information, see:
- Backend README: `server/README.md`
- Frontend README: `README.md`
- Production Readiness: `PRODUCTION_READINESS.md`
