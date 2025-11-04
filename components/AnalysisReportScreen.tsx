// components/AnalysisReportScreen.tsx
import React, { useEffect, useState } from 'react';
import { AnalysisResult, Exercise, Entitlements, Product, DetailedRubricScore } from '../types';
import { COLORS } from '../constants';
import { CheckCircleIcon, XCircleIcon, RetryIcon, NextIcon, LightbulbIcon, TargetIcon, DownloadIcon, HomeIcon } from './Icons';
import { hasProAccess } from '../services/monetizationService';
import { soundService } from '../services/soundService';
import { UpsellBanner } from './UpsellBanner';
import { PRODUCTS } from '../products';
import { printService } from '../services/printService';
import { PrintPreviewModal } from './PrintPreviewModal';
import { mainLogoUrl } from '../assets';

interface AnalysisReportScreenProps {
  result: AnalysisResult;
  exercise: Exercise;
  onRetry: () => void;
  onNextExercise: () => void;
  nextExerciseLabel: string;
  entitlements: Entitlements | null;
  onNavigateToPaywall: () => void;
  userResponse: string;
  isReview?: boolean;
}

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
      <div style={{...styles.scoreText, color: strokeColor}}>{score}</div>
    </div>
  );
};

const DetailedRubric: React.FC<{ rubric: DetailedRubricScore[] }> = ({ rubric }) => (
    <div style={styles.rubricContainer}>
        {rubric.map((item, index) => (
            <React.Fragment key={index}>
                <div style={styles.rubricCriterion}>{item.criterion}</div>
                <div style={styles.rubricScoreContainer}>
                    <div style={{...styles.rubricMeter, width: `${item.score * 10}%`}} />
                    <span>{item.score}/10</span>
                </div>
                <div style={styles.rubricJustification}>{item.justification}</div>
            </React.Fragment>
        ))}
    </div>
);


