// services/gamificationService.ts
// FIX: Added Achievement and AnalysisHistoryItem to imports.
import { UserProgress, Achievement, VoiceAnalysisResult, CompetenceScores, CommunicatorProfile, AnalysisHistoryItem } from '../types';
import { HomeIcon, TargetIcon, CheckCircleIcon } from '../components/Icons';
import { MODULES } from '../constants';


// This is a simplified gamification service.
// In a real app, this logic would be more complex and likely server-side.

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_step',
    title: 'Primo Passo',
    description: 'Hai completato il tuo primo esercizio! Continua così.',
    icon: TargetIcon,
    isUnlocked: (progress: UserProgress) => (progress.completedExerciseIds.length >= 1),
  },
  {
    id: 'five_completed',
    title: 'Allievo Costante',
    description: 'Hai completato 5 esercizi. La pratica rende perfetti.',
    icon: CheckCircleIcon,
    isUnlocked: (progress: UserProgress) => (progress.completedExerciseIds.length >= 5),
  },
  {
    id: 'checkup_complete',
    title: 'Consapevolezza Strategica',
    description: 'Hai completato il check-up e scoperto il tuo profilo.',
    icon: HomeIcon,
    isUnlocked: (progress: UserProgress) => !!progress.checkupProfile,
  },
  // Add more achievements here...
];

export const getUnlockedAchievements = (progress: UserProgress): Achievement[] => {
  return ACHIEVEMENTS.filter(ach => ach.isUnlocked(progress));
};


// --- Logic from progressionService to calculate scores synchronously for level-up checks ---
const TOTAL_MODULES = MODULES.filter(m => !m.isCustom).length;

const levelThresholds = [
  { min: 0, label: "Comunicatore poco efficace" },
  { min: 40, label: "Comunicatore quasi efficace" },
  { min: 70, label: "Comunicatore efficace" },
  { min: 90, label: "Comunicatore efficace e strategico" },
];

const WEIGHTS = {
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

    // FIX: Removed unnecessary type cast.
    const timestamps = Object.values(history).map(h => new Date(h.timestamp).getTime());
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
    // FIX: Removed unnecessary type cast.
    const timestamps = Object.values(history).map(h => new Date(h.timestamp).getTime());
    if (timestamps.length === 0) return 0;

    const lastTimestamp = Math.max(...timestamps);
    const now = new Date().getTime();
    const daysSinceLast = (now - lastTimestamp) / (1000 * 60 * 60 * 24);

    return Math.max(0, 100 - (daysSinceLast * (100 / 30)));
}

function calculateVoiceDelta(progress: UserProgress): number {
    const history = progress.analysisHistory || {};
    const voiceScores: number[] = [];

    // FIX: Removed unnecessary type cast by using the item directly.
    Object.values(history).forEach(historyItem => {
        if (historyItem.type === 'verbal' && historyItem.result) {
            const voiceResult = historyItem.result as VoiceAnalysisResult;
            const avgScore = voiceResult.scores.reduce((sum, s) => sum + s.score, 0) / voiceResult.scores.length;
            voiceScores.push(avgScore * 10);
        }
    });

    if (voiceScores.length === 0) return 50; // Neutral score

    const averageVoiceScore = voiceScores.reduce((sum, score) => sum + score, 0) / voiceScores.length;
    return averageVoiceScore;
}

function calculateOverallScore(progress: UserProgress): number {
    if (!progress || !progress.completedExerciseIds || progress.completedExerciseIds.length === 0) {
      return 0;
    }
  
    const coverageScore = calculateCoverage(progress);
    const qualityScore = calculateQuality(progress);
    const consistencyScore = calculateConsistency(progress);
    const recencyScore = calculateRecency(progress);
    const voiceDeltaScore = calculateVoiceDelta(progress);
  
    return Math.round(
      coverageScore * WEIGHTS.Coverage +
      qualityScore * WEIGHTS.Quality +
      consistencyScore * WEIGHTS.Consistency +
      recencyScore * WEIGHTS.Recency +
      voiceDeltaScore * WEIGHTS.VoiceDelta
    );
}

function getLevel(score: number) {
    return levelThresholds.slice().reverse().find(l => score >= l.min) || levelThresholds[0];
}

// --- Service Implementation ---

const getInitialProgress = (): UserProgress => ({
  completedExerciseIds: [],
  scores: [],
  competenceScores: {
    ascolto: 0,
    riformulazione: 0,
    assertivita: 0,
    gestione_conflitto: 0,
  },
  analysisHistory: {},
  // FIX: Added missing gamification properties to initial progress object.
  xp: 0,
  level: 1,
  streak: 0,
  lastCompletionDate: null,
  unlockedBadges: [],
});

const processCompletion = (
    progress: UserProgress, 
    exerciseId: string, 
    newScore: number,
    isRetake: boolean,
    dailyChallengeId: string
) => {
    const oldProgress = JSON.parse(JSON.stringify(progress));
    const oldUnlockedAchievements = new Set(getUnlockedAchievements(oldProgress).map(a => a.id));
    const oldLevel = getLevel(calculateOverallScore(oldProgress));

    const updatedProgress: UserProgress = JSON.parse(JSON.stringify(progress));
    
    // Add new score
    updatedProgress.scores.push(newScore);

    // Add completed exercise if it's not a retake
    if (!isRetake) {
        updatedProgress.completedExerciseIds = [...new Set([...updatedProgress.completedExerciseIds, exerciseId])];
    }
    
    // Check for new badges
    const newUnlockedAchievements = getUnlockedAchievements(updatedProgress);
    const newBadges = newUnlockedAchievements.filter(ach => !oldUnlockedAchievements.has(ach.id));

    // Check for level up
    const newLevel = getLevel(calculateOverallScore(updatedProgress));
    
    let levelUp = null;
    if (newLevel.min > oldLevel.min) {
        levelUp = newLevel;
    }

    return {
        updatedProgress,
        levelUp,
        newBadges
    };
};

// FIX: Added missing processCheckupCompletion function.
const processCheckupCompletion = (progress: UserProgress) => {
    const oldProgress = JSON.parse(JSON.stringify(progress));
    const oldUnlockedAchievements = new Set(getUnlockedAchievements(oldProgress).map(a => a.id));

    // A checkup is complete when the profile is about to be set.
    // So we can create a temporary progress object to check if new achievements are unlocked.
    const tempProgress = { ...oldProgress, checkupProfile: { profileTitle: 'temp', profileDescription: '', strengths: [], areasToImprove: [] } as CommunicatorProfile};

    const newUnlockedAchievements = getUnlockedAchievements(tempProgress as UserProgress);
    const newBadges = newUnlockedAchievements.filter(ach => !oldUnlockedAchievements.has(ach.id));

    return {
        updatedProgress: oldProgress, // Return the original progress, it will be updated with the real profile in App.tsx
        newBadges,
    };
};

export const gamificationService = {
    getInitialProgress,
    processCompletion,
    processCheckupCompletion,
};