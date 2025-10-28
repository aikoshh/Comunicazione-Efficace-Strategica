// types.ts
import React from 'react';

export enum ExerciseType {
  WRITTEN = 'written',
  VERBAL = 'verbal',
}

export type CompetenceKey = 'ascolto' | 'riformulazione' | 'assertivita' | 'gestione_conflitto';
export type CompetenceScores = Record<CompetenceKey, number>;

export interface Exercise {
  id: string;
  title: string;
  scenario: string;
  task: string;
  difficulty: 'Facile' | 'Medio' | 'Difficile';
  competence: CompetenceKey;
  exerciseType?: ExerciseType;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  color: string;
  headerImage: string;
  exercises: Exercise[];
  isPro?: boolean;
  isCustom?: boolean;
}

export interface DetailedRubricScore {
    criterion: string;
    score: number;
    justification: string;
}

export interface AnalysisResult {
    score: number;
    strengths: string[];
    areasForImprovement: {
        suggestion: string;
        example: string;
    }[];
    suggestedResponse: {
        short: string;
        long: string;
    };
    evolutionary_feedback?: string;
    detailedRubric?: DetailedRubricScore[];
    utilityScore?: number;
    clarityScore?: number;
}

export interface VoiceAnalysisResult {
    scores: {
        criterion_id: 'ritmo' | 'tono' | 'volume' | 'pause' | 'chiarezza';
        score: number;
    }[];
    strengths: string[];
    improvements: string[];
    actions: string[];
    micro_drill_60s: string;
    suggested_delivery: {
        instructions: string;
        annotated_text: string;
        ideal_script: string;
    };
}

export interface Entitlements {
    productIDs: Set<string>;
    teamSeats: number;
    teamActive: boolean;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    isUnlocked: (progress: UserProgress, entitlements?: Entitlements | null) => boolean;
}

export interface Level {
    level: number;
    minXp: number;
    label: string;
}

export interface CommunicatorProfile {
    profileTitle: string;
    profileDescription: string;
    strengths: string[];
    areasToImprove: string[];
}

export interface AnalysisHistoryItem {
    result: AnalysisResult | VoiceAnalysisResult;
    userResponse: string;
    timestamp: string;
    type: 'written' | 'verbal';
}

export interface UserProgress {
  completedExerciseIds: string[];
  scores: number[];
  competenceScores: CompetenceScores;
  analysisHistory: { [exerciseId: string]: AnalysisHistoryItem };
  checkupProfile?: CommunicatorProfile;
  xp: number;
  level: number;
  streak: number;
  lastCompletionDate: string | null;
  unlockedBadges: string[];
}

export interface UserProfile {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    isAdmin: boolean;
    enabled: boolean;
    expiryDate: string | null;
    createdAt: string;
}

export interface StorableEntitlements {
    productIDs: string[];
    teamSeats: number;
    teamActive: boolean;
}

export interface PersonalizationData {
    professione: string;
    livelloCarriera: string;
    eta: string;
    contestoComunicativo: string;
    sfidaPrincipale: string;
}

export interface Product {
    id: string;
    type: 'non-consumable' | 'subscription';
    name: string;
    price: string;
    description: string;
    benefits: string[];
    category: string;
}

export interface StrategicQuestion {
    question: string;
    description: string;
}

export interface StrategicQuestionCategory {
    category: string;
    description: string;
    questions: StrategicQuestion[];
}

export interface ChecklistItem {
    id: string;
    text: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'badge';

export interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
    badge?: Achievement;
}

export interface ToastContextType {
    addToast: (message: string, type?: ToastType, badge?: Achievement) => void;
}

export interface ProgressOverviewData {
    header: {
        welcome: string;
        score: number;
        level: string;
    };
    progress_bar: {
        value: number;
        label: string;
    };
}

export type ScoreExplanation = {
    [key in 'Coverage' | 'Quality' | 'Consistency' | 'Recency' | 'VoiceDelta']: number;
};
