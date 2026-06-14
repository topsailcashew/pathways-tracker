-- ============================================================
-- Migration: refactor_user_roles  (part 1 of 2)
-- 2026-05-22
--
-- Adds MINISTRY_LEADER to the existing enum so it can be referenced
-- in the data-migration step that follows (part 2).
-- PostgreSQL requires ADD VALUE to commit before the new label
-- can be used in DML, hence the two-migration split.
-- ============================================================

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'MINISTRY_LEADER';
