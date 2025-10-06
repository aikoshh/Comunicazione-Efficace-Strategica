import React from 'react';
import { WarningIcon, RetryIcon } from './Icons';
import { COLORS } from '../constants';

interface ApiKeyErrorScreenProps {
  error: string;
  onRetry: () => void;
}

export const ApiKeyErrorScreen: React.FC<ApiKeyErrorScreenProps> = ({ error, onRetry }) => {
  return (
    <div style={styles.container}>
      <WarningIcon width={48} height={48} color={COLORS.nero} />
      <h1 style={styles.title}>Errore di Configurazione</h1>
      <p style={styles.message}>
        L'applicazione non è configurata correttamente. Impossibile comunicare con i servizi di analisi.
      </p>
      <p style={styles.errorMessage}>Dettaglio: {error}</p>
      <p style={styles.message}>
        Assicurati che la chiave API sia stata impostata correttamente nell'ambiente di esecuzione come variabile d'ambiente `API_KEY`.
      </p>
      <button onClick={onRetry} style={styles.retryButton}>
        <RetryIcon /> Riprova
      </button>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '20px',
        textAlign: 'center',
        backgroundColor: COLORS.fondo,
        color: COLORS.nero,
    },
    title: {
        fontSize: '24px',
        margin: '20px 0 10px',
    },
    message: {
        fontSize: '16px',
        maxWidth: '500px',
        lineHeight: '1.5',
        marginBottom: '10px',
    },
    errorMessage: {
        fontSize: '14px',
        fontFamily: 'monospace',
        backgroundColor: '#f0f0f0',
        padding: '10px',
        borderRadius: '4px',
        maxWidth: '500px',
        wordBreak: 'break-all',
        margin: '10px 0',
    },
    retryButton: {
        marginTop: '20px',
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: 'bold',
        border: 'none',
        backgroundColor: COLORS.accentoVerde,
        color: 'white',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'background-color 0.2s ease',
    },
};
