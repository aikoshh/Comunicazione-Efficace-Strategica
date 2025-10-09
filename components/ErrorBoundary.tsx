import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, message: String(error?.message || error) };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // Qui puoi loggare su console o servizio esterno
    console.error('React error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding: 24, maxWidth: 800, margin: '40px auto', fontFamily: 'sans-serif'}}>
          <h1>Si è verificato un errore</h1>
          <p>Ricarica la pagina o torna indietro. Di seguito il dettaglio tecnico (solo per debug):</p>
          <pre style={{background:'#111', color:'#0f0', padding:12, borderRadius:8, overflow:'auto'}}>
            {this.state.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
