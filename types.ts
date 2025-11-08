// types.ts
import React from 'react';

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

export interface UserProgress {
  completedExerciseIds: string[];
  scores: number[];
  competenceScores: CompetenceScores;
  analysisHistory: { [exerciseId: string]: AnalysisHistoryItem };
  checkupProfile?: CommunicatorProfile;
  mainObjective?: string;
  xp: number;
  level: number;
  streak: number;
  lastCompletionDate: string | null;
  unlockedBadges: string[];
}

export type CompetenceKey = 'ascolto' | 'riformulazione' | 'assertivita' | 'gestione_conflitto';

export type CompetenceScores = Record<CompetenceKey, number>;

export interface AnalysisHistoryItem {
    timestamp: string;
    result: AnalysisResult | VoiceAnalysisResult;
    userResponse: string;
    type: 'written' | 'verbal';
    competence: CompetenceKey;
    score: number;
}

export enum ExerciseType {
  WRITTEN = 'written',
  VERBAL = 'verbal',
}

export interface Exercise {
  id: string;
  title: string;
  scenario: string;
  task: string;
  difficulty: 'Facile' | 'Medio' | 'Difficile';
  competence: CompetenceKey;
  exerciseType?: ExerciseType;
  category?: 'negotiation' | 'team_management' | 'relationships' | 'public_speaking' | 'general';
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

export interface Path {
    id: string;
    title: string;
    description: string;
    exerciseIds: string[];
    isPro?: boolean;
}

export interface Entitlements {
  productIDs: Set<string>;
  teamSeats: number;
  teamActive: boolean;
}

export interface StorableEntitlements {
    productIDs: string[];
    teamSeats?: number;
    teamActive?: boolean;
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
    userQuote: string;
    suggestion: string;
    rewrittenExample: string;
  }[];
  suggestedResponse: {
    short: string;
    long: string;
  };
  detailedRubric?: DetailedRubricScore[];
}

export interface VoiceAnalysisScore {
    criterion_id: 'ritmo' | 'tono' | 'volume' | 'pause' | 'chiarezza';
    score: number;
    justification: string;
}

// NEW: Added types for real-time analysis
export interface RealTimeMetrics {
  volume: number; // 0-100
  wpm: number;
  fillerCount: number;
  dynamicRange: number; // 0-100
}

export interface RealTimeMetricsSummary {
  avgWpm: number;
  totalFillers: number;
  avgDynamicRange: number;
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
    realTimeMetricsSummary?: RealTimeMetricsSummary; // Added summary
}

export interface CommunicatorProfile {
  profileTitle: string;
  profileDescription: string;
  strengths: string[];
  areasToImprove: string[];
}

export interface PersonalizationData {
    areaDiVita: string;
    ruoloContesto: string;
    interlocutore: string;
    obiettivoConversazione: string;
    sfidaPrincipale: string;
}

export type ResponseStyle = 'Empatica' | 'Diretta' | 'Strategica';

export interface Suggestion {
  type: 'assertiva' | 'empatica' | 'chiarificatrice' | 'strategica';
  response: string;
}

export interface StrategicResponse {
    analysis: string;
    suggestions: Suggestion[];
}

export interface ContinuedStrategicResponse extends StrategicResponse {
    personaResponse: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'persona' | 'coach';
    content: string;
    analysis?: string;
    suggestions?: Suggestion[];
}

export interface Product {
    id: string;
    type: 'consumable' | 'non-consumable';
    name: string;
    price: string;
    description: string;
    benefits: string[];
    category: string;
    paymentLink?: string;
    discountedFrom?: string;
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

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  badge?: Achievement; // Optional badge info for badge toasts
}

export type ToastType = 'success' | 'error' | 'info' | 'badge';

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

export type ScoreExplanation = Record<'Coverage' | 'Quality' | 'Consistency' | 'Recency' | 'VoiceDelta', number>;

export interface StrategicQuestionCategory {
    category: string;
    description: string;
    questions: {
        question: string;
        options: string[];
        correctAnswerIndex: number;
        explanation: string;
    }[];
}

export interface ChecklistItem {
    id: string;
    text: string;
}

export type ReportStatus = 'new' | 'read' | 'resolved';

export interface ProblemReport {
    id: string;
    userId: string;
    userEmail: string;
    userName: string;
    message: string;
    timestamp: string;
    status: ReportStatus;
}