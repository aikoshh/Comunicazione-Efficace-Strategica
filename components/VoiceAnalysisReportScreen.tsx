import React from 'react';
import { VoiceAnalysisResult, Exercise } from '../types';
import { COLORS, VOICE_RUBRIC_CRITERIA } from '../constants';
import { CheckCircleIcon, XCircleIcon, RetryIcon, HomeIcon, LightbulbIcon, TargetIcon } from './Icons';

interface VoiceAnalysisReportScreenProps {
  result: VoiceAnalysisResult;
  exercise: Exercise;
  onRetry: () => void;
  onNext: () => void;
}

const getScoreColor = (score: number): string => {
  if (score < 6) return COLORS.error;
  if (score >= 6 && score <= 7) return COLORS.warning;
  return COLORS.success;
};

const ScoreMeter: React.FC<{ label: string; score: number }> = ({ label, score }) => {
  const color = getScoreColor(score);
  return (
    <div style={styles.meterContainer}>
        <div style={styles.meterLabel}>{label}</div>
        <div style={styles.meterBar}>
            <div style={{...styles.meterFill, width: `${score * 10}%`, backgroundColor: color}} />
        </div>
        <span style={{...styles.meterScore, color: color, borderColor: color }}>{score}</span>
    </div>
  );
};

const AnnotatedText: React.FC<{ text: string }> = ({ text }) => {
    // Replace symbols with styled components
    const parts = text.split(/(☐|△)/g).filter(part => part.length > 0);
    return (
        <p style={styles.annotatedResponseText}>
            "
            {parts.map((part, i) => {
                if (part === '☐') {
                    return <span key={i} style={styles.pauseSymbol} title="Pausa"></span>;
                }
                if (part === '△') {
                    return <strong key={i} style={styles.emphasisSymbol} title="Enfasi"></strong>;
                }
                return <span key={i}>{part}</span>;
            })}
            "
        </p>
    );
};

export const VoiceAnalysisReportScreen: React.FC<VoiceAnalysisReportScreenProps> = ({ result, exercise, onRetry, onNext }) => {
  const hoverStyle = `
    .primary-button:hover {
      opacity: 0.9;
    }
    .secondary-button:hover {
      background-color: rgba(88, 166, 166, 0.1);
    }
  `;
    
  return (
    <div style={styles.container}>
      <style>{hoverStyle}</style>
      <div style={styles.card}>
        <h1 style={styles.title}>Report Voce & Paraverbale</h1>
        
        <div style={styles.scoresGrid}>
            {VOICE_RUBRIC_CRITERIA.map(criterion => {
                const scoreData = result.scores.find(s => s.criterion_id === criterion.id);
                return (
                    <ScoreMeter 
                        key={criterion.id}
                        label={criterion.label}
                        score={scoreData?.score ?? 0}
                    />
                );
            })}
        </div>
        
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
                  {result.improvements.map((item, index) => <li key={index} style={styles.listItem}>{item}</li>)}
                </ul>
            </div>
        </div>
        
        <div style={styles.actionsContainer}>
            <h2 style={styles.sectionTitle}><TargetIcon style={{color: COLORS.secondary}}/> Azioni Pratiche</h2>
            <ul style={styles.list}>
                {result.actions.map((item, index) => <li key={index} style={{...styles.listItem, ...styles.actionItem}}>{item}</li>)}
            </ul>
        </div>

        <div style={styles.microDrillContainer}>
            <h2 style={styles.sectionTitle}><LightbulbIcon style={{color: COLORS.warning}}/> Micro-Drill (60s)</h2>
            <p style={styles.microDrillText}>{result.micro_drill_60s}</p>
        </div>
        
        <div style={styles.suggestedDeliveryContainer}>
            <h2 style={styles.sectionTitle}>Consegna Suggerita</h2>
            <p style={styles.deliveryInstructions}>{result.suggested_delivery.instructions}</p>
            <AnnotatedText text={result.suggested_delivery.annotated_text} />
        </div>

        <div style={styles.buttonContainer}>
          <button onClick={onRetry} style={styles.secondaryButton} className="secondary-button">
            <RetryIcon /> Riprova Esercizio
          </button>
          <button onClick={onNext} style={styles.primaryButton} className="primary-button">
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
        maxWidth: '900px',
        width: '100%',
        boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
    },
    title: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: '32px',
        textAlign: 'center',
    },
    scoresGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
        paddingBottom: '32px',
        borderBottom: `1px solid ${COLORS.divider}`,
    },
    meterContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    meterLabel: {
        flex: 1,
        fontSize: '14px',
        color: COLORS.textSecondary,
        fontWeight: 500,
    },
    meterBar: {
        height: '8px',
        width: '100px',
        backgroundColor: COLORS.divider,
        borderRadius: '4px',
        overflow: 'hidden',
    },
    meterFill: {
        height: '100%',
        borderRadius: '4px',
        transition: 'width 0.5s ease-in-out',
    },
    meterScore: {
        fontSize: '14px',
        fontWeight: 'bold',
        padding: '2px 6px',
        borderRadius: '6px',
        border: '1px solid',
        minWidth: '20px',
        textAlign: 'center',
    },
    feedbackGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
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
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    listItem: {
        fontSize: '16px',
        color: COLORS.textSecondary,
        lineHeight: 1.6,
    },
    actionsContainer: {
        marginBottom: '32px',
    },
    actionItem: {
        padding: '12px',
        backgroundColor: 'rgba(88, 166, 166, 0.1)',
        borderRadius: '8px',
        borderLeft: `3px solid ${COLORS.secondary}`,
    },
    microDrillContainer: {
        backgroundColor: 'rgba(255, 193, 7, 0.15)',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '32px',
        borderLeft: `3px solid ${COLORS.warning}`,
    },
    microDrillText: {
        fontSize: '16px',
        color: COLORS.textPrimary,
        lineHeight: 1.6,
        margin: 0,
    },
    suggestedDeliveryContainer: {
        textAlign: 'left',
    },
    deliveryInstructions: {
        fontSize: '16px',
        color: COLORS.textSecondary,
        lineHeight: 1.6,
        marginBottom: '12px',
    },
    annotatedResponseText: {
        fontSize: '16px',
        fontStyle: 'italic',
        color: COLORS.textSecondary,
        lineHeight: 1.7,
        margin: 0,
        padding: '20px',
        backgroundColor: COLORS.cardDark,
        borderRadius: '12px',
    },
    pauseSymbol: {
        display: 'inline-block',
        width: '12px',
        height: '12px',
        backgroundColor: COLORS.secondary,
        borderRadius: '3px',
        margin: '0 4px',
        verticalAlign: 'middle',
    },
    emphasisSymbol: {
        display: 'inline-block',
        width: 0,
        height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderBottom: `10px solid ${COLORS.warning}`,
        margin: '0 4px',
        verticalAlign: 'middle',
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
        fontWeight: 500
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
        transition: 'opacity 0.2s ease',
    },
};