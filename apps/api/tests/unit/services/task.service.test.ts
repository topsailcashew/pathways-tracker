import { TaskService } from '../../../src/services/task.service';
import { testHelpers } from '../../helpers';

describe('TaskService', () => {
  let taskService: TaskService;
  let tenantId: string;
  let userId: string;
  let memberId: string;

  beforeAll(async () => {
    taskService = new TaskService();
  });

  beforeEach(async () => {
    const tenant = await testHelpers.createTestTenant();
    tenantId = tenant.id;

    const user = await testHelpers.createTestUser(tenantId);
    userId = user.id;

    const stage = await testHelpers.createTestStage(tenantId, 'NEWCOMER', 1);
    const member = await testHelpers.createTestMember(tenantId, stage.id, userId);
    memberId = member.id;
  });

  afterEach(async () => {
    if (tenantId) {
      await testHelpers.cleanupTestData(tenantId);
    }
  });

  afterAll(async () => {
    await testHelpers.disconnect();
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const task = await taskService.createTask({
        tenantId,
        memberId,
        description: 'Test task description',
        dueDate,
        priority: 'HIGH',
        assignedToId: userId,
        createdById: userId,
      });

      expect(task).toBeDefined();
      expect(task.description).toBe('Test task description');
      expect(task.priority).toBe('HIGH');
      expect(task.completed).toBe(false);
      expect(task.assignedToId).toBe(userId);
    });

    it('should throw error if member not found', async () => {
      await expect(
        taskService.createTask({
          tenantId,
          memberId: 'non-existent-member',
          description: 'Test task',
          dueDate: new Date(),
          priority: 'MEDIUM',
          assignedToId: userId,
          createdById: userId,
        })
      ).rejects.toThrow('Member not found');
    });
  });

  describe('getTaskById', () => {
    it('should return task with details', async () => {
      const created = await testHelpers.createTestTask(tenantId, memberId, userId, userId);

      const task = await taskService.getTaskById(created.id, tenantId);

      expect(task).toBeDefined();
      expect(task.id).toBe(created.id);
      expect(task.member).toBeDefined();
      expect(task.assignedTo).toBeDefined();
    });

    it('should throw error if task not found', async () => {
      await expect(
        taskService.getTaskById('non-existent-id', tenantId)
      ).rejects.toThrow('Task not found');
    });
  });

  describe('listTasks', () => {
    beforeEach(async () => {
      // Create multiple tasks
      await testHelpers.createTestTask(tenantId, memberId, userId, userId);
      await testHelpers.createTestTask(tenantId, memberId, userId, userId);
      await testHelpers.createTestTask(tenantId, memberId, userId, userId);
    });

    it('should list all tasks for tenant', async () => {
      const result = await taskService.listTasks(tenantId, {});

      expect(result.tasks.length).toBe(3);
      expect(result.pagination.total).toBe(3);
    });

    it('should filter by assignedToId', async () => {
      const result = await taskService.listTasks(tenantId, {
        assignedToId: userId,
      });

      expect(result.tasks.length).toBeGreaterThan(0);
      result.tasks.forEach(task => {
        expect(task.assignedToId).toBe(userId);
      });
    });

    it('should filter by completed status', async () => {
      const task = await testHelpers.createTestTask(tenantId, memberId, userId, userId);
      await testHelpers.prisma.task.update({
        where: { id: task.id },
        data: { completed: true, completedAt: new Date() },
      });

      const result = await taskService.listTasks(tenantId, {
        completed: true,
      });

      expect(result.tasks.length).toBeGreaterThan(0);
      result.tasks.forEach(task => {
        expect(task.completed).toBe(true);
      });
    });

    it('should filter by priority', async () => {
      await testHelpers.prisma.task.create({
        data: {
          tenantId,
          memberId,
          description: 'High priority task',
          dueDate: new Date(),
          priority: 'HIGH',
          assignedToId: userId,
          createdById: userId,
        },
      });

      const result = await taskService.listTasks(tenantId, {
        priority: 'HIGH',
      });

      expect(result.tasks.length).toBeGreaterThan(0);
      result.tasks.forEach(task => {
        expect(task.priority).toBe('HIGH');
      });
    });

    it('should paginate results', async () => {
      const page1 = await taskService.listTasks(tenantId, {
        page: 1,
        limit: 2,
      });

      expect(page1.tasks.length).toBe(2);
      expect(page1.pagination.page).toBe(1);

      const page2 = await taskService.listTasks(tenantId, {
        page: 2,
        limit: 2,
      });

      expect(page2.tasks.length).toBe(1);
      expect(page2.pagination.page).toBe(2);
    });
  });

  describe('updateTask', () => {
    it('should update task details', async () => {
      const task = await testHelpers.createTestTask(tenantId, memberId, userId, userId);

      const updated = await taskService.updateTask(task.id, tenantId, {
        description: 'Updated description',
        priority: 'LOW',
      });

      expect(updated.description).toBe('Updated description');
      expect(updated.priority).toBe('LOW');
    });

    it('should throw error if task not found', async () => {
      await expect(
        taskService.updateTask('non-existent-id', tenantId, {
          description: 'Updated',
        })
      ).rejects.toThrow('Task not found');
    });
  });

  describe('completeTask', () => {
    it('should mark task as completed', async () => {
      const task = await testHelpers.createTestTask(tenantId, memberId, userId, userId);

      const completed = await taskService.completeTask(task.id, tenantId);

      expect(completed.completed).toBe(true);
      expect(completed.completedAt).toBeDefined();
    });

    it('should throw error if task not found', async () => {
      await expect(
        taskService.completeTask('non-existent-id', tenantId)
      ).rejects.toThrow('Task not found');
    });

    it('should not change already completed task', async () => {
      const task = await testHelpers.createTestTask(tenantId, memberId, userId, userId);

      const firstComplete = await taskService.completeTask(task.id, tenantId);
      const firstCompletedAt = firstComplete.completedAt;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      const secondComplete = await taskService.completeTask(task.id, tenantId);

      expect(secondComplete.completedAt).toEqual(firstCompletedAt);
    });
  });

  describe('deleteTask', () => {
    it('should delete task', async () => {
      const task = await testHelpers.createTestTask(tenantId, memberId, userId, userId);

      await taskService.deleteTask(task.id, tenantId);

      const deleted = await testHelpers.prisma.task.findUnique({
        where: { id: task.id },
      });

      expect(deleted).toBeNull();
    });

    it('should throw error if task not found', async () => {
      await expect(
        taskService.deleteTask('non-existent-id', tenantId)
      ).rejects.toThrow('Task not found');
    });
  });
});
