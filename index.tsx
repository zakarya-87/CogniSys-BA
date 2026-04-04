
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initClientSentry } from './src/utils/sentry';
import './index.css';
import './src/i18n'; // Import i18n configuration

// Initialise Sentry before React mounts (no-op if VITE_SENTRY_DSN is unset)
initClientSentry();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <React.Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-background-light dark:bg-background-dark text-primary font-bold">Loading...</div>}>
        <App />
      </React.Suspense>
    </ErrorBoundary>
  </React.StrictMode>
);
