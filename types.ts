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
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface Exercise {
  id: string;
  title: string;
  scenario: string;
  task: string;
  difficulty: DifficultyLevel;
  exerciseType?: ExerciseType; // Make it optional to not break existing modules
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
}

export interface ImprovementArea {
  suggestion: string;
  example: string;
}

export interface AnalysisResult {
  score: number;
  strengths: string[];
  areasForImprovement: ImprovementArea[];
  suggestedResponse: {
    short: string;
    long: string;
  };
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

// New type for user progress tracking
export interface UserProgress {
    scores: number[];
}