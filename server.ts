import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import {
  createTask,
  deleteTask,
  listTasksByUser,
  updateTask,
  type TaskListFilters,
  type TaskPriority,
  type TaskStatus,
} from './src/db/tasks.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_PRIORITIES = new Set<TaskPriority>(['High', 'Medium', 'Low']);
const VALID_STATUSES = new Set<TaskStatus>(['Pending', 'Completed']);
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(value: string): boolean {
  if (!DATE_REGEX.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.get('/api/tasks', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const dbUser = req.dbUser;
      if (!dbUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const filters: TaskListFilters = {
        search:
          typeof req.query.search === 'string' ? req.query.search : undefined,
        priority:
          typeof req.query.priority === 'string'
            ? req.query.priority
            : undefined,
        status:
          typeof req.query.status === 'string' ? req.query.status : undefined,
        category:
          typeof req.query.category === 'string'
            ? req.query.category
            : undefined,
        sortBy:
          req.query.sortBy === 'createdAt' || req.query.sortBy === 'dueDate'
            ? req.query.sortBy
            : 'dueDate',
        sortOrder: req.query.sortOrder === 'desc' ? 'desc' : 'asc',
      };

      const rows = await listTasksByUser(dbUser.id, filters);
      res.json({ tasks: rows });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch tasks.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/tasks', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const dbUser = req.dbUser;
      if (!dbUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const body = req.body ?? {};
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      const description =
        typeof body.description === 'string' ? body.description.trim() : '';
      const priority =
        typeof body.priority === 'string' ? body.priority.trim() : 'Medium';
      const category =
        typeof body.category === 'string' ? body.category.trim() : '';
      const dueDate =
        typeof body.dueDate === 'string'
          ? body.dueDate.trim()
          : typeof body.due_date === 'string'
            ? body.due_date.trim()
            : '';
      const status =
        typeof body.status === 'string' ? body.status.trim() : 'Pending';

      if (!title) {
        return res.status(400).json({ error: 'Task title is required.' });
      }
      if (title.length > 255) {
        return res
          .status(400)
          .json({ error: 'Task title must be 255 characters or fewer.' });
      }
      if (!VALID_PRIORITIES.has(priority as TaskPriority)) {
        return res
          .status(400)
          .json({ error: 'Priority must be High, Medium, or Low.' });
      }
      if (!category || category.length > 64) {
        return res
          .status(400)
          .json({ error: 'Category is required (max 64 characters).' });
      }
      if (!isValidDateString(dueDate)) {
        return res
          .status(400)
          .json({ error: 'A valid due date (YYYY-MM-DD) is required.' });
      }
      if (!VALID_STATUSES.has(status as TaskStatus)) {
        return res
          .status(400)
          .json({ error: 'Status must be Pending or Completed.' });
      }

      const task = await createTask(dbUser.id, {
        title,
        description,
        priority: priority as TaskPriority,
        category,
        dueDate,
        status: status as TaskStatus,
      });

      res.status(201).json({ task });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create task.';
      res.status(500).json({ error: message });
    }
  });

  const handleUpdate = async (req: AuthRequest, res: Response) => {
    try {
      const dbUser = req.dbUser;
      if (!dbUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const taskId = Number(req.params.id);
      if (!Number.isInteger(taskId) || taskId <= 0) {
        return res.status(400).json({ error: 'Invalid task ID.' });
      }

      const body = req.body ?? {};
      const updates: {
        title?: string;
        description?: string;
        priority?: TaskPriority;
        category?: string;
        dueDate?: string;
        status?: TaskStatus;
      } = {};

      if (body.title !== undefined) {
        if (typeof body.title !== 'string' || !body.title.trim()) {
          return res.status(400).json({ error: 'Task title cannot be empty.' });
        }
        if (body.title.trim().length > 255) {
          return res
            .status(400)
            .json({ error: 'Task title must be 255 characters or fewer.' });
        }
        updates.title = body.title.trim();
      }

      if (body.description !== undefined) {
        if (typeof body.description !== 'string') {
          return res
            .status(400)
            .json({ error: 'Description must be a string.' });
        }
        updates.description = body.description.trim();
      }

      if (body.priority !== undefined) {
        if (
          typeof body.priority !== 'string' ||
          !VALID_PRIORITIES.has(body.priority.trim() as TaskPriority)
        ) {
          return res
            .status(400)
            .json({ error: 'Priority must be High, Medium, or Low.' });
        }
        updates.priority = body.priority.trim() as TaskPriority;
      }

      if (body.category !== undefined) {
        if (
          typeof body.category !== 'string' ||
          !body.category.trim() ||
          body.category.trim().length > 64
        ) {
          return res
            .status(400)
            .json({ error: 'Category must be between 1 and 64 characters.' });
        }
        updates.category = body.category.trim();
      }

      const rawDueDate =
        body.dueDate !== undefined ? body.dueDate : body.due_date;
      if (rawDueDate !== undefined) {
        if (
          typeof rawDueDate !== 'string' ||
          !isValidDateString(rawDueDate.trim())
        ) {
          return res
            .status(400)
            .json({ error: 'A valid due date (YYYY-MM-DD) is required.' });
        }
        updates.dueDate = rawDueDate.trim();
      }

      if (body.status !== undefined) {
        if (
          typeof body.status !== 'string' ||
          !VALID_STATUSES.has(body.status.trim() as TaskStatus)
        ) {
          return res
            .status(400)
            .json({ error: 'Status must be Pending or Completed.' });
        }
        updates.status = body.status.trim() as TaskStatus;
      }

      if (Object.keys(updates).length === 0) {
        return res
          .status(400)
          .json({ error: 'No valid update fields were provided.' });
      }

      const updated = await updateTask(dbUser.id, taskId, updates);
      if (!updated) {
        return res.status(404).json({ error: 'Task not found.' });
      }

      res.json({ task: updated });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update task.';
      res.status(500).json({ error: message });
    }
  };

  app.put('/api/tasks/:id', requireAuth, handleUpdate);
  app.patch('/api/tasks/:id', requireAuth, handleUpdate);

  app.delete(
    '/api/tasks/:id',
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const dbUser = req.dbUser;
        if (!dbUser) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const taskId = Number(req.params.id);
        if (!Number.isInteger(taskId) || taskId <= 0) {
          return res.status(400).json({ error: 'Invalid task ID.' });
        }

        const deleted = await deleteTask(dbUser.id, taskId);
        if (!deleted) {
          return res.status(404).json({ error: 'Task not found.' });
        }

        res.json({ deleted: true, id: taskId });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to delete task.';
        res.status(500).json({ error: message });
      }
    }
  );

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
