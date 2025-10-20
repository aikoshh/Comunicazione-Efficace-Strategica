import React from 'react';

// === Core Enums ===
export enum DifficultyLevel {
  BASE = 'Base',
  INTERMEDIO = 'Intermedio',
  AVANZATO = 'Avanzato',
}

export enum ExerciseType {
  WRITTEN = 'written',
  VERBAL = 'verbal',
}

// === Component-related Types ===
export type IconComponent = React.FC<React.SVGProps<SVGSVGElement>>;

export interface Breadcrumb {
  label: string;
  onClick?: () => void;
}

// === Main Data Structures ===
export interface Exercise {
  id: string;
  title: string;
  scenario: string;
  task: string;
  difficulty: DifficultyLevel;
  exerciseType?: ExerciseType;
  headerImage?: string;
  customObjective?: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  icon: IconComponent;
  cardImage?: string;
  headerImage?: string;
  exercises: Exercise[];
  isCustom?: boolean;
  specialModuleType?: 'chat_trainer';
  category: 'Fondamentali' | 'Pacchetti Settoriali' | 'Pacchetti Speciali';
  prerequisites?: string[];
}

// === Analysis & Results ===
export interface AreaForImprovement {
    suggestion: string;
    example: string;
}

export interface DetailedRubricScore {
  criterion: string;
  score: number;
  justification: string;
}

export interface AnalysisResult {
  score: number;
  strengths: string[];
  areasForImprovement: AreaForImprovement[];
  suggestedResponse: {
    short: string;
    long: string;
  };
  detailedRubric?: DetailedRubricScore[];
  utilityScore?: number;
  clarityScore?: number;
}

export interface VoiceRubricScore {
    criterion_id: string;
    score: number; // 1-10
}

export interface VoiceAnalysisResult {
    scores: VoiceRubricScore[];
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

export interface AnalysisHistoryEntry {
    exerciseId: string;
    userResponse: string;
    result: AnalysisResult | VoiceAnalysisResult;
    type: 'written' | 'verbal';
    timestamp: string;
}

// === User and Progress ===
export interface User {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  expiryDate: string | null;
  isAdmin: boolean;
  enabled: boolean;
}

export type CompetenceKey = 'ascolto' | 'riformulazione' | 'assertivita' | 'gestione_conflitto';

export interface CompetenceScores extends Record<CompetenceKey, number> {}

export interface UserProgress {
  scores: number[];
  completedExerciseIds?: string[];
  skippedExerciseIds?: string[];
  completedModuleIds?: string[];
  hasCompletedCheckup?: boolean;
  checkupResults?: CommunicatorProfile;
  analysisHistory?: AnalysisHistoryEntry[];
  competenceScores?: CompetenceScores;
}

export interface CommunicatorProfile {
    profileTitle: string;
    profileDescription: string;
    strengths: string[];
    areasToImprove: string[];
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

// Storable version of Entitlements for JSON compatibility
export interface StorableEntitlements extends Omit<Entitlements, 'productIDs'> {
    productIDs: string[];
}

// === App State & Services ===
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

export interface PersonalizationData {
    professione: string;
    livelloCarriera: string;
    eta: string;
    contestoComunicativo: string;
    sfidaPrincipale: string;
}

// === Toast Notifications ===
export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

// === PRO Content ===
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

// === Database ===
export interface Database {
    users: User[];
    userProgress: Record<string, UserProgress>;
    entitlements: Record<string, StorableEntitlements>;
}