import React, { useState } from 'react';
import { COLORS } from '../constants';
import { cesLogoUrl } from '../assets';
import { Spinner } from './Loader';
import { useToast } from '../hooks/useToast';

interface ApiKeySetupScreenProps {
  onKeySubmit: (apiKey: string) => void;
}

export const ApiKeySetupScreen: React.FC<ApiKeySetupScreenProps> = ({ onKeySubmit }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      addToast("La chiave API non può essere vuota.", 'error');
      return;
    }
    setIsLoading(true);
    // Simulate a quick validation check
    setTimeout(() => {
      onKeySubmit(apiKey);
      // We don't need to setIsLoading(false) because the component will unmount
    }, 500);
  };

  const dynamicStyles = `
    .api-key-input::placeholder {
      color: #AAAAAA;
    }
    .api-key-input:focus {
        border-color: ${COLORS.secondary};
        box-shadow: 0 0 0 3px rgba(88, 166, 166, 0.2);
    }
    .submit-button:hover:not(:disabled) {
        transform: translateY(-2px);
        filter: brightness(1.1);
    }
    .submit-button:active:not(:disabled) {
        transform: translateY(0px) scale(0.98);
        filter: brightness(0.95);
    }
    .submit-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
  `;

  return (
    <div style={styles.container}>
      <style>{dynamicStyles}</style>
      <div style={styles.setupBox}>
        <img src={cesLogoUrl} alt="CES Coach Logo" style={styles.logoImage} />
        <h1 style={styles.title}>Configura il tuo Coach</h1>
        <p style={styles.subtitle}>
          Per iniziare, inserisci la tua chiave API di Google Gemini. Questo permette all'applicazione di analizzare le tue risposte e fornirti feedback personalizzati.
        </p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="apiKey" style={styles.label}>Chiave API Gemini</label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={styles.input}
              className="api-key-input"
              placeholder="Incolla qui la tua API Key..."
              required
              disabled={isLoading}
            />
          </div>
          <button type="submit" style={styles.submitButton} className="submit-button" disabled={isLoading}>
            {isLoading ? <Spinner color="white" /> : 'Continua'}
          </button>
        </form>
        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={styles.link}>
          Non hai una chiave API? Ottienila qui
        </a>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '20px',
    backgroundColor: COLORS.base,
  },
  setupBox: {
    backgroundColor: COLORS.card,
    padding: '40px',
    borderRadius: '12px',
    border: `1px solid ${COLORS.divider}`,
    width: '100%',
    maxWidth: '500px',
    textAlign: 'center',
    boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
    animation: 'fadeInUp 0.5s ease-out'
  },
  logoImage: {
    width: '100%',
    maxWidth: '250px',
    height: 'auto',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    color: COLORS.textPrimary,
    marginBottom: '16px',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: '15px',
    color: COLORS.textSecondary,
    margin: '0 auto 32px',
    lineHeight: 1.6,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    textAlign: 'left',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  input: {
    padding: '12px 16px',
    fontSize: '16px',
    borderRadius: '8px',
    border: `1px solid ${COLORS.divider}`,
    fontFamily: 'inherit',
    backgroundColor: '#FFFFFF',
    color: COLORS.textPrimary,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  },
  submitButton: {
    padding: '14px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    background: COLORS.primaryGradient,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'transform 0.2s ease, filter 0.2s ease, opacity 0.2s ease',
    minHeight: '53px'
  },
  link: {
    display: 'inline-block',
    marginTop: '24px',
    color: COLORS.primary,
    textDecoration: 'underline',
    fontSize: '14px',
    fontWeight: 500
  },
};
