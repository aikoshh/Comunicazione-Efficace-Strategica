import React from 'react';
import { AnalysisHistoryItem, Exercise, AnalysisResult, VoiceAnalysisResult, ExerciseType } from '../types';
import { MODULES, COLORS, EXERCISE_TYPE_ICONS } from '../constants';
import { AnalysisReportScreen } from './AnalysisReportScreen';
import { VoiceAnalysisReportScreen } from './VoiceAnalysisReportScreen';
import { RetryIcon } from './Icons';

interface ReviewScreenProps {
  historyItem: AnalysisHistoryItem;
  onBack: () => void;
  onRetry: (exercise: Exercise) => void;
}

const findExerciseById = (id: string): Exercise | undefined => {
    if (id.startsWith('custom-')) {
        // This is a placeholder for custom exercises if they need to be reviewed.
        // For now, we assume custom exercises might not be stored in a findable way post-session.
        // A more robust solution would save custom exercise details with the history.
        return {
            id,
            title: 'Esercizio Personalizzato',
            scenario: 'Scenario personalizzato',
            task: 'Compito personalizzato',
            difficulty: 'Base' as any,
        };
    }
    for (const module of MODULES) {
        const found = module.exercises.find(ex => ex.id === id);
        if (found) return found;
    }
    return undefined;
};

// A type guard to check if the analysis is for a verbal exercise
function isVoiceAnalysis(analysis: any): analysis is VoiceAnalysisResult {
    return analysis && Array.isArray(analysis.scores) && typeof analysis.micro_drill_60s === 'string';
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({ historyItem, onBack, onRetry }) => {
  const exercise = findExerciseById(historyItem.exerciseId);

  if (!exercise) {
    return (
      <div style={styles.container}>
        <p>Esercizio non trovato.</p>
        <button onClick={onBack}>Torna alla Home</button>
      </div>
    );
  }

  const handleRetry = () => {
    onRetry(exercise);
  };

  const exerciseType = exercise.exerciseType || ExerciseType.WRITTEN;
  const ExerciseIcon = EXERCISE_TYPE_ICONS[exerciseType];

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.titleContainer}>
            <ExerciseIcon style={styles.icon}/>
            <h1 style={styles.title}>Revisione: {exercise.title}</h1>
        </div>
        <p style={styles.date}>Completato il: {new Date(historyItem.timestamp).toLocaleString('it-IT')}</p>
      </header>
      
      <div style={styles.content}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>La tua Risposta</h2>
          <div style={styles.responseBox}>
            <p style={styles.responseText}>"{historyItem.userResponse}"</p>
          </div>
        </div>

        <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Analisi Ricevuta</h2>
            <div style={styles.analysisContainer}>
                {isVoiceAnalysis(historyItem.analysis) ? (
                    <VoiceAnalysisReportScreen 
                        result={historyItem.analysis} 
                        exercise={exercise} 
                        onRetry={() => {}} 
                        onNextExercise={() => {}} 
                        nextExerciseLabel="" 
                        entitlements={null} 
                        onNavigateToPaywall={() => {}} 
                    />
                ) : (
                    <AnalysisReportScreen 
                        result={historyItem.analysis as AnalysisResult} 
                        exercise={exercise} 
                        onRetry={() => {}} 
                        onNextExercise={() => {}} 
                        nextExerciseLabel="" 
                        entitlements={null} 
                        onNavigateToPaywall={() => {}} 
                    />
                )}
            </div>
        </div>
      </div>
      
      <footer style={styles.footer}>
        <button onClick={handleRetry} style={styles.retryButton}>
            <RetryIcon /> Riprova Esercizio
        </button>
      </footer>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', backgroundColor: COLORS.base },
  header: { textAlign: 'center', marginBottom: '32px' },
  titleContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' },
  icon: { width: '28px', height: '28px', color: COLORS.primary },
  title: { fontSize: '28px', color: COLORS.textPrimary, fontWeight: 'bold' },
  date: { fontSize: '14px', color: COLORS.textSecondary, marginTop: '8px' },
  content: { display: 'flex', flexDirection: 'column', gap: '32px' },
  section: { backgroundColor: COLORS.card, borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' },
  sectionTitle: { fontSize: '22px', fontWeight: 600, color: COLORS.textPrimary, margin: '0 0 16px 0', paddingBottom: '8px', borderBottom: `2px solid ${COLORS.secondary}` },
  responseBox: { backgroundColor: COLORS.cardDark, padding: '20px', borderRadius: '8px' },
  responseText: { fontSize: '16px', color: COLORS.textSecondary, fontStyle: 'italic', lineHeight: 1.6, margin: 0 },
  analysisContainer: {
    border: `1px solid ${COLORS.divider}`,
    borderRadius: '12px',
    overflow: 'hidden',
  },
  footer: { marginTop: '32px', display: 'flex', justifyContent: 'center' },
  retryButton: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '14px 28px', fontSize: '18px', fontWeight: 'bold', color: 'white',
    background: COLORS.primaryGradient, border: 'none', borderRadius: '8px',
    cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 15px rgba(14, 58, 93, 0.3)'
  },
};
