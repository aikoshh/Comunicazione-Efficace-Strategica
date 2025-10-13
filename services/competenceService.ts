import type { CompetenceKey, CompetenceScores } from '../types';

/**
 * Maps each exercise ID to a specific core competence.
 * This is used to determine which competence score to update after an exercise.
 */
export const EXERCISE_TO_COMPETENCE_MAP: Record<string, CompetenceKey> = {
    // Check-up
    'checkup-1': 'riformulazione',
    'checkup-2': 'gestione_conflitto',
    'checkup-3': 'ascolto',

    // m4: Ascolto Attivo Strategico
    'e10': 'ascolto',
    'e11': 'ascolto',
    'e12': 'ascolto',

    // m1: Dare un Feedback Efficace
    'e1': 'riformulazione',
    'e2': 'assertivita', // Feedback to manager requires assertiveness
    'e7': 'riformulazione',

    // m3: Padroneggiare l'Arte delle Domande
    'e5': 'riformulazione',
    'e6': 'riformulazione',
    'e9': 'ascolto',
    'e16': 'ascolto',
    
    // m2: Gestire Conversazioni Difficili
    'e3': 'gestione_conflitto',
    'e4': 'assertivita', // Communicating unpopular decision requires assertiveness
    'e8': 'assertivita',
    'e13': 'gestione_conflitto',
    'e14': 'gestione_conflitto',
    'e15': 'assertivita',
    
    // m5: Voce Strategica (Paraverbale)
    'v1': 'riformulazione',
    'v2': 'assertivita',
    'v3': 'assertivita',

    // Pacchetti Settoriali
    's1e1': 'riformulazione',
    's2e1': 'gestione_conflitto',
    's3e1': 'gestione_conflitto',
    's7e1': 'riformulazione',
    's8e1': 'assertivita',
};

const MAX_COMPETENCE_SCORE = 33;

/**
 * Updates the competence scores based on the result of a single exercise.
 * @param currentScores The user's current scores for the 4 competencies.
 * @param exerciseId The ID of the completed exercise.
 * @param newExerciseScore The score (0-100) achieved in the exercise.
 * @returns The new, updated competence scores object.
 */
export const updateCompetenceScores = (
  currentScores: CompetenceScores | undefined,
  exerciseId: string,
  newExerciseScore: number
): CompetenceScores => {
  const scores = currentScores || { ascolto: 0, riformulazione: 0, assertivita: 0, gestione_conflitto: 0 };
  const competenceKey = EXERCISE_TO_COMPETENCE_MAP[exerciseId];

  if (competenceKey) {
    const currentCompetenceValue = scores[competenceKey] || 0;
    
    // Logic as per specification: average of the current value (0-33) and the new exercise score (0-100)
    const averagedScore = (currentCompetenceValue + newExerciseScore) / 2;
    
    // The result is capped at the maximum allowed value for a single competence
    scores[competenceKey] = Math.min(averagedScore, MAX_COMPETENCE_SCORE);
  }

  return scores;
};