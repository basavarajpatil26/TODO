import { AlertTriangle, CheckCircle2, Clock, ListTodo } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardSummaryProps {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  completionPercentage: number;
  loading: boolean;
  onSelectView: (view: 'all' | 'pending' | 'completed' | 'overdue') => void;
}

export function DashboardSummary({
  total,
  pending,
  completed,
  overdue,
  completionPercentage,
  loading,
  onSelectView,
}: DashboardSummaryProps) {
  const cards = [
    {
      key: 'all' as const,
      label: 'Total Tasks',
      value: total,
      detail: total === 1 ? '1 tracked item' : `${total} tracked items`,
      icon: ListTodo,
      accentText: 'text-indigo-600 dark:text-indigo-400',
      surfaceHover: 'hover:border-indigo-300 dark:hover:border-indigo-700',
    },
    {
      key: 'pending' as const,
      label: 'Pending Tasks',
      value: pending,
      detail: pending === 0 ? 'Queue clear' : 'Active in queue',
      icon: Clock,
      accentText: 'text-amber-600 dark:text-amber-400',
      surfaceHover: 'hover:border-amber-300 dark:hover:border-amber-700',
    },
    {
      key: 'completed' as const,
      label: 'Completed Tasks',
      value: completed,
      detail: `${completionPercentage}% completion rate`,
      icon: CheckCircle2,
      accentText: 'text-emerald-600 dark:text-emerald-400',
      surfaceHover: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    },
    {
      key: 'overdue' as const,
      label: 'Overdue Tasks',
      value: overdue,
      detail: overdue > 0 ? 'Past due date' : 'On schedule',
      icon: AlertTriangle,
      accentText:
        overdue > 0
          ? 'text-rose-600 dark:text-rose-400'
          : 'text-slate-500 dark:text-slate-400',
      surfaceHover:
        overdue > 0
          ? 'hover:border-rose-300 dark:hover:border-rose-700'
          : 'hover:border-slate-300 dark:hover:border-slate-700',
    },
  ];

  return (
    <section aria-label="Task summary metrics" className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => onSelectView(card.key)}
              className={`group text-left rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-sm p-5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${card.surfaceHover}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {card.label}
                </span>
                <Icon
                  className={`w-4 h-4 shrink-0 ${card.accentText}`}
                  aria-hidden="true"
                />
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-2">
                {loading ? (
                  <div className="h-8 w-14 rounded-md bg-slate-200 dark:bg-slate-800 animate-pulse" />
                ) : (
                  <span className="text-2xl font-bold tracking-tight font-mono tabular-nums text-slate-900 dark:text-slate-50">
                    {card.value}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                {card.detail}
              </p>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-sm px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
            <span>Overall Progress</span>
            <span className="text-slate-400 dark:text-slate-600" aria-hidden="true">
              ·
            </span>
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              {completed} of {total} completed
            </span>
          </div>
          <span className="text-sm font-semibold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
            {completionPercentage}%
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={completionPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Task completion percentage"
          className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
        >
          <motion.div
            initial={false}
            animate={{ scaleX: completionPercentage / 100 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'left' }}
            className="h-full w-full rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 dark:from-indigo-500 dark:to-sky-400"
          />
        </div>
      </div>
    </section>
  );
}
