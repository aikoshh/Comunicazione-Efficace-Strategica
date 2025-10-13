import type { ProgressOverviewData, ScoreExplanation, User, UserProgress, Exercise, Module } from '../types';

const mockScoreExplanation: ScoreExplanation = {
  Coverage: 58,
  Quality: 66,
  Consistency: 65,
  Recency: 60,
  VoiceDelta: 75,
};

const levelThresholds = [
  { id: "poco_efficace", min: 0, label: "Comunicatore poco efficace" },
  { id: "quasi_efficace", min: 40, label: "Comunicatore quasi efficace" },
  { id: "efficace", min: 70, label: "Comunicatore efficace" },
  { id: "efficace_strategico", min: 90, label: "Comunicatore efficace e strategico" },
];

const getLevelForScore = (score: number): string => {
    if (score === 0) {
        return "Comunicatore principiante";
    }
    // Find the highest threshold the score meets
    return [...levelThresholds].reverse().find(l => score >= l.min)?.label || "Comunicatore poco efficace";
};

// Simulate async API calls to mimic real-world fetching
export const getProgressOverview = async (user: User, progress: UserProgress | undefined): Promise<ProgressOverviewData> => {
  return new Promise(resolve => {
    setTimeout(() => {
        let score = 0;
        if (progress && progress.scores.length > 0) {
            const sum = progress.scores.reduce((acc, s) => acc + s, 0);
            score = Math.round(sum / progress.scores.length);
        }

        const overview: ProgressOverviewData = {
            header: {
              welcome: `Bentornato ${user.firstName}`,
              score: score,
              level: getLevelForScore(score),
            },
            progress_bar: {
              value: score,
              label: `${score}/100`,
            },
          };

        resolve(overview);
    }, 300);
  });
};

export const getScoreExplanation = async (): Promise<ScoreExplanation> => {
  return new Promise(resolve => setTimeout(() => resolve(mockScoreExplanation), 300));
};

export const getDailyChallenge = (modules: Module[]): Exercise => {
    // Flatten all exercises from non-custom modules
    const allExercises = modules
        .filter(m => !m.isCustom && m.exercises.length > 0)
        .flatMap(m => m.exercises);

    // Use the current date to get a pseudo-random but consistent exercise for the day
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const index = dayOfYear % allExercises.length;
    
    const dailyExercise = allExercises[index];
    
    return {
        ...dailyExercise,
        title: `Sfida del Giorno: ${dailyExercise.title}`,
    };
};