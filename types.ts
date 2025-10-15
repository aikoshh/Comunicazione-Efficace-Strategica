import React from 'react';

export enum DifficultyLevel {
  BASE = 'Base',
  INTERMEDIO = 'Intermedio',
  AVANZATO = 'Avanzato',
}

export enum ExerciseType {
  WRITTEN = 'WRITTEN',
  VERBAL = 'VERBAL',
}

export interface User {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  createdAt: string; // ISO 8601 string
  expiryDate: string | null; // ISO 8601 string or null
  isAdmin: boolean;
  enabled: boolean;
}

export interface Exercise {
  id: string;
  title: string;
  scenario: string;
  task: string;
  difficulty: DifficultyLevel;
  exerciseType?: ExerciseType; // Make it optional to not break existing modules
  customObjective?: string; // For personalized training goal
}

export type IconComponent = React.FC<React.SVGProps<SVGSVGElement>>;

export interface Module {
  id: string;
  title: string;
  description: string;
  icon: IconComponent;
  exercises: Exercise[];
  isCustom?: boolean;
  cardImage?: string;
  category?: 'Fondamentali' | 'Pacchetti Settoriali';
  prerequisites?: string[]; // Array of module IDs needed to unlock this one
}

export interface ImprovementArea {
  suggestion: string;
  example: string;
}

// --- PRO Feature Types ---
export interface DetailedRubricScore {
    criterion: 'Chiarezza' | 'Tono ed Empatia' | 'Orientamento alla Soluzione' | 'Assertività' | 'Struttura';
    score: number; // Score from 1 to 10
    justification: string;
}

export interface AnalysisResult {
  score: number;
  strengths: string[];
  areasForImprovement: ImprovementArea[];
  suggestedResponse: {
    short: string;
    long: string;
  };
  // PRO Features - Optional
  detailedRubric?: DetailedRubricScore[];
  utilityScore?: number; // For "Domande PRO"
  clarityScore?: number; // For "Domande PRO"
}

// New Types for Voice Analysis
export interface VoiceScore {
  criterion_id: string;
  score: number;
  why: string;
}

export interface SuggestedDelivery {
  instructions: string;
  annotated_text: string;
  ideal_script: string; // The new field for the "Strategic Replay" feature
}

export interface VoiceAnalysisResult {
  scores: VoiceScore[];
  strengths: string[];
  improvements: string[];
  actions: string[];
  micro_drill_60s: string;
  suggested_delivery: SuggestedDelivery;
}

// New Types for Progression System
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

// New Types for Competence Pie Chart
export type CompetenceKey = "ascolto" | "riformulazione" | "assertivita" | "gestione_conflitto";
export type CompetenceScores = Record<CompetenceKey, number>;

export interface AnalysisHistoryEntry {
  exerciseId: string;
  userResponse: string;
  result: AnalysisResult | VoiceAnalysisResult;
  timestamp: string;
  type: 'written' | 'verbal';
}

// New type for user progress tracking
export interface UserProgress {
  scores: number[];
  hasCompletedCheckup?: boolean;
  completedExerciseIds?: string[];
  skippedExerciseIds?: string[];
  completedModuleIds?: string[];
  dailyChallengeCompletedOn?: string; // e.g., "2024-07-29"
  checkupResults?: {
    strengths: string[];
    areasToImprove: string[];
    profileTitle: string;
    profileDescription: string;
  };
  analysisHistory?: AnalysisHistoryEntry[];
  // FIX: Corrected typo from Entitleaments to Entitlements.
  entitlements?: Entitlements;
  competenceScores?: CompetenceScores;
}

export interface CommunicatorProfile {
    profileTitle: string;
    profileDescription: string;
    strengths: string[];
    areasToImprove: string[];
}

export interface Breadcrumb {
  label: string;
  onClick?: () => void;
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

// --- Monetization Types ---
export type ProductType = 'non-consumable' | 'subscription';

export interface Product {
  id: string;
  type: ProductType;
  name: string;
  price: string;
  description: string;
  benefits: string[];
  category: 'Add-on' | 'Bundle' | 'Team Plan';
}

export interface Entitlements {
    productIDs: Set<string>;
    teamSeats: number;
    teamActive: boolean;
}

// --- PRO Content Types ---
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

// --- Custom Training Types ---
export interface PersonalizationData {
  professione: string;
  livelloCarriera: string;
  eta: string;
  contestoComunicativo: string;
  sfidaPrincipale: string;
}