// types.ts
import React from 'react';

// === Core Data Structures ===

export interface Module {
  id: string;
  title: string;
  description: string;
  icon: React.FC<any>;
  headerImage: string;
  exercises: Exercise[];
  isCustom?: boolean;
  isPro?: boolean;
  prerequisites?: string[]; // ID dei moduli da completare per sbloccare questo
}

export interface Exercise {
  id: string;
  title: string;
  scenario: string;
  task: string;
  difficulty: DifficultyLevel;
  exerciseType?: ExerciseType;
  headerImage?: string;
  customObjective?: string;
  competence: CompetenceKey | null;
}

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

// === Analysis Results ===

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
    evolutionary_feedback?: string; // New contextual feedback
    detailedRubric?: DetailedRubricScore[];
    utilityScore?: number;
    clarityScore?: number;
}

export interface VoiceRubricCriterion {
    id: string;
    label: string;
    description: string;
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


// === User & Progress ===

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

export interface CompetenceScores {
    ascolto: number;
    riformulazione: number;
    assertivita: number;
    gestione_conflitto: number;
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
    checkupProfile?: CommunicatorProfile;
    competenceScores: CompetenceScores;
    analysisHistory: {
        [exerciseId: string]: AnalysisHistoryItem
    };
    // Gamification
    xp: number;
    level: number;
    streak: number;
    lastCompletionDate: string | null;
    unlockedBadges: string[];
}


export interface CommunicatorProfile {
    profileTitle: string;
    profileDescription: string;
    strengths: string[];
    areasToImprove: string[];
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


// === Personalization & PRO Content ===

export interface PersonalizationData {
    professione: string;
    livelloCarriera: string;
    eta: string;
    contestoComunicativo: string;
    sfidaPrincipale: string;
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

// For storing in Firestore (Set cannot be stored)
export interface StorableEntitlements extends Omit<Entitlements, 'productIDs'> {
    productIDs: string[];
}


// === UI & App State ===

export type ToastType = 'success' | 'error' | 'info' | 'badge';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  badge?: {
      title: string;
      icon: React.FC<any>;
  }
}

export interface ToastContextType {
  addToast: (message: string, type?: ToastType, badge?: ToastMessage['badge']) => void;
}

export type AppScreen = 
  | 'login'
  | 'home'
  | 'module'
  | 'exercise'
  | 'analysis_report'
  | 'voice_analysis_report'
  | 'custom_setup'
  | 'strategic_checkup'
  | 'communicator_profile'
  | 'paywall'
  | 'admin'
  | 'chat_trainer'
  | 'api_key_error'
  | 'competence_report'
  | 'achievements';

export interface AppState {
    currentScreen: AppScreen;
    currentModuleId?: string;
    currentExerciseId?: string;
    analysisResult?: AnalysisResult;
    voiceAnalysisResult?: VoiceAnalysisResult;
    userResponse?: string;
    isReviewMode?: boolean; // To view past results
    checkupProfile?: CommunicatorProfile;
    apiKeyError?: string;
}

// Gamification
export interface Badge {
    id: string;
    title: string;
    description: string;
    icon: React.FC<any>;
    isPro?: boolean;
    condition: (progress: UserProgress) => boolean;
}
// FIX: Added Achievement interface to resolve missing type error.
export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: React.FC<any>;
    isUnlocked: (progress: UserProgress) => boolean;
}