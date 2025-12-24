import userService from '../../../src/services/user.service';
import { testHelpers } from '../../helpers';
import { AppError } from '../../../src/middleware/error.middleware';

describe('UserService', () => {
  let tenantId: string;
  let adminUser: any;

  beforeEach(async () => {
    const tenant = await testHelpers.createTestTenant();
    tenantId = tenant.id;
    adminUser = await testHelpers.createTestUser(tenantId, { role: 'ADMIN' });
  });

  afterEach(async () => {
    if (tenantId) {
      await testHelpers.cleanupTestData(tenantId);
    }
  });

  afterAll(async () => {
    await testHelpers.disconnect();
  });

  describe('getUsers', () => {
    it('should return all users in a tenant', async () => {
      await testHelpers.createTestUser(tenantId, { role: 'VOLUNTEER' });
      await testHelpers.createTestUser(tenantId, { role: 'TEAM_LEADER' });

      const users = await userService.getUsers(tenantId);
      expect(users.length).toBeGreaterThanOrEqual(3); // admin + 2 new users
      users.forEach((user: any) => {
        expect(user.tenantId).toBe(tenantId);
        expect(user).not.toHaveProperty('passwordHash');
      });
    });

    it('should filter users by role', async () => {
      await testHelpers.createTestUser(tenantId, { role: 'VOLUNTEER' });
      await testHelpers.createTestUser(tenantId, { role: 'VOLUNTEER' });

      const users = await userService.getUsers(tenantId, 'VOLUNTEER');
      expect(users.length).toBe(2);
      users.forEach((user: any) => {
        expect(user.role).toBe('VOLUNTEER');
      });
    });
  });

  describe('createUser', () => {
    it('should create a new user with hashed password', async () => {
      const userData = {
        tenantId,
        email: 'newuser@test.com',
        password: 'SecurePass123!',
        firstName: 'New',
        lastName: 'User',
        role: 'VOLUNTEER' as const,
      };

      const user = await userService.createUser(userData);
      expect(user.email).toBe('newuser@test.com');
      expect(user.firstName).toBe('New');
      expect(user.lastName).toBe('User');
      expect(user.role).toBe('VOLUNTEER');
      expect(user).not.toHaveProperty('passwordHash');
    });

    it('should throw error if email already exists in tenant', async () => {
      const userData = {
        tenantId,
        email: 'duplicate@test.com',
        password: 'SecurePass123!',
        firstName: 'First',
        lastName: 'User',
        role: 'VOLUNTEER' as const,
      };

      await userService.createUser(userData);

      await expect(userService.createUser(userData)).rejects.toThrow();
    });
  });

  describe('updateUser', () => {
    it('should update user details', async () => {
      const user = await testHelpers.createTestUser(tenantId);

      const updated = await userService.updateUser(user.id, tenantId, {
        firstName: 'Updated',
        lastName: 'Name',
      });

      expect(updated.firstName).toBe('Updated');
      expect(updated.lastName).toBe('Name');
    });

    it('should throw error if user not found', async () => {
      await expect(
        userService.updateUser('nonexistent-id', tenantId, { firstName: 'Test' })
      ).rejects.toThrow(AppError);
    });
  });

  describe('updateUserRole', () => {
    it('should update user role', async () => {
      const user = await testHelpers.createTestUser(tenantId, { role: 'VOLUNTEER' });

      const updated = await userService.updateUserRole(user.id, tenantId, 'TEAM_LEADER', 'ADMIN');
      expect(updated.role).toBe('TEAM_LEADER');
    });

    it('should prevent non-SUPER_ADMIN from assigning SUPER_ADMIN role', async () => {
      const user = await testHelpers.createTestUser(tenantId, { role: 'VOLUNTEER' });

      await expect(
        userService.updateUserRole(user.id, tenantId, 'SUPER_ADMIN', 'ADMIN')
      ).rejects.toThrow(AppError);
    });

    it('should allow SUPER_ADMIN to assign SUPER_ADMIN role', async () => {
      const user = await testHelpers.createTestUser(tenantId, { role: 'VOLUNTEER' });

      const updated = await userService.updateUserRole(user.id, tenantId, 'SUPER_ADMIN', 'SUPER_ADMIN');
      expect(updated.role).toBe('SUPER_ADMIN');
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const user = await testHelpers.createTestUser(tenantId);

      const result = await userService.deleteUser(user.id, tenantId, adminUser.id);
      expect(result.message).toContain("deleted").toBe(true);
      expect(result.message).toContain('deleted');
    });

    it('should prevent user from deleting themselves', async () => {
      await expect(
        userService.deleteUser(adminUser.id, tenantId, adminUser.id)
      ).rejects.toThrow(AppError);
    });

    it('should throw error if user not found', async () => {
      await expect(
        userService.deleteUser('nonexistent-id', tenantId, adminUser.id)
      ).rejects.toThrow(AppError);
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      await testHelpers.createTestUser(tenantId, { role: 'VOLUNTEER' });
      await testHelpers.createTestUser(tenantId, { role: 'TEAM_LEADER' });
      await testHelpers.createTestUser(tenantId, { role: 'ADMIN' });

      const stats = await userService.getUserStats(tenantId);
      expect(stats.total).toBeGreaterThanOrEqual(4);
      expect(stats.byRole).toBeDefined();
      expect(stats.byRole.VOLUNTEER).toBeGreaterThanOrEqual(1);
      expect(stats.byRole.TEAM_LEADER).toBeGreaterThanOrEqual(1);
      expect(stats.byRole.ADMIN).toBeGreaterThanOrEqual(2); // initial admin + new admin
    });
  });
});
