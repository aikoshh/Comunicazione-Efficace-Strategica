import React, { useState } from 'react';
import { AnalysisResult, Exercise } from '../types';
import { COLORS } from '../constants';
import { CheckCircleIcon, XCircleIcon, RetryIcon, HomeIcon } from './Icons';

interface AnalysisReportScreenProps {
  result: AnalysisResult;
  exercise: Exercise;
  onRetry: () => void;
  onNext: () => void;
}

const ScoreCircle: React.FC<{ score: number }> = ({ score }) => {
  const circumference = 2 * Math.PI * 52; // 2 * pi * radius
  const offset = circumference - (score / 100) * circumference;
  
  let strokeColor = COLORS.success;
  if (score < 70) strokeColor = COLORS.warning;
  if (score < 40) strokeColor = COLORS.error;

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
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <div style={styles.scoreText}>{score}<span style={{fontSize: '20px'}}>%</span></div>
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
                    return <strong style={{color: COLORS.primary}} key={i}>{part.slice(2, -2)}</strong>;
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

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Report dell'Analisi</h1>
        
        <ScoreCircle score={result.score} />
        
        <div style={styles.feedbackGrid}>
            <div style={styles.feedbackCard}>
                <h2 style={styles.sectionTitle}><CheckCircleIcon style={{color: COLORS.success}}/> Punti di Forza</h2>
                <ul style={styles.list}>
                    {result.strengths.map((item, index) => <li key={index} style={styles.listItem}>{item}</li>)}
                </ul>
            </div>

            <div style={styles.feedbackCard}>
                <h2 style={styles.sectionTitle}><XCircleIcon style={{color: COLORS.error}}/> Aree di Miglioramento</h2>
                <ul style={styles.list}>
                  {result.areasForImprovement.map((item, index) => (
                    <li key={index} style={styles.listItem}>
                      <span>{item.suggestion}</span>
                      <span style={styles.exampleText}>
                        <strong>Esempio:</strong> <em>"{item.example}"</em>
                      </span>
                    </li>
                  ))}
                </ul>
            </div>
        </div>
        
        <div style={styles.suggestedResponseContainer}>
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
          <button onClick={onRetry} style={styles.secondaryButton}>
            <RetryIcon /> Riprova Esercizio
          </button>
          <button onClick={onNext} style={styles.primaryButton}>
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
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
        border: `1px solid ${COLORS.divider}`,
        padding: '32px',
        maxWidth: '800px',
        width: '100%',
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
    },
    feedbackGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '24px',
        marginBottom: '32px',
    },
    feedbackCard: {
        backgroundColor: '#f8f9fa',
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
    },
    exampleText: {
      display: 'block',
      marginTop: '8px',
      padding: '10px 12px',
      backgroundColor: '#e9ecef',
      borderRadius: '8px',
      color: '#495057',
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
        backgroundColor: '#f1f1f1',
        color: COLORS.textSecondary,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    tabButtonActive: {
        backgroundColor: COLORS.primary,
        color: 'white',
        borderColor: COLORS.primary,
    },
    tabContent: {
        backgroundColor: '#f8f9fa',
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
        border: `1px solid ${COLORS.primary}`,
        backgroundColor: 'transparent',
        color: COLORS.primary,
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: 500
    },
    primaryButton: {
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: 'bold',
        border: 'none',
        background: COLORS.primaryGradient,
        color: 'white',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'opacity 0.2s ease',
    },
};