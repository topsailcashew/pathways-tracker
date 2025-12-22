import { MemberService } from '../../../src/services/member.service';
import { testHelpers } from '../../helpers';

describe('MemberService', () => {
  let memberService: MemberService;
  let tenantId: string;
  let userId: string;
  let stageId: string;

  beforeAll(async () => {
    memberService = new MemberService();
  });

  beforeEach(async () => {
    const tenant = await testHelpers.createTestTenant();
    tenantId = tenant.id;

    const user = await testHelpers.createTestUser(tenantId, { role: 'ADMIN' });
    userId = user.id;

    const stage = await testHelpers.createTestStage(tenantId, 'NEWCOMER', 1);
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

  describe('createMember', () => {
    it('should create a new member', async () => {
      const member = await memberService.createMember({
        tenantId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        pathway: 'NEWCOMER',
        currentStageId: stageId,
        createdById: userId,
      });

      expect(member).toBeDefined();
      expect(member.firstName).toBe('John');
      expect(member.lastName).toBe('Doe');
      expect(member.email).toBe('john.doe@example.com');
      expect(member.pathway).toBe('NEWCOMER');
      expect(member.currentStageId).toBe(stageId);
    });

    it('should create initial system note', async () => {
      const member = await memberService.createMember({
        tenantId,
        firstName: 'Jane',
        lastName: 'Smith',
        pathway: 'NEWCOMER',
        currentStageId: stageId,
        createdById: userId,
      });

      const notes = await testHelpers.prisma.note.findMany({
        where: { memberId: member.id },
      });

      expect(notes.length).toBeGreaterThan(0);
      expect(notes[0].isSystem).toBe(true);
      expect(notes[0].content).toContain('NEWCOMER pathway');
    });

    it('should increment tenant member count', async () => {
      const beforeCount = (await testHelpers.prisma.tenant.findUnique({
        where: { id: tenantId },
      }))!.memberCount;

      await memberService.createMember({
        tenantId,
        firstName: 'Test',
        lastName: 'User',
        pathway: 'NEWCOMER',
        currentStageId: stageId,
        createdById: userId,
      });

      const afterCount = (await testHelpers.prisma.tenant.findUnique({
        where: { id: tenantId },
      }))!.memberCount;

      expect(afterCount).toBe(beforeCount + 1);
    });

    it('should throw error if email already exists', async () => {
      await memberService.createMember({
        tenantId,
        firstName: 'First',
        lastName: 'User',
        email: 'duplicate@example.com',
        pathway: 'NEWCOMER',
        currentStageId: stageId,
        createdById: userId,
      });

      await expect(
        memberService.createMember({
          tenantId,
          firstName: 'Second',
          lastName: 'User',
          email: 'duplicate@example.com',
          pathway: 'NEWCOMER',
          currentStageId: stageId,
          createdById: userId,
        })
      ).rejects.toThrow('Member with this email already exists');
    });

    it('should throw error if stage does not exist', async () => {
      await expect(
        memberService.createMember({
          tenantId,
          firstName: 'Test',
          lastName: 'User',
          pathway: 'NEWCOMER',
          currentStageId: 'invalid-stage-id',
          createdById: userId,
        })
      ).rejects.toThrow('Invalid stage for this pathway');
    });
  });

  describe('getMemberById', () => {
    it('should return member with full details', async () => {
      const created = await testHelpers.createTestMember(tenantId, stageId, userId);

      const member = await memberService.getMemberById(created.id, tenantId);

      expect(member).toBeDefined();
      expect(member.id).toBe(created.id);
      expect(member.currentStage).toBeDefined();
      expect(member.assignedTo).toBeDefined();
    });

    it('should throw error if member not found', async () => {
      await expect(
        memberService.getMemberById('non-existent-id', tenantId)
      ).rejects.toThrow('Member not found');
    });

    it('should include notes, tags, and tasks', async () => {
      const member = await testHelpers.createTestMember(tenantId, stageId, userId);

      // Add a note
      await testHelpers.prisma.note.create({
        data: {
          memberId: member.id,
          content: 'Test note',
          createdById: userId,
        },
      });

      // Add a tag
      await testHelpers.prisma.memberTag.create({
        data: {
          memberId: member.id,
          tag: 'Test Tag',
        },
      });

      const result = await memberService.getMemberById(member.id, tenantId);

      expect(result.notes.length).toBeGreaterThan(0);
      expect(result.tags.length).toBeGreaterThan(0);
    });
  });

  describe('listMembers', () => {
    beforeEach(async () => {
      // Create multiple members for testing
      await testHelpers.createTestMember(tenantId, stageId, userId, {
        firstName: 'Alice',
        email: 'alice@example.com',
      });
      await testHelpers.createTestMember(tenantId, stageId, userId, {
        firstName: 'Bob',
        email: 'bob@example.com',
      });
      await testHelpers.createTestMember(tenantId, stageId, userId, {
        firstName: 'Charlie',
        email: 'charlie@example.com',
      });
    });

    it('should list all members for tenant', async () => {
      const result = await memberService.listMembers(tenantId, {});

      expect(result.members.length).toBe(3);
      expect(result.pagination.total).toBe(3);
    });

    it('should filter by pathway', async () => {
      const believerStage = await testHelpers.createTestStage(tenantId, 'NEW_BELIEVER', 1);
      await testHelpers.createTestMember(tenantId, believerStage.id, userId, {
        pathway: 'NEW_BELIEVER',
      });

      const result = await memberService.listMembers(tenantId, {
        pathway: 'NEW_BELIEVER',
      });

      expect(result.members.length).toBe(1);
      expect(result.members[0].pathway).toBe('NEW_BELIEVER');
    });

    it('should search by name', async () => {
      const result = await memberService.listMembers(tenantId, {
        search: 'Alice',
      });

      expect(result.members.length).toBe(1);
      expect(result.members[0].firstName).toBe('Alice');
    });

    it('should search by email', async () => {
      const result = await memberService.listMembers(tenantId, {
        search: 'bob@example',
      });

      expect(result.members.length).toBe(1);
      expect(result.members[0].email).toContain('bob@example');
    });

    it('should paginate results', async () => {
      const page1 = await memberService.listMembers(tenantId, {
        page: 1,
        limit: 2,
      });

      expect(page1.members.length).toBe(2);
      expect(page1.pagination.page).toBe(1);
      expect(page1.pagination.totalPages).toBe(2);

      const page2 = await memberService.listMembers(tenantId, {
        page: 2,
        limit: 2,
      });

      expect(page2.members.length).toBe(1);
      expect(page2.pagination.page).toBe(2);
    });
  });

  describe('updateMember', () => {
    it('should update member details', async () => {
      const member = await testHelpers.createTestMember(tenantId, stageId, userId);

      const updated = await memberService.updateMember(member.id, tenantId, {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '+9876543210',
      });

      expect(updated.firstName).toBe('Updated');
      expect(updated.lastName).toBe('Name');
      expect(updated.phone).toBe('+9876543210');
    });

    it('should throw error if member not found', async () => {
      await expect(
        memberService.updateMember('non-existent-id', tenantId, {
          firstName: 'Updated',
        })
      ).rejects.toThrow('Member not found');
    });

    it('should throw error if email already in use', async () => {
      const member1 = await testHelpers.createTestMember(tenantId, stageId, userId, {
        email: 'member1@example.com',
      });
      const member2 = await testHelpers.createTestMember(tenantId, stageId, userId, {
        email: 'member2@example.com',
      });

      await expect(
        memberService.updateMember(member1.id, tenantId, {
          email: 'member2@example.com',
        })
      ).rejects.toThrow('Email already in use');
    });
  });

  describe('advanceStage', () => {
    let stage2Id: string;

    beforeEach(async () => {
      const stage2 = await testHelpers.createTestStage(tenantId, 'NEWCOMER', 2);
      stage2Id = stage2.id;
    });

    it('should advance member to new stage', async () => {
      const member = await testHelpers.createTestMember(tenantId, stageId, userId);

      const result = await memberService.advanceStage(
        member.id,
        stage2Id,
        tenantId,
        userId
      );

      expect(result.member.currentStageId).toBe(stage2Id);
      expect(result.member.lastStageChangeDate).toBeDefined();
    });

    it('should create stage history record', async () => {
      const member = await testHelpers.createTestMember(tenantId, stageId, userId);

      await memberService.advanceStage(member.id, stage2Id, tenantId, userId);

      const history = await testHelpers.prisma.stageHistory.findMany({
        where: { memberId: member.id },
      });

      expect(history.length).toBeGreaterThan(0);
      expect(history[0].fromStageId).toBe(stageId);
      expect(history[0].toStageId).toBe(stage2Id);
    });

    it('should create system note', async () => {
      const member = await testHelpers.createTestMember(tenantId, stageId, userId);

      await memberService.advanceStage(member.id, stage2Id, tenantId, userId);

      const notes = await testHelpers.prisma.note.findMany({
        where: { memberId: member.id, isSystem: true },
      });

      expect(notes.length).toBeGreaterThan(0);
    });

    it('should trigger automation rules', async () => {
      const member = await testHelpers.createTestMember(tenantId, stageId, userId);

      // Create automation rule for stage 2
      await testHelpers.prisma.automationRule.create({
        data: {
          tenantId,
          stageId: stage2Id,
          name: 'Test Automation',
          taskDescription: 'Auto-generated test task',
          daysDue: 7,
          priority: 'HIGH',
          enabled: true,
        },
      });

      const result = await memberService.advanceStage(
        member.id,
        stage2Id,
        tenantId,
        userId
      );

      expect(result.createdTasks.length).toBeGreaterThan(0);
      expect(result.createdTasks[0].description).toBe('Auto-generated test task');
    });
  });

  describe('deleteMember', () => {
    it('should delete member', async () => {
      const member = await testHelpers.createTestMember(tenantId, stageId, userId);

      await memberService.deleteMember(member.id, tenantId);

      const deleted = await testHelpers.prisma.member.findUnique({
        where: { id: member.id },
      });

      expect(deleted).toBeNull();
    });

    it('should decrement tenant member count', async () => {
      const member = await testHelpers.createTestMember(tenantId, stageId, userId);

      const beforeCount = (await testHelpers.prisma.tenant.findUnique({
        where: { id: tenantId },
      }))!.memberCount;

      await memberService.deleteMember(member.id, tenantId);

      const afterCount = (await testHelpers.prisma.tenant.findUnique({
        where: { id: tenantId },
      }))!.memberCount;

      expect(afterCount).toBe(beforeCount - 1);
    });
  });

  describe('addNote', () => {
    it('should add note to member', async () => {
      const member = await testHelpers.createTestMember(tenantId, stageId, userId);

      const note = await memberService.addNote(
        member.id,
        tenantId,
        'Test note content',
        userId
      );

      expect(note).toBeDefined();
      expect(note.content).toBe('Test note content');
      expect(note.memberId).toBe(member.id);
      expect(note.isSystem).toBe(false);
    });
  });

  describe('addTag and removeTag', () => {
    it('should add tag to member', async () => {
      const member = await testHelpers.createTestMember(tenantId, stageId, userId);

      const tag = await memberService.addTag(member.id, tenantId, 'Test Tag');

      expect(tag).toBeDefined();
      expect(tag.tag).toBe('Test Tag');
      expect(tag.memberId).toBe(member.id);
    });

    it('should throw error if tag already exists', async () => {
      const member = await testHelpers.createTestMember(tenantId, stageId, userId);

      await memberService.addTag(member.id, tenantId, 'Duplicate Tag');

      await expect(
        memberService.addTag(member.id, tenantId, 'Duplicate Tag')
      ).rejects.toThrow('Tag already exists');
    });

    it('should remove tag from member', async () => {
      const member = await testHelpers.createTestMember(tenantId, stageId, userId);
      const tag = await memberService.addTag(member.id, tenantId, 'Remove Me');

      await memberService.removeTag(member.id, tenantId, tag.id);

      const deleted = await testHelpers.prisma.memberTag.findUnique({
        where: { id: tag.id },
      });

      expect(deleted).toBeNull();
    });
  });
});
