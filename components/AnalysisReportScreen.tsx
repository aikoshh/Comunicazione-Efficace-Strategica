import React, { useState, useEffect } from 'react';
import { AnalysisResult, Exercise, Entitlements, Product, DetailedRubricScore } from '../types';
import { COLORS } from '../constants';
import { CheckCircleIcon, XCircleIcon, RetryIcon, NextIcon, CrownIcon, DownloadIcon, HomeIcon, LightbulbIcon, TargetIcon } from './Icons';
import { PRODUCTS } from '../products';
import { soundService } from '../services/soundService';
import { hasProAccess } from '../services/monetizationService';
import { UpsellBanner } from './UpsellBanner';
import { printService } from '../services/printService';
import { PrintPreviewModal } from './PrintPreviewModal';

interface AnalysisReportScreenProps {
  result: AnalysisResult;
  exercise: Exercise;
  onRetry: () => void;
  onNextExercise: () => void;
  nextExerciseLabel: string;
  entitlements: Entitlements | null;
  onNavigateToPaywall: () => void;
  onPurchase: (product: Product) => Promise<void>;
  userResponse: string;
  isReview?: boolean;
}

const ScoreCircle: React.FC<{ score: number }> = ({ score }) => {
  const [displayScore, setDisplayScore] = useState(0);
  const circumference = 2 * Math.PI * 52; // 2 * pi * radius
  
  let strokeColor = COLORS.success;
  if (score < 70) strokeColor = COLORS.warning;
  if (score < 40) strokeColor = COLORS.error;

  useEffect(() => {
    const animation = requestAnimationFrame(() => setDisplayScore(score));
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
      <div style={{...styles.scoreText, color: strokeColor}}>{score}<span style={{fontSize: '20px'}}>%</span></div>
    </div>
  );
};

const DetailedRubric: React.FC<{ scores: DetailedRubricScore[] }> = ({ scores }) => (
    <div style={styles.detailedRubricContainer}>
        {scores.map((item, index) => (
            <React.Fragment key={index}>
                <div style={styles.rubricCriterion}>{item.criterion}</div>
                <div style={styles.rubricScoreContainer}>
                    <div style={styles.rubricMeter}><div style={{...styles.rubricMeterFill, width: `${item.score * 10}%`}}/></div>
                    <span>{item.score}/10</span>
                </div>
                <div style={styles.rubricJustification}>{item.justification}</div>
            </React.Fragment>
        ))}
    </div>
);

export const AnalysisReportScreen: React.FC<AnalysisReportScreenProps> = ({ result, exercise, onRetry, onNextExercise, nextExerciseLabel, entitlements, onNavigateToPaywall, onPurchase, userResponse, isReview }) => {
  const [printPreviewHtml, setPrintPreviewHtml] = useState<string | null>(null);
  const isPro = hasProAccess(entitlements);

  useEffect(() => {
    if(!isReview) soundService.playScoreSound(result.score);
    window.scrollTo(0, 0);
  }, [result.score, isReview]);
  
  const handlePrint = () => {
    soundService.playClick();
    if (!isPro) { onNavigateToPaywall(); return; }
    const html = printService.getReportHTML('analysis-report', `Report Analisi: ${exercise.title}`);
    setPrintPreviewHtml(html);
  };
  
  const triggerActualPrint = () => {
    if(printPreviewHtml) printService.triggerPrint(printPreviewHtml);
    setPrintPreviewHtml(null);
  }

  const HighlightedText: React.FC<{ text: string }> = ({ text }) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return <>{parts.map((part, i) => part.startsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part)}</>;
  };
    
  return (
    <div style={styles.container}>
      <div style={styles.card} id="analysis-report">
        <div style={styles.header}>
            <h1 style={styles.title}>Report di Analisi</h1>
            {isPro && <button onClick={handlePrint} style={styles.printButton} className="no-print"><DownloadIcon/> Esporta PDF</button>}
        </div>

        {isReview && (
            <div style={styles.userResponseContainer}>
                <h2 style={{...styles.sectionTitle, color: COLORS.textAccent}}>La Tua Risposta Precedente</h2>
                <p style={styles.userResponseText}>"{userResponse}"</p>
            </div>
        )}
        
        <ScoreCircle score={result.score} />
        
        <div style={styles.feedbackGrid}>
            <div style={styles.feedbackCard}>
                <h2 style={styles.sectionTitle}><CheckCircleIcon style={{color: COLORS.success}}/> Punti di Forza</h2>
                <ul style={styles.list}>{result.strengths.map((item, i) => <li key={i}>{item}</li>)}</ul>
            </div>
            <div style={styles.feedbackCard}>
                <h2 style={styles.sectionTitle}><XCircleIcon style={{color: COLORS.error}}/> Aree di Miglioramento</h2>
                <ul style={styles.list}>{result.areasForImprovement.map((item, i) => <li key={i}><strong>{item.suggestion}:</strong> <em>"{item.example}"</em></li>)}</ul>
            </div>
        </div>

        <div style={styles.suggestedResponseCard}>
            <h2 style={styles.sectionTitle}><LightbulbIcon style={{color: COLORS.secondary}}/> Risposta Consigliata</h2>
            <div style={styles.responsePair}>
                <h3 style={styles.responseType}>Versione Breve</h3>
                <p style={styles.responseText}><HighlightedText text={result.suggestedResponse.short} /></p>
            </div>
            <div style={styles.responsePair}>
                <h3 style={styles.responseType}>Versione Elaborata</h3>
                <p style={styles.responseText}><HighlightedText text={result.suggestedResponse.long} /></p>
            </div>
        </div>
        
        {isPro && result.detailedRubric && (
            <div style={styles.proSection}>
                <h2 style={styles.sectionTitle}><CrownIcon/> Analisi Dettagliata PRO</h2>
                <DetailedRubric scores={result.detailedRubric} />
            </div>
        )}

        <div style={styles.buttonContainer} className="no-print">
          {isReview ? (
             <>
                <button onClick={onRetry} style={styles.secondaryButton}><RetryIcon/> Riprova Esercizio</button>
                <button onClick={onNextExercise} style={styles.primaryButton}><HomeIcon /> {nextExerciseLabel}</button>
            </>
          ) : (
            <>
                <button onClick={onRetry} style={styles.secondaryButton}><RetryIcon /> Riprova</button>
                <button onClick={onNextExercise} style={styles.primaryButton}>{nextExerciseLabel} <NextIcon /></button>
            </>
          )}
        </div>
      </div>
      
      {!isPro && !isReview && (
          <UpsellBanner 
            product={PRODUCTS[0]} 
            score={result.score}
            onUnlock={onPurchase}
            onDetails={onNavigateToPaywall}
          />
      )}

      <PrintPreviewModal 
        isOpen={!!printPreviewHtml}
        onClose={() => setPrintPreviewHtml(null)}
        htmlContent={printPreviewHtml}
        onPrint={triggerActualPrint}
      />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { backgroundColor: COLORS.base, minHeight: '100vh', padding: '40px 20px' },
  card: { backgroundColor: COLORS.card, borderRadius: '16px', border: `1px solid ${COLORS.divider}`, padding: '32px', maxWidth: '900px', width: '100%', margin: '0 auto', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '28px', fontWeight: 'bold', color: COLORS.textPrimary, margin: 0 },
  printButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'none', border: `1px solid ${COLORS.secondary}`, color: COLORS.secondary, borderRadius: '8px', cursor: 'pointer' },
  userResponseContainer: { backgroundColor: COLORS.cardDark, padding: '20px', borderRadius: '12px', marginBottom: '24px', borderLeft: `5px solid ${COLORS.accentBeige}` },
  userResponseText: { fontSize: '16px', fontStyle: 'italic', color: COLORS.textSecondary, lineHeight: 1.7, margin: 0 },
  scoreContainer: { position: 'relative', width: '120px', height: '120px', margin: '16px auto 32px' },
  scoreText: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '32px', fontWeight: 'bold' },
  feedbackGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' },
  feedbackCard: { backgroundColor: COLORS.cardDark, padding: '24px', borderRadius: '12px' },
  sectionTitle: { fontSize: '20px', color: COLORS.textPrimary, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' },
  list: { listStyle: 'disc', paddingLeft: '20px', margin: 0, fontSize: '15px', color: COLORS.textSecondary, lineHeight: 1.7 },
  suggestedResponseCard: { backgroundColor: COLORS.card, padding: '24px', borderRadius: '12px', border: `1px solid ${COLORS.divider}`, marginBottom: '32px' },
  responsePair: { marginBottom: '16px' },
  responseType: { fontSize: '16px', fontWeight: 600, color: COLORS.textPrimary, margin: '0 0 8px 0' },
  responseText: { fontSize: '15px', fontStyle: 'italic', color: COLORS.textSecondary, lineHeight: 1.7, margin: 0 },
  proSection: { marginTop: '32px', paddingTop: '32px', borderTop: `1px solid ${COLORS.divider}` },
  detailedRubricContainer: { display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'center', gap: '12px 20px', rowGap: '16px' },
  rubricCriterion: { gridColumn: '1 / 3', fontSize: '16px', fontWeight: 600, color: COLORS.textPrimary },
  rubricScoreContainer: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: COLORS.textSecondary, fontWeight: 500 },
  rubricMeter: { height: '8px', width: '120px', backgroundColor: COLORS.divider, borderRadius: '4px' },
  rubricMeterFill: { height: '100%', backgroundColor: COLORS.secondary, borderRadius: '4px' },
  rubricJustification: { gridColumn: '1 / 3', fontSize: '14px', color: COLORS.textSecondary, fontStyle: 'italic', paddingLeft: '8px', borderLeft: `3px solid ${COLORS.divider}` },
  buttonContainer: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', marginTop: '32px', borderTop: `1px solid ${COLORS.divider}`, paddingTop: '32px' },
  secondaryButton: { padding: '12px 24px', fontSize: '16px', border: `1px solid ${COLORS.secondary}`, backgroundColor: 'transparent', color: COLORS.secondary, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  primaryButton: { padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', border: 'none', backgroundColor: COLORS.secondary, color: 'white', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
};