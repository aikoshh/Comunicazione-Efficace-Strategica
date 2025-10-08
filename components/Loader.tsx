import React, { useState, useEffect } from 'react';
import { COLORS } from '../constants';

const ESTIMATED_TIME = 12; // Tempo stimato in secondi

export const Loader = () => {
  const [timeLeft, setTimeLeft] = useState(ESTIMATED_TIME);

  useEffect(() => {
    // Imposta l'intervallo del timer
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        // Ferma il timer quando arriva a 0
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // Pulisce l'intervallo quando il componente viene smontato
    return () => clearInterval(timer);
  }, []); // L'array vuoto assicura che l'effetto venga eseguito solo una volta al montaggio

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
