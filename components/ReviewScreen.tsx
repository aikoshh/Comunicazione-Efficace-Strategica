import React from 'react';
import { Exercise, AnalysisHistoryEntry, AnalysisResult, VoiceAnalysisResult, DetailedRubricScore } from '../types';
import { COLORS } from '../constants';
import { BackIcon, RetryIcon } from './Icons';
import { soundService } from '../services/soundService';
import { AnalysisReportScreen } from './AnalysisReportScreen';
import { VoiceAnalysisReportScreen } from './VoiceAnalysisReportScreen';
import { useLocalization } from '../context/LocalizationContext';

interface ReviewScreenProps {
  exercise: Exercise;
  historyEntry: AnalysisHistoryEntry;
  onRetry: () => void;
  onBack: () => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({ exercise, historyEntry, onRetry, onBack }) => {
  const { response, result, timestamp } = historyEntry;
  const { t } = useLocalization();

  const handleRetryClick = () => {
    soundService.playClick();
    onRetry();
  };

  const handleBackClick = () => {
    soundService.playClick();
    onBack();
  };
  
  const isVoiceResult = (res: any): res is VoiceAnalysisResult => {
    return 'scores' in res && 'suggested_delivery' in res;
  };

  return (
    <div style={styles.container}>
      <div style={styles.reviewCard}>
        <header style={styles.header}>
            <div>
                <h1 style={styles.title}>{t('reviewTitle')}</h1>
                <p style={styles.exerciseTitle}>{exercise.title}</p>
                 <p style={styles.timestamp}>{t('completedOn', { date: new Date(timestamp).toLocaleString() })}</p>
            </div>
             <button onClick={handleBackClick} style={styles.backButton}>
                <BackIcon /> {t('backToModule')}
            </button>
        </header>
        
        <div style={styles.responseSection}>
            <h2 style={styles.sectionTitle}>{t('yourPreviousResponse')}</h2>
            <p style={styles.responseText}>"{response}"</p>
        </div>

        <div style={styles.analysisSection}>
            <h2 style={styles.sectionTitle}>{t('analysisReportTitle')}</h2>
            {isVoiceResult(result) ? (
                <VoiceAnalysisReportScreen 
                    result={result} 
                    exercise={exercise} 
                    onRetry={() => {}} // Dummy, button is outside
                    onNextExercise={() => {}} // Dummy
                    nextExerciseLabel=""
                    entitlements={null} // Not relevant in review
                    onNavigateToPaywall={() => {}} // Not relevant
                />
            ) : (
                <AnalysisReportScreen 
                    result={result as AnalysisResult} 
                    exercise={exercise} 
                    onRetry={() => {}} // Dummy
                    onNextExercise={() => {}} // Dummy
                    nextExerciseLabel=""
                    entitlements={null} // Not relevant
                    onNavigateToPaywall={() => {}} // Not relevant
                />
            )}
        </div>
        
        <footer style={styles.footer}>
            <button onClick={handleRetryClick} style={styles.retryButton}>
                <RetryIcon/> {t('retryExercise')}
            </button>
        </footer>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: COLORS.base,
    padding: '40px 20px',
  },
  reviewCard: {
    backgroundColor: COLORS.card,
    borderRadius: '12px',
    maxWidth: '900px',
    margin: '0 auto',
    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
  },
  header: {
    padding: '24px',
    borderBottom: `1px solid ${COLORS.divider}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    margin: 0,
  },
  exerciseTitle: {
      fontSize: '18px',
      color: COLORS.textSecondary,
      margin: '8px 0 4px 0',
      fontWeight: 500
  },
  timestamp: {
      fontSize: '14px',
      color: COLORS.textSecondary,
      margin: 0,
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
      flexShrink: 0
  },
  responseSection: {
      padding: '24px',
      backgroundColor: COLORS.cardDark
  },
  sectionTitle: {
      fontSize: '20px',
      fontWeight: 600,
      color: COLORS.textPrimary,
      marginBottom: '16px'
  },
  responseText: {
      fontSize: '16px',
      fontStyle: 'italic',
      color: COLORS.textSecondary,
      lineHeight: 1.7,
      margin: 0,
      padding: '16px',
      backgroundColor: COLORS.card,
      borderRadius: '8px',
      borderLeft: `3px solid ${COLORS.secondary}`
  },
  analysisSection: {
    padding: '0', // The report components have their own padding
  },
  footer: {
      padding: '24px',
      borderTop: `1px solid ${COLORS.divider}`,
      textAlign: 'center'
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
