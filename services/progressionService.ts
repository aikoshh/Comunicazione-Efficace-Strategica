// services/progressionService.ts
import {
  UserProfile,
  UserProgress,
  ProgressOverviewData,
  ScoreExplanation,
  VoiceAnalysisResult,
  AnalysisHistoryItem,
} from '../types';
import { MODULES } from '../constants';

const TOTAL_MODULES = MODULES.filter(m => !m.isCustom).length;

const levelThresholds = [
  { min: 0, label: "Comunicatore poco efficace" },
  { min: 40, label: "Comunicatore quasi efficace" },
  { min: 70, label: "Comunicatore efficace" },
  { min: 90, label: "Comunicatore efficace e strategico" },
];

const WEIGHTS: ScoreExplanation = {
  Coverage: 0.3,
  Quality: 0.4,
  Consistency: 0.1,
  Recency: 0.1,
  VoiceDelta: 0.1,
};

function calculateCoverage(progress: UserProgress): number {
  const completedExercises = progress.completedExerciseIds || [];
  if (completedExercises.length === 0) return 0;

  const completedModules = new Set<string>();
  MODULES.forEach(module => {
    if (!module.isCustom && module.exercises.some(ex => completedExercises.includes(ex.id))) {
      completedModules.add(module.id);
    }
  });

  return (completedModules.size / TOTAL_MODULES) * 100;
}

function calculateQuality(progress: UserProgress): number {
  const scores = progress.scores || [];
  if (scores.length === 0) return 0;
  const totalScore = scores.reduce((sum, score) => sum + score, 0);
  return totalScore / scores.length;
}

function calculateConsistency(progress: UserProgress): number {
    const history = progress.analysisHistory || {};
    if (Object.keys(history).length < 2) return 50; // Neutral score if not enough data

    const timestamps = (Object.values(history) as AnalysisHistoryItem[]).map(h => new Date(h.timestamp).getTime());
    timestamps.sort((a, b) => a - b);

    const dayInMs = 1000 * 60 * 60 * 24;
    const uniqueDays = new Set(timestamps.map(ts => Math.floor(ts / dayInMs))).size;

    const firstDay = Math.floor(timestamps[0] / dayInMs);
    const lastDay = Math.floor(timestamps[timestamps.length - 1] / dayInMs);
    const totalDaysSpan = Math.max(lastDay - firstDay, 1);

    const consistencyRatio = uniqueDays / totalDaysSpan;
    return Math.min(consistencyRatio * 150, 100);
}

function calculateRecency(progress: UserProgress): number {
    const history = progress.analysisHistory || {};
    const timestamps = (Object.values(history) as AnalysisHistoryItem[]).map(h => new Date(h.timestamp).getTime());
    if (timestamps.length === 0) return 0;

    const lastTimestamp = Math.max(...timestamps);
    const now = new Date().getTime();
    const daysSinceLast = (now - lastTimestamp) / (1000 * 60 * 60 * 24);

    return Math.max(0, 100 - (daysSinceLast * (100 / 30)));
}

function calculateVoiceDelta(progress: UserProgress): number {
    const history = progress.analysisHistory || {};
    const voiceScores: number[] = [];

    (Object.values(history) as AnalysisHistoryItem[]).forEach(historyItem => {
        if (historyItem.type === 'verbal' && historyItem.result) {
            const voiceResult = historyItem.result as VoiceAnalysisResult;
            const avgScore = voiceResult.scores.reduce((sum, s) => sum + s.score, 0) / voiceResult.scores.length;
            voiceScores.push(avgScore * 10);
        }
    });

    if (voiceScores.length === 0) return 50;

    const averageVoiceScore = voiceScores.reduce((sum, score) => sum + score, 0) / voiceScores.length;
    return averageVoiceScore;
}


export async function getScoreExplanation(): Promise<ScoreExplanation> {
  const scoreData: ScoreExplanation = {
    Coverage: WEIGHTS.Coverage * 100,
    Quality: WEIGHTS.Quality * 100,
    Consistency: WEIGHTS.Consistency * 100,
    Recency: WEIGHTS.Recency * 100,
    VoiceDelta: WEIGHTS.VoiceDelta * 100,
  };
  return scoreData;
}


export async function getProgressOverview(user: UserProfile, progress: UserProgress | undefined): Promise<ProgressOverviewData> {
  if (!progress || !progress.completedExerciseIds || progress.completedExerciseIds.length === 0) {
    return {
      header: {
        welcome: `Ciao, ${user.firstName}!`,
        score: 0,
        level: 'Inizia il tuo percorso',
      },
      progress_bar: {
        value: 0,
        label: '0/100',
      },
    };
  }

  const coverageScore = calculateCoverage(progress);
  const qualityScore = calculateQuality(progress);
  const consistencyScore = calculateConsistency(progress);
  const recencyScore = calculateRecency(progress);
  const voiceDeltaScore = calculateVoiceDelta(progress);

  const finalScore = Math.round(
    coverageScore * WEIGHTS.Coverage +
    qualityScore * WEIGHTS.Quality +
    consistencyScore * WEIGHTS.Consistency +
    recencyScore * WEIGHTS.Recency +
    voiceDeltaScore * WEIGHTS.VoiceDelta
  );
  
  const level = levelThresholds.slice().reverse().find(l => finalScore >= l.min)?.label || 'Comunicatore';

  return {
    header: {
      welcome: `Ciao, ${user.firstName}!`,
      score: finalScore,
      level: level,
    },
    progress_bar: {
      value: finalScore,
      label: `${finalScore}/100`,
    },
  };
}