import { useEffect, useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Loader2, X } from 'lucide-react';
import {
  TASK_CATEGORIES,
  type Task,
  type TaskFormPayload,
  type TaskPriority,
  type TaskStatus,
} from '../types/task.ts';
import { getTodayISO } from '../utils/date.ts';

interface TaskFormModalProps {
  isOpen: boolean;
  editingTask: Task | null;
  onClose: () => void;
  onSubmit: (payload: TaskFormPayload, editingTaskId?: number) => Promise<void>;
}

const PRIORITIES: {
  value: TaskPriority;
  label: string;
  activeClass: string;
}[] = [
  {
    value: 'High',
    label: 'High',
    activeClass:
      'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700',
  },
  {
    value: 'Medium',
    label: 'Medium',
    activeClass:
      'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
  },
  {
    value: 'Low',
    label: 'Low',
    activeClass:
      'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
  },
];

export function TaskFormModal({
  isOpen,
  editingTask,
  onClose,
  onSubmit,
}: TaskFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [categorySelect, setCategorySelect] = useState<string>('Work');
  const [customCategory, setCustomCategory] = useState('');
  const [dueDate, setDueDate] = useState(getTodayISO());
  const [status, setStatus] = useState<TaskStatus>('Pending');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setValidationError(null);
    setSubmitting(false);

    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description);
      setPriority(editingTask.priority);
      const isPreset = (TASK_CATEGORIES as readonly string[]).includes(
        editingTask.category
      );
      if (isPreset) {
        setCategorySelect(editingTask.category);
        setCustomCategory('');
      } else {
        setCategorySelect('__custom__');
        setCustomCategory(editingTask.category);
      }
      setDueDate(editingTask.dueDate);
      setStatus(editingTask.status);
    } else {
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setCategorySelect('Work');
      setCustomCategory('');
      setDueDate(getTodayISO());
      setStatus('Pending');
    }
  }, [isOpen, editingTask]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const resolvedCategory =
    categorySelect === '__custom__' ? customCategory.trim() : categorySelect;

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError('Please enter a task title before saving.');
      return;
    }
    if (trimmedTitle.length > 255) {
      setValidationError('Task title must be 255 characters or fewer.');
      return;
    }
    if (!resolvedCategory) {
      setValidationError('Please select or enter a task category.');
      return;
    }
    if (resolvedCategory.length > 64) {
      setValidationError('Category name must be 64 characters or fewer.');
      return;
    }
    if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      setValidationError('Please choose a valid due date.');
      return;
    }

    setValidationError(null);
    setSubmitting(true);
    try {
      await onSubmit(
        {
          title: trimmedTitle,
          description: description.trim(),
          priority,
          category: resolvedCategory,
          dueDate,
          status,
        },
        editingTask?.id
      );
      onClose();
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : 'Unable to save task.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div
        className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs"
        onClick={() => !submitting && onClose()}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2
            id="task-modal-title"
            className="text-lg font-bold text-slate-900 dark:text-slate-50"
          >
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close dialog"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} noValidate className="p-6 space-y-5">
          {validationError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-sm text-rose-700 dark:text-rose-300"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{validationError}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="task-title"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5"
            >
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              required
              maxLength={255}
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Finalize Q4 release checklist"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="task-description"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5"
            >
              Description
            </label>
            <textarea
              id="task-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add helpful context, subtasks, or links..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
              Priority <span className="text-rose-500">*</span>
            </span>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITIES.map((p) => {
                const selected = priority === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`py-2 px-3 rounded-xl border text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap cursor-pointer ${
                      selected
                        ? p.activeClass
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="task-category"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5"
              >
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                id="task-category"
                value={categorySelect}
                onChange={(e) => setCategorySelect(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {TASK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="__custom__">Custom category...</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="task-due-date"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5"
              >
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="task-due-date"
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {categorySelect === '__custom__' && (
            <div>
              <label
                htmlFor="task-custom-category"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5"
              >
                Custom Category Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="task-custom-category"
                type="text"
                maxLength={64}
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g. Learning, Travel, Operations"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          )}

          {editingTask && (
            <div>
              <span className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                Status
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(['Pending', 'Completed'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`py-2 px-3 rounded-xl border text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap cursor-pointer ${
                      status === s
                        ? s === 'Completed'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                          : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {submitting && (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              )}
              <span>{editingTask ? 'Save Changes' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