export const AnalysisReportScreen: React.FC<AnalysisReportScreenProps> = ({
  result, exercise, onRetry, onNextExercise, nextExerciseLabel, entitlements, onNavigateToPaywall, userResponse, isReview
}) => {
  const isPro = hasProAccess(entitlements);
  const [printHtml, setPrintHtml] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  
  useEffect(() => {
    if(!isReview) {
        soundService.playScoreSound(result.score);
    }
    window.scrollTo(0, 0);
  }, [result.score, isReview]);
  
  const handlePrint = async () => {
    soundService.playClick();
    if (!isPro) {
        onNavigateToPaywall();
        return;
    }
    const html = printService.getReportHTML('print-area', `Report: ${exercise.title}`);
    setPrintHtml(html);
    setIsPrintModalOpen(true);
  };
  
  return (
    <div style={styles.container} className="report-screen-mobile-padding">
      <div id="print-area" style={styles.card}>
        <div style={styles.header}>
            <h1 style={styles.title}>Report di Analisi</h1>
            {isPro && <button onClick={handlePrint} style={styles.printButton} className="no-print"><DownloadIcon/> Esporta PDF</button>}
        </div>

        <div style={styles.userResponseContainer}>
            <h2 style={{...styles.sectionTitle, color: COLORS.textAccent}}>La Tua Risposta</h2>
            <p style={styles.userResponseText}>"{userResponse}"</p>
        </div>
        
        <ScoreCircle score={result.score} />
        
        <div style={styles.section}>
            <h2 style={styles.sectionTitle}><CheckCircleIcon style={{color: COLORS.success}}/> Punti di Forza</h2>
            <ul style={styles.list}>
              {result.strengths.map((s, i) => <li key={i} style={styles.listItem}>{s}</li>)}
            </ul>
        </div>
        
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}><XCircleIcon style={{color: COLORS.error}}/> Aree di Miglioramento</h2>
          <div style={styles.improvementsGrid}>
            {result.areasForImprovement.map((area, index) => (
              <div key={index} style={styles.improvementCard}>
                <div style={styles.improvementQuote}>
                  <span style={styles.improvementLabel}>La Tua Frase:</span>
                  <p>"{area.userQuote}"</p>
                </div>
                <div style={styles.improvementSuggestion}>
                  <span style={styles.improvementLabel}>Suggerimento del Coach:</span>
                  <p>{area.suggestion}</p>
                </div>
                 <div style={styles.improvementRewrite}>
                  <span style={styles.improvementLabel}>Alternativa Proposta:</span>
                  <p>"{area.rewrittenExample}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div style={styles.section}>
            <h2 style={styles.sectionTitle}><LightbulbIcon style={{color: COLORS.secondary}}/> Risposta Suggerita</h2>
            <p><strong>Versione breve:</strong> <span dangerouslySetInnerHTML={{__html: result.suggestedResponse.short.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}} /></p>
            <p><strong>Versione elaborata:</strong> <span dangerouslySetInnerHTML={{__html: result.suggestedResponse.long.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}} /></p>
        </div>

        {isPro && result.detailedRubric && (
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}><TargetIcon style={{color: COLORS.primary}}/> Valutazione Dettagliata PRO</h2>
                <DetailedRubric rubric={result.detailedRubric} />
            </div>
        )}
      </div>

       {!isPro && (
          <UpsellBanner product={PRODUCTS[0]} score={result.score} onDetails={onNavigateToPaywall}/>
       )}

      <div style={styles.buttonContainer}>
          {isReview ? (
             <>
                <button onClick={onRetry} style={styles.secondaryButton}><RetryIcon /> Riprova Esercizio</button>
                <button onClick={onNextExercise} style={styles.primaryButton}><HomeIcon /> {nextExerciseLabel}</button>
            </>
          ) : (
            <>
                <button onClick={onRetry} style={styles.secondaryButton}><RetryIcon /> Riprova Esercizio</button>
                <button onClick={onNextExercise} style={styles.primaryButton}>{nextExerciseLabel} <NextIcon /></button>
            </>
          )}
      </div>
      <div style={styles.logoContainer}>
        <img src={mainLogoUrl} alt="CES Coach Logo" style={styles.footerLogo} />
      </div>
      <PrintPreviewModal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} htmlContent={printHtml} onPrint={() => printService.triggerPrint(printHtml!)} />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: COLORS.base,
    padding: '40px 20px',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '900px',
    margin: '0 auto',
    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
    border: `1px solid ${COLORS.divider}`
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `1px solid ${COLORS.divider}`,
    paddingBottom: '16px',
    marginBottom: '24px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    margin: 0,
  },
  printButton: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 16px', border: `1px solid ${COLORS.secondary}`,
    backgroundColor: 'transparent', color: COLORS.secondary,
    borderRadius: '8px', cursor: 'pointer',
  },
  userResponseContainer: {
    backgroundColor: COLORS.cardDark,
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  userResponseText: {
    fontSize: '16px',
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    lineHeight: 1.7,
    margin: 0,
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
    fontSize: '36px',
    fontWeight: 'bold',
  },
  section: {
      marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '20px',
    color: COLORS.textPrimary,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  list: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
  },
  listItem: {
      backgroundColor: COLORS.cardDark,
      padding: '12px 16px',
      borderRadius: '8px',
      borderLeft: `3px solid ${COLORS.success}`
  },
  improvementsGrid: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
  },
  improvementCard: {
      backgroundColor: COLORS.cardDark,
      borderRadius: '8px',
      borderLeft: `4px solid ${COLORS.error}`,
      padding: '16px'
  },
  improvementLabel: {
      fontSize: '13px',
      fontWeight: 'bold',
      color: COLORS.textSecondary,
      textTransform: 'uppercase',
      display: 'block',
      marginBottom: '4px'
  },
  improvementQuote: {
      marginBottom: '12px'
  },
  improvementSuggestion: {
      marginBottom: '12px'
  },
  improvementRewrite: {
      backgroundColor: 'rgba(46, 125, 50, 0.1)',
      padding: '12px',
      borderRadius: '6px'
  },
  rubricContainer: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gridTemplateRows: 'auto',
    alignItems: 'center',
    gap: '12px 16px',
    border: `1px solid ${COLORS.divider}`,
    padding: '16px',
    borderRadius: '8px'
  },
  rubricCriterion: {
      fontWeight: 600,
      gridColumn: '1 / 3'
  },
  rubricScoreContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: 'bold',
      color: COLORS.primary
  },
  rubricMeter: {
      height: '8px',
      width: '100px',
      backgroundColor: COLORS.secondary,
      borderRadius: '4px'
  },
  rubricJustification: {
      gridColumn: '1 / 3',
      fontSize: '14px',
      color: COLORS.textSecondary,
      paddingLeft: '16px',
      borderLeft: `2px solid ${COLORS.divider}`
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '32px',
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
    gap: '8px'
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
    gap: '8px'
  },
  logoContainer: {
    textAlign: 'center',
    paddingTop: '40px',
    paddingBottom: '40px'
  },
  footerLogo: {
    width: '150px',
    height: 'auto',
    opacity: 0.7
  }
};