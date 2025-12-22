# Pathways Tracker API Documentation

**Base URL:** `http://localhost:4000` (Development)
**Version:** 1.0.0
**Interactive Docs:** [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Members](#members)
3. [Tasks](#tasks)
4. [Response Format](#response-format)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)

---

## Authentication

All endpoints (except `/auth/register`, `/auth/login`, `/auth/refresh`, and `/health`) require JWT authentication.

### Header Format
```http
Authorization: Bearer <access_token>
```

### Token Lifecycle
- **Access Token:** 15 minutes expiry
- **Refresh Token:** 7 days expiry
- Token rotation on refresh

---

### POST /api/auth/register

Register a new user and create a tenant (for first user) or join existing tenant.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "churchName": "Grace Community Church"
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "tenantId": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ADMIN",
      "avatar": "https://ui-avatars.com/api/?name=John+Doe",
      "onboardingComplete": false,
      "createdAt": "2024-12-22T10:30:00.000Z"
    },
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  },
  "meta": {
    "timestamp": "2024-12-22T10:30:00.000Z"
  }
}
```

---

### POST /api/auth/login

Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ADMIN",
      "onboardingComplete": true
    },
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

**Errors:**
- `401` - Invalid credentials
- `400` - Validation error

---

### POST /api/auth/refresh

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token"
  }
}
```

**Notes:**
- Old refresh token is revoked (token rotation)
- Returns new access token and refresh token

---

### POST /api/auth/logout

Logout and revoke refresh token.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

### GET /api/auth/me

Get current authenticated user details.

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "role": "ADMIN",
    "avatar": "https://...",
    "onboardingComplete": true,
    "createdAt": "2024-12-22T10:30:00.000Z"
  }
}
```

---

### PATCH /api/auth/onboarding/complete

Mark onboarding as complete.

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "onboardingComplete": true
  }
}
```

---

## Members

### POST /api/members

Create a new member.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "phone": "+1234567890",
  "pathway": "NEWCOMER",
  "currentStageId": "stage_uuid",
  "assignedToId": "user_uuid",
  "gender": "FEMALE",
  "dateOfBirth": "1990-05-15",
  "address": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "zip": "62701"
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@example.com",
    "phone": "+1234567890",
    "pathway": "NEWCOMER",
    "currentStageId": "stage_uuid",
    "status": "ACTIVE",
    "joinedDate": "2024-12-22T10:30:00.000Z",
    "currentStage": {
      "id": "uuid",
      "name": "First Visit",
      "order": 1
    },
    "assignedTo": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

---

### GET /api/members

List members with filters and pagination.

**Headers:** `Authorization: Bearer <access_token>`

**Query Parameters:**
- `pathway` (optional): `NEWCOMER` or `NEW_BELIEVER`
- `status` (optional): `ACTIVE`, `INTEGRATED`, `INACTIVE`
- `stageId` (optional): UUID of stage
- `assignedToId` (optional): UUID of assigned user
- `search` (optional): Search by name, email, or phone
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50, max: 100)

**Example Request:**
```http
GET /api/members?pathway=NEWCOMER&status=ACTIVE&page=1&limit=25
```

**Response:** `200 OK`
```json
{
  "data": {
    "members": [
      {
        "id": "uuid",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane.smith@example.com",
        "pathway": "NEWCOMER",
        "currentStage": {
          "name": "First Visit"
        },
        "assignedTo": {
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 50,
      "totalPages": 2
    }
  }
}
```

---

### GET /api/members/:id

Get member details by ID.

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@example.com",
    "pathway": "NEWCOMER",
    "currentStage": {
      "id": "uuid",
      "name": "First Visit",
      "description": "Visitor attended service for the first time"
    },
    "assignedTo": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe"
    },
    "notes": [
      {
        "id": "uuid",
        "content": "Very friendly, interested in small groups",
        "isSystem": false,
        "createdAt": "2024-12-22T10:30:00.000Z",
        "createdBy": {
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    ],
    "tags": [
      {
        "id": "uuid",
        "tag": "First Time Visitor"
      }
    ],
    "tasks": [
      {
        "id": "uuid",
        "description": "Send welcome email",
        "dueDate": "2024-12-25T00:00:00.000Z",
        "priority": "HIGH",
        "completed": false
      }
    ]
  }
}
```

---

### PATCH /api/members/:id

Update member details.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith-Johnson",
  "phone": "+1987654321",
  "maritalStatus": "MARRIED"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "firstName": "Jane",
    "lastName": "Smith-Johnson",
    "phone": "+1987654321",
    "maritalStatus": "MARRIED"
  }
}
```

---

### DELETE /api/members/:id

Delete a member.

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `204 No Content`

---

### PATCH /api/members/:id/stage

