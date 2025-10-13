import React from 'react';
// Fix: Import ExerciseType as a value to use it in component logic, not just as a type.
import { ExerciseType } from '../types';
import type { Exercise, UserProgress, AnalysisResult, VoiceAnalysisResult } from '../types';
import { COLORS, EXERCISE_TYPE_ICONS } from '../constants';
import { BackIcon, RetryIcon } from './Icons';
import { AnalysisReportScreen } from './AnalysisReportScreen';
import { VoiceAnalysisReportScreen } from './VoiceAnalysisReportScreen';

interface ReviewScreenProps {
  exercise: Exercise;
  userProgress: UserProgress | undefined;
  onRetry: (exercise: Exercise) => void;
  onBack: () => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({ exercise, userProgress, onRetry, onBack }) => {
  const history = userProgress?.analysisHistory || [];
  const analysisItem = [...history].reverse().find(item => item.exerciseId === exercise.id);

  if (!analysisItem) {
    return (
      <div style={styles.container}>
        <p>Nessuna cronologia trovata per questo esercizio.</p>
        <button onClick={onBack} style={styles.backButton}>Indietro</button>
      </div>
    );
  }
  
  const isVerbal = 'scores' in analysisItem.analysisResult;
  const ExerciseIcon = EXERCISE_TYPE_ICONS[exercise.exerciseType || ExerciseType.WRITTEN];

  // This is a bit of a hack to reuse the full report screens.
  // We are creating dummy functions for props that are not used in review context
  // but are required by the report components.
  const dummyNext = () => {};

  const renderAnalysis = () => {
    if (isVerbal) {
        return (
            <div style={styles.reportWrapper}>
                <VoiceAnalysisReportScreen 
                    result={analysisItem.analysisResult as VoiceAnalysisResult}
                    exercise={exercise}
                    onRetry={() => onRetry(exercise)}
                    onNextExercise={dummyNext}
                    nextExerciseLabel="Riprova Esercizio" // Will be overridden by button below
                    entitlements={userProgress?.entitlements || null}
                    onNavigateToPaywall={dummyNext}
                />
            </div>
        );
    }
    return (
        <div style={styles.reportWrapper}>
            <AnalysisReportScreen
                result={analysisItem.analysisResult as AnalysisResult}
                exercise={exercise}
                onRetry={() => onRetry(exercise)}
                onNextExercise={dummyNext}
                nextExerciseLabel="Riprova Esercizio" // Will be overridden by button below
                entitlements={userProgress?.entitlements || null}
                onNavigateToPaywall={dummyNext}
            />
        </div>
    );
  };


  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.backButton}>
        <BackIcon /> Torna al Modulo
      </button>

      <div style={styles.reviewCard}>
        <header style={styles.header}>
            <ExerciseIcon style={styles.icon}/>
            <h1 style={styles.title}>Revisione: {exercise.title}</h1>
        </header>
        
        <div style={styles.section}>
            <h2 style={styles.sectionTitle}>La tua Risposta Precedente</h2>
            <p style={styles.userResponse}>"{analysisItem.userResponse}"</p>
            <small style={styles.timestamp}>Completato il: {new Date(analysisItem.timestamp).toLocaleString('it-IT')}</small>
        </div>

        <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Analisi Ricevuta</h2>
            {renderAnalysis()}
        </div>
        
        <footer style={styles.footer}>
            <button onClick={() => onRetry(exercise)} style={styles.retryButton}>
                <RetryIcon /> Riprova Esercizio
            </button>
        </footer>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  backButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: 'transparent',
      border: `1px solid ${COLORS.divider}`,
      borderRadius: '8px',
      padding: '8px 16px',
      cursor: 'pointer',
      fontSize: '15px',
      color: COLORS.textSecondary,
      fontWeight: '500',
      transition: 'all 0.2s ease',
      alignSelf: 'flex-start',
      marginBottom: '24px'
  },
  reviewCard: {
      backgroundColor: COLORS.card,
      borderRadius: '12px',
      padding: '32px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
  },
  header: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      borderBottom: `1px solid ${COLORS.divider}`,
      paddingBottom: '24px',
      marginBottom: '24px',
  },
  icon: {
      width: '32px',
      height: '32px',
      color: COLORS.primary,
  },
  title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: COLORS.textPrimary,
      margin: 0,
  },
  section: {
      marginBottom: '32px',
  },
  sectionTitle: {
      fontSize: '20px',
      fontWeight: 600,
      color: COLORS.textPrimary,
      marginBottom: '16px',
  },
  userResponse: {
      fontSize: '16px',
      fontStyle: 'italic',
      color: COLORS.textSecondary,
      lineHeight: 1.6,
      backgroundColor: COLORS.cardDark,
      padding: '16px',
      borderRadius: '8px',
      margin: '0 0 8px 0',
  },
  timestamp: {
      fontSize: '12px',
      color: COLORS.textSecondary,
      display: 'block',
      textAlign: 'right',
  },
  reportWrapper: {
      // This wrapper removes padding and background from the nested report screens
      // to avoid double-padding and styling issues.
      padding: '0',
      backgroundColor: 'transparent',
      minHeight: 'auto',
  },
  footer: {
      textAlign: 'center',
      borderTop: `1px solid ${COLORS.divider}`,
      paddingTop: '24px',
      marginTop: '24px',
  },
  retryButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    border: 'none',
    backgroundColor: COLORS.secondary,
    color: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
  }
};