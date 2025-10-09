import React, { useState, useEffect } from 'react';
import { AnalysisResult, Exercise } from '../types';
import { COLORS } from '../constants';
import { CheckCircleIcon, XCircleIcon, RetryIcon, HomeIcon, LightbulbIcon } from './Icons';
import { soundService } from '../services/soundService';

interface AnalysisReportScreenProps {
  result: AnalysisResult;
  exercise: Exercise;
  onRetry: () => void;
  onNext: () => void;
}

const KEYWORDS = [
    'efficace', 'chiaro', 'empatico', 'tono', 'ritmo', 'pause', 'volume', 'assertività', 'costruttivo', 
    'soluzione', 'obiettivo', 'strategico', 'ottimo', 'eccellente', 'ben', 'buon', 'correttamente', 
    'giusto', 'prova a', 'cerca di', 'evita di', 'potresti', 'considera', 'concentrati su', 
    'ricorda di', 'lavora su', 'registra', 'ascolta', 'leggi', 'parla', 'esercitati', 
    'identifica', 'scrivi', 'comunica', 'gestisci', 'usa', 'mantieni', 'assicurati'
];

const HighlightText: React.FC<{ text: string }> = ({ text }) => {
    if (!text) return null;
    // Regex to split by keywords, keeping the delimiters, ensuring they are whole words (\b)
    const regex = new RegExp(`\\b(${KEYWORDS.join('|')})\\b`, 'gi');
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, index) => 
                KEYWORDS.some(keyword => new RegExp(`^${keyword}$`, 'i').test(part)) ? (
                    <strong key={index} style={{ color: COLORS.primary, fontWeight: '700' }}>{part}</strong>
                ) : (
                    part
                )
            )}
        </>
    );
};

const ScoreCircle: React.FC<{ score: number }> = ({ score }) => {
  const [displayScore, setDisplayScore] = useState(0);
  const circumference = 2 * Math.PI * 52; // 2 * pi * radius
  
  let strokeColor = COLORS.success;
  if (score < 70) strokeColor = COLORS.warning;
  if (score < 40) strokeColor = COLORS.error;

  useEffect(() => {
    const animation = requestAnimationFrame(() => {
        setDisplayScore(score);
    });
    return () => cancelAnimationFrame(animation);
  }, [score]);


  return (
    <div style={styles.scoreContainer}>
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r="52" fill="none" stroke={COLORS.divider} strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (displayScore / 100) * circumference}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.25, 1, 0.5, 1)' }}
        />
      </svg>
      <div style={{...styles.scoreText, color: strokeColor, animation: 'popIn 0.5s 0.8s ease-out both'}}>{score}<span style={{fontSize: '20px'}}>%</span></div>
    </div>
  );
};

const ResponseText: React.FC<{ text: string }> = ({ text }) => {
    // This regex splits the string by the bold markers (**...**) and keeps the delimiters
    const parts = text.split(/(\*\*.*?\*\*)/g).filter(part => part.length > 0);
    return (
        <p style={styles.suggestedResponseText}>
            "
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    // If the part is a keyword, wrap it in <strong>
                    return <strong style={{color: COLORS.secondary}} key={i}>{part.slice(2, -2)}</strong>;
                }
                // Otherwise, return the text part as is
                return part;
            })}
            "
        </p>
    );
};

