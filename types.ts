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
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
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