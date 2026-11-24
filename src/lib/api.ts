import { auth } from './firebase.ts';
import type { Task, TaskFormPayload } from '../types/task.ts';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to manage tasks.');
  }
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function parseResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data?.error === 'string'
        ? data.error
        : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export async function fetchTasks(): Promise<Task[]> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/tasks', {
    method: 'GET',
    headers,
  });
  const data = await parseResponse<{ tasks: Task[] }>(res);
  return data.tasks;
}

export async function createTaskRequest(payload: TaskFormPayload): Promise<Task> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await parseResponse<{ task: Task }>(res);
  return data.task;
}

export async function updateTaskRequest(
  id: number,
  payload: Partial<TaskFormPayload>
): Promise<Task> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await parseResponse<{ task: Task }>(res);
  return data.task;
}

export async function deleteTaskRequest(id: number): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'DELETE',
    headers,
  });
  await parseResponse<{ deleted: boolean; id: number }>(res);
}
