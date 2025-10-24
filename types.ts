// types.ts
import React from 'react';

// === Enums and Basic Types ===

export enum DifficultyLevel {
  BASE = 'Base',
  INTERMEDIO = 'Intermedio',
  AVANZATO = 'Avanzato',
}

export enum ExerciseType {
  WRITTEN = 'Scritto',
  VERBAL = 'Vocale',
}

export type CompetenceKey = 'ascolto' | 'riformulazione' | 'assertivita' | 'gestione_conflitto';

// === Core Data Structures ===

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  enabled: boolean;
  createdAt: string; // ISO string
  expiryDate: string | null; // ISO string
}

export interface Exercise {
  id: string;
  title: string;
  scenario: string;
  task: string;
  difficulty: DifficultyLevel;
  competence: CompetenceKey;
  exerciseType?: ExerciseType;
  headerImage?: string;
  customObjective?: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  icon: React.FC<any>;
  headerImage: string;
  isPro: boolean;
  prerequisites: string[];
  exercises: Exercise[];
  isCustom?: boolean;
}

export interface VoiceRubricCriterion {
  id: string;
  label: string;
  description: string;
}

// === Analysis and Feedback ===

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
  // PRO Features
  evolutionary_feedback?: string;
  detailedRubric?: DetailedRubricScore[];
  utilityScore?: number;
  clarityScore?: number;
}

export interface VoiceAnalysisResult {
  scores: {
    criterion_id: string;
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

export interface CommunicatorProfile {
  profileTitle: string;
  profileDescription: string;
  strengths: string[];
  areasToImprove: string[];
}

export interface AnalysisHistoryItem {
  result: AnalysisResult | VoiceAnalysisResult;
  userResponse: string;
  timestamp: string; // ISO String
  type: 'written' | 'verbal';
}

// === User Progress and Gamification ===

export type CompetenceScores = Record<CompetenceKey, number>;

export interface UserProgress {
  completedExerciseIds: string[];
  scores: number[];
  competenceScores: CompetenceScores;
  analysisHistory: { [exerciseId: string]: AnalysisHistoryItem };
  checkupProfile?: CommunicatorProfile;
  // Gamification
  xp: number;
  level: number;
  streak: number;
  lastCompletionDate: string | null; // ISO String
  unlockedBadges: string[];
}

// === Personalization & PRO Content ===

export interface PersonalizationData {
  professione: string;
  livelloCarriera: string;
  eta: string;
  contestoComunicativo: string;
  sfidaPrincipale: string;
}

export interface StrategicQuestionCategory {
  category: string;
  description: string;
  questions: {
    question: string;
    description: string;
  }[];
}

export interface ChecklistItem {
    id: string;
    text: string;
}

// === Monetization ===

export interface Product {
  id: string;
  type: 'non-consumable' | 'subscription';
  name: string;
  price: string;
  description: string;
  benefits: string[];
  category: string;
}

export interface Entitlements {
  productIDs: Set<string>;
  teamSeats: number;
  teamActive: boolean;
}

export interface StorableEntitlements {
  productIDs: string[];
  teamSeats: number;
  teamActive: boolean;
}

// === UI & App State ===

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  badge?: {
      title: string;
      icon: React.FC<any>;
  }
}

export type ToastType = 'info' | 'success' | 'error' | 'badge';

export interface ToastContextType {
  addToast: (message: string, type?: ToastType, badge?: ToastMessage['badge']) => void;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.FC<any>;
  isUnlocked: (progress: UserProgress) => boolean;
}

// === Progression Analytics ===
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
