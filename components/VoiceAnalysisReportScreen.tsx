import React, { useEffect, useState } from 'react';
import { VoiceAnalysisResult, Exercise, Entitlements } from '../types';
import { COLORS, VOICE_RUBRIC_CRITERIA } from '../constants';
import { useSpeech } from '../hooks/useSpeech';
import { CheckCircleIcon, XCircleIcon, RetryIcon, HomeIcon, LightbulbIcon, TargetIcon, SpeakerIcon, SpeakerOffIcon, NextIcon } from './Icons';
import { soundService } from '../services/soundService';
import { hasProAccess } from '../services/monetizationService';

interface VoiceAnalysisReportScreenProps {
  result: VoiceAnalysisResult;
  exercise: Exercise;
  onRetry: () => void;
  onNextExercise: () => void;
  nextExerciseLabel: string;
  entitlements: Entitlements | null;
  onNavigateToPaywall: () => void;
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

export const VoiceAnalysisReportScreen: React.FC<VoiceAnalysisReportScreenProps> = ({ result, exercise, onRetry, onNextExercise, nextExerciseLabel, entitlements, onNavigateToPaywall }) => {
  const { speak, isSpeaking, stopSpeaking } = useSpeech();
  
  const averageScore = result.scores.length > 0
    ? Math.round(result.scores.reduce((acc, s) => acc + s.score, 0) / result.scores.length * 10)
    : 0;

  const isPro = hasProAccess(entitlements);

  useEffect(() => {
    window.scrollTo(0, 0);
    soundService.playScoreSound(averageScore);
    
    return () => {
        stopSpeaking(); // Cleanup speech synthesis on component unmount
    }
  }, [averageScore, stopSpeaking]);
  
  const handleRetry = () => {
    soundService.playClick();
    onRetry();
  };
  
  const handleNext = () => {
    soundService.playClick();
    onNextExercise();
  };
  
  const handleStrategicReplay = () => {
    soundService.playClick();
    if (!isPro) {
        onNavigateToPaywall();
        return;
    }

    if (isSpeaking) {
        stopSpeaking();
    } else {
        speak(result.suggested_delivery.ideal_script);
    }
  };

  const hoverStyle = `
    .primary-button:hover, .secondary-button:hover, .replay-button:hover:not(:disabled) {
      transform: translateY(-2px);
      filter: brightness(1.1);
    }
     .primary-button:active, .secondary-button:active, .replay-button:active:not(:disabled) {
      transform: translateY(0) scale(0.98);
      filter: brightness(0.95);
    }
  `;
    
  return (
    <div style={styles.container}>
      <style>{hoverStyle}</style>
      <div style={styles.card}>
        <h1 style={styles.title}>Report Voce & Paraverbale</h1>
        
        <ScoreCircle score={averageScore} />
        
        <div style={{...styles.scoresGrid, animation: 'fadeInUp 0.5s 0.2s ease-out both'}}>
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
            <div style={{...styles.feedbackCard, animation: 'fadeInUp 0.5s 0.4s ease-out both'}}>
                <h2 style={styles.sectionTitle}><CheckCircleIcon style={{color: COLORS.success}}/> Punti di Forza</h2>
                <ul style={styles.list}>
                    {result.strengths.map((item, index) => 
                        <li key={index} style={styles.listItem}>
                            <CheckCircleIcon style={{...styles.listItemIcon, color: COLORS.success}}/>
                            <span style={styles.listItemText}><HighlightText text={item}/></span>
                        </li>
                    )}
                </ul>
            </div>

            <div style={{...styles.feedbackCard, animation: 'fadeInUp 0.5s 0.5s ease-out both'}}>
                <h2 style={styles.sectionTitle}><XCircleIcon style={{color: COLORS.error}}/> Aree di Miglioramento</h2>
                <ul style={styles.list}>
                  {result.improvements.map((item, index) => 
                    <li key={index} style={styles.listItem}>
                        <LightbulbIcon style={{...styles.listItemIcon, color: COLORS.warning}}/>
                        <span style={styles.listItemText}><HighlightText text={item}/></span>
                    </li>
                  )}
                </ul>
            </div>
        </div>
        
        <div style={{...styles.actionsContainer, animation: 'fadeInUp 0.5s 0.6s ease-out both'}}>
            <h2 style={styles.sectionTitle}><TargetIcon style={{color: COLORS.secondary}}/> Azioni Pratiche</h2>
            <ul style={styles.list}>
                {result.actions.map((item, index) => 
                    <li key={index} style={{...styles.listItem, ...styles.actionItem}}>
                        <TargetIcon style={{...styles.listItemIcon, color: COLORS.secondary}}/>
                        <span style={styles.listItemText}><HighlightText text={item}/></span>
                    </li>
                )}
            </ul>
        </div>

        <div style={{...styles.microDrillContainer, animation: 'fadeInUp 0.5s 0.7s ease-out both'}}>
            <h2 style={styles.sectionTitle}><LightbulbIcon style={{color: COLORS.warning}}/> Micro-Drill (60s)</h2>
            <p style={styles.microDrillText}><HighlightText text={result.micro_drill_60s}/></p>
        </div>
        
        <div style={{...styles.suggestedDeliveryContainer, animation: 'fadeInUp 0.5s 0.8s ease-out both'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'}}>
              <h2 style={styles.sectionTitle}>Risposta Consigliata</h2>
              <button onClick={handleStrategicReplay} style={!isPro ? styles.replayButtonLocked : styles.replayButton} className="replay-button">
                  {isSpeaking ? <SpeakerOffIcon/> : <SpeakerIcon/>}
                  {isSpeaking ? 'Ferma Ascolto' : (isPro ? 'Ascolta Versione Ideale' : 'Sblocca PRO')}
              </button>
          </div>
          <p style={styles.deliveryInstructions}><HighlightText text={result.suggested_delivery.instructions}/></p>
          <AnnotatedText text={result.suggested_delivery.annotated_text} />
        </div>

        <div style={styles.buttonContainer}>
          <button onClick={handleRetry} style={styles.secondaryButton} className="secondary-button">
            <RetryIcon /> Riprova Esercizio
          </button>
          <button onClick={handleNext} style={styles.primaryButton} className="primary-button">
            {nextExerciseLabel} <NextIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        backgroundColor: COLORS.base,
        minHeight: 'calc(100vh - 64px)',
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
    scoresGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
        paddingBottom: '32px',
        borderBottom: `1px solid ${COLORS.divider}`,
    },
    meterContainer: { display: 'flex', alignItems: 'center', gap: '12px' },
    meterLabel: { flex: 1, fontSize: '14px', color: COLORS.textSecondary, fontWeight: 500 },
    meterBar: { height: '8px', width: '100px', backgroundColor: COLORS.divider, borderRadius: '4px', overflow: 'hidden' },
    meterFill: { height: '100%', borderRadius: '4px', transition: 'width 0.8s cubic-bezier(0.25, 1, 0.5, 1)' },
    meterScore: { fontSize: '14px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '6px', border: '1px solid', minWidth: '20px', textAlign: 'center' },
    feedbackGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' },
    feedbackCard: { backgroundColor: COLORS.cardDark, padding: '20px', borderRadius: '12px' },
    sectionTitle: { fontSize: '20px', color: COLORS.textPrimary, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, margin: 0 },
    list: { listStyle: 'none', paddingLeft: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' },
    listItem: { fontSize: '16px', color: COLORS.textSecondary, lineHeight: 1.6, display: 'flex', alignItems: 'flex-start', gap: '12px' },
    listItemIcon: { flexShrink: 0, width: '20px', height: '20px', marginTop: '3px' },
    listItemText: { flex: 1 },
    actionsContainer: { marginBottom: '32px' },
    actionItem: { padding: '12px', backgroundColor: 'rgba(88, 166, 166, 0.1)', borderRadius: '8px', borderLeft: `3px solid ${COLORS.secondary}`, color: COLORS.textPrimary },
    microDrillContainer: { backgroundColor: 'rgba(255, 193, 7, 0.15)', padding: '20px', borderRadius: '12px', marginBottom: '32px', borderLeft: `3px solid ${COLORS.warning}` },
    microDrillText: { fontSize: '16px', color: COLORS.textPrimary, lineHeight: 1.6, margin: 0 },
    suggestedDeliveryContainer: { textAlign: 'left' },
    replayButton: {
        padding: '10px 18px',
        fontSize: '15px',
        border: `1px solid ${COLORS.primary}`,
        backgroundColor: 'transparent',
        color: COLORS.primary,
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: 600,
        transition: 'all 0.2s ease',
    },
    replayButtonLocked: {
        padding: '10px 18px',
        fontSize: '15px',
        border: `1px solid ${COLORS.warning}`,
        backgroundColor: 'rgba(255, 193, 7, 0.15)',
        color: COLORS.textAccent,
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: 600,
        transition: 'all 0.2s ease',
    },
    deliveryInstructions: { fontSize: '16px', color: COLORS.textSecondary, lineHeight: 1.6, marginBottom: '12px', marginTop: '16px' },
    annotatedResponseText: { fontSize: '16px', fontStyle: 'italic', color: COLORS.textSecondary, lineHeight: 1.7, margin: 0, padding: '20px', backgroundColor: COLORS.cardDark, borderRadius: '12px' },
    pauseSymbol: { display: 'inline-block', width: '12px', height: '12px', backgroundColor: COLORS.secondary, borderRadius: '3px', margin: '0 4px', verticalAlign: 'middle' },
    emphasisSymbol: { display: 'inline-block', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: `10px solid ${COLORS.warning}`, margin: '0 4px', verticalAlign: 'middle' },
    buttonContainer: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', marginTop: '32px', borderTop: `1px solid ${COLORS.divider}`, paddingTop: '32px' },
    secondaryButton: { padding: '12px 24px', fontSize: '16px', border: `1px solid ${COLORS.secondary}`, backgroundColor: 'transparent', color: COLORS.secondary, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, transition: 'all 0.2s ease' },
    primaryButton: { padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', border: 'none', backgroundColor: COLORS.secondary, color: 'white', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease' },
};