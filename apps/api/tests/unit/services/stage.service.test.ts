import stageService from '../../../src/services/stage.service';
import { testHelpers } from '../../helpers';
import { AppError } from '../../../src/middleware/error.middleware';

describe('StageService', () => {
  let tenantId: string;

  beforeEach(async () => {
    const tenant = await testHelpers.createTestTenant();
    tenantId = tenant.id;
  });

  afterEach(async () => {
    if (tenantId) {
      await testHelpers.cleanupTestData(tenantId);
    }
  });

  afterAll(async () => {
    await testHelpers.disconnect();
  });

  describe('getStages', () => {
    it('should return all stages for a pathway', async () => {
      await testHelpers.createTestStage(tenantId, 'NEWCOMER', 0);
      await testHelpers.createTestStage(tenantId, 'NEWCOMER', 1);
      await testHelpers.createTestStage(tenantId, 'NEW_BELIEVER', 0);

      const newcomerStages = await stageService.getStages(tenantId, 'NEWCOMER');
      expect(newcomerStages.length).toBe(2);
      newcomerStages.forEach((stage: any) => {
        expect(stage.pathway).toBe('NEWCOMER');
      });
    });

    it('should return stages in correct order', async () => {
      await testHelpers.createTestStage(tenantId, 'NEWCOMER', 2);
      await testHelpers.createTestStage(tenantId, 'NEWCOMER', 0);
      await testHelpers.createTestStage(tenantId, 'NEWCOMER', 1);

      const stages = await stageService.getStages(tenantId, 'NEWCOMER');
      expect(stages[0].order).toBe(0);
      expect(stages[1].order).toBe(1);
      expect(stages[2].order).toBe(2);
    });
  });

  describe('createStage', () => {
    it('should create a new stage', async () => {
      const stageData = {
        tenantId,
        pathway: 'NEWCOMER' as const,
        name: 'Welcome Stage',
        description: 'Initial welcome stage',
        order: 0,
      };

      const stage = await stageService.createStage(stageData);
      expect(stage.name).toBe('Welcome Stage');
      expect(stage.pathway).toBe('NEWCOMER');
      expect(stage.order).toBe(0);
    });

    it('should handle auto-advance configuration', async () => {
      const stageData = {
        tenantId,
        pathway: 'NEWCOMER' as const,
        name: 'Auto Stage',
        description: 'Stage with auto-advance',
        order: 0,
        autoAdvanceEnabled: true,
        autoAdvanceType: 'TIME_IN_STAGE' as const,
        autoAdvanceValue: '7',
      };

      const stage = await stageService.createStage(stageData);
      expect(stage.autoAdvanceEnabled).toBe(true);
      expect(stage.autoAdvanceType).toBe('TIME_IN_STAGE');
      expect(stage.autoAdvanceValue).toBe('7');
    });
  });

  describe('updateStage', () => {
    it('should update stage details', async () => {
      const stage = await testHelpers.createTestStage(tenantId, 'NEWCOMER', 0);

      const updated = await stageService.updateStage(stage.id, tenantId, {
        name: 'Updated Name',
        description: 'Updated description',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Updated description');
    });

    it('should throw error if stage not found', async () => {
      await expect(
        stageService.updateStage('nonexistent-id', tenantId, { name: 'Test' })
      ).rejects.toThrow(AppError);
    });
  });

  describe('deleteStage', () => {
    it('should delete a stage and normalize orders', async () => {
      const stage1 = await testHelpers.createTestStage(tenantId, 'NEWCOMER', 0);
      const stage2 = await testHelpers.createTestStage(tenantId, 'NEWCOMER', 1);
      const stage3 = await testHelpers.createTestStage(tenantId, 'NEWCOMER', 2);

      // Delete middle stage
      const result = await stageService.deleteStage(stage2.id, tenantId);
      expect(result.message).toContain("deleted").toBe(true);

      // Check remaining stages are renumbered
      const remaining = await stageService.getStages(tenantId, 'NEWCOMER');
      expect(remaining.length).toBe(2);
      expect(remaining[0].order).toBe(0);
      expect(remaining[1].order).toBe(1);
    });

    it('should prevent deletion if stage has members', async () => {
      const stage = await testHelpers.createTestStage(tenantId, 'NEWCOMER', 0);
      const user = await testHelpers.createTestUser(tenantId);
      await testHelpers.createTestMember(tenantId, stage.id, user.id);

      await expect(
        stageService.deleteStage(stage.id, tenantId)
      ).rejects.toThrow(AppError);
    });
  });

  describe('reorderStages', () => {
    it('should reorder stages correctly', async () => {
      const stage1 = await testHelpers.createTestStage(tenantId, 'NEWCOMER', 0);
      const stage2 = await testHelpers.createTestStage(tenantId, 'NEWCOMER', 1);
      const stage3 = await testHelpers.createTestStage(tenantId, 'NEWCOMER', 2);

      // Move stage3 to position 0
      await stageService.reorderStages(tenantId, 'NEWCOMER', [
        { stageId: stage3.id, order: 0 },
        { stageId: stage1.id, order: 1 },
        { stageId: stage2.id, order: 2 },
      ]);

      const stages = await stageService.getStages(tenantId, 'NEWCOMER');
      expect(stages[0].id).toBe(stage3.id);
      expect(stages[1].id).toBe(stage1.id);
      expect(stages[2].id).toBe(stage2.id);
    });
  });
});
