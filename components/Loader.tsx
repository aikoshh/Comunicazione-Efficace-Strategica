import React, { useState, useEffect } from 'react';
import { COLORS } from '../constants';

const DEFAULT_ESTIMATED_TIME = 15; // Default time in seconds

interface LoaderProps {
  estimatedTime?: number;
}

export const FullScreenLoader: React.FC<LoaderProps> = ({ estimatedTime = DEFAULT_ESTIMATED_TIME }) => {
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

export const Spinner: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = 'currentColor' }) => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <style>{`
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `}</style>
        <svg 
            style={{ animation: 'spin 1s linear infinite' }}
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M12 2V6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 18V22" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}/>
            <path d="M4.93 4.93L7.76 7.76" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.9 }}/>
            <path d="M16.24 16.24L19.07 19.07" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}/>
            <path d="M2 12H6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}/>
            <path d="M18 12H22" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}/>
            <path d="M4.93 19.07L7.76 16.24" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}/>
            <path d="M16.24 7.76L19.07 4.93" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2 }}/>
        </svg>
    </div>
);


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