export const AnalysisReportScreen: React.FC<AnalysisReportScreenProps> = ({ result, exercise, onRetry, onNext }) => {
  const [activeTab, setActiveTab] = useState<'short' | 'long'>('short');

  useEffect(() => {
    soundService.playScoreSound(result.score);
    window.scrollTo(0, 0); // Scroll to top on mount
  }, [result.score]);
  
  const handleRetry = () => {
    soundService.playClick();
    onRetry();
  };
  
  const handleNext = () => {
    soundService.playClick();
    onNext();
  };
  
  const hoverStyle = `
    .primary-button:hover, .secondary-button:hover {
      transform: translateY(-2px);
      filter: brightness(1.1);
    }
     .primary-button:active, .secondary-button:active {
      transform: translateY(0);
      filter: brightness(0.95);
    }
  `;

  return (
    <div style={styles.container}>
      <style>{hoverStyle}</style>
      <div style={styles.card}>
        <h1 style={styles.title}>Report dell'Analisi</h1>
        
        <ScoreCircle score={result.score} />
        
        <div style={styles.feedbackGrid}>
            <div style={{...styles.feedbackCard, animation: 'fadeInUp 0.5s 0.2s ease-out both'}}>
                <h2 style={styles.sectionTitle}><CheckCircleIcon style={{color: COLORS.success}}/> Punti di Forza</h2>
                <ul style={styles.list}>
                    {result.strengths.map((item, index) => 
                        <li key={index} style={styles.listItem}>
                            <CheckCircleIcon style={{...styles.listItemIcon, color: COLORS.success}} />
                            <span style={styles.listItemText}><HighlightText text={item} /></span>
                        </li>
                    )}
                </ul>
            </div>

            <div style={{...styles.feedbackCard, animation: 'fadeInUp 0.5s 0.4s ease-out both'}}>
                <h2 style={styles.sectionTitle}><LightbulbIcon style={{color: COLORS.warning}}/> Aree di Miglioramento</h2>
                <ul style={styles.list}>
                  {(result?.areasForImprovement ?? []).map((item, index) => (
  <li key={index} style={styles.listItem}>
    <LightbulbIcon style={{ ...styles.listItemIcon, color: COLORS.warning }} />
                      <div style={styles.listItemText}>
                        <span><HighlightText text={item.suggestion} /></span>
                        <span style={styles.exampleText}>
                          <strong>Esempio:</strong> <em>"{item.example}"</em>
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
            </div>
        </div>
        
        <div style={{...styles.suggestedResponseContainer, animation: 'fadeInUp 0.5s 0.6s ease-out both'}}>
          <h2 style={styles.sectionTitle}>Risposta Suggerita</h2>
          <div style={styles.tabs}>
            <button 
                style={{...styles.tabButton, ...(activeTab === 'short' ? styles.tabButtonActive : {})}}
                onClick={() => setActiveTab('short')}>
                Versione Breve
            </button>
            <button 
                style={{...styles.tabButton, ...(activeTab === 'long' ? styles.tabButtonActive : {})}}
                onClick={() => setActiveTab('long')}>
                Versione Lunga
            </button>
          </div>
          <div style={styles.tabContent}>
            {activeTab === 'short' 
                ? <ResponseText text={result.suggestedResponse.short} />
                : <ResponseText text={result.suggestedResponse.long} />
            }
          </div>
        </div>

        <div style={styles.buttonContainer}>
          <button onClick={handleRetry} style={styles.secondaryButton} className="secondary-button">
            <RetryIcon /> Riprova Esercizio
          </button>
          <button onClick={handleNext} style={styles.primaryButton} className="primary-button">
            Menu Principale <HomeIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        backgroundColor: COLORS.base,
        minHeight: '100vh',
        padding: '40px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: '12px',
        border: `1px solid ${COLORS.divider}`,
        padding: '32px',
        maxWidth: '800px',
        width: '100%',
        boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
    },
    title: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: '24px',
        textAlign: 'center',
    },
    scoreContainer: {
        position: 'relative',
        width: '120px',
        height: '120px',
        margin: '16px auto 32px',
    },
    scoreText: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '32px',
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'center',
    },
    feedbackGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '24px',
        marginBottom: '32px',
    },
    feedbackCard: {
        backgroundColor: COLORS.cardDark,
        padding: '20px',
        borderRadius: '12px',
    },
    sectionTitle: {
        fontSize: '20px',
        color: COLORS.textPrimary,
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontWeight: 600
    },
    list: {
        listStyle: 'none',
        paddingLeft: 0,
        margin: 0,
    },
    listItem: {
        fontSize: '16px',
        color: COLORS.textSecondary,
        lineHeight: 1.6,
        marginBottom: '18px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
    },
    listItemIcon: {
        flexShrink: 0,
        width: '20px',
        height: '20px',
        marginTop: '3px',
    },
    listItemText: {
        flex: 1,
    },
    exampleText: {
      display: 'block',
      marginTop: '8px',
      padding: '10px 12px',
      backgroundColor: '#EAECEE',
      borderRadius: '8px',
      color: COLORS.textSecondary,
      fontSize: '15px',
      borderLeft: `3px solid ${COLORS.secondary}`
    },
    suggestedResponseContainer: {
        textAlign: 'left',
    },
    tabs: {
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
    },
    tabButton: {
        padding: '8px 16px',
        fontSize: '14px',
        fontWeight: '500',
        border: `1px solid ${COLORS.divider}`,
        backgroundColor: COLORS.divider,
        color: COLORS.textSecondary,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    tabButtonActive: {
        backgroundColor: COLORS.secondary,
        color: 'white',
        borderColor: COLORS.secondary,
    },
    tabContent: {
        backgroundColor: COLORS.cardDark,
        padding: '20px',
        borderRadius: '12px',
        minHeight: '100px',
    },
    suggestedResponseText: {
        fontSize: '16px',
        fontStyle: 'italic',
        color: COLORS.textSecondary,
        lineHeight: 1.7,
        margin: 0,
    },
    buttonContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '16px',
        marginTop: '32px',
        borderTop: `1px solid ${COLORS.divider}`,
        paddingTop: '32px',
    },
    secondaryButton: {
        padding: '12px 24px',
        fontSize: '16px',
        border: `1px solid ${COLORS.secondary}`,
        backgroundColor: 'transparent',
        color: COLORS.secondary,
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: 500,
        transition: 'all 0.2s ease',
    },
    primaryButton: {
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: 'bold',
        border: 'none',
        backgroundColor: COLORS.secondary,
        color: 'white',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s ease',
    },
};
