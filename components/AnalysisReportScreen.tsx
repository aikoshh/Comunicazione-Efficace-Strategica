import React, { useState, useEffect } from 'react';
import { AnalysisResult, Exercise, Entitlements, DetailedRubricScore } from '../types';
import { COLORS } from '../constants';
import { CheckCircleIcon, RetryIcon, HomeIcon, LightbulbIcon, NextIcon, TargetIcon } from './Icons';
import { soundService } from '../services/soundService';
import { UpsellBanner } from './UpsellBanner';
import { PRODUCTS } from '../products';
import { hasProAccess, hasEntitlement } from '../services/monetizationService';
import { printService } from '../services/printService';


interface AnalysisReportScreenProps {
  result: AnalysisResult;
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
  const circumference = 2 * Math.PI * 52;
  
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
    const parts = text.split(/(\*\*.*?\*\*)/g).filter(part => part.length > 0);
    return (
        <p style={styles.suggestedResponseText}>
            "
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong style={{color: COLORS.secondary}} key={i}>{part.slice(2, -2)}</strong>;
                }
                return part;
            })}
            "
        </p>
    );
};

const DetailedRubric: React.FC<{ rubric: DetailedRubricScore[] }> = ({ rubric }) => (
    <div style={styles.proFeatureSection}>
        <h2 style={styles.proSectionTitle}>Valutazione Dettagliata PRO</h2>
        <div style={styles.rubricContainer}>
            {rubric.map(item => (
                <React.Fragment key={item.criterion}>
                    <div style={styles.rubricCriterion}>{item.criterion}</div>
                    <div style={styles.rubricScoreContainer}>
                        <div style={{...styles.rubricScoreBar, width: `${item.score * 10}%`, backgroundColor: item.score >= 8 ? COLORS.success : item.score >= 5 ? COLORS.warning : COLORS.error }} />
                        <span style={styles.rubricScoreText}>{item.score}/10</span>
                    </div>
                    <div style={styles.rubricJustification}>{item.justification}</div>
                </React.Fragment>
            ))}
        </div>
    </div>
);

const QuestionMetrics: React.FC<{ utility: number; clarity: number }> = ({ utility, clarity }) => (
    <div style={styles.proFeatureSection}>
        <h2 style={styles.proSectionTitle}>Metriche Avanzate Domanda PRO</h2>
        <div style={styles.metricsContainer}>
            <div style={styles.metricItem}>
                <div style={styles.metricLabel}>Utilità della Domanda</div>
                <div style={styles.metricValue}>{utility}/10</div>
            </div>
            <div style={styles.metricItem}>
                <div style={styles.metricLabel}>Chiarezza della Domanda</div>
                <div style={styles.metricValue}>{clarity}/10</div>
            </div>
        </div>
    </div>
);


