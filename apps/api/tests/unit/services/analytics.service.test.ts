import analyticsService from '../../../src/services/analytics.service';
import { testHelpers } from '../../helpers';

describe('AnalyticsService', () => {
  let tenantId: string;
  let userId: string;
  let stageId: string;

  beforeEach(async () => {
    const tenant = await testHelpers.createTestTenant();
    tenantId = tenant.id;
    const user = await testHelpers.createTestUser(tenantId);
    userId = user.id;
    const stage = await testHelpers.createTestStage(tenantId, 'NEWCOMER', 0);
    stageId = stage.id;
  });

  afterEach(async () => {
    if (tenantId) {
      await testHelpers.cleanupTestData(tenantId);
    }
  });

  afterAll(async () => {
    await testHelpers.disconnect();
  });

  describe('getOverview', () => {
    it('should return analytics overview', async () => {
      await testHelpers.createTestMember(tenantId, stageId, userId);
      await testHelpers.createTestMember(tenantId, stageId, userId);

      const overview = await analyticsService.getOverview(tenantId);
      expect(overview.members.total).toBeGreaterThanOrEqual(2);
      expect(overview.tasks.total).toBeDefined();
      expect(overview.tasks.completed).toBeDefined();
      expect(overview.members.active).toBeDefined();
    });
  });

  describe('getMemberAnalytics', () => {
    it('should return member analytics', async () => {
      await testHelpers.createTestMember(tenantId, stageId, userId, { status: 'ACTIVE' });
      await testHelpers.createTestMember(tenantId, stageId, userId, { status: 'INACTIVE' });

      const analytics = await analyticsService.getMemberAnalytics(tenantId);
      expect(analytics.byStatus).toBeDefined();
      expect(analytics.byStage).toBeDefined();
      expect(analytics.byStatus.find((s: any) => s.status === 'ACTIVE')).toBeDefined();
    });
  });

  describe('getTaskAnalytics', () => {
    it('should return task analytics', async () => {
      const member = await testHelpers.createTestMember(tenantId, stageId, userId);
      await testHelpers.createTestTask(tenantId, member.id, userId, userId);

      const analytics = await analyticsService.getTaskAnalytics(tenantId);
      expect(analytics.byPriority).toBeDefined();
      expect(analytics.summary.completionRate).toBeDefined();
    });
  });

  describe('exportData', () => {
    it('should export members as CSV', async () => {
      await testHelpers.createTestMember(tenantId, stageId, userId);

      const csv = await analyticsService.exportData(tenantId, 'members');
      expect(csv).toContain('firstName');
      expect(csv).toContain('lastName');
      expect(csv).toContain('email');
    });

    it('should export tasks as CSV', async () => {
      const member = await testHelpers.createTestMember(tenantId, stageId, userId);
      await testHelpers.createTestTask(tenantId, member.id, userId, userId);

      const csv = await analyticsService.exportData(tenantId, 'tasks');
      expect(csv).toContain('description');
      expect(csv).toContain('dueDate');
      expect(csv).toContain('priority');
    });
  });
});
