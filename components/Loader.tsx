import React, { useState, useEffect } from 'react';
import { COLORS } from '../constants';

const DEFAULT_ESTIMATED_TIME = 15; // Default time in seconds

const loadingPhrases = [
    "“La singola più grande differenza tra comunicazione e illusione è il risultato.” - Milton Erickson",
    "“Le parole giuste possono essere poche, ma trovare quelle giuste è il difficile.” - Mark Twain",
    "“Il modo in cui comunichiamo con gli altri e con noi stessi determina la qualità delle nostre vite.” - Tony Robbins",
    "“Non ascoltiamo per rispondere. Ascoltiamo per comprendere.” - Stephen Covey",
    "L'AI sta analizzando il ritmo, il tono e le pause strategiche...",
    "Stiamo calibrando il feedback sulla base dei principi CES®...",
];

interface LoaderProps {
  estimatedTime?: number;
}

const OrangeSpinner: React.FC<{ size?: number; color?: string }> = ({ size = 80, color = COLORS.warning }) => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <style>{`
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `}</style>
        <svg 
            style={{ animation: 'spin 1.2s linear infinite' }}
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M12 2V6" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4.93 4.93L7.76 7.76" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}/>
            <path d="M2 12H6" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}/>
            <path d="M4.93 19.07L7.76 16.24" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}/>
            <path d="M12 18V22" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2 }}/>
        </svg>
    </div>
);

export const FullScreenLoader: React.FC<LoaderProps> = ({ estimatedTime = DEFAULT_ESTIMATED_TIME }) => {
  const [timeLeft, setTimeLeft] = useState(estimatedTime);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  useEffect(() => {
    setTimeLeft(estimatedTime);
    
    const timer = setInterval(() => {
      setTimeLeft(prevTime => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    const phraseTimer = setInterval(() => {
        setCurrentPhraseIndex(prevIndex => (prevIndex + 1) % loadingPhrases.length);
    }, 4000);

    return () => {
        clearInterval(timer);
        clearInterval(phraseTimer);
    };
  }, [estimatedTime]);

  return (
    <div style={styles.container}>
        <style>{`
            @keyframes slow-blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
            }
            @keyframes phrase-fade {
                0%, 100% { opacity: 0; }
                20%, 80% { opacity: 1; }
            }
        `}</style>
      <OrangeSpinner />
      <p style={{...styles.text, animation: 'slow-blink 2s infinite ease-in-out'}}>Analisi in corso...</p>
      
      <p key={currentPhraseIndex} style={styles.subtext}>
        {loadingPhrases[currentPhraseIndex]}
      </p>

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
    padding: '20px',
  },
  text: {
    marginTop: '24px',
    color: COLORS.textPrimary,
    fontSize: '22px',
    fontWeight: 600,
    margin: '24px 0 8px 0',
  },
  subtext: {
    color: COLORS.textSecondary,
    fontSize: '16px',
    maxWidth: '400px',
    lineHeight: 1.6,
    margin: 0,
    height: '70px', // Reserve space to avoid layout shifts
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontStyle: 'italic',
    animation: 'phrase-fade 4s infinite ease-in-out',
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
