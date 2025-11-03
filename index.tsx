// index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider } from './hooks/useToast';
// UPDATED: Import from the real, centralized firebase service
import { onAuthUserChanged, firebaseInitializationError } from './services/firebase';
import { FullScreenLoader } from './components/Loader';
import { ApiKeyErrorScreen } from './components/ApiKeyErrorScreen';
import type { UserProfile } from './types';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// NEW: Handle initialization failure at the highest level
if (firebaseInitializationError) {
    root.render(
        <React.StrictMode>
            <ApiKeyErrorScreen error={firebaseInitializationError.message} />
        </React.StrictMode>
    );
} else {
    // Register the service worker for PWA capabilities
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, err => {
          console.log('ServiceWorker registration failed: ', err);
        });
      });
    }

    // Render a loader while waiting for auth state
    root.render(<FullScreenLoader estimatedTime={1} />);

    // Set up the "gatekeeper" using the REAL auth state listener
    onAuthUserChanged((user: UserProfile | null) => {
      root.render(
        <React.StrictMode>
          <ToastProvider>
            <App initialUser={user} />
          </ToastProvider>
        </React.StrictMode>
      );
    });
}