export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Pending' | 'Completed';

export interface Task {
  id: number;
  userId: number;
  title: string;
  description: string;
  priority: TaskPriority;
  category: string;
  dueDate: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFormPayload {
  title: string;
  description: string;
  priority: TaskPriority;
  category: string;
  dueDate: string;
  status: TaskStatus;
}

export type ViewSection = 'all' | 'pending' | 'completed' | 'overdue';
export type SortField = 'dueDate' | 'priority' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export const TASK_CATEGORIES = [
  'Work',
  'Personal',
  'Engineering',
  'Design',
  'Finance',
  'Health',
  'Errands',
] as const;
