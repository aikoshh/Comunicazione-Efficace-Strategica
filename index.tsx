import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider } from './hooks/useToast';
import { LocalizationProvider } from './context/LocalizationContext';
import { SoundProvider } from './hooks/useSound';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ToastProvider>
      <LocalizationProvider>
        <SoundProvider>
          <App />
        </SoundProvider>
      </LocalizationProvider>
    </ToastProvider>
  </React.StrictMode>
);