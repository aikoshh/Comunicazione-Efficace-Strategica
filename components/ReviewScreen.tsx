import React from 'react';
import { AnalysisHistoryItem, Module, Exercise } from '../types';
import { COLORS } from '../constants';
import { BackIcon, RetryIcon } from './Icons';
import { AnalysisReportScreen } from './AnalysisReportScreen';
import { VoiceAnalysisReportScreen } from './VoiceAnalysisReportScreen';
import { soundService } from '../services/soundService';
import { useLocalization } from '../context/LocalizationContext';
import { getContent } from '../locales/content';

interface ReviewScreenProps {
  historyItem: AnalysisHistoryItem;
  onRetry: () => void;
  onBack: () => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({ historyItem, onRetry, onBack }) => {
  const { lang, t } = useLocalization();
  const MODULES = getContent(lang).MODULES;

  const findExerciseById = (id: string): Exercise | undefined => {
    if (id.startsWith('custom-')) {
        // Since custom exercises are not stored, we create a placeholder.
        // The actual scenario/task will come from the historyItem.
        return {
            id,
            title: t('customExerciseTitle'),
            scenario: '', // This will be overridden by history data
            task: '',     // This will be overridden by history data
            difficulty: 'Base' as any,
        };
    }
    for (const module of MODULES) {
        const found = module.exercises.find(e => e.id === id);
        if (found) return found;
    }
    return undefined;
  };

  const exercise = findExerciseById(historyItem.exerciseId);

  if (!exercise) {
    return <div>{t('exerciseNotFound')}</div>;
  }

  // Override scenario/task for custom exercises with the one saved in history
  if (exercise.id.startsWith('custom-')) {
      const isVoiceAnalysis = 'scores' in historyItem.analysis;
      if (!isVoiceAnalysis) {
          // This part is a bit tricky since the original scenario/task of a written custom exercise wasn't saved.
          // We can only show the user's response and the analysis.
          exercise.scenario = t('customExerciseScenarioPlaceholder');
          exercise.task = t('customExerciseTaskPlaceholder');
      } else {
          // For verbal, it should be part of the analysis, but let's be safe.
          exercise.scenario = t('customExerciseScenarioPlaceholder');
          exercise.task = t('customExerciseTaskPlaceholder');
      }
  }


  const handleBackClick = () => {
    soundService.playClick();
    onBack();
  };

  const isVoiceAnalysis = 'scores' in historyItem.analysis;

  return (
    <div style={styles.container}>
      <button onClick={handleBackClick} style={styles.backButton}>
        <BackIcon /> {t('backToModule')}
      </button>

      <div style={styles.reviewHeader}>
        <h1 style={styles.title}>{t('reviewExerciseTitle')}</h1>
        <p style={styles.subtitle}>{t('reviewExerciseSubtitle')}</p>
      </div>

      <div style={styles.userResponseCard}>
        <h2 style={styles.sectionTitle}>{t('yourPreviousResponse')}</h2>
        <blockquote style={styles.blockquote}>"{historyItem.userResponse}"</blockquote>
      </div>

      {isVoiceAnalysis ? (
        <VoiceAnalysisReportScreen
          result={historyItem.analysis}
          exercise={exercise}
          onRetry={onRetry}
          onNextExercise={onBack}
          nextExerciseLabel={t('backToModule')}
          entitlements={null} // Entitlements don't matter for review
          onNavigateToPaywall={() => {}}
        />
      ) : (
        <AnalysisReportScreen
          result={historyItem.analysis}
          exercise={exercise}
          onRetry={onRetry}
          onNextExercise={onBack}
          nextExerciseLabel={t('backToModule')}
          entitlements={null} // Entitlements don't matter for review
          onNavigateToPaywall={() => {}}
        />
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '40px 20px',
    backgroundColor: COLORS.base,
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
      marginBottom: '24px',
  },
  reviewHeader: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: '18px',
    color: COLORS.textSecondary,
    marginTop: '8px',
  },
  userResponseCard: {
    backgroundColor: COLORS.card,
    padding: '24px',
    borderRadius: '12px',
    marginBottom: '32px',
    border: `1px solid ${COLORS.divider}`,
  },
  sectionTitle: {
    fontSize: '20px',
    color: COLORS.textPrimary,
    fontWeight: 600,
    marginBottom: '16px',
  },
  blockquote: {
    margin: 0,
    padding: '16px',
    backgroundColor: COLORS.cardDark,
    borderRadius: '8px',
    borderLeft: `4px solid ${COLORS.secondary}`,
    fontSize: '16px',
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    lineHeight: 1.7,
  }
};