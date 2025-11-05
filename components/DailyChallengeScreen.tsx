// components/DailyChallengeScreen.tsx
import React, { useState, useMemo } from 'react';
import { Exercise, AnalysisResult, Entitlements, AnalysisHistoryItem, UserProgress } from '../types';
import { ExerciseScreen } from './ExerciseScreen';
import { COLORS, DAILY_CHALLENGES, OBJECTIVE_CATEGORY_MAP } from '../constants';
import { TargetIcon } from './Icons';

const getDailyChallenge = (objective?: string): Exercise => {
  const date = new Date();
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));

  if (objective && OBJECTIVE_CATEGORY_MAP[objective]) {
    const category = OBJECTIVE_CATEGORY_MAP[objective];
    const categoryChallenges = DAILY_CHALLENGES.filter(c => c.category === category);
    if (categoryChallenges.length > 0) {
      return categoryChallenges[dayOfYear % categoryChallenges.length];
    }
  }
  
  // Fallback to general challenges or cycle through all if no specific ones are found
  const generalChallenges = DAILY_CHALLENGES.filter(c => c.category === 'general' || !c.category);
  if (generalChallenges.length > 0) {
      return generalChallenges[dayOfYear % generalChallenges.length];
  }

  // Final fallback to cycle all challenges
  return DAILY_CHALLENGES[dayOfYear % DAILY_CHALLENGES.length];
};

interface DailyChallengeScreenProps {
  userProgress: UserProgress;
  onComplete: (result: AnalysisResult, userResponse: string, exercise: Exercise) => void;
  entitlements: Entitlements | null;
  analysisHistory: { [exerciseId: string]: AnalysisHistoryItem };
  onApiKeyError: (error: string) => void;
  onBack: () => void;
}

export const DailyChallengeScreen: React.FC<DailyChallengeScreenProps> = (props) => {
  const dailyExercise = useMemo(() => getDailyChallenge(props.userProgress.mainObjective), [props.userProgress.mainObjective]);

  return (
    <div style={{ paddingTop: '20px' }}>
      <header style={styles.header}>
        <div style={styles.titleContainer}>
            <TargetIcon style={styles.titleIcon} />
            <h1 style={styles.title}>Sfida del Giorno</h1>
        </div>
        <p style={styles.subtitle}>
            Ogni giorno un nuovo scenario per mettere alla prova le tue abilità di comunicazione strategica.
        </p>
      </header>
      <ExerciseScreen 
        exercise={dailyExercise}
        moduleColor={COLORS.primary}
        onComplete={(result, userResponse, exercise, type) => props.onComplete(result as AnalysisResult, userResponse, exercise)}
        entitlements={props.entitlements}
        analysisHistory={props.analysisHistory}
        onApiKeyError={props.onApiKeyError}
      />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    textAlign: 'center',
    marginBottom: '20px',
    maxWidth: '800px',
    margin: '0 auto 40px',
    backgroundColor: COLORS.card,
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
    position: 'relative',
    zIndex: 2,
  },
   titleContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      justifyContent: 'center',
      textAlign: 'center'
  },
  titleIcon: {
      width: '32px',
      height: '32px',
      color: COLORS.primary
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: COLORS.primary,
    margin: 0,
  },
  subtitle: {
    fontSize: '16px',
    color: COLORS.textSecondary,
    lineHeight: 1.6,
    marginTop: '12px'
  },
};