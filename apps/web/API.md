
# Pathway Tracker API Specification

This document outlines the architecture, data models, and endpoints required to build a fully functional backend for the Pathway Tracker application.

## 🏗 Recommended Stack

*   **Runtime:** Node.js (v18+)
*   **Framework:** Express.js, NestJS, or Fastify
*   **Database:** PostgreSQL (Relational integrity is crucial for Members <-> Tasks <-> Stages)
*   **ORM:** Prisma or TypeORM
*   **Authentication:** JWT (JSON Web Tokens) with Passport.js or Firebase Auth
*   **AI Integration:** Google GenAI SDK (Server-side)
*   **Email/SMS:** SendGrid (Email) and Twilio (SMS)

---

## 💾 Database Schema (Prisma Pseudo-code)

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // Hashed
  role      String   // 'ADMIN' | 'VOLUNTEER'
  firstName String
  lastName  String
  tasks     Task[]
}

model Member {
  id             String        @id @default(uuid())
  firstName      String
  lastName       String
  email          String?
  phone          String?
  photoUrl       String?
  pathway        String        // 'NEWCOMER' | 'NEW_BELIEVER'
  currentStageId String
  status         String        // 'ACTIVE' | 'INTEGRATED' | 'INACTIVE'
  joinedDate     DateTime      @default(now())
  assignedToId   String?       // Foreign Key to User
  tags           String[]
  notes          String[]      // or separate Note model
  messageLog     MessageLog[]
  resources      Resource[]
  tasks          Task[]
}

model MessageLog {
  id        String   @id @default(uuid())
  memberId  String
  channel   String   // 'SMS' | 'EMAIL'
  direction String   // 'INBOUND' | 'OUTBOUND'
  content   String
  timestamp DateTime @default(now())
  sentBy    String?
  member    Member   @relation(fields: [memberId], references: [id])
}

model Task {
  id           String   @id @default(uuid())
  description  String
  dueDate      DateTime
  priority     String   // 'LOW' | 'MEDIUM' | 'HIGH'
  completed    Boolean  @default(false)
  memberId     String
  assignedToId String
  member       Member   @relation(fields: [memberId], references: [id])
  user         User     @relation(fields: [assignedToId], references: [id])
}

model Stage {
  id      String @id
  pathway String // 'NEWCOMER' | 'NEW_BELIEVER'
  name    String
  order   Int
}

model AutomationRule {
  id              String  @id @default(uuid())
  triggerStageId  String
  taskDescription String
  daysDue         Int
  priority        String
  enabled         Boolean @default(true)
}

model IntegrationConfig {
  id             String   @id @default(uuid())
  sourceName     String
  sheetUrl       String
  targetPathway  String
  targetStageId  String
  autoCreateTask Boolean
  lastSync       DateTime?
}
```

---

## 🔌 API Endpoints

### 1. Authentication
*   `POST /api/auth/login`: Authenticate user and return JWT.
*   `GET /api/auth/me`: Return current user profile based on JWT.

### 2. Members
*   `GET /api/members`: Retrieve paginated list. Supports filters:
    *   `?pathway=NEWCOMER`
    *   `?status=ACTIVE`
    *   `?search=John`
*   `GET /api/members/:id`: Get full details (including logs, resources).
*   `POST /api/members`: Create a new member.
*   `POST /api/members/batch`: Batch create members (used by CSV import).
*   `PUT /api/members/:id`: Update details, move stages, or change status.
    *   *Trigger Logic:* If `currentStageId` changes, backend should check `AutomationRule` table and auto-create Tasks if applicable.
*   `DELETE /api/members/:id`: Soft delete or archive member.

### 3. Member Sub-Resources
*   `POST /api/members/:id/notes`: Add a note.
*   `POST /api/members/:id/resources`: Add a resource link.
*   `DELETE /api/members/:id/resources/:resourceId`: Remove a resource.

### 4. Communication & AI
*   `POST /api/communications/send`: Send SMS/Email.
    *   **Payload:** `{ memberId, channel, content, subject? }`
    *   **Logic:** Integrates with Twilio/SendGrid, then saves entry to `MessageLog` table.
*   `POST /api/ai/generate-draft`: Generate message content.
    *   **Payload:** `{ memberId, context }`
    *   **Logic:** Calls Gemini API server-side using the secure API Key.
*   `POST /api/ai/analyze`: Generate journey analysis.
    *   **Payload:** `{ memberId }`
    *   **Logic:** Aggregates member notes/history and calls Gemini API.

### 5. Tasks
*   `GET /api/tasks`: Get tasks for the logged-in user or all users (Admin).
    *   Filters: `?completed=false`, `?dueDate=today`
*   `POST /api/tasks`: Manually create a task.
*   `PATCH /api/tasks/:id`: Toggle completion status or edit details.
*   `DELETE /api/tasks/:id`: Delete a task.

### 6. Settings & Configuration
*   `GET /api/settings/stages`: Get configured stages.
*   `PUT /api/settings/stages`: Reorder or rename stages.
*   `GET /api/settings/automation-rules`: Get rules.
*   `POST /api/settings/automation-rules`: Create a rule.
*   `GET /api/settings/integrations`: Get Google Sheet configs.
*   `POST /api/settings/integrations/sync/:id`: Trigger a server-side sync of a specific Google Sheet.
    *   **Logic:** Backend fetches CSV, parses, duplicates check, and inserts new Members.

---

## 🚀 Implementation Guide

### Step 1: Backend Setup
1.  Initialize a Node.js project.
2.  Setup Prisma with PostgreSQL.
3.  Create the schema based on the model above.
4.  Run migrations: `npx prisma migrate dev`.

### Step 2: Gemini AI Integration (Server-side)
Move the logic from `services/geminiService.ts` to the backend controller.
*   **Security:** The `API_KEY` will reside in the backend `.env` file, never exposed to the client.
*   **Prompt Engineering:** The backend constructs the prompt context using data fetched directly from the database (ensuring the AI has the most up-to-date member notes).

### Step 3: Frontend Refactor
1.  Replace `MOCK_MEMBERS` and `MOCK_TASKS` in `App.tsx` with `useEffect` hooks fetching from `/api/members` and `/api/tasks`.
2.  Update `geminiService.ts` to call `axios.post('/api/ai/...')` instead of using the Google GenAI SDK directly.
3.  Update `communicationService.ts` to call `/api/communications/send`.
