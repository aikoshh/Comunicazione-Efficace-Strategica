import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ✅ importa il CSS qui: Vite gestirà il file e in produzione genererà l'hash corretto
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
