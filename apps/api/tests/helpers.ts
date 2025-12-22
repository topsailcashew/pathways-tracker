import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';

const prisma = new PrismaClient();

export const testHelpers = {
  prisma,

  // Create a test tenant
  async createTestTenant(data?: Partial<any>) {
    return await prisma.tenant.create({
      data: {
        name: data?.name || 'Test Church',
        domain: data?.domain || `test-${Date.now()}`,
        adminEmail: data?.adminEmail || 'admin@test.com',
        plan: data?.plan || 'FREE',
        status: data?.status || 'ACTIVE',
      },
    });
  },

  // Create a test user
  async createTestUser(tenantId: string, data?: Partial<any>) {
    const passwordHash = await bcrypt.hash(data?.password || 'password123', 10);

    return await prisma.user.create({
      data: {
        tenantId,
        email: data?.email || `user-${Date.now()}@test.com`,
        passwordHash,
        firstName: data?.firstName || 'Test',
        lastName: data?.lastName || 'User',
        role: data?.role || 'VOLUNTEER',
        onboardingComplete: data?.onboardingComplete ?? true,
      },
    });
  },

  // Create a test stage
  async createTestStage(tenantId: string, pathway: 'NEWCOMER' | 'NEW_BELIEVER', order: number) {
    return await prisma.stage.create({
      data: {
        tenantId,
        pathway,
        name: `Test Stage ${order}`,
        description: 'Test stage description',
        order,
      },
    });
  },

  // Create a test member
  async createTestMember(tenantId: string, stageId: string, createdById: string, data?: Partial<any>) {
    return await prisma.member.create({
      data: {
        tenantId,
        firstName: data?.firstName || 'John',
        lastName: data?.lastName || 'Doe',
        email: data?.email || `member-${Date.now()}@test.com`,
        phone: data?.phone || '+1234567890',
        pathway: data?.pathway || 'NEWCOMER',
        currentStageId: stageId,
        createdById,
        assignedToId: data?.assignedToId || createdById,
      },
    });
  },

  // Create a test task
  async createTestTask(tenantId: string, memberId: string, assignedToId: string, createdById: string) {
    return await prisma.task.create({
      data: {
        tenantId,
        memberId,
        description: 'Test task description',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        priority: 'MEDIUM',
        assignedToId,
        createdById,
      },
    });
  },

  // Generate JWT token for testing
  generateToken(userId: string, tenantId: string, email: string) {
    return sign(
      { userId, tenantId, email },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );
  },

  // Clean up test data
  async cleanupTestData(tenantId: string) {
    await prisma.task.deleteMany({ where: { tenantId } });
    await prisma.note.deleteMany({ where: { member: { tenantId } } });
    await prisma.memberTag.deleteMany({ where: { member: { tenantId } } });
    await prisma.resource.deleteMany({ where: { member: { tenantId } } });
    await prisma.stageHistory.deleteMany({ where: { member: { tenantId } } });
    await prisma.message.deleteMany({ where: { tenantId } });
    await prisma.member.deleteMany({ where: { tenantId } });
    await prisma.automationRule.deleteMany({ where: { tenantId } });
    await prisma.stage.deleteMany({ where: { tenantId } });
    await prisma.refreshToken.deleteMany({ where: { user: { tenantId } } });
    await prisma.user.deleteMany({ where: { tenantId } });
    await prisma.churchSettings.deleteMany({ where: { tenantId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
  },

  // Disconnect from database
  async disconnect() {
    await prisma.$disconnect();
  },
};
