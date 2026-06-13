-- ============================================================
-- Migration: add_approval_requests_and_soft_delete
-- 2026-05-22
--
-- Changes:
--   1. New UserRole enum values (SYSTEM_ADMIN, SYSTEM_MONITOR,
--      CHURCH_ADMIN, PASTOR, MINISTRY_LEAD)
--   2. ServeTeam: deleted_at (soft delete) + parent_team_id (nesting)
--   3. New enums: ApprovalStatus, ApprovalActionType
--   4. New table: approval_requests
-- ============================================================


-- ── 1. New UserRole enum values ────────────────────────────────────────────
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SYSTEM_ADMIN';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SYSTEM_MONITOR';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CHURCH_ADMIN';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PASTOR';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'MINISTRY_LEAD';


-- ── 2. ServeTeam: soft delete + parent nesting ─────────────────────────────

-- 2a. Soft-delete timestamp (NULL = live, non-NULL = trashed)
ALTER TABLE "ServeTeam"
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Index used by all list queries: WHERE "tenantId" = $1 AND "deletedAt" IS NULL
CREATE INDEX IF NOT EXISTS "ServeTeam_tenantId_deletedAt_idx"
  ON "ServeTeam"("tenantId", "deletedAt");

-- 2b. Self-referential parent for sub-team nesting
ALTER TABLE "ServeTeam"
  ADD COLUMN IF NOT EXISTS "parentTeamId" TEXT;

ALTER TABLE "ServeTeam"
  ADD CONSTRAINT "ServeTeam_parentTeamId_fkey"
    FOREIGN KEY ("parentTeamId")
    REFERENCES "ServeTeam"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "ServeTeam_parentTeamId_idx"
  ON "ServeTeam"("parentTeamId");


-- ── 3. New enums ───────────────────────────────────────────────────────────

CREATE TYPE "ApprovalStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED'
);

CREATE TYPE "ApprovalActionType" AS ENUM (
  'SERVE_TEAM_CREATE',
  'SERVE_TEAM_UPDATE',
  'SERVE_TEAM_DELETE',
  'TEAM_MEMBER_ADD',
  'TEAM_MEMBER_REMOVE',
  'TEAM_MEMBER_ROLE_CHANGE',
  'INVITATION_CREATE',
  'OTHER'
);


-- ── 4. approval_requests table ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ApprovalRequest" (
  "id"            TEXT        NOT NULL,
  "tenantId"      TEXT        NOT NULL,
  "monitorId"     TEXT        NOT NULL,   -- SYSTEM_MONITOR who queued the action
  "actionType"    "ApprovalActionType" NOT NULL,
  "payload"       JSONB       NOT NULL,   -- full request body, replayed on approval
  "status"        "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "resolvedBy"    TEXT,                   -- SYSTEM_ADMIN who approved/rejected
  "resolvedAt"    TIMESTAMP(3),
  "resolverNote"  TEXT,
  "targetTeamId"  TEXT,                   -- optional FK to the affected ServeTeam
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id"),

  CONSTRAINT "ApprovalRequest_tenantId_fkey"
    FOREIGN KEY ("tenantId")
    REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "ApprovalRequest_monitorId_fkey"
    FOREIGN KEY ("monitorId")
    REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "ApprovalRequest_resolvedBy_fkey"
    FOREIGN KEY ("resolvedBy")
    REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT "ApprovalRequest_targetTeamId_fkey"
    FOREIGN KEY ("targetTeamId")
    REFERENCES "ServeTeam"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

-- Indexes for common access patterns
CREATE INDEX IF NOT EXISTS "ApprovalRequest_tenantId_status_idx"
  ON "ApprovalRequest"("tenantId", "status");

CREATE INDEX IF NOT EXISTS "ApprovalRequest_monitorId_status_idx"
  ON "ApprovalRequest"("monitorId", "status");

-- Dashboard query: recent pending items sorted newest-first
CREATE INDEX IF NOT EXISTS "ApprovalRequest_status_createdAt_idx"
  ON "ApprovalRequest"("status", "createdAt" DESC);


-- ── 5. Auto-update updatedAt for approval_requests ─────────────────────────
-- PostgreSQL doesn't auto-update updatedAt; use a trigger.

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "ApprovalRequest_set_updated_at" ON "ApprovalRequest";

CREATE TRIGGER "ApprovalRequest_set_updated_at"
  BEFORE UPDATE ON "ApprovalRequest"
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
