import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Folder,
  Layers,
  LogOut,
  Plus,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { User } from 'firebase/auth';
import type { ViewSection } from '../types/task.ts';

interface CategoryCount {
  name: string;
  count: number;
}

interface SidebarProps {
  activeView: ViewSection;
  onSelectView: (view: ViewSection) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categories: CategoryCount[];
  counts: {
    all: number;
    pending: number;
    completed: number;
    overdue: number;
  };
  completionPercentage: number;
  user: User;
  onSignOut: () => void;
  onNewTask: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeView,
  onSelectView,
  selectedCategory,
  onSelectCategory,
  categories,
  counts,
  completionPercentage,
  user,
  onSignOut,
  onNewTask,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const [avatarFailed, setAvatarFailed] = useState(false);

  const navItems: {
    id: ViewSection;
    label: string;
    count: number;
    icon: typeof Layers;
    highlight?: boolean;
  }[] = [
    { id: 'all', label: 'All Tasks', count: counts.all, icon: Layers },
    { id: 'pending', label: 'Pending', count: counts.pending, icon: Clock },
    {
      id: 'completed',
      label: 'Completed',
      count: counts.completed,
      icon: CheckCircle2,
    },
    {
      id: 'overdue',
      label: 'Overdue',
      count: counts.overdue,
      icon: AlertTriangle,
      highlight: counts.overdue > 0,
    },
  ];

  const initials = (user.displayName || user.email || 'U')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  const handleViewClick = (view: ViewSection) => {
    onSelectView(view);
    onCloseMobile();
  };

  const handleCategoryClick = (category: string) => {
    onSelectCategory(category);
    onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full bg-white/90 dark:bg-slate-900/95 backdrop-blur-md border-r border-slate-200/90 dark:border-slate-800 w-[264px]">
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
        <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap shrink-0">
          TaskFlow
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 shrink-0">
        <button
          type="button"
          onClick={() => {
            onNewTask();
            onCloseMobile();
          }}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>New Task</span>
        </button>
      </div>

      <nav
        aria-label="Task views"
        className="flex-1 overflow-y-auto px-3 space-y-6 pb-4"
      >
        <div>
          <p className="px-3 mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wide">
            Views
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleViewClick(item.id)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : item.highlight
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-400 dark:text-slate-500'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="truncate whitespace-nowrap">
                        {item.label}
                      </span>
                    </span>
                    <span
                      className={`text-xs font-mono tabular-nums shrink-0 ${
                        item.highlight && !isActive
                          ? 'text-rose-600 dark:text-rose-400 font-semibold'
                          : isActive
                            ? 'text-indigo-600 dark:text-indigo-300 font-semibold'
                            : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {item.count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <p className="px-3 mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wide">
            Categories
          </p>
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                onClick={() => handleCategoryClick('All')}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer ${
                  selectedCategory === 'All'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Folder
                    className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500"
                    aria-hidden="true"
                  />
                  <span className="truncate whitespace-nowrap">
                    All Categories
                  </span>
                </span>
                <span className="text-xs font-mono tabular-nums text-slate-400 dark:text-slate-500">
                  {counts.all}
                </span>
              </button>
            </li>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <li key={cat.name}>
                  <button
                    type="button"
                    onClick={() => handleCategoryClick(cat.name)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="truncate whitespace-nowrap pl-6">
                      {cat.name}
                    </span>
                    <span className="text-xs font-mono tabular-nums text-slate-400 dark:text-slate-500 shrink-0">
                      {cat.count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3 shrink-0">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Completion</span>
          <span className="font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-200">
            {completionPercentage}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-2.5 pt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            {user.photoURL && !avatarFailed ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User avatar'}
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center justify-center shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                {user.displayName || 'Account'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            title="Sign out"
            aria-label="Sign out"
            className="p-2 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-50 h-full">{content}</aside>
        </div>
      )}
    </>
  );
}
