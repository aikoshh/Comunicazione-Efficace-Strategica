import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Removed .tsx extension from the import path to resolve module loading issue.
import App from './App';
import { ToastProvider } from './hooks/useToast';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);