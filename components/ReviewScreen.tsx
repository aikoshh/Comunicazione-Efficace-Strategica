import React from 'react';
import { AnalysisHistoryRecord, Exercise, AnalysisResult, VoiceAnalysisResult } from '../types';
import { MODULES, COLORS } from '../constants';
import { AnalysisReportScreen } from './AnalysisReportScreen';
import { VoiceAnalysisReportScreen } from './VoiceAnalysisReportScreen';
import { RetryIcon } from './Icons';
import { soundService } from '../services/soundService';

interface ReviewScreenProps {
  historyRecord: AnalysisHistoryRecord;
  onBack: () => void;
  onRetry: (exercise: Exercise) => void;
}

const findExerciseById = (id: string): Exercise | undefined => {
    for (const mod of MODULES) {
        const found = mod.exercises.find(e => e.id === id);
        if (found) return found;
    }
    // Handle custom exercises
    if (id.startsWith('custom-')) {
        return {
            id: id,
            title: 'Esercizio Personalizzato',
            scenario: 'Scenario personalizzato',
            task: 'Compito personalizzato',
            difficulty: 'Base' as any,
        };
    }
    return undefined;
};

export const ReviewScreen: React.FC<ReviewScreenProps> = ({ historyRecord, onBack, onRetry }) => {
  const exercise = findExerciseById(historyRecord.exerciseId);

  if (!exercise) {
    return (
      <div style={styles.container}>
        <p>Esercizio non trovato.</p>
        <button onClick={onBack}>Torna Indietro</button>
      </div>
    );
  }
  
  const handleRetryClick = () => {
    soundService.playClick();
    onRetry(exercise);
  };
  
  const isVerbal = 'scores' in historyRecord.result;
  const ReportComponent = isVerbal ? VoiceAnalysisReportScreen : AnalysisReportScreen;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Revisione Esercizio: {exercise.title}</h1>
      
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>La tua Risposta</h2>
        <p style={styles.userResponse}>
            "{historyRecord.userResponse}"
        </p>
        <p style={styles.timestamp}>
            Risposto il: {new Date(historyRecord.timestamp).toLocaleString('it-IT')}
        </p>
      </div>
      
      <div style={styles.analysisContainer}>
        <h2 style={styles.sectionTitle}>Analisi Ricevuta</h2>
        {/*
          NOTE: We are reusing the entire report screens for consistency.
          The `onNextExercise` prop will navigate back to the module, which is a reasonable behavior.
          The `entitlements` prop is set to null to avoid showing upsell banners in review mode.
        */}
        <ReportComponent
          result={historyRecord.result as any}
          exercise={exercise}
          onRetry={() => onRetry(exercise)}
          onNextExercise={onBack}
          nextExerciseLabel="Torna al Modulo"
          entitlements={null}
          onNavigateToPaywall={() => {}}
        />
      </div>

       <div style={styles.buttonContainer}>
          <button onClick={handleRetryClick} style={styles.retryButton}>
            <RetryIcon /> Riprova Esercizio
          </button>
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
    title: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: '24px',
        textAlign: 'center',
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        border: `1px solid ${COLORS.divider}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    },
    sectionTitle: {
        fontSize: '20px',
        fontWeight: 600,
        color: COLORS.primary,
        marginBottom: '16px',
    },
    userResponse: {
        fontSize: '16px',
        fontStyle: 'italic',
        color: COLORS.textSecondary,
        lineHeight: 1.6,
        margin: 0,
        padding: '16px',
        backgroundColor: COLORS.cardDark,
        borderRadius: '8px',
    },
    timestamp: {
        fontSize: '12px',
        color: COLORS.textSecondary,
        textAlign: 'right',
        marginTop: '12px',
    },
    analysisContainer: {
        // The report component has its own styling, so we just wrap it.
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '24px',
    },
    retryButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: 'bold',
        color: 'white',
        background: COLORS.primaryGradient,
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, filter 0.2s ease',
    }
};