Advance member to a new stage.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "toStageId": "new_stage_uuid",
  "reason": "Completed welcome call"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "member": {
      "id": "uuid",
      "currentStageId": "new_stage_uuid",
      "lastStageChangeDate": "2024-12-22T10:30:00.000Z"
    },
    "createdTasks": [
      {
        "id": "uuid",
        "description": "Invite to connect group event",
        "dueDate": "2024-12-29T00:00:00.000Z",
        "priority": "MEDIUM",
        "createdByRule": true
      }
    ]
  }
}
```

**Notes:**
- Creates stage history record
- Triggers automation rules for new stage
- Creates system note
- Returns any auto-created tasks

---

### POST /api/members/:id/notes

Add a note to member.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "content": "Met with Jane today. She's interested in joining the choir."
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "memberId": "member_uuid",
    "content": "Met with Jane today. She's interested in joining the choir.",
    "isSystem": false,
    "createdAt": "2024-12-22T10:30:00.000Z",
    "createdBy": {
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

---

### POST /api/members/:id/tags

Add a tag to member.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "tag": "Youth Parent"
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "memberId": "member_uuid",
    "tag": "Youth Parent",
    "createdAt": "2024-12-22T10:30:00.000Z"
  }
}
```

---

### DELETE /api/members/:id/tags/:tagId

Remove a tag from member.

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `204 No Content`

---

## Tasks

### POST /api/tasks

Create a new task.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "memberId": "member_uuid",
  "description": "Schedule follow-up call",
  "dueDate": "2024-12-25T10:00:00.000Z",
  "priority": "HIGH",
  "assignedToId": "user_uuid"
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "memberId": "member_uuid",
    "description": "Schedule follow-up call",
    "dueDate": "2024-12-25T10:00:00.000Z",
    "priority": "HIGH",
    "completed": false,
    "assignedToId": "user_uuid",
    "createdByRule": false,
    "createdAt": "2024-12-22T10:30:00.000Z"
  }
}
```

---

### GET /api/tasks

List tasks with filters.

**Headers:** `Authorization: Bearer <access_token>`

**Query Parameters:**
- `memberId` (optional): Filter by member
- `assignedToId` (optional): Filter by assigned user
- `completed` (optional): `true` or `false`
- `priority` (optional): `LOW`, `MEDIUM`, `HIGH`
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50)

**Response:** `200 OK`
```json
{
  "data": {
    "tasks": [
      {
        "id": "uuid",
        "description": "Schedule follow-up call",
        "dueDate": "2024-12-25T10:00:00.000Z",
        "priority": "HIGH",
        "completed": false,
        "member": {
          "firstName": "Jane",
          "lastName": "Smith"
        },
        "assignedTo": {
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 25,
      "totalPages": 1
    }
  }
}
```

---

### GET /api/tasks/:id

Get task details.

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "description": "Schedule follow-up call",
    "dueDate": "2024-12-25T10:00:00.000Z",
    "priority": "HIGH",
    "completed": false,
    "member": {
      "id": "uuid",
      "firstName": "Jane",
      "lastName": "Smith"
    },
    "assignedTo": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe"
    },
    "createdAt": "2024-12-22T10:30:00.000Z"
  }
}
```

---

### PATCH /api/tasks/:id

Update task details.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "description": "Schedule follow-up call this week",
  "priority": "MEDIUM",
  "dueDate": "2024-12-26T10:00:00.000Z"
}
```

**Response:** `200 OK`

---

### PATCH /api/tasks/:id/complete

Mark task as completed.

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "completed": true,
    "completedAt": "2024-12-22T10:30:00.000Z"
  }
}
```

---

### DELETE /api/tasks/:id

Delete a task.

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `204 No Content`

---

## Response Format

### Success Response

```json
{
  "data": {
    // Response data here
  },
  "meta": {
    "timestamp": "2024-12-22T10:30:00.000Z",
    "requestId": "req_abc123"
  }
}
```

### Pagination Response

```json
{
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "totalPages": 2
    }
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-12-22T10:30:00.000Z",
    "requestId": "req_abc123"
  }
}
```

### HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Invalid/missing token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource |
| 422 | Unprocessable Entity | Business logic error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Common Error Codes

- `VALIDATION_ERROR` - Request validation failed
- `EMAIL_EXISTS` - Email already registered
- `INVALID_CREDENTIALS` - Wrong email/password
- `INVALID_REFRESH_TOKEN` - Refresh token invalid/expired
- `MEMBER_NOT_FOUND` - Member doesn't exist
- `TASK_NOT_FOUND` - Task doesn't exist
- `STAGE_NOT_FOUND` - Stage doesn't exist
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions

---

## Rate Limiting

- **Limit:** 100 requests per 15 minutes per IP address
- **Response:** `429 Too Many Requests`

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1703246400
```

---

## User Roles & Permissions

### Roles

1. **VOLUNTEER** - Basic member access
2. **TEAM_LEADER** - Can manage assigned members
3. **ADMIN** - Full tenant access
4. **SUPER_ADMIN** - System-wide access

### Permission Examples

- `member:view` - View own assigned members
- `member:view_all` - View all tenant members
- `member:create` - Create new members
- `member:update` - Update member details
- `member:delete` - Delete members
- `task:create` - Create tasks
- `task:complete` - Complete tasks

---

## Getting Started

1. **Register:** Create an account with `POST /api/auth/register`
2. **Login:** Get access token with `POST /api/auth/login`
3. **Create Members:** Add members with `POST /api/members`
4. **Manage Tasks:** Create and track tasks with `/api/tasks/*`
5. **Advance Stages:** Move members through pathway with `PATCH /api/members/:id/stage`

---

## Support

- **Issues:** [GitHub Issues](https://github.com/pathways-tracker/issues)
- **Email:** support@pathwaystracker.com
- **Documentation:** [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---

**Last Updated:** December 22, 2024
**API Version:** 1.0.0
