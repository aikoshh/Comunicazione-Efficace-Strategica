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

export interface Exercise {
  id: string;
  title: string;
  scenario: string;
  task: string;
  difficulty: DifficultyLevel;
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
  isDemo?: boolean;
}
