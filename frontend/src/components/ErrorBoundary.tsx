"use client";

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  fallbackRender?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
    
    if (typeof window !== 'undefined' && (window as Window & { Sentry?: { captureException: (error: Error, options: { extra: ErrorInfo }) => void } }).Sentry) {
      (window as Window & { Sentry?: { captureException: (error: Error, options: { extra: ErrorInfo }) => void } }).Sentry?.captureException(error, { extra: errorInfo });
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackRender) {
        return this.props.fallbackRender(this.state.error!, this.reset);
      }
      
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-red-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Something went wrong</h3>
          <p className="text-[#64748b] mb-4">{this.state.error?.message}</p>
          <button
            onClick={this.reset}
            className="px-4 py-2 bg-gradient-to-r from-[#ff4b1f] to-[#06b6d4] text-white rounded-xl font-medium hover:shadow-[0_0_20px_rgba(255,75,31,0.4)] transition-all"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps: Omit<Props, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

export function WidgetErrorBoundary({ 
  name, 
  children, 
  onError 
}: { 
  name: string; 
  children: ReactNode; 
  onError?: (error: Error) => void;
}) {
  return (
    <ErrorBoundary
      onError={onError}
      fallbackRender={(error, reset) => (
        <div className="bg-[#1e293b]/50 rounded-2xl border border-red-500/30 p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-3 text-red-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h4 className="font-medium text-white mb-1">{name} unavailable</h4>
          <p className="text-sm text-[#64748b] mb-4">{error.message}</p>
          <button
            onClick={reset}
            className="px-3 py-1.5 text-sm bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}