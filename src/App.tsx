import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { SWRConfig } from 'swr';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/auth/context/auth-provider';
import { TourProvider } from '@/context/tour/tour-provider';
import { AppRouter } from '@/routes';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-destructive/5 p-10">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-lg border border-destructive/50 bg-background p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-destructive/10 p-2">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <h1 className="text-2xl font-semibold text-destructive">
                  Something went wrong
                </h1>
              </div>
              <p className="text-destructive/80 mb-6">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors mb-6"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </button>
              {this.state.error?.stack && (
                <pre className="rounded-md bg-muted p-4 overflow-auto max-h-96 text-xs text-muted-foreground font-mono">
                  {this.state.error.stack}
                </pre>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <SWRConfig
          value={{
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
            refreshWhenHidden: true,
            refreshWhenOffline: true,
          }}
        >
          <BrowserRouter>
            <AuthProvider>
              <TourProvider>
                <AppRouter />
                <Toaster />
              </TourProvider>
            </AuthProvider>
          </BrowserRouter>
        </SWRConfig>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
