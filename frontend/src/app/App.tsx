// frontend/src/app/App.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../lib/AuthContext';
import { router } from './router';

// Initialize React Query client with resilient production defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes cache validity
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Do not retry unauthorized or forbidden requests
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled UI Exception caught by RootErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F6F7F5] flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-[#DCE2DC] rounded-lg p-6 shadow-sm text-center">
            <h1 className="text-xl font-semibold text-[#202923] mb-2">
              Application Error
            </h1>
            <p className="text-sm text-[#59655E] mb-6">
              An unexpected client error occurred while rendering the administrative portal.
            </p>
            {this.state.error?.message && (
              <pre className="text-xs bg-red-50 text-red-800 p-3 rounded border border-red-200 text-left mb-6 overflow-x-auto">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="w-full inline-flex justify-center items-center px-4 py-2 bg-[#246B52] hover:bg-[#1D5743] text-white text-sm font-medium rounded transition-colors"
            >
              Return to Operations Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const App: React.FC = () => {
  return (
    <RootErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </RootErrorBoundary>
  );
};

export default App;