# Pathways Tracker - Database & Backend API Design

**Document Version:** 1.0
**Date:** December 21, 2025
**Author:** System Architecture Team
**Status:** Design Complete - Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Technology Stack](#technology-stack)
4. [Database Schema Design](#database-schema-design)
5. [REST API Specification](#rest-api-specification)
6. [System Architecture](#system-architecture)
7. [Data Flow Diagrams](#data-flow-diagrams)
8. [Implementation Guide](#implementation-guide)
9. [Security Considerations](#security-considerations)
10. [Performance & Scaling](#performance--scaling)
11. [Appendices](#appendices)

---

## Executive Summary

This document provides a comprehensive database schema and backend API design for the **Pathways Tracker** application - a church integration platform for tracking newcomers and new believers through customizable discipleship pathways.

### Key Features

- **Multi-tenant architecture** supporting multiple churches in a single deployment
- **Role-based access control (RBAC)** with 4 roles and 40+ granular permissions
- **Automated workflows** with stage-based task creation and time/event-triggered progression
- **AI-powered insights** using Google Gemini for message generation and journey analysis
- **Communication hub** for email/SMS with delivery tracking
- **Family/household management** with relationship linking
- **Google Sheets integration** for bulk member imports
- **Comprehensive analytics** and reporting

### Design Decisions

1. **PostgreSQL Database** - Chosen for relational integrity, ACID compliance, and complex query support
2. **Prisma ORM** - TypeScript-first ORM with migrations and type safety
3. **RESTful API** - Standard REST patterns with JWT authentication
4. **Background Job Processing** - Bull queue for async operations (email, SMS, imports)
5. **Multi-tenant Row-Level Security** - Every table includes `tenantId` for data isolation

---

## System Overview

### Application Purpose

Pathways Tracker helps churches:

1. **Track spiritual journeys** through two parallel pathways (Newcomer and New Believer)
2. **Automate follow-ups** with rule-based task creation
3. **Manage communications** via integrated email/SMS
4. **Link families** into household units
5. **Generate insights** using AI-powered analysis
6. **Import data** from Google Sheets with deduplication
7. **Monitor progress** with comprehensive analytics

### Current State

- **Frontend:** React 19 + TypeScript with Vite
- **State Management:** React Context API
- **Data:** Mock data (resets on refresh)
- **AI Integration:** Gemini 2.5 Flash (client-side, API key exposed)

### Target State (This Design)

- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL 15+ with Prisma ORM
- **Authentication:** JWT with refresh token rotation
- **Authorization:** RBAC with 4 roles (SUPER_ADMIN, ADMIN, TEAM_LEADER, VOLUNTEER)
- **Communication:** SendGrid (email) + Twilio (SMS)
- **AI:** Server-side Gemini API calls (secure)
- **Queue:** Bull (Redis-based) for background jobs

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Runtime** | Node.js 18+ | JavaScript runtime |
| **Framework** | Express.js + TypeScript | REST API server |
| **Database** | PostgreSQL 15+ | Primary data store |
| **ORM** | Prisma 5+ | Database access & migrations |
| **Cache** | Redis 7+ | Sessions, caching, rate limiting |
| **Queue** | Bull (Redis-based) | Background job processing |
| **Auth** | JWT + bcrypt | Token authentication |
| **Email** | SendGrid | Transactional email |
| **SMS** | Twilio | SMS messaging |
| **AI** | Google Gemini 2.5 Flash | Message generation, journey analysis |
| **Storage** | AWS S3 or Local FS | File uploads, exports |
| **Integration** | Google Sheets API | Bulk data import |

### Development Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "bcrypt": "^5.1.0",
    "jsonwebtoken": "^9.0.0",
    "bull": "^4.11.0",
    "ioredis": "^5.3.0",
    "@sendgrid/mail": "^7.7.0",
    "twilio": "^4.20.0",
    "@google/generative-ai": "^0.1.0",
    "zod": "^3.22.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/express": "^4.17.0",
    "@types/bcrypt": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.0",
    "ts-node": "^10.9.0",
    "nodemon": "^3.0.0"
  }
}
```

---

## Database Schema Design

### Overview

The database consists of **14 core tables** organized into logical domains:

1. **Multi-tenancy:** Tenant
2. **Authentication:** User, RefreshToken
3. **Members:** Member, Family, Note, MemberTag, Resource, StageHistory
4. **Tasks:** Task
5. **Pathways:** Stage, AutomationRule
6. **Communication:** Message
7. **Settings:** ChurchSettings, ServiceTime, IntegrationConfig
8. **Admin:** SystemLog, AuditLog, SystemHealth

### Complete Prisma Schema

```prisma
// ========================================
// MULTI-TENANCY
// ========================================

model Tenant {
  id            String   @id @default(uuid())
  name          String
  domain        String   @unique
  adminEmail    String
  plan          Plan     @default(FREE)
  status        TenantStatus @default(ACTIVE)
  memberCount   Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastLoginAt   DateTime?

  // Billing
  stripeCustomerId String?
  subscriptionId   String?
  trialEndsAt      DateTime?

  // Relations
  users            User[]
  members          Member[]
  stages           Stage[]
  tasks            Task[]
  automationRules  AutomationRule[]
  integrations     IntegrationConfig[]
  churchSettings   ChurchSettings?
  systemLogs       SystemLog[]
  auditLogs        AuditLog[]

  @@index([domain])
  @@index([status])
}

enum Plan {
  FREE
  PRO
  ENTERPRISE
}

enum TenantStatus {
  ACTIVE
  SUSPENDED
  PENDING
}

// ========================================
// AUTHENTICATION & USERS
// ========================================

model User {
  id                String   @id @default(uuid())
  tenantId          String
  email             String
  passwordHash      String
  role              UserRole @default(VOLUNTEER)

  // Profile
  firstName         String
  lastName          String
  phone             String?
  avatar            String?
  gender            Gender?
  address           String?
  location          String?
  postalCode        String?
  dateOfBirth       DateTime?

  // Account status
  isActive          Boolean  @default(true)
  emailVerified     Boolean  @default(false)
  onboardingComplete Boolean @default(false)
  lastLoginAt       DateTime?

  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  tenant            Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  assignedMembers   Member[] @relation("AssignedTo")
  assignedTasks     Task[]   @relation("AssignedTo")
  createdMembers    Member[] @relation("CreatedBy")
  createdTasks      Task[]   @relation("CreatedBy")
  sentMessages      Message[]
  createdNotes      Note[]
  refreshTokens     RefreshToken[]

  @@unique([tenantId, email])
  @@index([tenantId, role])
  @@index([email])
}

enum UserRole {
  VOLUNTEER
  TEAM_LEADER
  ADMIN
  SUPER_ADMIN
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

model RefreshToken {
  id          String   @id @default(uuid())
  userId      String
  token       String   @unique
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  revokedAt   DateTime?

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
}

// ========================================
// MEMBERS & FAMILY
// ========================================

model Member {
  id                  String       @id @default(uuid())
  tenantId            String

  // Personal Information
  firstName           String
  lastName            String
  email               String?
  phone               String?
  photoUrl            String?
  dateOfBirth         DateTime?
  gender              Gender?

  // Address
  address             String?
  city                String?
  state               String?
  zip                 String?
  nationality         String?

  // Marital & Family
  maritalStatus       MaritalStatus?
  spouseName          String?
  spouseDob           DateTime?
  emergencyContact    String?

  // Pathway Tracking
  pathway             Pathway
  currentStageId      String
  status              MemberStatus @default(ACTIVE)
  joinedDate          DateTime     @default(now())
  lastStageChangeDate DateTime     @default(now())

  // Church Membership
  isChurchMember      Boolean      @default(false)
  titheNumber         String?
  membershipDate      DateTime?

  // Family/Household
  familyId            String?
  familyRole          FamilyRole?

  // Assignment
  assignedToId        String?
  createdById         String

  // Timestamps
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt

  // Relations
  tenant              Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  currentStage        Stage        @relation("CurrentStage", fields: [currentStageId], references: [id])
  family              Family?      @relation(fields: [familyId], references: [id])
  assignedTo          User?        @relation("AssignedTo", fields: [assignedToId], references: [id])
  createdBy           User         @relation("CreatedBy", fields: [createdById], references: [id])

  // Child relations
  tasks               Task[]
  notes               Note[]
  messages            Message[]
  resources           Resource[]
  tags                MemberTag[]
  stageHistory        StageHistory[]

  @@unique([tenantId, email])
  @@unique([tenantId, titheNumber])
  @@index([tenantId, pathway, status])
  @@index([tenantId, currentStageId])
  @@index([tenantId, assignedToId])
  @@index([familyId])
  @@index([email])
}

enum Pathway {
  NEWCOMER
  NEW_BELIEVER
}

enum MemberStatus {
  ACTIVE
  INTEGRATED
  INACTIVE
}

enum MaritalStatus {
  SINGLE
  MARRIED
  DIVORCED
  WIDOWED
  OTHER
}

enum FamilyRole {
  HEAD
  SPOUSE
  CHILD
  OTHER
}

model Family {
  id              String   @id @default(uuid())
  tenantId        String
  name            String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  members         Member[]

  @@index([tenantId])
}

model Note {
  id          String   @id @default(uuid())
  memberId    String
  content     String   @db.Text
  isSystem    Boolean  @default(false)
  createdById String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  member      Member   @relation(fields: [memberId], references: [id], onDelete: Cascade)
  createdBy   User?    @relation(fields: [createdById], references: [id])

  @@index([memberId, createdAt])
}

model MemberTag {
  id        String   @id @default(uuid())
  memberId  String
  tag       String
  createdAt DateTime @default(now())

  member    Member   @relation(fields: [memberId], references: [id], onDelete: Cascade)

  @@unique([memberId, tag])
  @@index([memberId])
  @@index([tag])
}

model Resource {
  id          String       @id @default(uuid())
  memberId    String
  title       String
  url         String
  type        ResourceType
  dateAdded   DateTime     @default(now())

  member      Member       @relation(fields: [memberId], references: [id], onDelete: Cascade)

  @@index([memberId])
}

enum ResourceType {
  PDF
  VIDEO
  LINK
  DOC
}

model StageHistory {
  id              String   @id @default(uuid())
  memberId        String
  fromStageId     String?
  toStageId       String
  changedAt       DateTime @default(now())
  changedBy       String?
  reason          String?

  member          Member   @relation(fields: [memberId], references: [id], onDelete: Cascade)
  fromStage       Stage?   @relation("FromStage", fields: [fromStageId], references: [id])
  toStage         Stage    @relation("ToStage", fields: [toStageId], references: [id])

  @@index([memberId, changedAt])
}

// ========================================
// PATHWAYS & STAGES
// ========================================

model Stage {
  id              String    @id @default(uuid())
  tenantId        String
  pathway         Pathway
  name            String
  description     String?   @db.Text
  order           Int

  autoAdvanceEnabled Boolean @default(false)
  autoAdvanceType    AutoAdvanceType?
  autoAdvanceValue   String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  tenant          Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  members         Member[]  @relation("CurrentStage")
  automationRules AutomationRule[]
  fromHistory     StageHistory[] @relation("FromStage")
  toHistory       StageHistory[] @relation("ToStage")

  @@unique([tenantId, pathway, order])
  @@unique([tenantId, pathway, name])
  @@index([tenantId, pathway])
}

enum AutoAdvanceType {
  TASK_COMPLETED
  TIME_IN_STAGE
}

model AutomationRule {
  id              String       @id @default(uuid())
  tenantId        String
  stageId         String
  name            String
  taskDescription String
  daysDue         Int
  priority        TaskPriority @default(MEDIUM)
  enabled         Boolean      @default(true)

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  tenant          Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  stage           Stage        @relation(fields: [stageId], references: [id], onDelete: Cascade)

  @@index([tenantId, stageId, enabled])
}

// ========================================
// TASKS
// ========================================

model Task {
  id              String       @id @default(uuid())
  tenantId        String
  memberId        String
  description     String       @db.Text
  dueDate         DateTime
  completed       Boolean      @default(false)
  completedAt     DateTime?
  priority        TaskPriority @default(MEDIUM)

  assignedToId    String
  createdById     String
  createdByRule   Boolean      @default(false)
  automationRuleId String?

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  tenant          Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  member          Member       @relation(fields: [memberId], references: [id], onDelete: Cascade)
  assignedTo      User         @relation("AssignedTo", fields: [assignedToId], references: [id])
  createdBy       User         @relation("CreatedBy", fields: [createdById], references: [id])

  @@index([tenantId, assignedToId, completed])
  @@index([tenantId, memberId])
  @@index([dueDate, completed])
  @@index([completed, dueDate])
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
}

// ========================================
// COMMUNICATION
// ========================================

model Message {
  id          String           @id @default(uuid())
  tenantId    String
  memberId    String
  channel     MessageChannel
  direction   MessageDirection
  content     String           @db.Text
  subject     String?

  sentById    String?
  sentByName  String?
  status      MessageStatus    @default(SENT)
  errorMessage String?
  externalId  String?

  sentAt      DateTime         @default(now())
  deliveredAt DateTime?
  readAt      DateTime?

  member      Member           @relation(fields: [memberId], references: [id], onDelete: Cascade)
  sentBy      User?            @relation(fields: [sentById], references: [id])

  @@index([tenantId, memberId, sentAt])
  @@index([sentAt])
}

enum MessageChannel {
  SMS
  EMAIL
}

enum MessageDirection {
  INBOUND
  OUTBOUND
}

enum MessageStatus {
  QUEUED
  SENT
  DELIVERED
  READ
  FAILED
}

// ========================================
// CHURCH SETTINGS
// ========================================

model ChurchSettings {
  id              String        @id @default(uuid())
  tenantId        String        @unique

  name            String
  email           String
  phone           String
  website         String?

  address         String
  city            String
  state           String
  zip             String
  country         String        @default("United States")

  denomination    String?
  weeklyAttendance String?
  timezone        String        @default("America/New_York")

  memberTerm      String        @default("Church Member")
  autoWelcome     Boolean       @default(false)

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  tenant          Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  serviceTimes    ServiceTime[]
}

model ServiceTime {
  id                String          @id @default(uuid())
  churchSettingsId  String
  day               DayOfWeek
  time              String
  name              String

  createdAt         DateTime        @default(now())

  churchSettings    ChurchSettings  @relation(fields: [churchSettingsId], references: [id], onDelete: Cascade)

  @@index([churchSettingsId])
}

enum DayOfWeek {
  SUNDAY
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
}

// ========================================
// INTEGRATIONS
// ========================================

model IntegrationConfig {
  id              String            @id @default(uuid())
  tenantId        String
  sourceName      String
  sheetUrl        String
  targetPathway   Pathway
  targetStageId   String

  autoCreateTask  Boolean           @default(false)
  taskDescription String?
  autoWelcome     Boolean           @default(false)

  status          IntegrationStatus @default(ACTIVE)
  lastSync        DateTime?
  lastSyncStatus  String?
  syncFrequency   String?

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  tenant          Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId, status])
}

enum IntegrationStatus {
  ACTIVE
  ERROR
  PAUSED
}

// ========================================
// SYSTEM MONITORING
// ========================================

model SystemLog {
  id          String      @id @default(uuid())
  tenantId    String?
  level       LogLevel
  module      LogModule
  message     String      @db.Text

  userId      String?
  userEmail   String?
  ipAddress   String?
  userAgent   String?
  requestId   String?

  latency     Int?
  endpoint    String?
  method      String?
  statusCode  Int?

  errorStack  String?     @db.Text
  errorCode   String?

  timestamp   DateTime    @default(now())

  tenant      Tenant?     @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId, timestamp])
  @@index([level, timestamp])
  @@index([module, timestamp])
  @@index([userId, timestamp])
  @@index([requestId])
}

enum LogLevel {
  INFO
  WARN
  ERROR
  CRITICAL
}

enum LogModule {
  AUTH
  API
  DB
  EMAIL
  SMS
  BILLING
  AUTOMATION
  INTEGRATION
  SYSTEM
}

model AuditLog {
  id          String      @id @default(uuid())
  tenantId    String
  userId      String

  action      AuditAction
  entityType  String
  entityId    String

  oldValues   Json?
  newValues   Json?

  ipAddress   String?
  userAgent   String?

  timestamp   DateTime    @default(now())

  tenant      Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId, timestamp])
  @@index([userId, timestamp])
  @@index([entityType, entityId])
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  ROLE_CHANGE
  STAGE_ADVANCE
  TASK_COMPLETE
  MESSAGE_SENT
}

model SystemHealth {
  id              String   @id @default(uuid())

  activeUsers     Int
  totalMembers    Int
  tasksCompleted  Int
  messagesSent    Int

  avgResponseTime Int
  errorRate       Float

  dbConnections   Int
  dbSize          BigInt

  recordedAt      DateTime @default(now())

  @@index([recordedAt])
}
```

### Key Schema Design Patterns

#### 1. Multi-Tenant Isolation

Every table (except admin tables) includes `tenantId`:

```typescript
// All queries auto-filter by tenant
const members = await prisma.member.findMany({
  where: { tenantId: currentUser.tenantId }
});
```

#### 2. Soft Delete via Status

Instead of deleting records, use status flags:

```prisma
status: MemberStatus  // ACTIVE, INTEGRATED, INACTIVE
isActive: Boolean     // For users
```

#### 3. Audit Trail

- `StageHistory` tracks all pathway progressions
- `AuditLog` tracks RBAC-protected actions
- `SystemLog` tracks technical events

#### 4. Cascade Deletes

Configured via `onDelete: Cascade`:

```
Tenant deleted → All users, members, tasks cascade
Member deleted → All tasks, notes, messages cascade
User deleted → Refresh tokens cascade
```

#### 5. Composite Unique Constraints

Prevent duplicates within tenant:

```prisma
@@unique([tenantId, email])
@@unique([tenantId, titheNumber])
@@unique([tenantId, pathway, order])
```

---

## REST API Specification

### API Base URL

```
Production:  https://api.pathwaystracker.com/v1
Development: http://localhost:4000/api
```

### Authentication

All endpoints (except `/auth/register`, `/auth/login`, `/auth/refresh`) require JWT authentication:

```http
Authorization: Bearer <accessToken>
```

**Token Lifecycle:**
- Access Token: 15 minutes expiry
- Refresh Token: 7 days expiry
- Token rotation on refresh

### Response Format

**Success Response:**
```json
{
  "data": { /* ... */ },
  "meta": {
    "timestamp": "2025-12-21T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

**Error Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [
      { "field": "email", "message": "Must be valid email" }
    ]
  },
  "meta": {
    "timestamp": "2025-12-21T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 202 | Accepted | Async operation queued |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Invalid/missing token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 422 | Unprocessable Entity | Business logic error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service down |

### API Endpoint Categories

1. **Authentication** - `/api/auth/*`
2. **Users** - `/api/users/*`
3. **Members** - `/api/members/*`
4. **Tasks** - `/api/tasks/*`
5. **Pathways/Stages** - `/api/pathways/*`, `/api/stages/*`
6. **Automation** - `/api/automation-rules/*`
7. **Communication** - `/api/communications/*`
8. **Settings** - `/api/church-settings/*`
9. **Integrations** - `/api/integrations/*`
10. **Analytics** - `/api/analytics/*`
11. **Super Admin** - `/api/admin/*`

### Complete API Reference

> **Note:** For the complete API specification with all request/response schemas, see sections 7-10 above in the design process. The API includes:
>
> - **Authentication:** 6 endpoints (register, login, refresh, logout, me, onboarding)
> - **Users:** 6 endpoints (list, get, update, update role, delete, permissions)
> - **Members:** 20+ endpoints (CRUD, family linking, notes, resources, tags)
> - **Tasks:** 7 endpoints (CRUD, complete, export ICS)
> - **Stages:** 5 endpoints (CRUD, reorder)
> - **Automation:** 5 endpoints (CRUD, toggle)
> - **Communication:** 7 endpoints (email, SMS, AI generation, webhooks)
> - **Settings:** 5 endpoints (church settings, service times)
> - **Integrations:** 7 endpoints (CRUD, sync, test)
> - **Analytics:** 7 endpoints (dashboard, pipeline, funnel, reports)
> - **Admin:** 4 endpoints (tenants, logs, health)

**Total:** 80+ API endpoints

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  React Frontend (Vite + TypeScript)                             │
│  ├─ Components (Dashboard, Members, Tasks, etc.)                │
│  ├─ Context API (Global State)                                  │
│  ├─ Services (API Client, AI, Communication)                    │
│  └─ Utils (Validation, Logging, Monitoring)                     │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTPS/REST API
                     ├─ JWT Bearer Token
                     ├─ JSON Request/Response
                     └─ WebSocket (future: real-time)
                     │
┌────────────────────┴────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  Node.js/Express Backend                                         │
│  ├─ Routes (Auth, Members, Tasks, etc.)                         │
│  ├─ Middleware                                                   │
│  │  ├─ Authentication (JWT validation)                          │
│  │  ├─ Authorization (RBAC permissions)                         │
│  │  ├─ Validation (Request schemas)                             │
│  │  ├─ Error Handling (Standardized responses)                  │
│  │  └─ Logging (Request/Response tracking)                      │
│  ├─ Services                                                     │
│  │  ├─ Auth Service (bcrypt, JWT)                               │
│  │  ├─ Member Service (CRUD + business logic)                   │
│  │  ├─ Task Service (Automation checks)                         │
│  │  ├─ Communication Service (Email/SMS queue)                  │
│  │  ├─ AI Service (Gemini API integration)                      │
│  │  └─ Analytics Service (Aggregations)                         │
│  └─ Background Jobs                                              │
│     ├─ Task Automation Worker                                   │
│     ├─ Email Queue Worker                                       │
│     ├─ SMS Queue Worker                                         │
│     ├─ Integration Sync Worker                                  │
│     └─ Auto-Advance Checker (Cron)                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬──────────────┐
        │            │            │              │
┌───────▼──────┐ ┌──▼─────┐ ┌───▼──────┐ ┌─────▼────────┐
│ PostgreSQL   │ │ Redis  │ │  Queue   │ │  File Store  │
│   Database   │ │ Cache  │ │  (Bull)  │ │  (S3/Local)  │
└──────────────┘ └────────┘ └──────────┘ └──────────────┘
  - Members       - Sessions  - Email jobs  - Exports
  - Tasks         - API cache - SMS jobs    - Uploads
  - Users         - Analytics - Sync jobs   - Avatars
  - Settings      - Rate limit

┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Google       │  │  Twilio      │  │  SendGrid    │          │
│  │ Gemini AI    │  │  (SMS)       │  │  (Email)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │ Google       │  │  Stripe      │                            │
│  │ Sheets API   │  │  (Billing)   │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

### Middleware Stack

Requests flow through middleware in this order:

```
1. CORS Handling          → Allow cross-origin requests
2. Helmet Security        → Set security headers
3. Request Logging        → Log incoming request
4. Rate Limiting          → Check request quota
5. Body Parsing           → Parse JSON body
6. Authentication         → Verify JWT token
7. Authorization          → Check RBAC permissions
8. Request Validation     → Validate request schema
9. Route Handler          → Execute business logic
10. Response Logging      → Log outgoing response
11. Error Handling        → Catch and format errors
```

### Background Job Processing

```
┌─────────────────────────────────────────────────────────────────┐
│                       JOB QUEUE (Bull + Redis)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Email Queue                                                     │
│  ├─ Priority: HIGH (transactional), NORMAL (welcome)           │
│  ├─ Retry: 3 attempts with exponential backoff                 │
│  ├─ Worker: EmailWorker.process()                              │
│  └─ Provider: SendGrid API                                      │
│                                                                  │
│  SMS Queue                                                       │
│  ├─ Priority: HIGH (immediate), NORMAL (batch)                 │
│  ├─ Retry: 2 attempts                                           │
│  ├─ Worker: SMSWorker.process()                                │
│  └─ Provider: Twilio API                                        │
│                                                                  │
│  Integration Sync Queue                                          │
│  ├─ Priority: NORMAL                                            │
│  ├─ Retry: 1 attempt                                            │
│  ├─ Worker: SyncWorker.process()                               │
│  └─ Provider: Google Sheets API                                │
│                                                                  │
│  Auto-Advance Queue (Cron: every 1 hour)                        │
│  ├─ Check TIME_IN_STAGE rules                                  │
│  ├─ Advance members when threshold met                         │
│  └─ Create automation tasks                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Flow 1: User Registration & Onboarding

```
User fills registration form
    ↓
POST /api/auth/register
    ↓
Backend validates email uniqueness
    ↓
Hash password with bcrypt (10 rounds)
    ↓
Create User record (role: VOLUNTEER, onboardingComplete: false)
    ↓
Generate JWT access token (15min expiry)
Generate refresh token (7 days expiry)
    ↓
Store refresh token in database
    ↓
Return tokens + user profile
    ↓
Frontend stores tokens in localStorage
    ↓
Redirect to Onboarding flow
    ↓
User completes church setup (4 steps)
    ↓
PATCH /api/auth/onboarding/complete
    ↓
Set onboardingComplete = true
    ↓
Redirect to Dashboard
```

### Flow 2: Member Stage Advancement with Automation

```
User drags member to new stage (PathwaysPage)
    ↓
PATCH /api/members/:id/stage
    ↓
[MIDDLEWARE]
- Authenticate JWT
- Check MEMBER_UPDATE permission
- Verify ownership (VOLUNTEER: assignedToId === userId)
- Validate stageId exists in member's pathway
    ↓
[DATABASE TRANSACTION START]
    ↓
1. Create StageHistory record
   - fromStageId: current
   - toStageId: new
   - changedAt: now()
   - changedBy: userId
   - reason: "Manual advance"
    ↓
2. Update Member
   - currentStageId: new stage
   - lastStageChangeDate: now()
    ↓
3. Create system Note
   - content: "[System] Advanced from X to Y"
   - isSystem: true
    ↓
4. Query AutomationRules
   WHERE stageId = new AND enabled = true
    ↓
   For each matching rule:
      ├─ Create Task
      │  - memberId: member.id
      │  - description: rule.taskDescription
      │  - dueDate: now() + rule.daysDue
      │  - priority: rule.priority
      │  - assignedToId: member.assignedToId
      │  - createdByRule: true
      │  - automationRuleId: rule.id
      │
      └─ Create Note
         - "[System] Auto-created task: {description}"
    ↓
5. Check Stage Auto-Advance Rule
   IF stage.autoAdvanceType === "TIME_IN_STAGE":
      - Schedule background job for future check
   IF stage.autoAdvanceType === "TASK_COMPLETED":
      - No action (checked on task completion)
    ↓
[TRANSACTION COMMIT]
    ↓
Return updated member + created tasks
    ↓
Frontend updates context state
    ↓
UI re-renders kanban board
Toast: "Member advanced to {stage}"
```

### Flow 3: Task Completion with Auto-Advance

```
User checks task as complete
    ↓
PATCH /api/tasks/:id/complete
    ↓
[DATABASE TRANSACTION START]
    ↓
1. Update Task
   - completed: true
   - completedAt: now()
    ↓
2. Fetch Member + Current Stage
    ↓
3. Check Stage Auto-Advance Rule
   IF stage.autoAdvanceType === "TASK_COMPLETED":
      ├─ Extract keyword: stage.autoAdvanceValue
      ├─ Check match: task.description.includes(keyword)
      └─ IF match:
         ├─ Get next stage (order + 1)
         ├─ IF next stage exists:
         │  └─ Recursively call MemberService.advanceStage()
         │     (Creates stage history, triggers automation)
         └─ ELSE (final stage):
            └─ Update member.status = INTEGRATED
    ↓
[TRANSACTION COMMIT]
    ↓
Return task + memberAdvanced info (if applicable)
    ↓
Frontend shows completion + optional stage advance
```

### Flow 4: Google Sheets Integration Sync

```
User clicks "Sync Now" on integration
    ↓
POST /api/integrations/:id/sync
    ↓
Create job in Bull queue
Return 202 Accepted + jobId
    ↓
[BACKGROUND WORKER]
    ↓
1. Fetch Google Sheet CSV
   - Convert /edit URL to /export?format=csv
   - HTTP GET with retry (3 attempts)
   - Validate response (200 OK, text/csv)
    ↓
2. Parse CSV
   - Detect headers (flexible matching)
   - Handle quoted fields
   - Extract: firstName, lastName, email, phone
   - Validate each row
    ↓
3. Deduplicate
   - Query existing members WHERE email IN (csvEmails)
   - Case-insensitive matching
   - Collect duplicates for report
   - Filter to only new members
    ↓
4. Batch Create Members
   [TRANSACTION START]
      ↓
      For each new member:
         ├─ Create Member
         │  - pathway: integration.targetPathway
         │  - currentStageId: integration.targetStageId
         │  - photoUrl: ui-avatars.com/api/...
         │
         ├─ Create Tags
         │  - "Sheet Import"
         │  - integration.sourceName
         │
         ├─ Create Note
         │  - "[System] Imported from {source} on {date}"
         │
         ├─ IF integration.autoWelcome:
         │  ├─ Create Message (status: QUEUED)
         │  └─ Queue email job
         │
         └─ IF integration.autoCreateTask:
            └─ Create Task (dueDate: tomorrow)
      ↓
   [TRANSACTION COMMIT]
    ↓
5. Update Integration
   - lastSync: now()
   - lastSyncStatus: "Success: imported {count}"
    ↓
6. Process Email Queue (if auto-welcome)
   - Background workers send emails
   - Update message status: QUEUED → SENT → DELIVERED
    ↓
Job completes
    ↓
Frontend polls GET /api/integrations/:id/sync/:jobId
Displays import summary
```

### Flow 5: AI Message Generation

```
User clicks "Smart Draft" in member detail
    ↓
POST /api/communications/generate-message
    ↓
Fetch member details + notes + messages + stage
    ↓
Construct AI prompt:
   "You are a church follow-up coordinator.
    Generate a warm, personal SMS (max 160 chars) for:
    - {firstName}, age {daysInStage} days in {stageName}
    - Pathway: {pathway}
    - Last contact: {daysSinceLastMessage} days ago
    - Notes: {recentNotes}"
    ↓
Call Gemini API (server-side)
    ↓
Parse AI response
    ↓
Return generated message
    ↓
Frontend populates message textarea
User can edit before sending
```

---

## Implementation Guide

### Step 1: Database Setup

```bash
# Install PostgreSQL 15+
brew install postgresql@15  # macOS
sudo apt install postgresql-15  # Ubuntu

# Start PostgreSQL
brew services start postgresql@15

# Create database
createdb pathways_tracker_dev

# Create production database
createdb pathways_tracker_prod
```

### Step 2: Backend Project Setup

```bash
# Create project directory
mkdir pathways-tracker-backend
cd pathways-tracker-backend

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express typescript ts-node @types/express @types/node
npm install prisma @prisma/client
npm install bcrypt jsonwebtoken @types/bcrypt @types/jsonwebtoken
npm install bull ioredis @types/bull
npm install @sendgrid/mail twilio
npm install @google/generative-ai
npm install zod cors helmet winston
npm install dotenv

# Install dev dependencies
npm install -D nodemon ts-node-dev

# Initialize TypeScript
npx tsc --init

# Initialize Prisma
npx prisma init
```

### Step 3: Configure Prisma

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ... paste complete schema from above
```

```bash
# Run migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

### Step 4: Environment Configuration

```env
# .env.development
NODE_ENV=development
PORT=4000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/pathways_tracker_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Frontend
FRONTEND_URL="http://localhost:3000"

# External APIs
SENDGRID_API_KEY="SG.xxx"
TWILIO_ACCOUNT_SID="ACxxx"
TWILIO_AUTH_TOKEN="xxx"
TWILIO_PHONE_NUMBER="+1234567890"
GEMINI_API_KEY="AIxxx"

# Google Sheets (OAuth)
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxx"

# File Storage
AWS_ACCESS_KEY_ID="xxx"
AWS_SECRET_ACCESS_KEY="xxx"
AWS_S3_BUCKET="pathways-tracker-uploads"

# Monitoring
SENTRY_DSN="https://xxx@sentry.io/xxx"
```

### Step 5: Project Structure

```
pathways-tracker-backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── queue.ts
│   │   └── permissions.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── permissions.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── logging.middleware.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   ├── members.routes.ts
│   │   ├── tasks.routes.ts
│   │   ├── stages.routes.ts
│   │   ├── automation.routes.ts
│   │   ├── communications.routes.ts
│   │   ├── settings.routes.ts
│   │   ├── integrations.routes.ts
│   │   ├── analytics.routes.ts
│   │   └── admin.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── member.service.ts
│   │   ├── task.service.ts
│   │   ├── automation.service.ts
│   │   ├── communication.service.ts
│   │   ├── ai.service.ts
│   │   ├── integration.service.ts
│   │   └── analytics.service.ts
│   ├── workers/
│   │   ├── email.worker.ts
│   │   ├── sms.worker.ts
│   │   ├── sync.worker.ts
│   │   └── auto-advance.worker.ts
│   ├── types/
│   │   ├── express.d.ts
│   │   └── models.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── validator.ts
│   │   └── helpers.ts
│   ├── index.ts
│   └── app.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
│   ├── unit/
│   └── integration/
├── .env
├── .env.example
├── tsconfig.json
├── package.json
└── README.md
```

### Step 6: Core Implementation

**6.1 Database Connection (`src/config/database.ts`)**

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

export default prisma;
```

**6.2 Authentication Middleware (`src/middleware/auth.middleware.ts`)**

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    role: string;
  };
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, tenantId: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

**6.3 RBAC Middleware (`src/middleware/permissions.middleware.ts`)**

```typescript
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export enum Permission {
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  MEMBER_VIEW = 'member:view',
  MEMBER_CREATE = 'member:create',
  MEMBER_UPDATE = 'member:update',
  MEMBER_DELETE = 'member:delete',
  MEMBER_VIEW_ALL = 'member:view_all',
  // ... all 40+ permissions
}

export const RolePermissions: Record<string, Permission[]> = {
  SUPER_ADMIN: Object.values(Permission),
  ADMIN: [
    Permission.USER_VIEW,
    Permission.MEMBER_VIEW_ALL,
    Permission.MEMBER_CREATE,
    Permission.MEMBER_UPDATE,
    Permission.MEMBER_DELETE,
    // ... all admin permissions
  ],
  TEAM_LEADER: [
    Permission.MEMBER_VIEW_ALL,
    Permission.MEMBER_CREATE,
    Permission.MEMBER_UPDATE,
    // ... team leader permissions
  ],
  VOLUNTEER: [
    Permission.MEMBER_VIEW,
    Permission.MEMBER_CREATE,
    Permission.MEMBER_UPDATE,
    // ... volunteer permissions
  ],
};

export function requirePermission(permission: Permission) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userPermissions = RolePermissions[req.user!.role] || [];

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: permission,
      });
    }

    next();
  };
}
```

**6.4 Auth Service (`src/services/auth.service.ts`)**

```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

export async function registerUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantId: string;
}) {
  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      ...data,
      passwordHash,
      role: 'VOLUNTEER',
      avatar: `https://ui-avatars.com/api/?name=${data.firstName}+${data.lastName}`,
    },
  });

  // Generate tokens
  const accessToken = jwt.sign(
    { userId: user.id, tenantId: user.tenantId },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { user, accessToken, refreshToken };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findFirst({
    where: { email, isActive: true },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid credentials');
  }

  // Generate tokens (same as registerUser)
  // ...

  return { user, accessToken, refreshToken };
}
```

**6.5 Member Service with Automation (`src/services/member.service.ts`)**

```typescript
import prisma from '../config/database';

export async function advanceStage(
  memberId: string,
  toStageId: string,
  userId: string,
  reason?: string
) {
  return await prisma.$transaction(async (tx) => {
    // Get member and current stage
    const member = await tx.member.findUnique({
      where: { id: memberId },
      include: { currentStage: true },
    });

    if (!member) throw new Error('Member not found');

    // Create stage history
    await tx.stageHistory.create({
      data: {
        memberId,
        fromStageId: member.currentStageId,
        toStageId,
        changedBy: userId,
        reason: reason || 'Manual advance',
      },
    });

    // Update member
    const updatedMember = await tx.member.update({
      where: { id: memberId },
      data: {
        currentStageId: toStageId,
        lastStageChangeDate: new Date(),
      },
    });

    // Create system note
    await tx.note.create({
      data: {
        memberId,
        content: `[System] Advanced from ${member.currentStage.name} to new stage`,
        isSystem: true,
      },
    });

    // Check automation rules
    const rules = await tx.automationRule.findMany({
      where: {
        stageId: toStageId,
        enabled: true,
      },
    });

    const createdTasks = [];
    for (const rule of rules) {
      const task = await tx.task.create({
        data: {
          tenantId: member.tenantId,
          memberId,
          description: rule.taskDescription,
          dueDate: new Date(Date.now() + rule.daysDue * 24 * 60 * 60 * 1000),
          priority: rule.priority,
          assignedToId: member.assignedToId || userId,
          createdById: userId,
          createdByRule: true,
          automationRuleId: rule.id,
        },
      });

      createdTasks.push(task);

      await tx.note.create({
        data: {
          memberId,
          content: `[System] Auto-created task: ${rule.taskDescription}`,
          isSystem: true,
        },
      });
    }

    return { member: updatedMember, createdTasks };
  });
}
```

### Step 7: Start Development Server

```bash
# Start Redis
redis-server

# Start PostgreSQL (if not running)
brew services start postgresql@15

# Run database migrations
npx prisma migrate dev

# Start backend
npm run dev
```

---

## Security Considerations

### 1. Authentication Security

- **Password Hashing:** bcrypt with 10 rounds
- **JWT Secrets:** Strong, random secrets (32+ characters)
- **Token Expiry:** Short access tokens (15min), longer refresh tokens (7 days)
- **Token Rotation:** Refresh tokens rotated on each refresh
- **Revocation:** Refresh tokens stored in DB, can be revoked

### 2. Authorization Security

- **RBAC Enforcement:** Every endpoint checks permissions
- **Ownership Validation:** Users can only access resources they own or have `view_all` permission
- **Multi-Tenant Isolation:** All queries filtered by `tenantId`
- **Role Hierarchy:** Cannot change own role, cannot delete own account

### 3. Data Security

- **SQL Injection:** Prevented by Prisma ORM (parameterized queries)
- **Input Validation:** Zod schemas on all request bodies
- **Output Sanitization:** HTML escaped in responses
- **Rate Limiting:** 100 requests/15min per IP
- **CORS:** Restricted to `FRONTEND_URL` only

### 4. API Security

- **HTTPS Only:** Force SSL in production
- **Helmet.js:** Security headers (CSP, XSS protection)
- **Request Logging:** All requests logged with `requestId`
- **Error Masking:** Internal errors never exposed to client
- **Webhook Verification:** Twilio/SendGrid webhooks verified by signature

### 5. Sensitive Data Handling

- **API Keys:** Server-side only, never in frontend
- **PII Encryption:** Consider encrypting email/phone at rest
- **Audit Logs:** All RBAC actions logged in `AuditLog`
- **GDPR Compliance:** Data export and deletion endpoints

---

## Performance & Scaling

### Database Optimization

**Indexes:**
- All foreign keys indexed
- Composite indexes on common query patterns:
  - `[tenantId, pathway, status]` for member filtering
  - `[assignedToId, completed]` for task filtering
  - `[dueDate, completed]` for overdue tasks

**Query Optimization:**
- Use `select` to limit fields returned
- Use `include` sparingly (prefer separate queries)
- Implement cursor-based pagination for large lists
- Use database connection pooling (Prisma default: 10 connections)

**Scaling:**
- Read replicas for analytics queries
- Partitioning by `tenantId` for large deployments
- Archive old data (messages > 1 year, logs > 90 days)

### Caching Strategy

**Redis Caching:**
- Church settings: 1 hour TTL
- Stages: 1 hour TTL (invalidate on update)
- User permissions: 15 minutes TTL
- Analytics: 5 minutes TTL

**HTTP Caching:**
- Static assets: 1 year Cache-Control
- API responses: No caching (real-time data)

### Background Job Performance

**Queue Priorities:**
- HIGH: Transactional emails, user-triggered SMS
- NORMAL: Welcome emails, scheduled reports
- LOW: Analytics aggregations, cleanups

**Concurrency:**
- Email worker: 5 concurrent jobs
- SMS worker: 3 concurrent jobs (rate limit)
- Sync worker: 2 concurrent jobs

**Monitoring:**
- Job failure alerts (Slack/email)
- Queue length monitoring (Redis Commander)
- Performance metrics (Datadog/New Relic)

### Horizontal Scaling

- **Stateless API:** Can run multiple backend instances
- **Load Balancer:** Nginx or AWS ALB
- **Session Storage:** Redis (shared across instances)
- **File Storage:** S3 (shared storage)

---

## Appendices

### Appendix A: Migration from Mock Data

**Step-by-step migration plan:**

1. **Backend Setup (Week 1)**
   - Set up PostgreSQL database
   - Run Prisma migrations
   - Implement authentication endpoints
   - Deploy to staging

2. **Frontend Integration (Week 2)**
   - Create `apiClient.ts` with axios
   - Replace mock auth with real API calls
   - Test JWT flow (login, refresh, logout)

3. **Data Migration (Week 3)**
   - Export mock data to JSON
   - Write seed script to import into PostgreSQL
   - Test data integrity

4. **Feature Parity (Week 4-6)**
   - Replace members CRUD with API calls
   - Replace tasks CRUD with API calls
   - Implement automation logic
   - Connect communication services

5. **Testing & Launch (Week 7-8)**
   - End-to-end testing
   - Performance testing
   - Security audit
   - Production deployment

### Appendix B: Deployment Checklist

**Pre-Deployment:**
- [ ] Generate strong JWT secrets (`openssl rand -base64 32`)
- [ ] Set up production PostgreSQL database
- [ ] Configure SendGrid API key
- [ ] Configure Twilio credentials
- [ ] Set up AWS S3 bucket
- [ ] Configure Gemini API key
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (SSL certificate)
- [ ] Set up monitoring (Sentry, Datadog)
- [ ] Configure backup strategy (daily DB backups)

**Post-Deployment:**
- [ ] Run database migrations
- [ ] Seed initial tenant (first church)
- [ ] Create super admin user
- [ ] Test all endpoints
- [ ] Monitor error rates
- [ ] Set up alerts (email/Slack)

### Appendix C: API Testing with Postman

**Sample Postman Collection:**

```json
{
  "info": {
    "name": "Pathways Tracker API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/auth/register",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"admin@church.org\",\n  \"password\": \"SecurePassword123!\",\n  \"firstName\": \"John\",\n  \"lastName\": \"Admin\"\n}"
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/auth/login",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"admin@church.org\",\n  \"password\": \"SecurePassword123!\"\n}"
            }
          }
        }
      ]
    }
  ]
}
```

### Appendix D: Database ERD (Mermaid Diagram)

```mermaid
erDiagram
    Tenant ||--o{ User : has
    Tenant ||--o{ Member : has
    Tenant ||--o{ Stage : has
    Tenant ||--o{ Task : has
    Tenant ||--|| ChurchSettings : has

    User ||--o{ Member : "assigned to"
    User ||--o{ Task : "assigned to"
    User ||--o{ RefreshToken : has

    Member ||--o{ Task : has
    Member ||--o{ Note : has
    Member ||--o{ Message : has
    Member ||--o{ Resource : has
    Member ||--o{ MemberTag : has
    Member ||--o{ StageHistory : has
    Member }o--|| Stage : "current stage"
    Member }o--o| Family : "belongs to"

    Stage ||--o{ AutomationRule : has
    Stage ||--o{ Member : "current members"

    ChurchSettings ||--o{ ServiceTime : has
```

---

## Conclusion

This comprehensive design provides a production-ready foundation for the Pathways Tracker backend. The PostgreSQL database schema supports complex relationships, the REST API follows industry best practices, and the architecture scales to support multiple churches.

### Next Steps

1. **Review & Approve:** Stakeholder review of this design
2. **Setup Development Environment:** Follow implementation guide
3. **Implement Core Features:** Start with authentication and members
4. **Integrate Frontend:** Replace mock data with API calls
5. **Testing:** Unit tests, integration tests, end-to-end tests
6. **Deploy:** Staging environment, then production
7. **Monitor & Iterate:** Collect metrics, optimize based on usage

### Support & Documentation

- **API Documentation:** Generate with Swagger/OpenAPI
- **Database Documentation:** Auto-generate from Prisma schema
- **Developer Guide:** Onboarding docs for new team members
- **Runbooks:** Operational procedures for common tasks

---

**Document Revision History:**

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-21 | Initial comprehensive design | System Architecture Team |

**End of Document**
