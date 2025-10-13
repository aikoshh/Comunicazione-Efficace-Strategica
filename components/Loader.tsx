import React, { useState, useEffect } from 'react';
import { COLORS } from '../constants';

const DEFAULT_ESTIMATED_TIME = 15; // Default time in seconds

interface LoaderProps {
  estimatedTime?: number;
}

export const Loader: React.FC<LoaderProps> = ({ estimatedTime = DEFAULT_ESTIMATED_TIME }) => {
  const [timeLeft, setTimeLeft] = useState(estimatedTime);

  useEffect(() => {
    // Resetta il timer se il componente viene ri-renderizzato con un nuovo tempo
    setTimeLeft(estimatedTime);
    
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [estimatedTime]); // L'effetto si riattiva se la prop `estimatedTime` cambia

  return (
    <div style={styles.container}>
      <img
        src="https://i.gifer.com/ZNeT.gif"
        alt="Analisi in corso..."
        style={styles.gif}
      />
      <p style={styles.text}>Analisi in corso...</p>
      <p style={styles.subtext}>L'AI sta elaborando la tua risposta, attendi qualche istante.</p>
      <div style={styles.countdownContainer}>
        {timeLeft > 0 ? (
          <p style={styles.countdownText}>
            Tempo stimato: <strong style={styles.countdownNumber}>{timeLeft}s</strong>
          </p>
        ) : (
          <p style={styles.countdownText}>Elaborazione quasi completata...</p>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    textAlign: 'center',
    backgroundColor: COLORS.base,
  },
  gif: {
    width: '150px',
    height: '150px',
    marginBottom: '16px',
  },
  text: {
    marginTop: '16px',
    color: COLORS.textPrimary,
    fontSize: '20px',
    fontWeight: 500,
    margin: '16px 0 8px 0',
  },
  subtext: {
    color: COLORS.textSecondary,
    fontSize: '16px',
    maxWidth: '320px',
    lineHeight: 1.5,
    margin: 0,
  },
  countdownContainer: {
    marginTop: '24px',
    padding: '8px 24px',
    borderRadius: '16px',
    backgroundColor: COLORS.cardDark,
    border: `1px solid ${COLORS.divider}`,
    minHeight: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  countdownText: {
    color: COLORS.textSecondary,
    fontSize: '16px',
    margin: 0,
  },
  countdownNumber: {
    color: COLORS.primary,
    fontWeight: 700,
    fontSize: '18px',
    minWidth: '30px', // Evita sfarfallio quando le cifre cambiano
    display: 'inline-block'
  },
};