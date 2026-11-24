import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Menu,
  Moon,
  Plus,
  RefreshCw,
  Search,
  Sun,
  X,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import {
  createTaskRequest,
  deleteTaskRequest,
  fetchTasks,
  updateTaskRequest,
} from './lib/api.ts';
import type {
  SortField,
  SortOrder,
  Task,
  TaskFormPayload,
  TaskPriority,
  ViewSection,
} from './types/task.ts';
import { isTaskOverdue } from './utils/date.ts';
import { AuthGate } from './components/AuthGate.tsx';
import { DashboardSummary } from './components/DashboardSummary.tsx';
import { DeleteConfirmModal } from './components/DeleteConfirmModal.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { TaskCard } from './components/TaskCard.tsx';
import { TaskFormModal } from './components/TaskFormModal.tsx';
import {
  ToastContainer,
  type ToastMessage,
} from './components/ToastContainer.tsx';

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

const VIEW_TITLES: Record<ViewSection, string> = {
  all: 'All Tasks',
  pending: 'Pending Tasks',
  completed: 'Completed Tasks',
  overdue: 'Overdue Tasks',
};

function useTheme() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = window.localStorage.getItem('taskflow-theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    window.localStorage.setItem('taskflow-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  return { isDark, toggleTheme };
}

function WorkspaceApp() {
  const { user, loading: authLoading, signingIn, authError, signInWithGoogle, signOutUser } =
    useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<ViewSection>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | TaskPriority>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<`${SortField}:${SortOrder}`>('dueDate:asc');
  const [showCompletedInAll, setShowCompletedInAll] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadTasks = useCallback(async () => {
    if (!user) return;
    setTasksLoading(true);
    setLoadError(null);
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to load tasks.';
      setLoadError(message);
    } finally {
      setTasksLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      void loadTasks();
    } else {
      setTasks([]);
      setLoadError(null);
    }
  }, [user, loadTasks]);

  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const pending = total - completed;
    const overdue = tasks.filter((t) => isTaskOverdue(t)).length;
    const completionPercentage =
      total === 0 ? 0 : Math.round((completed / total) * 100);
    return {
      total,
      pending,
      completed,
      overdue,
      completionPercentage,
    };
  }, [tasks]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const task of tasks) {
      map.set(task.category, (map.get(task.category) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks]);

  const filteredAndSortedTasks = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    const [sortField, sortOrder] = sortOption.split(':') as [
      SortField,
      SortOrder,
    ];

    const filtered = tasks.filter((task) => {
      if (activeView === 'pending' && task.status !== 'Pending') return false;
      if (activeView === 'completed' && task.status !== 'Completed') return false;
      if (activeView === 'overdue' && !isTaskOverdue(task)) return false;

      if (selectedCategory !== 'All' && task.category !== selectedCategory) {
        return false;
      }

      if (priorityFilter !== 'All' && task.priority !== priorityFilter) {
        return false;
      }

      if (term) {
        const matchesTitle = task.title.toLowerCase().includes(term);
        const matchesDesc = task.description.toLowerCase().includes(term);
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'dueDate') {
        cmp = a.dueDate.localeCompare(b.dueDate);
      } else if (sortField === 'priority') {
        cmp = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
      } else {
        cmp = a.createdAt.localeCompare(b.createdAt);
      }
      if (cmp === 0) {
        cmp = a.id - b.id;
      }
      return sortOrder === 'desc' ? -cmp : cmp;
    });
  }, [tasks, activeView, selectedCategory, priorityFilter, searchQuery, sortOption]);

  const pendingInFiltered = useMemo(
    () => filteredAndSortedTasks.filter((t) => t.status === 'Pending'),
    [filteredAndSortedTasks]
  );

  const completedInFiltered = useMemo(
    () => filteredAndSortedTasks.filter((t) => t.status === 'Completed'),
    [filteredAndSortedTasks]
  );

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    priorityFilter !== 'All' ||
    selectedCategory !== 'All' ||
    activeView !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setPriorityFilter('All');
    setSelectedCategory('All');
    setActiveView('all');
  };

  const handleOpenCreate = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (
    payload: TaskFormPayload,
    editingTaskId?: number
  ) => {
    if (editingTaskId) {
      const updated = await updateTaskRequest(editingTaskId, payload);
      setTasks((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      pushToast('success', `Updated "${updated.title}".`);
    } else {
      const created = await createTaskRequest(payload);
      setTasks((prev) => [created, ...prev]);
      pushToast('success', `Added "${created.title}".`);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    setUpdatingIds((prev) => new Set(prev).add(task.id));
    try {
      const updated = await updateTaskRequest(task.id, { status: nextStatus });
      setTasks((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      pushToast(
        'success',
        nextStatus === 'Completed'
          ? `Completed "${updated.title}".`
          : `Reopened "${updated.title}".`
      );
    } catch (err) {
      pushToast(
        'error',
        err instanceof Error ? err.message : 'Unable to update task status.'
      );
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  };

  const handleConfirmDelete = async (task: Task) => {
    try {
      await deleteTaskRequest(task.id);
      setTasks((prev) => prev.filter((item) => item.id !== task.id));
      setDeletingTask(null);
      pushToast('success', `Deleted "${task.title}".`);
    } catch (err) {
      pushToast(
        'error',
        err instanceof Error ? err.message : 'Unable to delete task.'
      );
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Loading workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthGate
        onSignIn={signInWithGoogle}
        signingIn={signingIn}
        authError={authError}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-indigo-50/35 to-sky-50/45 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/25 text-slate-900 dark:text-slate-100">
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categories={categoryCounts}
        counts={{
          all: metrics.total,
          pending: metrics.pending,
          completed: metrics.completed,
          overdue: metrics.overdue,
        }}
        completionPercentage={metrics.completionPercentage}
        user={user}
        onSignOut={signOutUser}
        onNewTask={handleOpenCreate}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50 truncate">
                {VIEW_TITLES[activeView]}
              </h1>
              {selectedCategory !== 'All' && (
                <>
                  <span
                    className="text-slate-300 dark:text-slate-700"
                    aria-hidden="true"
                  >
                    /
                  </span>
                  <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                    {selectedCategory}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Add Task</span>
            </button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
          <DashboardSummary
            total={metrics.total}
            pending={metrics.pending}
            completed={metrics.completed}
            overdue={metrics.overdue}
            completionPercentage={metrics.completionPercentage}
            loading={tasksLoading}
            onSelectView={setActiveView}
          />

          <section
            aria-label="Filter and search controls"
            className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-sm p-4 space-y-3.5"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1 min-w-0">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks by title or description..."
                  aria-label="Search tasks"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950 pl-10 pr-9 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <div className="flex items-center gap-1.5">
                  <ArrowUpDown
                    className="w-4 h-4 text-slate-400 shrink-0"
                    aria-hidden="true"
                  />
                  <label htmlFor="sort-select" className="sr-only">
                    Sort tasks
                  </label>
                  <select
                    id="sort-select"
                    value={sortOption}
                    onChange={(e) =>
                      setSortOption(e.target.value as `${SortField}:${SortOrder}`)
                    }
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="dueDate:asc">Due Date (Soonest)</option>
                    <option value="dueDate:desc">Due Date (Latest)</option>
                    <option value="priority:desc">Priority (High–Low)</option>
                    <option value="priority:asc">Priority (Low–High)</option>
                    <option value="createdAt:desc">Recently Created</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <div
                role="tablist"
                aria-label="Filter by task status"
                className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100/90 dark:bg-slate-800/80"
              >
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'pending', label: 'Pending' },
                    { id: 'completed', label: 'Completed' },
                    { id: 'overdue', label: 'Overdue' },
                  ] as const
                ).map((tab) => {
                  const selected = activeView === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setActiveView(tab.id)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        selected
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
                  Priority:
                </span>
                {(['All', 'High', 'Medium', 'Low'] as const).map((level) => {
                  const active = priorityFilter === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setPriorityFilter(level)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {loadError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-4 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 text-sm text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{loadError}</span>
              </div>
              <button
                type="button"
                onClick={() => void loadTasks()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {tasksLoading ? (
            <div className="space-y-3" aria-label="Loading tasks">
              {[1, 2, 3, 4].map((skeleton) => (
                <div
                  key={skeleton}
                  className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 p-5 animate-pulse"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                    <div className="flex-1 space-y-2.5">
                      <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
                      <div className="h-3.5 w-2/3 rounded bg-slate-100 dark:bg-slate-800/70" />
                      <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800/60" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAndSortedTasks.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/85 dark:bg-slate-900/80 px-6 py-14 text-center">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {tasks.length === 0
                  ? 'No tasks created yet'
                  : 'No tasks match your active filters'}
              </h2>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {tasks.length === 0
                  ? 'Add your first task with a priority, category, and due date to start tracking your progress.'
                  : 'Try adjusting your search query, priority level, or status tab to view other tasks.'}
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                {hasActiveFilters && tasks.length > 0 && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>{tasks.length === 0 ? 'Create First Task' : 'New Task'}</span>
                </button>
              </div>
            </div>
          ) : activeView === 'all' ? (
            <div className="space-y-8">
              <section aria-label="Pending tasks" className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Pending Tasks{' '}
                    <span className="ml-1 font-mono tabular-nums text-slate-400 dark:text-slate-500">
                      ({pendingInFiltered.length})
                    </span>
                  </h2>
                </div>

                {pendingInFiltered.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 px-5 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    All tasks in this view are completed.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence initial={false}>
                      {pendingInFiltered.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onToggleStatus={handleToggleStatus}
                          onEdit={handleOpenEdit}
                          onRequestDelete={setDeletingTask}
                          isUpdating={updatingIds.has(task.id)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </section>

              {completedInFiltered.length > 0 && (
                <section aria-label="Completed tasks" className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowCompletedInAll((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
                  >
                    {showCompletedInAll ? (
                      <ChevronDown className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    )}
                    <span>
                      Completed Tasks{' '}
                      <span className="ml-1 font-mono tabular-nums text-slate-400 dark:text-slate-500">
                        ({completedInFiltered.length})
                      </span>
                    </span>
                  </button>

                  {showCompletedInAll && (
                    <div className="space-y-3">
                      <AnimatePresence initial={false}>
                        {completedInFiltered.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onToggleStatus={handleToggleStatus}
                            onEdit={handleOpenEdit}
                            onRequestDelete={setDeletingTask}
                            isUpdating={updatingIds.has(task.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </section>
              )}
            </div>
          ) : (
            <section aria-label={VIEW_TITLES[activeView]} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {VIEW_TITLES[activeView]}{' '}
                  <span className="ml-1 font-mono tabular-nums text-slate-400 dark:text-slate-500">
                    ({filteredAndSortedTasks.length})
                  </span>
                </h2>
              </div>
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {filteredAndSortedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleStatus={handleToggleStatus}
                      onEdit={handleOpenEdit}
                      onRequestDelete={setDeletingTask}
                      isUpdating={updatingIds.has(task.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}
        </main>
      </div>

      <TaskFormModal
        isOpen={isFormOpen}
        editingTask={editingTask}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <DeleteConfirmModal
        task={deletingTask}
        onCancel={() => setDeletingTask(null)}
        onConfirm={handleConfirmDelete}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WorkspaceApp />
    </AuthProvider>
  );
}
