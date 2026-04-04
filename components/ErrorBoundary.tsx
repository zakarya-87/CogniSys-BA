
import React, { ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/Button";
import { Sentry } from "../src/utils/sentry";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const ExclamationTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

// Fixed: Explicitly use React.Component to resolve type errors with setState and props
export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report to Sentry if initialised (no-op if DSN not configured)
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 text-center">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full border border-red-100 dark:border-red-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
              <ExclamationTriangleIcon className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
              The application encountered an unexpected error.
            </p>
            <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-md mb-6 text-left overflow-auto max-h-32">
                <code className="text-xs text-red-800 dark:text-red-300 font-mono">
                    {this.state.error?.message || "Unknown Error"}
                </code>
            </div>
            <div className="flex gap-3 justify-center">
                <Button onClick={() => window.location.reload()}>
                Reload Application
                </Button>
                <button 
                    onClick={() => this.setState({ hasError: false, error: null })}
                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:underline"
                >
                    Try to Recover
                </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}