export const AnalysisReportScreen: React.FC<AnalysisReportScreenProps> = ({ result, exercise, onRetry, onNextExercise, nextExerciseLabel, entitlements, onNavigateToPaywall }) => {
  const [activeTab, setActiveTab] = useState<'short' | 'long'>('short');
  const showUpsell = result.score >= 70 && !hasProAccess(entitlements);
  const suggestedProduct = PRODUCTS.find(p => p.id === 'ces.addon.riformulazione.pro');
  const hasRiformulazionePro = hasEntitlement(entitlements, 'ces.addon.riformulazione.pro');
  const hasDomandePro = hasEntitlement(entitlements, 'ces.addon.domande.pro');
  
  const reportCardId = `report-card-${exercise.id}`;

  useEffect(() => {
    soundService.playScoreSound(result.score);
    window.scrollTo(0, 0);
  }, [result.score]);
  
  const handleRetry = () => { soundService.playClick(); onRetry(); };
  const handleNext = () => { soundService.playClick(); onNextExercise(); };
  const handleExport = () => { 
      soundService.playClick();
      printService.printReport(reportCardId, `Report Esercizio: ${exercise.title}`);
  };
  
  const hoverStyle = `
    .primary-button:hover, .secondary-button:hover, .export-button:hover {
      transform: translateY(-2px);
      filter: brightness(1.1);
    }
     .primary-button:active, .secondary-button:active, .export-button:active {
      transform: translateY(0) scale(0.98);
      filter: brightness(0.95);
    }
  `;

  return (
    <div style={styles.container}>
      <style>{hoverStyle}</style>
      <div style={styles.card} id={reportCardId}>
        <div style={styles.headerContainer}>
            <h1 style={styles.title}>Report dell'Analisi</h1>
            {hasRiformulazionePro && (
                <button onClick={handleExport} style={styles.exportButton} className="export-button no-print">
                    Esporta in PDF
                </button>
            )}
        </div>
        
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
                  {result.areasForImprovement.map((item, index) => (
                    <li key={index} style={styles.listItem}>
                      <LightbulbIcon style={{...styles.listItemIcon, color: COLORS.warning}} />
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
        
        {hasRiformulazionePro && result.detailedRubric && <DetailedRubric rubric={result.detailedRubric} />}
        {hasDomandePro && result.utilityScore && result.clarityScore && <QuestionMetrics utility={result.utilityScore} clarity={result.clarityScore} />}
        
        <div style={{...styles.suggestedResponseContainer, animation: 'fadeInUp 0.5s 0.6s ease-out both'}}>
          <h2 style={styles.sectionTitle}><TargetIcon style={{color: COLORS.secondary}}/> Risposta Suggerita</h2>
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
        
        {showUpsell && suggestedProduct && (
            <UpsellBanner 
                product={suggestedProduct}
                score={result.score}
                onUnlock={onNavigateToPaywall}
                onDetails={onNavigateToPaywall}
            />
        )}

        <div style={styles.buttonContainer} className="no-print">
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
        maxWidth: '800px',
        width: '100%',
        boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
    },
    headerContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px',
    },
    title: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        margin: 0,
    },
    exportButton: {
        padding: '10px 18px',
        fontSize: '15px',
        border: `1px solid ${COLORS.primary}`,
        backgroundColor: 'transparent',
        color: COLORS.primary,
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 500,
        transition: 'all 0.2s ease',
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
    list: { listStyle: 'none', paddingLeft: 0, margin: 0 },
    listItem: { fontSize: '16px', color: COLORS.textSecondary, lineHeight: 1.6, marginBottom: '18px', display: 'flex', alignItems: 'flex-start', gap: '12px' },
    listItemIcon: { flexShrink: 0, width: '20px', height: '20px', marginTop: '3px' },
    listItemText: { flex: 1 },
    exampleText: { display: 'block', marginTop: '8px', padding: '10px 12px', backgroundColor: '#EAECEE', borderRadius: '8px', color: COLORS.textSecondary, fontSize: '15px', borderLeft: `3px solid ${COLORS.secondary}` },
    suggestedResponseContainer: { textAlign: 'left', marginTop: '32px' },
    tabs: { display: 'flex', gap: '8px', marginBottom: '16px' },
    tabButton: { padding: '8px 16px', fontSize: '14px', fontWeight: '500', border: `1px solid ${COLORS.divider}`, backgroundColor: COLORS.divider, color: COLORS.textSecondary, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' },
    tabButtonActive: { backgroundColor: COLORS.secondary, color: 'white', borderColor: COLORS.secondary },
    tabContent: { backgroundColor: COLORS.cardDark, padding: '20px', borderRadius: '12px', minHeight: '100px' },
    suggestedResponseText: { fontSize: '16px', fontStyle: 'italic', color: COLORS.textSecondary, lineHeight: 1.7, margin: 0 },
    buttonContainer: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', marginTop: '32px', borderTop: `1px solid ${COLORS.divider}`, paddingTop: '32px' },
    secondaryButton: { padding: '12px 24px', fontSize: '16px', border: `1px solid ${COLORS.secondary}`, backgroundColor: 'transparent', color: COLORS.secondary, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, transition: 'all 0.2s ease' },
    primaryButton: { padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', border: 'none', backgroundColor: COLORS.secondary, color: 'white', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease' },
    proFeatureSection: { backgroundColor: '#FFFBEA', border: `1px solid ${COLORS.warning}`, borderLeft: `5px solid ${COLORS.warning}`, borderRadius: '12px', padding: '20px', marginTop: '32px' },
    proSectionTitle: { fontSize: '20px', color: COLORS.textAccent, marginBottom: '16px', fontWeight: 'bold' },
    rubricContainer: { display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'center', gap: '12px 16px' },
    rubricCriterion: { fontWeight: '600', color: COLORS.textPrimary },
    rubricScoreContainer: { display: 'flex', alignItems: 'center', gap: '8px' },
    rubricScoreBar: { height: '8px', borderRadius: '4px' },
    rubricScoreText: { fontSize: '14px', fontWeight: 'bold', color: COLORS.textPrimary },
    rubricJustification: { gridColumn: '1 / -1', fontSize: '14px', color: COLORS.textSecondary, paddingLeft: '24px', borderLeft: `2px solid ${COLORS.divider}` },
    metricsContainer: { display: 'flex', gap: '24px', justifyContent: 'space-around', textAlign: 'center' },
    metricItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
    metricLabel: { fontSize: '15px', color: COLORS.textSecondary },
    metricValue: { fontSize: '24px', fontWeight: 'bold', color: COLORS.primary },
};
