import React, { useState, useEffect } from 'react';
import { COLORS } from '../constants';

const DEFAULT_ESTIMATED_TIME = 15; // Default time in seconds

const loadingTips = [
    "L'ascolto è la metà silenziosa della comunicazione.",
    "Una domanda ben posta è più potente di mille affermazioni.",
    "La chiarezza non è dire tutto, ma dire l'essenziale.",
    "L'empatia è vedere con gli occhi di un altro e sentire con il cuore di un altro.",
    "Un feedback efficace si concentra sul comportamento, non sulla persona.",
    "Le pause strategiche danno peso alle tue parole e tempo per pensare.",
    "L'obiettivo di una conversazione difficile non è vincere, ma progredire insieme."
];

interface LoaderProps {
  estimatedTime?: number;
}

export const FullScreenLoader: React.FC<LoaderProps> = ({ estimatedTime = DEFAULT_ESTIMATED_TIME }) => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [countdown, setCountdown] = useState(estimatedTime);

  useEffect(() => {
    const tipInterval = setInterval(() => {
        setCurrentTipIndex(prevIndex => (prevIndex + 1) % loadingTips.length);
    }, 4000); // Change tip every 4 seconds

    return () => clearInterval(tipInterval);
  }, []);

  useEffect(() => {
    // Start countdown immediately when the component is shown
    setCountdown(estimatedTime);
    const countdownInterval = setInterval(() => {
        setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [estimatedTime]);

  const dynamicStyles = `
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `;

  return (
    <div style={styles.container}>
      <style>{dynamicStyles}</style>
      <Spinner size={120} color={COLORS.warning} />
      <h2 style={{...styles.text, animation: 'blink 1.5s linear infinite'}}>Analisi in corso...</h2>
      <p style={styles.subtext}>L'AI sta elaborando la tua risposta per darti un feedback strategico.</p>
      <p style={styles.countdownText}>
        Tempo stimato rimanente: {countdown} secondi
      </p>
      <div style={styles.tipContainer}>
        <p key={currentTipIndex} style={styles.tipText}>
          {loadingTips[currentTipIndex]}
        </p>
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
    padding: '20px'
  },
  text: {
    color: COLORS.textPrimary,
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '24px 0 8px 0',
  },
  subtext: {
    color: COLORS.textSecondary,
    fontSize: '16px',
    maxWidth: '350px',
    lineHeight: 1.5,
    margin: 0,
  },
  countdownText: {
    color: COLORS.textPrimary,
    fontSize: '18px',
    fontWeight: 500,
    margin: '16px 0 0 0',
  },
  tipContainer: {
    marginTop: '32px',
    padding: '16px 24px',
    borderRadius: '12px',
    backgroundColor: COLORS.cardDark,
    border: `1px solid ${COLORS.divider}`,
    minHeight: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '450px',
    boxSizing: 'border-box'
  },
  tipText: {
    color: COLORS.textPrimary,
    fontSize: '15px',
    fontStyle: 'italic',
    margin: 0,
    animation: 'fadeInUp 0.5s ease-out'
  },
};