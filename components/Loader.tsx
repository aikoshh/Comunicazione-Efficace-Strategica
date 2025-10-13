import React, { useState, useEffect } from 'react';
import { COLORS } from '../constants';
import { useLocalization } from '../context/LocalizationContext';
import { translations } from '../locales/translations';

const DEFAULT_ESTIMATED_TIME = 15;

interface LoaderProps {
  estimatedTime?: number;
}

const loadingTips = {
    it: [
        "Respira. Una comunicazione calma è una comunicazione efficace.",
        "Ricorda l'obiettivo: cosa vuoi ottenere da questa interazione?",
        "L'ascolto è il superpotere nascosto di ogni grande comunicatore.",
        "\"Le parole giuste al momento giusto sono azione.\" - G. Nardone",
        "La chiarezza batte la complessità. Sempre.",
        "L'empatia non è essere d'accordo, è capire.",
        "Una pausa strategica può essere più potente di mille parole.",
        "Concentrati sui fatti, non sulle interpretazioni.",
    ],
    en: [
        "Breathe. Calm communication is effective communication.",
        "Remember the goal: what do you want to achieve with this interaction?",
        "Listening is the hidden superpower of every great communicator.",
        "\"The right words at the right time are action.\" - G. Nardone",
        "Clarity beats complexity. Always.",
        "Empathy isn't agreeing, it's understanding.",
        "A strategic pause can be more powerful than a thousand words.",
        "Focus on facts, not interpretations.",
    ]
};

export const FullScreenLoader: React.FC<LoaderProps> = ({ estimatedTime = DEFAULT_ESTIMATED_TIME }) => {
  const [timeLeft, setTimeLeft] = useState(estimatedTime);
  const [currentTip, setCurrentTip] = useState('');
  const { lang, t } = useLocalization();

  useEffect(() => {
    setTimeLeft(estimatedTime);
    
    const timer = setInterval(() => {
      setTimeLeft(prevTime => (prevTime <= 1 ? 0 : prevTime - 1));
    }, 1000);

    const tips = loadingTips[lang];
    setCurrentTip(tips[Math.floor(Math.random() * tips.length)]);
    const tipInterval = setInterval(() => {
        setCurrentTip(tips[Math.floor(Math.random() * tips.length)]);
    }, 4000);

    return () => {
        clearInterval(timer);
        clearInterval(tipInterval);
    };
  }, [estimatedTime, lang]);

  return (
    <div style={styles.container}>
        <style>{`
            @keyframes slow-blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
            }
        `}</style>
      <Spinner size={64} color="#E67E22" />
      <p style={{...styles.text, animation: 'slow-blink 2s infinite ease-in-out'}}>{t('analysisInProgress')}</p>
      <p style={styles.tipText}>"{currentTip}"</p>
      
      <div style={styles.countdownContainer}>
        {timeLeft > 0 ? (
          <p style={styles.countdownText}>
            {t('estimatedTime')}: <strong style={styles.countdownNumber}>{timeLeft}s</strong>
          </p>
        ) : (
          <p style={styles.countdownText}>{t('finishingUp')}</p>
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
    padding: '20px'
  },
  text: {
    marginTop: '24px',
    color: COLORS.textPrimary,
    fontSize: '22px',
    fontWeight: 'bold',
    margin: '24px 0 8px 0',
  },
  tipText: {
    color: COLORS.textSecondary,
    fontSize: '16px',
    maxWidth: '350px',
    lineHeight: 1.5,
    margin: '16px 0',
    minHeight: '48px', // Prevent layout shifts
    fontStyle: 'italic',
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
    minWidth: '30px',
    display: 'inline-block',
    textAlign: 'center',
  },
};