-- Migration: Fix StageHistory FK cascades + seed default stages for stageless tenants
-- 2026-05-21

-- ============================================================
-- 1. Fix StageHistory foreign key constraints
-- ============================================================

ALTER TABLE "StageHistory" DROP CONSTRAINT IF EXISTS "StageHistory_fromStageId_fkey";
ALTER TABLE "StageHistory" DROP CONSTRAINT IF EXISTS "StageHistory_toStageId_fkey";

-- fromStageId → SET NULL  (preserve history, just lose the stale "from" reference)
ALTER TABLE "StageHistory"
    ADD CONSTRAINT "StageHistory_fromStageId_fkey"
    FOREIGN KEY ("fromStageId") REFERENCES "Stage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- toStageId → CASCADE  (destination stage gone → history entry is no longer meaningful)
ALTER TABLE "StageHistory"
    ADD CONSTRAINT "StageHistory_toStageId_fkey"
    FOREIGN KEY ("toStageId") REFERENCES "Stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- 2. Seed default stages for every tenant that currently has none
-- ============================================================

DO $$
DECLARE
    tenant_rec RECORD;
BEGIN
    FOR tenant_rec IN
        SELECT t.id
        FROM "Tenant" t
        WHERE NOT EXISTS (SELECT 1 FROM "Stage" s WHERE s."tenantId" = t.id)
    LOOP
        -- NEWCOMER stages
        INSERT INTO "Stage" (id, "tenantId", pathway, name, description, "order", "autoAdvanceEnabled", "createdAt", "updatedAt")
        VALUES
            (gen_random_uuid(), tenant_rec.id, 'NEWCOMER', 'First Visit',    'Person attended for the first time',                1, false, NOW(), NOW()),
            (gen_random_uuid(), tenant_rec.id, 'NEWCOMER', 'Welcome Call',   'Initial follow-up call or message made',            2, false, NOW(), NOW()),
            (gen_random_uuid(), tenant_rec.id, 'NEWCOMER', 'Newcomer Lunch', 'Attended the newcomers lunch event',                3, false, NOW(), NOW()),
            (gen_random_uuid(), tenant_rec.id, 'NEWCOMER', 'Connect Group',  'Joined a small group or connect group',             4, false, NOW(), NOW()),
            (gen_random_uuid(), tenant_rec.id, 'NEWCOMER', 'Growth Track',   'Completed membership or growth class',              5, false, NOW(), NOW()),
            (gen_random_uuid(), tenant_rec.id, 'NEWCOMER', 'Serving',        'Actively serving in a ministry role',               6, false, NOW(), NOW()),
            (gen_random_uuid(), tenant_rec.id, 'NEWCOMER', 'Integrated',     'Fully integrated into the church community',        7, false, NOW(), NOW()),
            -- NEW_BELIEVER stages
            (gen_random_uuid(), tenant_rec.id, 'NEW_BELIEVER', 'Decision Made',  'Made a decision to follow Christ',              1, false, NOW(), NOW()),
            (gen_random_uuid(), tenant_rec.id, 'NEW_BELIEVER', 'Foundations',    'Completing new believer foundations course',    2, false, NOW(), NOW()),
            (gen_random_uuid(), tenant_rec.id, 'NEW_BELIEVER', 'Baptism',        'Preparing for or completed water baptism',      3, false, NOW(), NOW()),
            (gen_random_uuid(), tenant_rec.id, 'NEW_BELIEVER', 'Discipleship',   'In active one-on-one discipleship',             4, false, NOW(), NOW()),
            (gen_random_uuid(), tenant_rec.id, 'NEW_BELIEVER', 'Integrated',     'Fully integrated into the church community',    5, false, NOW(), NOW())
        ON CONFLICT ("tenantId", pathway, "order") DO NOTHING;
    END LOOP;
END $$;
