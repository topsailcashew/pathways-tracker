-- Migration: Add Invitation model
-- 2026-05-22

CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

CREATE TABLE "Invitation" (
    "id"              TEXT        NOT NULL,
    "tenantId"        TEXT        NOT NULL,
    "invitedByUserId" TEXT        NOT NULL,
    "invitedEmail"    TEXT,
    "role"            "UserRole"  NOT NULL,
    "token"           TEXT        NOT NULL,
    "status"          "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt"       TIMESTAMP(3) NOT NULL,
    "acceptedAt"      TIMESTAMP(3),
    "acceptedByEmail" TEXT,
    "note"            TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "Invitation_token_key"     ON "Invitation"("token");
CREATE        INDEX "Invitation_tenantId_idx"  ON "Invitation"("tenantId");
CREATE        INDEX "Invitation_token_idx"     ON "Invitation"("token");
CREATE        INDEX "Invitation_tenantId_status_idx" ON "Invitation"("tenantId", "status");

-- Foreign keys
ALTER TABLE "Invitation"
    ADD CONSTRAINT "Invitation_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Invitation"
    ADD CONSTRAINT "Invitation_invitedByUserId_fkey"
    FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
