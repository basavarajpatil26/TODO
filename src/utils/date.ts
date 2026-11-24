import type { Task } from '../types/task.ts';

export function getTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isTaskOverdue(task: Pick<Task, 'status' | 'dueDate'>): boolean {
  if (task.status === 'Completed') return false;
  return task.dueDate < getTodayISO();
}

export function isTaskDueToday(task: Pick<Task, 'status' | 'dueDate'>): boolean {
  if (task.status === 'Completed') return false;
  return task.dueDate === getTodayISO();
}

export function formatDisplayDate(isoDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
