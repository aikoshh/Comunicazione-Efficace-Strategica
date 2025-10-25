// types.ts
import React from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'badge';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  badge?: {
    title: string;
    icon: React.FC<any>;
  };
}

export interface ToastContextType {
  addToast: (message: string, type?: ToastType, badge?: ToastMessage['badge']) => void;
}

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
  exercises: Exercise[];
  isPro?: boolean;
  isCustom?: boolean;
  headerImage?: string;
  color: string;
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

export interface AnalysisHistoryItem {
  id: string;
  timestamp: string;
  type: 'written' | 'verbal';
  userResponse: string;
  result: AnalysisResult | VoiceAnalysisResult;
}

export interface CommunicatorProfile {
  profileTitle: string;
  profileDescription: string;
  strengths: string[];
  areasToImprove: string[];
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

export interface PersonalizationData {
  professione: string;
  livelloCarriera: string;
  eta: string;
  contestoComunicativo: string;
  sfidaPrincipale: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  enabled: boolean;
  createdAt: string;
  expiryDate: string | null;
}

export interface Entitlements {
  productIDs: Set<string>;
  teamSeats: number;
  teamActive: boolean;
}

export interface StorableEntitlements extends Omit<Entitlements, 'productIDs'> {
  productIDs: string[];
}

export interface Product {
  id: string;
  type: 'consumable' | 'non-consumable' | 'subscription';
  name: string;
  price: string;
  description: string;
  benefits: string[];
  category: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.FC<any>;
  isUnlocked: (progress: UserProgress) => boolean;
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

export interface ScoreExplanation {
  Coverage: number;
  Quality: number;
  Consistency: number;
  Recency: number;
  VoiceDelta: number;
}
