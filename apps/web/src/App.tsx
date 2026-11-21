import React from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/stores/authStore";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { AppRouter } from "@/routes/AppRouter";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--ui-surface-2)] p-6">
          <div className="max-w-lg rounded-2xl border border-red-200 bg-white p-6 shadow-md dark:border-red-900/50 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-red-600">Something went wrong</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {this.state.error.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <LocaleProvider>
            <ToastProvider>
              <AuthProvider>
                <AppRouter />
              </AuthProvider>
            </ToastProvider>
          </LocaleProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}

export default App;
