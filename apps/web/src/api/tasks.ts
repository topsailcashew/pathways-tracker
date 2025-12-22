import { apiClient, handleApiError } from './client';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: TaskPriority;
  completed: boolean;
  completedAt?: string;
  assignedToId: string;
  memberId?: string;
  tenantId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  member?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateTaskData {
  title: string;
  description?: string;
  dueDate: string;
  priority: TaskPriority;
  assignedToId: string;
  memberId?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
  assignedToId?: string;
  memberId?: string;
  completed?: boolean;
}

export interface TaskFilters {
  assignedToId?: string;
  memberId?: string;
  completed?: boolean;
  overdue?: boolean;
  priority?: TaskPriority;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  byPriority: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    URGENT: number;
  };
}

// Get all tasks with optional filters
export const getTasks = async (filters?: TaskFilters): Promise<Task[]> => {
  try {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get<Task[]>(
      `/api/tasks${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Get task statistics
export const getTaskStats = async (): Promise<TaskStats> => {
  try {
    const response = await apiClient.get<TaskStats>('/api/tasks/stats');
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Get task by ID
export const getTask = async (id: string): Promise<Task> => {
  try {
    const response = await apiClient.get<Task>(`/api/tasks/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Create task
export const createTask = async (data: CreateTaskData): Promise<Task> => {
  try {
    const response = await apiClient.post<Task>('/api/tasks', data);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Update task
export const updateTask = async (id: string, data: UpdateTaskData): Promise<Task> => {
  try {
    const response = await apiClient.patch<Task>(`/api/tasks/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Delete task
export const deleteTask = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/tasks/${id}`);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Mark task as complete
export const completeTask = async (id: string): Promise<Task> => {
  try {
    const response = await apiClient.patch<Task>(`/api/tasks/${id}/complete`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};
