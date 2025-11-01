// types.ts

import React from 'react';

// --- USER & AUTH ---

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

export interface Entitlements {
    productIDs: Set<string>;
    teamSeats: number;
    teamActive: boolean;
}

// FIX: Corrected typo in interface name from StorableEntitleaments to StorableEntitlements.
export interface StorableEntitlements {
    productIDs: string[];
    teamSeats: number;
    teamActive: boolean;
}

// --- CORE APP ---

export enum ExerciseType {
  WRITTEN = 'written',
  VERBAL = 'verbal',
}

export type CompetenceKey = 'ascolto' | 'riformulazione' | 'assertivita' | 'gestione_conflitto';

export interface CompetenceScores {
    ascolto: number;
    riformulazione: number;
    assertivita: number;
    gestione_conflitto: number;
}

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
  icon: React.FC<any>;
  color: string;
  headerImage: string;
  exercises: Exercise[];
  isPro?: boolean;
  isCustom?: boolean;
}

// --- ANALYSIS & RESULTS ---

export interface DetailedRubricScore {
  criterion: string;
  score: number; // 0-10
  justification: string;
}

export interface AreaForImprovement {
    suggestion: string;
    example: string;
}

export interface AnalysisResult {
  score: number; // Overall score 0-100
  strengths: string[];
  areasForImprovement: AreaForImprovement[];
  suggestedResponse: {
    short: string;
    long: string;
  };
  detailedRubric?: DetailedRubricScore[]; // PRO feature
}

export interface VoiceAnalysisScore {
    criterion_id: 'ritmo' | 'tono' | 'volume' | 'pause' | 'chiarezza';
    score: number; // 0-10
    justification: string;
}

export interface VoiceAnalysisResult {
    scores: VoiceAnalysisScore[];
    strengths: string[];
    improvements: string[];
    actions: string[];
    micro_drill_60s: string;
    suggested_delivery: {
        instructions: string;
        ideal_script: string;
        annotated_text: string;
    };
}


export interface CommunicatorProfile {
    profileTitle: string;
    profileDescription: string;
    strengths: string[];
    areasToImprove: string[];
}

export interface AnalysisHistoryItem {
    timestamp: string; // ISO string
    result: AnalysisResult | VoiceAnalysisResult;
    userResponse: string;
    type: 'written' | 'verbal';
}

// --- GAMIFICATION & PROGRESS ---

export interface UserProgress {
  completedExerciseIds: string[];
  scores: number[]; // History of overall scores from exercises
  competenceScores: CompetenceScores;
  analysisHistory: {
    [exerciseId: string]: AnalysisHistoryItem;
  };
  checkupProfile?: CommunicatorProfile;
  // Gamification
  xp: number;
  level: number;
  streak: number;
  lastCompletionDate: string | null;
  unlockedBadges: string[];
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: React.FC<any>;
    isUnlocked: (progress: UserProgress, entitlements?: Entitlements) => boolean;
}

export interface Level {
    level: number;
    minXp: number;
    label: string;
}

// --- MONETIZATION ---

export interface Product {
    id: string;
    type: 'non-consumable' | 'subscription';
    name: string;
    price: string;
    description: string;
    benefits: string[];
    category: string;
}

// --- UI & MISC ---

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

export type ResponseStyle = 'Empatica' | 'Diretta' | 'Strategica';

export interface StrategicResponse {
    analysis: string;
    suggestions: {
        type: 'assertiva' | 'empatica' | 'chiarificatrice' | 'strategica';
        response: string;
    }[];
}

export interface ContinuedStrategicResponse extends StrategicResponse {
    personaResponse: string;
}


export interface ChatMessage {
    id: string;
    role: 'user' | 'persona' | 'coach';
    content: string;
    feedback?: string;
}


// --- PROGRESS OVERVIEW ---
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

// --- ADMIN & REPORTING ---
export type ReportStatus = 'new' | 'read' | 'resolved';

export interface ProblemReport {
    id: string;
    userId: string;
    userEmail: string;
    userName: string;
    message: string;
    timestamp: string; // ISO string
    status: ReportStatus;
}