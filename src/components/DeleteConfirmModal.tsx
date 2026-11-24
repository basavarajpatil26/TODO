import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import type { Task } from '../types/task.ts';

interface DeleteConfirmModalProps {
  task: Task | null;
  onCancel: () => void;
  onConfirm: (task: Task) => Promise<void>;
}

export function DeleteConfirmModal({
  task,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setDeleting(false);
  }, [task]);

  useEffect(() => {
    if (!task) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleting) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [task, deleting, onCancel]);

  if (!task) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm(task);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div
        className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs"
        onClick={() => !deleting && onCancel()}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/70 flex items-center justify-center shrink-0">
              <AlertTriangle
                className="w-5 h-5 text-rose-600 dark:text-rose-400"
                aria-hidden="true"
              />
            </div>
            <div>
              <h2
                id="delete-modal-title"
                className="text-base font-bold text-slate-900 dark:text-slate-50"
              >
                Delete Task
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                This action cannot be undone.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            aria-label="Cancel deletion"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Are you sure you want to permanently delete{' '}
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            &ldquo;{task.title}&rdquo;
          </span>
          ?
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {deleting && (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            )}
            <span>Delete Task</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
