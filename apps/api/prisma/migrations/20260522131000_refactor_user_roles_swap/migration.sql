-- ============================================================
-- Migration: refactor_user_roles_swap  (part 2 of 2)
-- 2026-05-22
-- ============================================================


-- ── Step 1: Migrate row data to new role values ────────────────────────────

UPDATE "User" SET "role" = 'CHURCH_ADMIN'    WHERE "role" = 'ADMIN';
UPDATE "User" SET "role" = 'PASTOR'          WHERE "role" = 'TEAM_LEADER';
UPDATE "User" SET "role" = 'MINISTRY_LEADER' WHERE "role" = 'INTEGRATION_TEAM_ADMIN';
UPDATE "User" SET "role" = 'MINISTRY_LEADER' WHERE "role" = 'MINISTRY_LEAD';
UPDATE "User" SET "role" = 'VOLUNTEER'       WHERE "role" = 'INTEGRATION_TEAM_MEMBER';

UPDATE "Invitation" SET "role" = 'CHURCH_ADMIN'    WHERE "role" = 'ADMIN';
UPDATE "Invitation" SET "role" = 'PASTOR'          WHERE "role" = 'TEAM_LEADER';
UPDATE "Invitation" SET "role" = 'MINISTRY_LEADER' WHERE "role" = 'INTEGRATION_TEAM_ADMIN';
UPDATE "Invitation" SET "role" = 'MINISTRY_LEADER' WHERE "role" = 'MINISTRY_LEAD';
UPDATE "Invitation" SET "role" = 'VOLUNTEER'       WHERE "role" = 'INTEGRATION_TEAM_MEMBER';


-- ── Step 2: Swap the enum type ─────────────────────────────────────────────

CREATE TYPE "UserRole_new" AS ENUM (
  'VOLUNTEER',
  'SUPER_ADMIN',
  'SYSTEM_ADMIN',
  'SYSTEM_MONITOR',
  'CHURCH_ADMIN',
  'PASTOR',
  'MINISTRY_LEADER'
);

-- Must drop the column default before altering its type; PostgreSQL cannot
-- automatically cast the old default expression to the new enum type.
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "UserRole_new"
    USING "role"::text::"UserRole_new";

ALTER TABLE "Invitation"
  ALTER COLUMN "role" TYPE "UserRole_new"
    USING "role"::text::"UserRole_new";

DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";


-- ── Step 3: Restore column default ────────────────────────────────────────
ALTER TABLE "User"
  ALTER COLUMN "role" SET DEFAULT 'VOLUNTEER'::"UserRole";
