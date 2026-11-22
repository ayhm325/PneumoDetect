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
        <div className="flex min-h-screen items-center justify-center bg-[var(--pd-canvas)] p-6 text-[var(--pd-text-primary)]">
          <div className="pd-panel pd-panel--feature max-w-lg border-[color-mix(in_srgb,var(--pd-coral)_36%,transparent)] p-6">
            <h2 className="text-lg font-semibold text-[var(--pd-coral)]">Something went wrong</h2>
            <p className="mt-2 text-sm text-[var(--pd-text-secondary)]">
              {this.state.error.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="pd-btn pd-btn--primary pd-btn--sm mt-5"
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
