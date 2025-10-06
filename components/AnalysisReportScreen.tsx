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
  
  let strokeColor = COLORS.accentoVerde;
  if (score < 70) strokeColor = '#F4A731'; // Yellow
  if (score < 40) strokeColor = '#E5484D'; // Red

  return (
    <div style={styles.scoreContainer}>
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r="52" fill="none" stroke="#e6e6e6" strokeWidth="8" />
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
          style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
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
                    return <strong key={i}>{part.slice(2, -2)}</strong>;
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
        {result.isDemo && (
            <div style={styles.demoBanner}>
                <p style={styles.demoBannerText}>
                    <strong>Modalità Demo:</strong> Questa è un'analisi di esempio. Configura la tua API_KEY per ricevere feedback reali.
                </p>
            </div>
        )}
        
        <h1 style={styles.title}>Risultato dell'Analisi</h1>

        <div style={styles.exerciseRecap}>
            <h2 style={styles.recapTitle}>{exercise.title}</h2>
            <p style={styles.recapText}><strong>Scenario:</strong> {exercise.scenario}</p>
            <p style={styles.recapText}><strong>Compito:</strong> {exercise.task}</p>
        </div>
        
        <ScoreCircle score={result.score} />
        
        <div style={styles.feedbackGrid}>
            <div style={styles.feedbackCard}>
                <h2 style={styles.sectionTitle}><CheckCircleIcon style={{color: COLORS.accentoVerde}}/> Punti di Forza</h2>
                <ul style={styles.list}>
                    {result.strengths.map((item, index) => <li key={index} style={styles.listItem}>{item}</li>)}
                </ul>
            </div>

            <div style={styles.feedbackCard}>
                <h2 style={styles.sectionTitle}><XCircleIcon style={{color: '#E5484D'}}/> Aree di Miglioramento</h2>
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
          <button onClick={onRetry} style={styles.retryButton}>
            <RetryIcon /> Riprova Esercizio
          </button>
          <button onClick={onNext} style={styles.nextButton}>
            Menu iniziale <HomeIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        backgroundColor: COLORS.fondo,
        minHeight: '100vh',
        padding: '40px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        padding: '32px',
        maxWidth: '800px',
        width: '100%',
    },
    demoBanner: {
        backgroundColor: '#fffbe6',
        border: '1px solid #ffe58f',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '24px',
        textAlign: 'center',
    },
    demoBannerText: {
        margin: 0,
        color: '#8a6d3b',
        fontSize: '14px',
    },
    title: {
        fontSize: '28px',
        color: COLORS.nero,
        marginBottom: '24px',
        textAlign: 'center',
    },
    exerciseRecap: {
        backgroundColor: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '24px',
        textAlign: 'left',
    },
    recapTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: COLORS.nero,
        margin: '0 0 12px 0',
    },
    recapText: {
        fontSize: '15px',
        color: '#495057',
        lineHeight: 1.6,
        margin: '0 0 8px 0',
    },
    scoreContainer: {
        position: 'relative',
        width: '120px',
        height: '120px',
        margin: '0 auto 24px',
    },
    scoreText: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '32px',
        fontWeight: 'bold',
        color: COLORS.nero,
    },
    feedbackGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
        color: COLORS.nero,
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    list: {
        listStyle: 'none',
        paddingLeft: 0,
        margin: 0,
    },
    listItem: {
        fontSize: '16px',
        color: '#333',
        lineHeight: 1.6,
        marginBottom: '18px',
    },
    exampleText: {
      display: 'block',
      marginTop: '8px',
      padding: '8px 12px',
      backgroundColor: '#e9ecef',
      borderRadius: '6px',
      color: '#495057',
      fontSize: '15px',
    },
    suggestedResponseContainer: {
        textAlign: 'left',
        borderTop: '1px solid #eee',
        paddingTop: '24px',
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
        border: '1px solid #ddd',
        backgroundColor: '#f1f1f1',
        color: '#555',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    tabButtonActive: {
        backgroundColor: COLORS.nero,
        color: 'white',
        borderColor: COLORS.nero,
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
        color: '#333',
        lineHeight: 1.7,
        margin: 0,
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'center',
        gap: '16px',
        marginTop: '32px',
        borderTop: '1px solid #eee',
        paddingTop: '24px',
    },
    retryButton: {
        padding: '12px 24px',
        fontSize: '16px',
        border: `1px solid ${COLORS.nero}`,
        backgroundColor: 'white',
        color: COLORS.nero,
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    nextButton: {
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: '500',
        border: 'none',
        backgroundColor: COLORS.salviaVerde,
        color: 'white',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'background-color 0.2s ease',
    },
};
