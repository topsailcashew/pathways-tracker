import request from 'supertest';
import app from '../../src/app';
import { testHelpers } from '../helpers';
import { sign } from 'jsonwebtoken';

describe('Stages Routes', () => {
  let tenantId: string;
  let adminUser: any;
  let authToken: string;

  beforeEach(async () => {
    const tenant = await testHelpers.createTestTenant();
    tenantId = tenant.id;
    adminUser = await testHelpers.createTestUser(tenantId, { role: 'ADMIN' });

    authToken = sign(
      { userId: adminUser.id, tenantId, email: adminUser.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
  });

  afterEach(async () => {
    if (tenantId) {
      await testHelpers.cleanupTestData(tenantId);
    }
  });

  afterAll(async () => {
    await testHelpers.disconnect();
  });

  describe('GET /api/stages', () => {
    it('should return all stages for a pathway', async () => {
      await testHelpers.createTestStage(tenantId, 'NEWCOMER', 0);
      await testHelpers.createTestStage(tenantId, 'NEWCOMER', 1);

      const response = await request(app)
        .get('/api/stages?pathway=NEWCOMER')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0].order).toBeLessThan(response.body.data[1].order);
    });

    it('should return 400 if pathway is missing', async () => {
      await request(app)
        .get('/api/stages')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('POST /api/stages', () => {
    it('should create a new stage', async () => {
      const newStage = {
        pathway: 'NEWCOMER',
        name: 'Welcome Stage',
        description: 'Initial welcome stage',
        order: 0,
      };

      const response = await request(app)
        .post('/api/stages')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newStage)
        .expect(201);

      expect(response.body.data.name).toBe('Welcome Stage');
      expect(response.body.data.pathway).toBe('NEWCOMER');
    });

    it('should create stage with auto-advance configuration', async () => {
      const newStage = {
        pathway: 'NEWCOMER',
        name: 'Auto Stage',
        description: 'Stage with auto-advance',
        order: 0,
        autoAdvanceEnabled: true,
        autoAdvanceType: 'TIME_IN_STAGE',
        autoAdvanceValue: '7',
      };

      const response = await request(app)
        .post('/api/stages')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newStage)
        .expect(201);

      expect(response.body.data.autoAdvanceEnabled).toBe(true);
      expect(response.body.data.autoAdvanceType).toBe('TIME_IN_STAGE');
    });
  });

  describe('PATCH /api/stages/:id', () => {
    it('should update stage details', async () => {
      const stage = await testHelpers.createTestStage(tenantId, 'NEWCOMER', 0);

      const updates = {
        name: 'Updated Name',
        description: 'Updated description',
      };

      const response = await request(app)
        .patch(`/api/stages/${stage.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.data.name).toBe('Updated Name');
    });
  });

  describe('POST /api/stages/reorder', () => {
    it('should reorder stages', async () => {
      const stage1 = await testHelpers.createTestStage(tenantId, 'NEWCOMER', 0);
      const stage2 = await testHelpers.createTestStage(tenantId, 'NEWCOMER', 1);

      const reorderData = {
        pathway: 'NEWCOMER',
        stages: [
          { id: stage2.id, order: 0 },
          { id: stage1.id, order: 1 },
        ],
      };

      const response = await request(app)
        .post('/api/stages/reorder')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reorderData)
        .expect(200);

      expect(response.body.data[0].id).toBe(stage2.id);
      expect(response.body.data[1].id).toBe(stage1.id);
    });
  });

  describe('DELETE /api/stages/:id', () => {
    it('should delete a stage', async () => {
      const stage = await testHelpers.createTestStage(tenantId, 'NEWCOMER', 0);

      const response = await request(app)
        .delete(`/api/stages/${stage.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.success).toBe(true);
    });

    it('should prevent deletion if stage has members', async () => {
      const stage = await testHelpers.createTestStage(tenantId, 'NEWCOMER', 0);
      await testHelpers.createTestMember(tenantId, stage.id, adminUser.id);

      await request(app)
        .delete(`/api/stages/${stage.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });
});
