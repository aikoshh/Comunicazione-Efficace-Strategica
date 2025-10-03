import React from 'react';

export enum DifficultyLevel {
  BASE = 'Base',
  INTERMEDIO = 'Intermedio',
  AVANZATO = 'Avanzato',
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
  difficulty: DifficultyLevel;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  // FIX: Allow style prop for icon components to support coloring SVG icons.
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  exercises: Exercise[];
}

// Struttura per la Heatmap CES
export interface CESStepAnalysis {
  covered: boolean;
  suggestion?: string; // Suggerimento concreto se non coperto
}

export interface CESHeatmap {
  ingaggio: CESStepAnalysis;
  ricalco: CESStepAnalysis;
  riformulazione: CESStepAnalysis;
  direzionamento: CESStepAnalysis;
  chiusura: CESStepAnalysis;
}

// Struttura per l'analisi della Scala del Coinvolgimento
export interface CommunicativeScaleAnalysis {
  phase: string; // Es. "Consiglio non richiesto"
  feedback: string;
  scaleScore: number; // Punteggio da 1 a 10
}

// Struttura per la risposta ideale
export interface IdealResponse {
  short: string;
  long: string;
}

// Struttura completa del risultato dell'analisi
export interface AnalysisResult {
  score: number;
  feedback: string;
  isPositive: boolean;
  cesHeatmap: CESHeatmap;
  communicativeScaleAnalysis: CommunicativeScaleAnalysis;
  idealResponse: IdealResponse;
}
