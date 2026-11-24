import { and, asc, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { db } from './index.ts';
import { tasks, type TaskRecord } from './schema.ts';

export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Pending' | 'Completed';

export interface CreateTaskInput {
  title: string;
  description: string;
  priority: TaskPriority;
  category: string;
  dueDate: string;
  status: TaskStatus;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  category?: string;
  dueDate?: string;
  status?: TaskStatus;
}

export interface TaskListFilters {
  search?: string;
  priority?: string;
  status?: string;
  category?: string;
  sortBy?: 'dueDate' | 'createdAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export async function listTasksByUser(
  userId: number,
  filters: TaskListFilters = {}
): Promise<TaskRecord[]> {
  try {
    const conditions: SQL[] = [eq(tasks.userId, userId)];

    if (filters.priority && filters.priority !== 'All') {
      conditions.push(eq(tasks.priority, filters.priority));
    }

    if (filters.status && filters.status !== 'All') {
      conditions.push(eq(tasks.status, filters.status));
    }

    if (filters.category && filters.category !== 'All') {
      conditions.push(eq(tasks.category, filters.category));
    }

    if (filters.search && filters.search.trim().length > 0) {
      const term = `%${filters.search.trim()}%`;
      const searchCond = or(
        ilike(tasks.title, term),
        ilike(tasks.description, term)
      );
      if (searchCond) {
        conditions.push(searchCond);
      }
    }

    const orderFn = filters.sortOrder === 'desc' ? desc : asc;
    const orderColumn =
      filters.sortBy === 'createdAt' ? tasks.createdAt : tasks.dueDate;

    return await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(orderFn(orderColumn), desc(tasks.id));
  } catch (error) {
    console.error('Failed to list tasks:', error);
    throw new Error('Unable to load tasks. Please try again later.', {
      cause: error,
    });
  }
}

export async function createTask(
  userId: number,
  input: CreateTaskInput
): Promise<TaskRecord> {
  try {
    const result = await db
      .insert(tasks)
      .values({
        userId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        category: input.category,
        dueDate: input.dueDate,
        status: input.status,
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to create task:', error);
    throw new Error('Unable to create task. Please try again later.', {
      cause: error,
    });
  }
}

export async function updateTask(
  userId: number,
  taskId: number,
  input: UpdateTaskInput
): Promise<TaskRecord | null> {
  try {
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (input.title !== undefined) updates.title = input.title;
    if (input.description !== undefined) updates.description = input.description;
    if (input.priority !== undefined) updates.priority = input.priority;
    if (input.category !== undefined) updates.category = input.category;
    if (input.dueDate !== undefined) updates.dueDate = input.dueDate;
    if (input.status !== undefined) updates.status = input.status;

    const result = await db
      .update(tasks)
      .set(updates)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();

    return result[0] ?? null;
  } catch (error) {
    console.error('Failed to update task:', error);
    throw new Error('Unable to update task. Please try again later.', {
      cause: error,
    });
  }
}

export async function deleteTask(
  userId: number,
  taskId: number
): Promise<boolean> {
  try {
    const result = await db
      .delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning({ id: tasks.id });

    return result.length > 0;
  } catch (error) {
    console.error('Failed to delete task:', error);
    throw new Error('Unable to delete task. Please try again later.', {
      cause: error,
    });
  }
}
