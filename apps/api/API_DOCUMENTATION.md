# Shepherd API Documentation

**Base URL:** `http://localhost:4000` (Development)
**Version:** 1.0.0
**Interactive Docs:** [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Members](#members)
3. [Tasks](#tasks)
4. [Users](#users)
5. [Stages](#stages)
6. [Forms](#forms)
7. [AI](#ai)
8. [Automation Rules](#automation-rules)
9. [Settings](#settings)
10. [Church](#church)
11. [Analytics](#analytics)
12. [Communications](#communications)
13. [Integrations](#integrations)
14. [Health Check](#health-check)
15. [Response Format](#response-format)
16. [Error Handling](#error-handling)
17. [Rate Limiting](#rate-limiting)
18. [Roles & Permissions](#roles--permissions)

---

## Authentication

Authentication is handled by **Supabase Auth**. The API does not manage registration or login directly — users authenticate through Supabase and then sync their session with the API.

All endpoints (except public form endpoints and `/health`) require a valid Supabase access token.

### Header Format

```http
Authorization: Bearer <supabase_access_token>
```

---

### POST /api/auth/sync

Sync the authenticated Supabase user with the application database. Creates the user record on first sync, or returns the existing user. Optionally creates a new church/tenant if `churchName` is provided.

**Auth:** Supabase token required (passed via Bearer header)

**Request Body:**
```json
{
  "churchName": "Grace Community Church"
}
```

> `churchName` is optional. If provided on first sync, a new tenant is created with this name.

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "ADMIN",
    "avatar": "https://ui-avatars.com/api/?name=John+Doe",
    "onboardingComplete": false,
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/auth/me

Get the current authenticated user's details.

**Auth:** Required
**Permissions:** None (any authenticated user)

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
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### PATCH /api/auth/onboarding/complete

Mark onboarding as complete for the current user.

**Auth:** Required
**Permissions:** None (any authenticated user)

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "onboardingComplete": true
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### POST /api/auth/logout

Log out the current user.

**Auth:** Required
**Permissions:** None (any authenticated user)

**Response:** `200 OK`
```json
{
  "data": {
    "message": "Logged out successfully"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

## Members

### POST /api/members

Create a new member.

**Auth:** Required
**Permissions:** `member:create`

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

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `firstName` | string | Yes | Member's first name |
| `lastName` | string | Yes | Member's last name |
| `email` | string | No | Email address |
| `phone` | string | No | Phone number |
| `pathway` | enum | Yes | `NEWCOMER` or `NEW_BELIEVER` |
| `currentStageId` | uuid | No | Initial stage ID. If omitted, defaults to the first stage (lowest order) of the selected pathway. |
| `assignedToId` | uuid | No | Assigned team member |
| `gender` | enum | No | `MALE`, `FEMALE`, `OTHER` |
| `dateOfBirth` | date | No | Date of birth |
| `address` | string | No | Street address |
| `city` | string | No | City |
| `state` | string | No | State |
| `zip` | string | No | ZIP code |

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
    "joinedDate": "2025-01-15T10:30:00.000Z",
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
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/members

List members with filters and pagination.

**Auth:** Required
**Permissions:** `member:view` (assigned members only) or `member:view_all` (all members)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pathway` | enum | — | `NEWCOMER` or `NEW_BELIEVER` |
| `status` | enum | — | `ACTIVE`, `INTEGRATED`, `INACTIVE` |
| `stageId` | uuid | — | Filter by stage |
| `assignedToId` | uuid | — | Filter by assigned user |
| `search` | string | — | Search by name, email, or phone |
| `page` | integer | `1` | Page number |
| `limit` | integer | `50` | Results per page (max 100) |

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
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/members/:id

Get member details by ID, including notes, tags, and tasks.

**Auth:** Required
**Permissions:** `member:view` or `member:view_all`

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
        "createdAt": "2025-01-15T10:30:00.000Z",
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
        "dueDate": "2025-01-20T00:00:00.000Z",
        "priority": "HIGH",
        "completed": false
      }
    ]
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### PATCH /api/members/:id

Update member details.

**Auth:** Required
**Permissions:** `member:update`

**Request Body:** (all fields optional)
```json
{
  "firstName": "Jane",
  "lastName": "Smith-Johnson",
  "email": "jane.updated@example.com",
  "phone": "+1987654321",
  "pathway": "NEW_BELIEVER",
  "currentStageId": "stage_uuid",
  "assignedToId": "user_uuid",
  "status": "ACTIVE",
  "gender": "FEMALE",
  "dateOfBirth": "1990-05-15",
  "address": "456 Oak Ave",
  "city": "Springfield",
  "state": "IL",
  "zip": "62702",
  "maritalStatus": "MARRIED",
  "nationality": "American",
  "spouseName": "John Smith-Johnson",
  "spouseDob": "1988-03-20"
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
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### DELETE /api/members/:id

Delete a member.

**Auth:** Required
**Permissions:** `member:delete`

**Response:** `204 No Content`

---

### PATCH /api/members/:id/stage

Advance a member to a new stage. Creates a stage history record, triggers automation rules, and creates a system note.

**Auth:** Required
**Permissions:** `member:update`

**Request Body:**
```json
{
  "toStageId": "new_stage_uuid",
  "reason": "Completed welcome call"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `toStageId` | uuid | No | Target stage ID (alternative: `stageId`) |
| `stageId` | uuid | No | Target stage ID (alternative: `toStageId`) |
| `reason` | string | No | Reason for stage change |

> Provide either `toStageId` or `stageId`. At least one is required.

**Response:** `200 OK`
```json
{
  "data": {
    "member": {
      "id": "uuid",
      "currentStageId": "new_stage_uuid",
      "lastStageChangeDate": "2025-01-15T10:30:00.000Z"
    },
    "createdTasks": [
      {
        "id": "uuid",
        "description": "Invite to connect group event",
        "dueDate": "2025-01-22T00:00:00.000Z",
        "priority": "MEDIUM",
        "createdByRule": true
      }
    ]
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### POST /api/members/import

Bulk import members.

**Auth:** Required
**Permissions:** `member:create`

**Request Body:**
```json
{
  "pathway": "NEWCOMER",
  "currentStageId": "stage_uuid",
  "members": [
    {
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com",
      "phone": "+1234567890"
    },
    {
      "firstName": "Bob",
      "lastName": "Jones",
      "email": "bob@example.com"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pathway` | enum | Yes | `NEWCOMER` or `NEW_BELIEVER` |
| `currentStageId` | uuid | No | Stage to assign imported members. If omitted, defaults to the first stage (lowest order) of the selected pathway. |
| `members` | array | Yes | Array of member objects (max 2000) |

**Response:** `200 OK`
```json
{
  "data": {
    "imported": 2,
    "failed": 0,
    "errors": []
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### POST /api/members/:id/notes

Add a note to a member.

**Auth:** Required
**Permissions:** `member:update`

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
    "createdAt": "2025-01-15T10:30:00.000Z",
    "createdBy": {
      "firstName": "John",
      "lastName": "Doe"
    }
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### POST /api/members/:id/tags

Add a tag to a member.

**Auth:** Required
**Permissions:** `member:update`

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
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### DELETE /api/members/:memberId/tags/:tagId

Remove a tag from a member.

**Auth:** Required
**Permissions:** `member:update`

**Response:** `204 No Content`

---

## Tasks

### POST /api/tasks

Create a new task.

**Auth:** Required
**Permissions:** `task:create`

**Request Body:**
```json
{
  "memberId": "member_uuid",
  "description": "Schedule follow-up call",
  "dueDate": "2025-01-20T10:00:00.000Z",
  "priority": "HIGH",
  "assignedToId": "user_uuid"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `memberId` | uuid | Yes | Associated member |
| `description` | string | Yes | Task description |
| `dueDate` | ISO 8601 | Yes | Due date |
| `priority` | enum | No | `LOW`, `MEDIUM`, `HIGH` |
| `assignedToId` | uuid | Yes | Assigned user |

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "memberId": "member_uuid",
    "description": "Schedule follow-up call",
    "dueDate": "2025-01-20T10:00:00.000Z",
    "priority": "HIGH",
    "completed": false,
    "assignedToId": "user_uuid",
    "createdByRule": false,
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/tasks

List tasks with filters and pagination.

**Auth:** Required
**Permissions:** `task:view` (assigned tasks only) or `task:view_all` (all tasks)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `memberId` | uuid | — | Filter by member |
| `assignedToId` | uuid | — | Filter by assigned user |
| `completed` | boolean | — | `true` or `false` |
| `overdue` | boolean | — | `true` for overdue tasks only |
| `priority` | enum | — | `LOW`, `MEDIUM`, `HIGH` |
| `page` | integer | `1` | Page number |
| `limit` | integer | `50` | Results per page |

**Response:** `200 OK`
```json
{
  "data": {
    "tasks": [
      {
        "id": "uuid",
        "description": "Schedule follow-up call",
        "dueDate": "2025-01-20T10:00:00.000Z",
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
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/tasks/stats

Get task statistics.

**Auth:** Required
**Permissions:** `task:view` or `task:view_all`

**Response:** `200 OK`
```json
{
  "data": {
    "total": 150,
    "completed": 98,
    "pending": 52,
    "overdue": 8,
    "byPriority": {
      "HIGH": 30,
      "MEDIUM": 75,
      "LOW": 45
    }
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/tasks/:id

Get task details.

**Auth:** Required
**Permissions:** `task:view` or `task:view_all`

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "description": "Schedule follow-up call",
    "dueDate": "2025-01-20T10:00:00.000Z",
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
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### PATCH /api/tasks/:id

Update task details.

**Auth:** Required
**Permissions:** `task:update`

**Request Body:** (all fields optional)
```json
{
  "description": "Schedule follow-up call this week",
  "dueDate": "2025-01-22T10:00:00.000Z",
  "priority": "MEDIUM",
  "assignedToId": "user_uuid"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "description": "Schedule follow-up call this week",
    "priority": "MEDIUM",
    "dueDate": "2025-01-22T10:00:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### PATCH /api/tasks/:id/complete

Mark a task as completed.

**Auth:** Required
**Permissions:** `task:update`

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "completed": true,
    "completedAt": "2025-01-15T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### DELETE /api/tasks/:id

Delete a task.

**Auth:** Required
**Permissions:** `task:delete`

**Response:** `204 No Content`

---

## Users

### GET /api/users

List all users in the tenant.

**Auth:** Required
**Permissions:** `user:view`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `role` | enum | — | Filter by role: `VOLUNTEER`, `TEAM_LEADER`, `ADMIN`, `SUPER_ADMIN` |

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ADMIN",
      "avatar": "https://...",
      "onboardingComplete": true,
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 5,
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/users/stats

Get user statistics for the tenant.

**Auth:** Required
**Permissions:** `user:view`

**Response:** `200 OK`
```json
{
  "data": {
    "total": 12,
    "byRole": {
      "ADMIN": 2,
      "TEAM_LEADER": 4,
      "VOLUNTEER": 6
    }
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/users/:id

Get user details by ID.

**Auth:** Required
**Permissions:** `user:view`

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
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### POST /api/users

Create a new user within the tenant.

**Auth:** Required
**Permissions:** `user:create`

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "firstName": "Sarah",
  "lastName": "Connor",
  "role": "TEAM_LEADER",
  "phone": "+1234567890"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Email address |
| `password` | string | Yes | Password (min 8 characters) |
| `firstName` | string | Yes | First name |
| `lastName` | string | Yes | Last name |
| `role` | enum | Yes | `VOLUNTEER`, `TEAM_LEADER`, `ADMIN`, `SUPER_ADMIN` |
| `phone` | string | No | Phone number |

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "email": "newuser@example.com",
    "firstName": "Sarah",
    "lastName": "Connor",
    "role": "TEAM_LEADER",
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### PATCH /api/users/:id

Update user details.

**Auth:** Required
**Permissions:** `user:update`

**Request Body:** (all fields optional)
```json
{
  "firstName": "Sarah",
  "lastName": "Connor-Smith",
  "phone": "+1987654321"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "firstName": "Sarah",
    "lastName": "Connor-Smith",
    "phone": "+1987654321"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### PATCH /api/users/:id/role

Update a user's role.

**Auth:** Required
**Permissions:** `user:update`

**Request Body:**
```json
{
  "role": "ADMIN"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "ADMIN"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### DELETE /api/users/:id

Delete a user.

**Auth:** Required
**Permissions:** `user:delete`

**Response:** `200 OK`
```json
{
  "data": {
    "message": "User deleted successfully"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

## Stages

### GET /api/stages

List all stages, optionally filtered by pathway.

**Auth:** Required
**Permissions:** `stage:view`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pathway` | enum | — | `NEWCOMER` or `NEW_BELIEVER` |

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "pathway": "NEWCOMER",
      "name": "First Visit",
      "description": "Visitor attended service for the first time",
      "order": 1,
      "autoAdvanceEnabled": false
    },
    {
      "id": "uuid",
      "tenantId": "uuid",
      "pathway": "NEWCOMER",
      "name": "Welcome Call",
      "description": "Follow-up welcome call completed",
      "order": 2,
      "autoAdvanceEnabled": true,
      "autoAdvanceType": "TASK_COMPLETED",
      "autoAdvanceValue": "1"
    }
  ],
  "meta": {
    "total": 2,
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/stages/stats

Get stage statistics.

**Auth:** Required
**Permissions:** `stage:view`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pathway` | enum | — | `NEWCOMER` or `NEW_BELIEVER` |

**Response:** `200 OK`
```json
{
  "data": {
    "totalStages": 8,
    "byPathway": {
      "NEWCOMER": 4,
      "NEW_BELIEVER": 4
    },
    "memberCounts": [
      {
        "stageId": "uuid",
        "stageName": "First Visit",
        "count": 15
      }
    ]
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/stages/:id

Get stage details by ID.

**Auth:** Required
**Permissions:** `stage:view`

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "pathway": "NEWCOMER",
    "name": "First Visit",
    "description": "Visitor attended service for the first time",
    "order": 1,
    "autoAdvanceEnabled": false,
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### POST /api/stages

Create a new stage.

**Auth:** Required
**Permissions:** `stage:create`

**Request Body:**
```json
{
  "pathway": "NEWCOMER",
  "name": "Connect Group",
  "description": "Member joined a connect group",
  "order": 3,
  "autoAdvanceEnabled": true,
  "autoAdvanceType": "TASK_COMPLETED",
  "autoAdvanceValue": "1"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pathway` | enum | Yes | `NEWCOMER` or `NEW_BELIEVER` |
| `name` | string | Yes | Stage name |
| `description` | string | No | Stage description |
| `order` | integer | Yes | Display order |
| `autoAdvanceEnabled` | boolean | No | Enable auto-advance |
| `autoAdvanceType` | enum | No | `TASK_COMPLETED` or `TIME_IN_STAGE` |
| `autoAdvanceValue` | string | No | Value for auto-advance trigger |

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "pathway": "NEWCOMER",
    "name": "Connect Group",
    "description": "Member joined a connect group",
    "order": 3,
    "autoAdvanceEnabled": true,
    "autoAdvanceType": "TASK_COMPLETED",
    "autoAdvanceValue": "1"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### PATCH /api/stages/:id

Update a stage.

**Auth:** Required
**Permissions:** `stage:update`

**Request Body:** (all fields optional)
```json
{
  "name": "Connect Group (Updated)",
  "description": "Updated description",
  "autoAdvanceEnabled": false
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "name": "Connect Group (Updated)",
    "description": "Updated description",
    "autoAdvanceEnabled": false
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### POST /api/stages/reorder

Reorder stages within a pathway.

**Auth:** Required
**Permissions:** `stage:update`

**Request Body:**
```json
{
  "pathway": "NEWCOMER",
  "reorders": [
    { "stageId": "uuid-1", "newOrder": 1 },
    { "stageId": "uuid-2", "newOrder": 2 },
    { "stageId": "uuid-3", "newOrder": 3 }
  ]
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "message": "Stages reordered successfully"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### DELETE /api/stages/:id

Delete a stage.

**Auth:** Required
**Permissions:** `stage:delete`

**Response:** `200 OK`
```json
{
  "data": {
    "message": "Stage deleted successfully"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

## Forms

Forms allow churches to create public-facing forms that automatically create member records on submission.

### POST /api/forms

Create a new form.

**Auth:** Required
**Permissions:** `form:create`

**Request Body:**
```json
{
  "name": "Visitor Card",
  "description": "Sunday service visitor registration",
  "targetPathway": "NEWCOMER",
  "targetStageId": "stage_uuid",
  "fields": [
    {
      "id": "field-1",
      "label": "First Name",
      "type": "text",
      "required": true,
      "mapTo": "firstName"
    },
    {
      "id": "field-2",
      "label": "Last Name",
      "type": "text",
      "required": true,
      "mapTo": "lastName"
    },
    {
      "id": "field-3",
      "label": "Email",
      "type": "email",
      "required": false,
      "placeholder": "your@email.com",
      "mapTo": "email"
    },
    {
      "id": "field-4",
      "label": "How did you hear about us?",
      "type": "select",
      "required": false,
      "options": ["Friend", "Social Media", "Website", "Drive By"]
    }
  ]
}
```

**Field Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique field identifier |
| `label` | string | Yes | Display label |
| `type` | enum | Yes | `text`, `email`, `phone`, `number`, `date`, `select`, `textarea`, `checkbox` |
| `required` | boolean | Yes | Whether the field is required |
| `placeholder` | string | No | Placeholder text |
| `options` | string[] | No | Options for `select` type |
| `mapTo` | enum | No | Map to member field (see below) |

**`mapTo` values:** `firstName`, `lastName`, `email`, `phone`, `dateOfBirth`, `gender`, `address`, `city`, `state`, `zip`, `nationality`, `maritalStatus`, `spouseName`, `spouseDob`, `emergencyContact`, `isChurchMember`, `titheNumber`

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "name": "Visitor Card",
    "slug": "visitor-card",
    "description": "Sunday service visitor registration",
    "targetPathway": "NEWCOMER",
    "targetStageId": "stage_uuid",
    "fields": [...],
    "isActive": true,
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/forms

List all forms for the tenant.

**Auth:** Required
**Permissions:** `form:view`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Visitor Card",
      "slug": "visitor-card",
      "description": "Sunday service visitor registration",
      "isActive": true,
      "submissionCount": 42,
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/forms/:id

Get form details by ID, including fields.

**Auth:** Required
**Permissions:** `form:view`

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "name": "Visitor Card",
    "slug": "visitor-card",
    "description": "Sunday service visitor registration",
    "targetPathway": "NEWCOMER",
    "targetStageId": "stage_uuid",
    "fields": [...],
    "isActive": true,
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### PATCH /api/forms/:id

Update a form.

**Auth:** Required
**Permissions:** `form:update`

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Visitor Card",
  "description": "Updated description",
  "fields": [...],
  "isActive": false
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "name": "Updated Visitor Card",
    "isActive": false
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### DELETE /api/forms/:id

Delete a form.

**Auth:** Required
**Permissions:** `form:delete`

**Response:** `204 No Content`

---

### GET /api/forms/:id/submissions

List submissions for a form.

**Auth:** Required
**Permissions:** `form:view`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "formId": "form_uuid",
      "data": {
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com"
      },
      "memberId": "member_uuid",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/forms/public/:slug

Get a public form by its slug. No authentication required.

**Auth:** None
**Permissions:** None

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "name": "Visitor Card",
    "slug": "visitor-card",
    "description": "Sunday service visitor registration",
    "fields": [
      {
        "id": "field-1",
        "label": "First Name",
        "type": "text",
        "required": true
      }
    ]
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### POST /api/forms/public/:slug/submit

Submit a public form. Creates a new member record based on field mappings. No authentication required.

**Auth:** None
**Permissions:** None

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "How did you hear about us?": "Friend"
}
```

> Keys correspond to field `id` or `mapTo` values defined in the form.

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "formId": "form_uuid",
    "memberId": "member_uuid",
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

## AI

AI-powered features for generating personalized messages and analyzing member journeys.

### POST /api/ai/generate-message

Generate a personalized outreach message for a member.

**Auth:** Required
**Permissions:** `communication:use_ai`

**Request Body:**
```json
{
  "firstName": "Jane",
  "pathway": "NEWCOMER",
  "currentStageId": "stage_uuid",
  "joinedDate": "2025-01-01T00:00:00.000Z",
  "tags": ["Youth Parent", "First Time Visitor"],
  "churchName": "Grace Community Church"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `firstName` | string | Yes | Member's first name |
| `pathway` | enum | Yes | `NEWCOMER` or `NEW_BELIEVER` |
| `currentStageId` | uuid | Yes | Current stage ID |
| `joinedDate` | ISO 8601 | Yes | Date the member joined |
| `tags` | string[] | No | Member's tags |
| `churchName` | string | No | Church name for personalization |

**Response:** `200 OK`
```json
{
  "message": "Hi Jane! We're so glad you visited Grace Community Church. We'd love to invite you to our upcoming connect group this Sunday..."
}
```

---

### POST /api/ai/analyze-journey

Analyze a member's journey through their pathway and provide insights.

**Auth:** Required
**Permissions:** `communication:use_ai`

**Request Body:**
```json
{
  "firstName": "Jane",
  "pathway": "NEWCOMER",
  "currentStageId": "stage_uuid",
  "currentStageName": "Welcome Call",
  "joinedDate": "2025-01-01T00:00:00.000Z",
  "lastInteraction": "2025-01-10T00:00:00.000Z",
  "daysSinceInteraction": 5,
  "recentNotes": ["Very engaged", "Interested in volunteering"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `firstName` | string | Yes | Member's first name |
| `pathway` | enum | Yes | `NEWCOMER` or `NEW_BELIEVER` |
| `currentStageId` | uuid | Yes | Current stage ID |
| `currentStageName` | string | Yes | Current stage name |
| `joinedDate` | ISO 8601 | Yes | Date the member joined |
| `lastInteraction` | ISO 8601 | No | Last interaction date |
| `daysSinceInteraction` | integer | No | Days since last interaction |
| `recentNotes` | string[] | No | Recent notes about the member |

**Response:** `200 OK`
```json
{
  "analysis": {
    "summary": "Jane is progressing well through the newcomer pathway...",
    "riskLevel": "LOW",
    "recommendations": [
      "Invite to connect group",
      "Schedule one-on-one with pastor"
    ],
    "nextSteps": "Consider advancing to the next stage within the next week"
  }
}
```

---

## Automation Rules

Automation rules automatically create tasks when a member enters a specific stage.

### GET /api/automation-rules

List all automation rules.

**Auth:** Required
**Permissions:** `automation:view`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `stageId` | uuid | — | Filter by stage |

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "stageId": "stage_uuid",
      "name": "Welcome Email Task",
      "taskDescription": "Send welcome email to new visitor",
      "daysDue": 3,
      "priority": "HIGH",
      "enabled": true,
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 5,
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/automation-rules/stats

Get automation rule statistics.

**Auth:** Required
**Permissions:** `automation:view`

**Response:** `200 OK`
```json
{
  "data": {
    "total": 10,
    "enabled": 8,
    "disabled": 2,
    "tasksCreated": 156
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/automation-rules/:id

Get automation rule details by ID.

**Auth:** Required
**Permissions:** `automation:view`

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "stageId": "stage_uuid",
    "name": "Welcome Email Task",
    "taskDescription": "Send welcome email to new visitor",
    "daysDue": 3,
    "priority": "HIGH",
    "enabled": true,
    "stage": {
      "id": "uuid",
      "name": "First Visit",
      "pathway": "NEWCOMER"
    },
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### POST /api/automation-rules

Create a new automation rule.

**Auth:** Required
**Permissions:** `automation:create`

**Request Body:**
```json
{
  "stageId": "stage_uuid",
  "name": "Welcome Email Task",
  "taskDescription": "Send welcome email to new visitor",
  "daysDue": 3,
  "priority": "HIGH",
  "enabled": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stageId` | uuid | Yes | Stage that triggers this rule |
| `name` | string | Yes | Rule name |
| `taskDescription` | string | Yes | Description of auto-created task |
| `daysDue` | integer | Yes | Days until task is due |
| `priority` | enum | No | `LOW`, `MEDIUM`, `HIGH` |
| `enabled` | boolean | No | Whether the rule is active (default: `true`) |

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "stageId": "stage_uuid",
    "name": "Welcome Email Task",
    "taskDescription": "Send welcome email to new visitor",
    "daysDue": 3,
    "priority": "HIGH",
    "enabled": true,
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### PATCH /api/automation-rules/:id

Update an automation rule.

**Auth:** Required
**Permissions:** `automation:update`

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Rule Name",
  "taskDescription": "Updated task description",
  "daysDue": 5,
  "priority": "MEDIUM"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "name": "Updated Rule Name",
    "taskDescription": "Updated task description",
    "daysDue": 5,
    "priority": "MEDIUM"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### PATCH /api/automation-rules/:id/toggle

Enable or disable an automation rule.

**Auth:** Required
**Permissions:** `automation:update`

**Request Body:**
```json
{
  "enabled": false
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "name": "Welcome Email Task",
    "enabled": false
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### DELETE /api/automation-rules/:id

Delete an automation rule.

**Auth:** Required
**Permissions:** `automation:delete`

**Response:** `200 OK`
```json
{
  "data": {
    "message": "Automation rule deleted successfully"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

## Settings

Tenant-level settings for the church.

### GET /api/settings

Get current tenant settings.

**Auth:** Required
**Permissions:** `settings:view`

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "name": "Grace Community Church",
    "email": "info@gracechurch.org",
    "phone": "+1234567890",
    "website": "https://gracechurch.org",
    "address": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zip": "62701",
    "country": "US",
    "denomination": "Non-denominational",
    "weeklyAttendance": 250,
    "timezone": "America/Chicago",
    "memberTerm": "Member",
    "autoWelcome": true,
    "serviceTimes": [
      {
        "id": "uuid",
        "day": "SUNDAY",
        "time": "09:00",
        "name": "Morning Service"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### PATCH /api/settings

Update tenant settings.

**Auth:** Required
**Permissions:** `settings:update`

**Request Body:** (all fields optional)
```json
{
  "name": "Grace Community Church",
  "email": "info@gracechurch.org",
  "phone": "+1234567890",
  "website": "https://gracechurch.org",
  "address": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "zip": "62701",
  "country": "US",
  "denomination": "Non-denominational",
  "weeklyAttendance": 300,
  "timezone": "America/Chicago",
  "memberTerm": "Visitor",
  "autoWelcome": false
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "name": "Grace Community Church",
    "weeklyAttendance": 300,
    "memberTerm": "Visitor",
    "autoWelcome": false
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### POST /api/settings/service-times

Add a service time.

**Auth:** Required
**Permissions:** `settings:update`

**Request Body:**
```json
{
  "day": "SUNDAY",
  "time": "11:00",
  "name": "Late Morning Service"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `day` | enum | Yes | `SUNDAY`, `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY` |
| `time` | string | Yes | Time in HH:mm format |
| `name` | string | Yes | Service name |

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "day": "SUNDAY",
    "time": "11:00",
    "name": "Late Morning Service"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### DELETE /api/settings/service-times/:id

Remove a service time.

**Auth:** Required
**Permissions:** `settings:update`

**Response:** `200 OK`
```json
{
  "data": {
    "message": "Service time deleted successfully"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

## Church

Church management endpoints (alternative to Settings for managing church profile and configuration).

### GET /api/church

Get church details for the current tenant.

**Auth:** Required
**Permissions:** `settings:view`

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "name": "Grace Community Church",
    "email": "info@gracechurch.org",
    "phone": "+1234567890",
    "website": "https://gracechurch.org",
    "address": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zip": "62701",
    "country": "US",
    "denomination": "Non-denominational",
    "weeklyAttendance": 250,
    "timezone": "America/Chicago",
    "memberTerm": "Member",
    "autoWelcome": true,
    "serviceTimes": [...]
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/church/stats

Get church statistics.

**Auth:** Required
**Permissions:** `settings:view`

**Response:** `200 OK`
```json
{
  "data": {
    "totalMembers": 150,
    "activeMembers": 120,
    "totalUsers": 12,
    "totalStages": 8,
    "totalTasks": 45
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### POST /api/church

Create a church profile for the tenant.

**Auth:** Required
**Permissions:** `settings:update`

**Request Body:**
```json
{
  "name": "Grace Community Church",
  "email": "info@gracechurch.org",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "zip": "62701",
  "website": "https://gracechurch.org",
  "country": "US",
  "denomination": "Non-denominational",
  "weeklyAttendance": 250,
  "timezone": "America/Chicago",
  "memberTerm": "Member",
  "autoWelcome": true,
  "serviceTimes": [
    {
      "day": "SUNDAY",
      "time": "09:00",
      "name": "Morning Service"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Church name |
| `email` | string | Yes | Church email |
| `phone` | string | Yes | Church phone |
| `address` | string | Yes | Street address |
| `city` | string | Yes | City |
| `state` | string | Yes | State |
| `zip` | string | Yes | ZIP code |
| `website` | string (URL) | No | Church website |
| `country` | string | No | Country |
| `denomination` | string | No | Church denomination |
| `weeklyAttendance` | integer | No | Average weekly attendance |
| `timezone` | string | No | Timezone identifier |
| `memberTerm` | string | No | Custom term for members |
| `autoWelcome` | boolean | No | Auto-send welcome messages |
| `serviceTimes` | array | No | Array of service time objects |

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "name": "Grace Community Church",
    "email": "info@gracechurch.org"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### PATCH /api/church

Update church details.

**Auth:** Required
**Permissions:** `settings:update`

**Request Body:** (all fields optional)
```json
{
  "name": "Grace Community Church (Updated)",
  "weeklyAttendance": 300
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "name": "Grace Community Church (Updated)",
    "weeklyAttendance": 300
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### DELETE /api/church

Delete church profile.

**Auth:** Required
**Permissions:** `settings:update`

**Response:** `200 OK`
```json
{
  "data": {
    "message": "Church profile deleted successfully"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### POST /api/church/service-times

Add a service time to the church.

**Auth:** Required
**Permissions:** `settings:update`

**Request Body:**
```json
{
  "day": "WEDNESDAY",
  "time": "19:00",
  "name": "Midweek Service"
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "day": "WEDNESDAY",
    "time": "19:00",
    "name": "Midweek Service"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### DELETE /api/church/service-times/:id

Remove a service time from the church.

**Auth:** Required
**Permissions:** `settings:update`

**Response:** `200 OK`
```json
{
  "data": {
    "message": "Service time deleted successfully"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

## Analytics

### GET /api/analytics/overview

Get an overview of key metrics.

**Auth:** Required
**Permissions:** `analytics:view`

**Response:** `200 OK`
```json
{
  "data": {
    "totalMembers": 150,
    "activeMembers": 120,
    "newMembersThisMonth": 15,
    "totalTasks": 200,
    "completedTasks": 145,
    "overdueTaskCount": 8,
    "completionRate": 72.5,
    "avgTimeInStage": 14.2
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/analytics/members

Get member analytics.

**Auth:** Required
**Permissions:** `analytics:view`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pathway` | enum | — | `NEWCOMER` or `NEW_BELIEVER` |

**Response:** `200 OK`
```json
{
  "data": {
    "byPathway": {
      "NEWCOMER": 80,
      "NEW_BELIEVER": 70
    },
    "byStatus": {
      "ACTIVE": 120,
      "INTEGRATED": 25,
      "INACTIVE": 5
    },
    "byStage": [
      {
        "stageId": "uuid",
        "stageName": "First Visit",
        "count": 30
      }
    ],
    "joinedOverTime": [
      {
        "month": "2025-01",
        "count": 15
      }
    ]
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/analytics/tasks

Get task analytics.

**Auth:** Required
**Permissions:** `analytics:view`

**Response:** `200 OK`
```json
{
  "data": {
    "total": 200,
    "completed": 145,
    "pending": 47,
    "overdue": 8,
    "completionRate": 72.5,
    "byPriority": {
      "HIGH": 50,
      "MEDIUM": 100,
      "LOW": 50
    },
    "avgCompletionDays": 3.2
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/analytics/export

Export data as JSON.

**Auth:** Required
**Permissions:** `analytics:export`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | enum | Yes | `members` or `tasks` |

**Example Request:**
```http
GET /api/analytics/export?type=members
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com",
      "pathway": "NEWCOMER",
      "status": "ACTIVE",
      "joinedDate": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 150,
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

## Communications

### POST /api/communications/email

Send an email to a member.

**Auth:** Required
**Permissions:** `communication:send_email`

**Request Body:**
```json
{
  "memberId": "member_uuid",
  "subject": "Welcome to Grace Community Church!",
  "content": "Hi Jane, we're so glad you visited us last Sunday..."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `memberId` | uuid | Yes | Target member |
| `subject` | string | Yes | Email subject |
| `content` | string | Yes | Email body |

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "memberId": "member_uuid",
    "channel": "EMAIL",
    "subject": "Welcome to Grace Community Church!",
    "content": "Hi Jane, we're so glad you visited us last Sunday...",
    "status": "SENT",
    "sentAt": "2025-01-15T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### POST /api/communications/sms

Send an SMS to a member.

**Auth:** Required
**Permissions:** `communication:send_sms`

**Request Body:**
```json
{
  "memberId": "member_uuid",
  "content": "Hi Jane! Just a reminder about our connect group this Sunday at 10am. Hope to see you there!"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `memberId` | uuid | Yes | Target member |
| `content` | string | Yes | SMS content (max 1600 characters) |

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "memberId": "member_uuid",
    "channel": "SMS",
    "content": "Hi Jane! Just a reminder about our connect group this Sunday at 10am. Hope to see you there!",
    "status": "SENT",
    "sentAt": "2025-01-15T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/communications/history

Get communication history.

**Auth:** Required
**Permissions:** `communication:view_history`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `memberId` | uuid | — | Filter by member |
| `channel` | enum | — | `SMS` or `EMAIL` |

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "memberId": "member_uuid",
      "channel": "EMAIL",
      "subject": "Welcome to Grace Community Church!",
      "content": "Hi Jane...",
      "status": "SENT",
      "sentAt": "2025-01-15T10:30:00.000Z",
      "member": {
        "firstName": "Jane",
        "lastName": "Smith"
      }
    }
  ],
  "meta": {
    "total": 25,
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/communications/stats

Get communication statistics.

**Auth:** Required
**Permissions:** `communication:view_history`

**Response:** `200 OK`
```json
{
  "data": {
    "totalSent": 150,
    "byChannel": {
      "EMAIL": 100,
      "SMS": 50
    },
    "thisMonth": 25,
    "lastMonth": 30
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

## Integrations

Google Sheets integration for automatically importing members from external sources.

### GET /api/integrations

List all integrations.

**Auth:** Required
**Permissions:** `integration:view`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "sourceName": "Sunday Service Sign-ups",
      "sheetUrl": "https://docs.google.com/spreadsheets/d/...",
      "targetPathway": "NEWCOMER",
      "targetStageId": "stage_uuid",
      "status": "ACTIVE",
      "lastSyncAt": "2025-01-15T08:00:00.000Z",
      "syncFrequency": "daily",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 3,
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/integrations/stats

Get integration statistics.

**Auth:** Required
**Permissions:** `integration:view`

**Response:** `200 OK`
```json
{
  "data": {
    "total": 3,
    "active": 2,
    "paused": 1,
    "error": 0,
    "totalSynced": 450
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/integrations/:id

Get integration details by ID.

**Auth:** Required
**Permissions:** `integration:view`

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "sourceName": "Sunday Service Sign-ups",
    "sheetUrl": "https://docs.google.com/spreadsheets/d/...",
    "targetPathway": "NEWCOMER",
    "targetStageId": "stage_uuid",
    "autoCreateTask": true,
    "taskDescription": "Follow up with new sign-up",
    "autoWelcome": true,
    "syncFrequency": "daily",
    "status": "ACTIVE",
    "lastSyncAt": "2025-01-15T08:00:00.000Z",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### POST /api/integrations

Create a new integration.

**Auth:** Required
**Permissions:** `integration:create`

**Request Body:**
```json
{
  "sourceName": "Sunday Service Sign-ups",
  "sheetUrl": "https://docs.google.com/spreadsheets/d/abc123/edit",
  "targetPathway": "NEWCOMER",
  "targetStageId": "stage_uuid",
  "autoCreateTask": true,
  "taskDescription": "Follow up with new sign-up",
  "autoWelcome": true,
  "syncFrequency": "daily"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sourceName` | string | Yes | Integration name |
| `sheetUrl` | string (URL) | Yes | Google Sheets URL |
| `targetPathway` | enum | Yes | `NEWCOMER` or `NEW_BELIEVER` |
| `targetStageId` | uuid | Yes | Stage for imported members |
| `autoCreateTask` | boolean | No | Auto-create tasks for imported members |
| `taskDescription` | string | No | Task description for auto-created tasks |
| `autoWelcome` | boolean | No | Auto-send welcome messages |
| `syncFrequency` | string | No | Sync frequency (e.g., `daily`) |

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "sourceName": "Sunday Service Sign-ups",
    "sheetUrl": "https://docs.google.com/spreadsheets/d/abc123/edit",
    "targetPathway": "NEWCOMER",
    "targetStageId": "stage_uuid",
    "status": "ACTIVE",
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### PATCH /api/integrations/:id

Update an integration.

**Auth:** Required
**Permissions:** `integration:update`

**Request Body:** (all fields optional)
```json
{
  "sourceName": "Updated Integration Name",
  "autoCreateTask": false,
  "syncFrequency": "weekly"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "sourceName": "Updated Integration Name",
    "autoCreateTask": false,
    "syncFrequency": "weekly"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### POST /api/integrations/:id/sync

Manually trigger a sync for an integration.

**Auth:** Required
**Permissions:** `integration:sync`

**Response:** `200 OK`
```json
{
  "data": {
    "synced": 15,
    "failed": 0,
    "errors": [],
    "lastSyncAt": "2025-01-15T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### POST /api/integrations/:id/test

Test the connection for an integration.

**Auth:** Required
**Permissions:** `integration:view`

**Response:** `200 OK`
```json
{
  "data": {
    "success": true,
    "message": "Connection successful",
    "rowCount": 150
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### DELETE /api/integrations/:id

Delete an integration.

**Auth:** Required
**Permissions:** `integration:delete`

**Response:** `200 OK`
```json
{
  "data": {
    "message": "Integration deleted successfully"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

## Health Check

### GET /health

Check API server health. No authentication required.

**Auth:** None
**Permissions:** None

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 86400,
  "environment": "development"
}
```

---

## Response Format

### Success Response

```json
{
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

### Paginated Response

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
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
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
    "timestamp": "2025-01-15T10:30:00.000Z",
    "requestId": "req_abc123"
  }
}
```

### HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE (some endpoints) |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Invalid/missing token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource |
| 422 | Unprocessable Entity | Business logic error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Common Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `MEMBER_NOT_FOUND` | Member doesn't exist |
| `TASK_NOT_FOUND` | Task doesn't exist |
| `STAGE_NOT_FOUND` | Stage doesn't exist |
| `USER_NOT_FOUND` | User doesn't exist |
| `FORM_NOT_FOUND` | Form doesn't exist |
| `INTEGRATION_NOT_FOUND` | Integration doesn't exist |
| `RULE_NOT_FOUND` | Automation rule doesn't exist |
| `EMAIL_EXISTS` | Email already registered |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `UNAUTHORIZED` | Authentication required |

---

## Rate Limiting

- **Default Limit:** 100 requests per 15-minute window per IP address
- **Body Size Limit:** 10 MB

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1703246400
```

**Exceeded Response:** `429 Too Many Requests`
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later"
  }
}
```

---

## Roles & Permissions

### Roles

| Role | Description |
|------|-------------|
| `SUPER_ADMIN` | System-wide access — all permissions |
| `ADMIN` | Full tenant access — all tenant-level permissions |
| `TEAM_LEADER` | Can manage members, tasks, and communicate — limited admin |
| `VOLUNTEER` | Basic access — assigned members and tasks only |

### Permission Matrix

| Permission | SUPER_ADMIN | ADMIN | TEAM_LEADER | VOLUNTEER |
|------------|:-----------:|:-----:|:-----------:|:---------:|
| **Users** | | | | |
| `user:view` | X | X | X | |
| `user:create` | X | X | | |
| `user:update` | X | X | | |
| `user:delete` | X | X | | |
| `user:manage_roles` | X | X | | |
| **Members** | | | | |
| `member:view` | X | X | X | X |
| `member:view_all` | X | X | X | |
| `member:create` | X | X | X | X |
| `member:update` | X | X | X | X |
| `member:delete` | X | X | | |
| `member:assign` | X | X | X | |
| **Tasks** | | | | |
| `task:view` | X | X | X | X |
| `task:view_all` | X | X | X | |
| `task:create` | X | X | X | X |
| `task:update` | X | X | X | X |
| `task:delete` | X | X | | |
| `task:assign` | X | X | X | |
| **Stages** | | | | |
| `stage:view` | X | X | X | X |
| `stage:create` | X | X | | |
| `stage:update` | X | X | | |
| `stage:delete` | X | X | | |
| `stage:reorder` | X | X | | |
| **Automation Rules** | | | | |
| `automation:view` | X | X | X | |
| `automation:create` | X | X | | |
| `automation:update` | X | X | | |
| `automation:delete` | X | X | | |
| **Communications** | | | | |
| `communication:send_email` | X | X | X | X |
| `communication:send_sms` | X | X | X | X |
| `communication:view_history` | X | X | X | X |
| `communication:use_ai` | X | X | X | X |
| **Settings** | | | | |
| `settings:view` | X | X | X | X |
| `settings:update` | X | X | | |
| **Integrations** | | | | |
| `integration:view` | X | X | X | |
| `integration:create` | X | X | | |
| `integration:update` | X | X | | |
| `integration:delete` | X | X | | |
| `integration:sync` | X | X | | |
| **Analytics** | | | | |
| `analytics:view` | X | X | X | |
| `analytics:export` | X | X | | |
| **Forms** | | | | |
| `form:view` | X | X | X | |
| `form:create` | X | X | | |
| `form:update` | X | X | | |
| `form:delete` | X | X | | |
| **Admin** | | | | |
| `admin:view_logs` | X | | | |
| `admin:manage_tenants` | X | | | |
| `admin:view_health` | X | | | |

> **Note:** `VOLUNTEER` users with `member:view` (without `member:view_all`) can only see members assigned to them. The same applies to `task:view` vs `task:view_all`.

---

**Last Updated:** January 2025
**API Version:** 1.0.0
