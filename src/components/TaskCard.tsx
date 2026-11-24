import {
  AlertTriangle,
  Calendar,
  Check,
  Flag,
  Pencil,
  Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { Task, TaskPriority } from '../types/task.ts';
import {
  formatDisplayDate,
  isTaskDueToday,
  isTaskOverdue,
} from '../utils/date.ts';

interface TaskCardProps {
  task: Task;
  onToggleStatus: (task: Task) => void;
  onEdit: (task: Task) => void;
  onRequestDelete: (task: Task) => void;
  isUpdating?: boolean;
}

const PRIORITY_STYLES: Record<
  TaskPriority,
  { text: string; icon: string; label: string }
> = {
  High: {
    text: 'text-rose-600 dark:text-rose-400',
    icon: 'text-rose-500 dark:text-rose-400',
    label: 'High priority',
  },
  Medium: {
    text: 'text-amber-600 dark:text-amber-400',
    icon: 'text-amber-500 dark:text-amber-400',
    label: 'Medium priority',
  },
  Low: {
    text: 'text-emerald-600 dark:text-emerald-400',
    icon: 'text-emerald-500 dark:text-emerald-400',
    label: 'Low priority',
  },
};

export function TaskCard({
  task,
  onToggleStatus,
  onEdit,
  onRequestDelete,
  isUpdating = false,
}: TaskCardProps) {
  const isCompleted = task.status === 'Completed';
  const overdue = isTaskOverdue(task);
  const dueToday = isTaskDueToday(task);
  const priorityStyle = PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.Medium;

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      className={`group rounded-xl border transition-colors duration-150 p-4 sm:p-5 ${
        isCompleted
          ? 'border-slate-200/70 dark:border-slate-800/70 bg-slate-50/70 dark:bg-slate-900/45'
          : overdue
            ? 'border-rose-200 dark:border-rose-900/70 bg-white/95 dark:bg-slate-900/90 hover:border-rose-300 dark:hover:border-rose-800'
            : 'border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <button
          type="button"
          onClick={() => onToggleStatus(task)}
          disabled={isUpdating}
          aria-label={
            isCompleted
              ? `Mark "${task.title}" as pending`
              : `Mark "${task.title}" as completed`
          }
          className={`mt-0.5 flex items-center justify-center w-6 h-6 rounded-full border transition-all duration-150 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer disabled:opacity-50 ${
            isCompleted
              ? 'bg-emerald-600 border-emerald-600 dark:bg-emerald-500 dark:border-emerald-500 text-white'
              : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 bg-white dark:bg-slate-950 text-transparent hover:text-indigo-400'
          }`}
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3
                className={`text-base font-semibold leading-snug break-words ${
                  isCompleted
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : 'text-slate-900 dark:text-slate-50'
                }`}
              >
                {task.title}
              </h3>

              {task.description && (
                <p
                  className={`mt-1.5 text-sm leading-relaxed break-words ${
                    isCompleted
                      ? 'text-slate-400 dark:text-slate-500'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {task.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onEdit(task)}
                aria-label={`Edit "${task.title}"`}
                title="Edit task"
                className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onRequestDelete(task)}
                aria-label={`Delete "${task.title}"`}
                title="Delete task"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span
              className={`inline-flex items-center gap-1 font-medium ${priorityStyle.text}`}
            >
              <Flag
                className={`w-3.5 h-3.5 ${priorityStyle.icon}`}
                aria-hidden="true"
              />
              <span>{priorityStyle.label}</span>
            </span>

            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
              ·
            </span>

            <span className="font-medium text-slate-600 dark:text-slate-300">
              {task.category}
            </span>

            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
              ·
            </span>

            <span
              className={`inline-flex items-center gap-1 font-mono tabular-nums ${
                overdue
                  ? 'text-rose-600 dark:text-rose-400 font-semibold'
                  : dueToday
                    ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                    : ''
              }`}
            >
              {overdue ? (
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              )}
              <span>
                {formatDisplayDate(task.dueDate)}
                {overdue ? ' · Overdue' : dueToday ? ' · Due today' : ''}
              </span>
            </span>

            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
              ·
            </span>

            <span
              className={
                isCompleted
                  ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                  : 'text-slate-500 dark:text-slate-400'
              }
            >
              {task.status}
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
