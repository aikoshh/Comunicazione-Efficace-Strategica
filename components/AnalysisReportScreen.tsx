import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

// ---- Global fallback overlay (per errori fuori da React) ----
function installGlobalErrorOverlay() {
  const id = 'global-error-overlay';
  if (document.getElementById(id)) return;

  const overlay = document.createElement('div');
  overlay.id = id;
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.background = 'rgba(0,0,0,0.85)';
  overlay.style.color = '#0f0';
  overlay.style.fontFamily = 'monospace';
  overlay.style.whiteSpace = 'pre-wrap';
  overlay.style.fontSize = '14px';
  overlay.style.padding = '16px';
  overlay.style.zIndex = '99999';
  overlay.style.display = 'none';
  overlay.style.overflow = 'auto';
  document.body.appendChild(overlay);

  function show(msg: string) {
    overlay.style.display = 'block';
    overlay.textContent =
      '⚠️ ERRORE FATALE (fuori da React)\n\n' +
      msg +
      '\n\nSuggerimento: apri la console per i dettagli e fai Ctrl+Shift+R per ricaricare senza cache.';
  }

  window.addEventListener('error', (e) => {
    show(`${e.message}\n${e.filename}:${e.lineno}:${(e as any).colno ?? ''}`);
  });

  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    const reason = (e.reason && (e.reason.stack || e.reason.message || String(e.reason))) || 'Promise rejection';
    show(String(reason));
  });
}

installGlobalErrorOverlay();
// -------------------------------------------------------------

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
