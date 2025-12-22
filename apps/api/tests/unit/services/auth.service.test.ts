import { AuthService } from '../../../src/services/auth.service';
import { testHelpers } from '../../helpers';
import { AppError } from '../../../src/middleware/error.middleware';

describe('AuthService', () => {
  let authService: AuthService;
  let tenantId: string;

  beforeAll(async () => {
    authService = new AuthService();
  });

  beforeEach(async () => {
    // Create a fresh tenant for each test
    const tenant = await testHelpers.createTestTenant();
    tenantId = tenant.id;
  });

  afterEach(async () => {
    // Clean up test data
    if (tenantId) {
      await testHelpers.cleanupTestData(tenantId);
    }
  });

  afterAll(async () => {
    await testHelpers.disconnect();
  });

  describe('register', () => {
    it('should register a new user and create a tenant', async () => {
      const result = await authService.register({
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        firstName: 'New',
        lastName: 'User',
        churchName: 'New Church',
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('newuser@example.com');
      expect(result.user.firstName).toBe('New');
      expect(result.user.lastName).toBe('User');
      expect(result.user.role).toBe('ADMIN'); // First user is admin
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      // Clean up the created tenant
      await testHelpers.cleanupTestData(result.user.tenantId);
    });

    it('should register a user to an existing tenant', async () => {
      const result = await authService.register({
        email: 'teamuser@example.com',
        password: 'SecurePassword123!',
        firstName: 'Team',
        lastName: 'User',
        tenantId,
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('teamuser@example.com');
      expect(result.user.tenantId).toBe(tenantId);
      expect(result.user.role).toBe('VOLUNTEER'); // Subsequent users are volunteers
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error if email already exists', async () => {
      await authService.register({
        email: 'duplicate@example.com',
        password: 'password123',
        firstName: 'First',
        lastName: 'User',
        tenantId,
      });

      await expect(
        authService.register({
          email: 'duplicate@example.com',
          password: 'password123',
          firstName: 'Second',
          lastName: 'User',
          tenantId,
        })
      ).rejects.toThrow('Email already registered');
    });

    it('should hash the password', async () => {
      const result = await authService.register({
        email: 'secure@example.com',
        password: 'MyPassword123!',
        firstName: 'Secure',
        lastName: 'User',
        tenantId,
      });

      const user = await testHelpers.prisma.user.findUnique({
        where: { id: result.user.id },
      });

      expect(user?.passwordHash).toBeDefined();
      expect(user?.passwordHash).not.toBe('MyPassword123!');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Create a user to login with
      await authService.register({
        email: 'logintest@example.com',
        password: 'TestPassword123!',
        firstName: 'Login',
        lastName: 'Test',
        tenantId,
      });
    });

    it('should login with valid credentials', async () => {
      const result = await authService.login({
        email: 'logintest@example.com',
        password: 'TestPassword123!',
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('logintest@example.com');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error with invalid email', async () => {
      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error with invalid password', async () => {
      await expect(
        authService.login({
          email: 'logintest@example.com',
          password: 'WrongPassword123!',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should be case-insensitive for email', async () => {
      const result = await authService.login({
        email: 'LOGINTEST@EXAMPLE.COM',
        password: 'TestPassword123!',
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('logintest@example.com');
    });

    it('should update lastLoginAt timestamp', async () => {
      const beforeLogin = new Date();
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay

      await authService.login({
        email: 'logintest@example.com',
        password: 'TestPassword123!',
      });

      const user = await testHelpers.prisma.user.findFirst({
        where: { email: 'logintest@example.com' },
      });

      expect(user?.lastLoginAt).toBeDefined();
      expect(user!.lastLoginAt!.getTime()).toBeGreaterThan(beforeLogin.getTime());
    });
  });

  describe('refresh', () => {
    let refreshToken: string;
    let userId: string;

    beforeEach(async () => {
      const result = await authService.register({
        email: 'refreshtest@example.com',
        password: 'TestPassword123!',
        firstName: 'Refresh',
        lastName: 'Test',
        tenantId,
      });

      refreshToken = result.refreshToken;
      userId = result.user.id;
    });

    it('should refresh access token with valid refresh token', async () => {
      const result = await authService.refresh(refreshToken);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).not.toBe(refreshToken); // Token rotation
    });

    it('should revoke old refresh token after rotation', async () => {
      await authService.refresh(refreshToken);

      // Try to use old token again
      await expect(authService.refresh(refreshToken)).rejects.toThrow(
        'Invalid or expired refresh token'
      );
    });

    it('should throw error with invalid refresh token', async () => {
      await expect(authService.refresh('invalid-token')).rejects.toThrow();
    });

    it('should throw error with revoked refresh token', async () => {
      await testHelpers.prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revokedAt: new Date() },
      });

      await expect(authService.refresh(refreshToken)).rejects.toThrow(
        'Invalid or expired refresh token'
      );
    });
  });

  describe('logout', () => {
    it('should revoke refresh token on logout', async () => {
      const result = await authService.register({
        email: 'logouttest@example.com',
        password: 'TestPassword123!',
        firstName: 'Logout',
        lastName: 'Test',
        tenantId,
      });

      await authService.logout(result.refreshToken);

      const token = await testHelpers.prisma.refreshToken.findFirst({
        where: { token: result.refreshToken },
      });

      expect(token?.revokedAt).toBeDefined();
    });
  });

  describe('completeOnboarding', () => {
    it('should mark onboarding as complete', async () => {
      const user = await testHelpers.createTestUser(tenantId, {
        onboardingComplete: false,
      });

      const result = await authService.completeOnboarding(user.id);

      expect(result.onboardingComplete).toBe(true);
    });
  });

  describe('getCurrentUser', () => {
    it('should return user details', async () => {
      const user = await testHelpers.createTestUser(tenantId);

      const result = await authService.getCurrentUser(user.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(user.id);
      expect(result.email).toBe(user.email);
    });

    it('should throw error if user not found', async () => {
      await expect(
        authService.getCurrentUser('non-existent-id')
      ).rejects.toThrow('User not found');
    });
  });
});
