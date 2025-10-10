import React from 'react';
import { WarningIcon } from './Icons';
import { COLORS } from '../constants';

interface ApiKeyErrorScreenProps {
  error: string;
}

export const ApiKeyErrorScreen: React.FC<ApiKeyErrorScreenProps> = ({ error }) => {
  return (
    <div style={styles.container}>
      <WarningIcon width={48} height={48} color={COLORS.error} />
      <h1 style={styles.title}>Errore di Autenticazione API</h1>
      <p style={styles.message}>
        Si è verificato un problema con la tua API Key di Google AI Studio.
      </p>
      <p style={styles.errorMessage}>Dettaglio: {error}</p>
      <p style={styles.message}>
        Assicurati che la chiave API inserita sia corretta e non sia scaduta.
        Per risolvere, effettua il logout e accedi nuovamente con una API Key valida.
        Se il problema persiste, genera una nuova chiave dal sito di Google AI Studio.
      </p>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center',
        backgroundColor: COLORS.base,
    },
    title: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        margin: '24px 0 12px',
    },
    message: {
        fontSize: '16px',
        color: COLORS.textSecondary,
        maxWidth: '600px',
        lineHeight: '1.6',
        margin: '0 0 16px 0',
    },
    errorMessage: {
        fontSize: '14px',
        fontFamily: 'monospace',
        backgroundColor: '#f8f9fa',
        color: COLORS.error,
        padding: '16px',
        borderRadius: '12px',
        border: `1px solid ${COLORS.divider}`,
        maxWidth: '600px',
        width: '100%',
        boxSizing: 'border-box',
        wordBreak: 'break-all',
        margin: '16px 0',
        textAlign: 'left',
    },
};
