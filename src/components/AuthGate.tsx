import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Layers,
  Loader2,
  Moon,
  Sun,
} from 'lucide-react';

interface AuthGateProps {
  onSignIn: () => void;
  signingIn: boolean;
  authError: string | null;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function AuthGate({
  onSignIn,
  signingIn,
  authError,
  isDark,
  onToggleTheme,
}: AuthGateProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-indigo-50/40 to-sky-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
      <header className="flex items-center justify-between gap-8 px-6 py-4 max-w-6xl w-full mx-auto">
        <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap shrink-0">
          TaskFlow
        </span>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 text-balance">
                Stay ahead of every deadline with structured daily focus.
              </h1>
              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Organize priorities, separate pending work from completed
                milestones, and track overdue deliverables in one persistent
                workspace.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/75 dark:bg-slate-900/75 p-4">
                <Layers
                  className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                  aria-hidden="true"
                />
                <h2 className="mt-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Priority &amp; Categories
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Classify tasks by urgency and domain for rapid filtering.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/75 dark:bg-slate-900/75 p-4">
                <CalendarClock
                  className="w-5 h-5 text-amber-600 dark:text-amber-400"
                  aria-hidden="true"
                />
                <h2 className="mt-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Due Date Alerts
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Spot approaching and overdue work automatically.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/75 dark:bg-slate-900/75 p-4">
                <CheckCircle2
                  className="w-5 h-5 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
                <h2 className="mt-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Live Progress
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Monitor completion rates across your active task list.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex items-center">
            <div className="w-full rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-7 shadow-xl">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Sign in to your workspace
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Your tasks are synced securely to your account so you can access
                them across sessions.
              </p>

              {authError && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-3.5 py-3 text-xs text-rose-700 dark:text-rose-300"
                >
                  <AlertCircle
                    className="w-4 h-4 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={onSignIn}
                disabled={signingIn}
                className="mt-6 w-full inline-flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60 cursor-pointer"
              >
                {signingIn ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <svg
                    className="w-4 h-4 shrink-0"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"
                    />
                  </svg>
                )}
                <span>
                  {signingIn ? 'Signing in...' : 'Continue with Google'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
