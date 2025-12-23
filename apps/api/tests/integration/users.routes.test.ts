import request from 'supertest';
import app from '../../src/app';
import { testHelpers } from '../helpers';
import { sign } from 'jsonwebtoken';

describe('Users Routes', () => {
  let tenantId: string;
  let adminUser: any;
  let authToken: string;

  beforeEach(async () => {
    const tenant = await testHelpers.createTestTenant();
    tenantId = tenant.id;
    adminUser = await testHelpers.createTestUser(tenantId, { role: 'ADMIN' });

    // Create auth token
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

  describe('GET /api/users', () => {
    it('should return all users for authenticated user', async () => {
      await testHelpers.createTestUser(tenantId, { role: 'VOLUNTEER' });
      await testHelpers.createTestUser(tenantId, { role: 'TEAM_LEADER' });

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
      expect(response.body.meta).toBeDefined();
    });

    it('should filter users by role', async () => {
      await testHelpers.createTestUser(tenantId, { role: 'VOLUNTEER' });
      await testHelpers.createTestUser(tenantId, { role: 'VOLUNTEER' });

      const response = await request(app)
        .get('/api/users?role=VOLUNTEER')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(2);
      response.body.data.forEach((user: any) => {
        expect(user.role).toBe('VOLUNTEER');
      });
    });

    it('should return 401 without auth token', async () => {
      await request(app)
        .get('/api/users')
        .expect(401);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const newUser = {
        email: 'newuser@test.com',
        password: 'SecurePass123!',
        firstName: 'New',
        lastName: 'User',
        role: 'VOLUNTEER',
        phone: '+1234567890',
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newUser)
        .expect(201);

      expect(response.body.data.email).toBe('newuser@test.com');
      expect(response.body.data.firstName).toBe('New');
      expect(response.body.data.role).toBe('VOLUNTEER');
      expect(response.body.data).not.toHaveProperty('passwordHash');
    });

    it('should validate required fields', async () => {
      const invalidUser = {
        email: 'invalid',
        password: 'short',
      };

      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUser)
        .expect(400);
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('should update user details', async () => {
      const user = await testHelpers.createTestUser(tenantId);

      const updates = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const response = await request(app)
        .patch(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.lastName).toBe('Name');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .patch('/api/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ firstName: 'Test' })
        .expect(404);
    });
  });

  describe('PATCH /api/users/:id/role', () => {
    it('should update user role', async () => {
      const user = await testHelpers.createTestUser(tenantId, { role: 'VOLUNTEER' });

      const response = await request(app)
        .patch(`/api/users/${user.id}/role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ role: 'TEAM_LEADER' })
        .expect(200);

      expect(response.body.data.role).toBe('TEAM_LEADER');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete a user', async () => {
      const user = await testHelpers.createTestUser(tenantId);

      const response = await request(app)
        .delete(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.success).toBe(true);
    });

    it('should prevent deleting own account', async () => {
      await request(app)
        .delete(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /api/users/stats', () => {
    it('should return user statistics', async () => {
      await testHelpers.createTestUser(tenantId, { role: 'VOLUNTEER' });
      await testHelpers.createTestUser(tenantId, { role: 'TEAM_LEADER' });

      const response = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.total).toBeGreaterThanOrEqual(3);
      expect(response.body.data.byRole).toBeDefined();
    });
  });
});
