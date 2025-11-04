// components/CompetenceReportScreen.tsx
import React from 'react';
import type { UserProgress, CompetenceKey, Exercise } from '../types';
import { COLORS, MODULES } from '../constants';
import { EXERCISE_TO_COMPETENCE_MAP } from '../services/competenceService';
import { BackIcon, CheckCircleIcon, TargetIcon, LightbulbIcon } from './Icons';
import { mainLogoUrl } from '../assets';

interface CompetenceReportScreenProps {
  userProgress: UserProgress;
  onBack: () => void;
  onSelectExercise: (exercise: Exercise) => void;
}

const COMPETENCE_DETAILS: Record<CompetenceKey, { label: string; description: string }> = {
  ascolto: { label: 'Ascolto Strategico', description: 'Capacità di comprendere non solo le parole, ma anche le intenzioni e le emozioni dell\'interlocutore.' },
  riformulazione: { label: 'Riformulazione & Feedback', description: 'Abilità di rispecchiare, chiarire e dare feedback in modo costruttivo.' },
  assertivita: { label: 'Assertività', description: 'Esprimere i propri bisogni e opinioni in modo chiaro e rispettoso, senza passività né aggressività.' },
  gestione_conflitto: { label: 'Gestione del Conflitto', description: 'Trasformare i disaccordi in opportunità di dialogo e soluzione.' },
};

const getAllExercises = () => MODULES.flatMap(m => m.exercises);

export const CompetenceReportScreen: React.FC<CompetenceReportScreenProps> = ({ userProgress, onBack, onSelectExercise }) => {
  const allExercises = getAllExercises();

  const getExercisesForCompetence = (competence: CompetenceKey) => {
    return allExercises.filter(ex => EXERCISE_TO_COMPETENCE_MAP[ex.id] === competence);
  };

  const getCompetenceScoreColor = (score: number) => {
    const max = 33;
    const percentage = (score / max) * 100;
    if (percentage < 40) return COLORS.error;
    if (percentage < 70) return COLORS.warning;
    return COLORS.success;
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Report Dettagliato Competenze</h1>
        <p style={styles.subtitle}>Analizza i tuoi punti di forza e scopri come migliorare in ogni area.</p>
      </header>
      <main style={styles.main}>
        {(Object.keys(COMPETENCE_DETAILS) as CompetenceKey[]).map(key => {
          const competence = COMPETENCE_DETAILS[key];
          const score = userProgress.competenceScores[key] || 0;
          const exercisesForCompetence = getExercisesForCompetence(key);
          const completedExercises = exercisesForCompetence.filter(ex => userProgress.completedExerciseIds.includes(ex.id));
          const pendingExercises = exercisesForCompetence.filter(ex => !userProgress.completedExerciseIds.includes(ex.id));
          
          const scoreColor = getCompetenceScoreColor(score);

          return (
            <section key={key} style={styles.competenceSection}>
              <div style={styles.competenceHeader}>
                <h2 style={styles.competenceTitle}>{competence.label}</h2>
                <div style={styles.scorePill} title={`Punteggio massimo per competenza: 33`}>
                  <span style={{...styles.scoreValue, color: scoreColor}}>{score.toFixed(1)}</span>
                  <span style={styles.scoreMax}> / 33</span>
                </div>
              </div>
              <p style={styles.competenceDescription}>{competence.description}</p>
              
              {completedExercises.length > 0 && (
                <div>
                  <h3 style={styles.subHeader}><CheckCircleIcon/> Esercizi Completati</h3>
                  {completedExercises.map(ex => {
                    const historyItem = userProgress.analysisHistory[ex.id];
                    const analysisResult = historyItem?.result as any;
                    if (!historyItem) return null;
                    
                    return (
                      <div key={ex.id} style={styles.exerciseCard}>
                        <p style={styles.exerciseTitle}>{ex.title}</p>
                        <p style={styles.userResponse}><strong>Tua risposta:</strong> "{historyItem.userResponse}"</p>
                        <p style={styles.feedbackSummary}><strong>Feedback ricevuto:</strong> {analysisResult.strengths?.[0] || 'Analisi completata.'}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {pendingExercises.length > 0 && (
                <div style={{marginTop: '24px'}}>
                  <h3 style={styles.subHeader}><TargetIcon/> Prossimi Passi per Migliorare</h3>
                  <div style={styles.pendingExercisesContainer}>
                    {pendingExercises.map(ex => (
                      <button key={ex.id} style={styles.pendingExerciseButton} onClick={() => onSelectExercise(ex)}>
                        <LightbulbIcon style={{color: COLORS.secondary}}/>
                        <span>{ex.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </main>
      <div style={styles.logoContainer}>
        <img src={mainLogoUrl} alt="CES Coach Logo" style={styles.footerLogo} />
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '40px 20px', minHeight: '100vh' },
  header: { textAlign: 'center', marginBottom: '40px', position: 'relative' },
  backButton: {
    position: 'absolute', top: 0, left: 0,
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'transparent', border: `1px solid ${COLORS.divider}`,
    borderRadius: '8px', padding: '8px 16px', cursor: 'pointer',
    fontSize: '15px', color: COLORS.textSecondary, fontWeight: 500,
  },
  title: { fontSize: '28px', fontWeight: 'bold', color: COLORS.primary, margin: 0 },
  subtitle: { fontSize: '18px', color: COLORS.textSecondary, marginTop: '8px' },
  main: { display: 'flex', flexDirection: 'column', gap: '40px' },
  competenceSection: { backgroundColor: COLORS.card, padding: '24px', borderRadius: '12px', border: `1px solid ${COLORS.divider}` },
  competenceHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  competenceTitle: { fontSize: '22px', fontWeight: 'bold', color: COLORS.primary, margin: 0 },
  scorePill: { backgroundColor: COLORS.cardDark, padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'baseline' },
  scoreValue: { fontSize: '18px', fontWeight: 'bold' },
  scoreMax: { fontSize: '14px', color: COLORS.textSecondary },
  competenceDescription: { fontSize: '15px', color: COLORS.textSecondary, lineHeight: 1.6, margin: '0 0 24px 0' },
  subHeader: { fontSize: '18px', fontWeight: 600, color: COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' },
  exerciseCard: { backgroundColor: COLORS.cardDark, padding: '16px', borderRadius: '8px', marginBottom: '12px' },
  exerciseTitle: { fontSize: '16px', fontWeight: 'bold', margin: '0 0 8px 0' },
  userResponse: { fontSize: '14px', color: COLORS.textSecondary, fontStyle: 'italic', margin: '0 0 8px 0' },
  feedbackSummary: { fontSize: '14px', color: COLORS.textPrimary, margin: 0 },
  pendingExercisesContainer: { display: 'flex', flexWrap: 'wrap', gap: '12px' },
  pendingExerciseButton: {
    display: 'flex', alignItems: 'center', gap: '8px',
    backgroundColor: 'rgba(88, 166, 166, 0.1)', border: 'none',
    padding: '10px 16px', borderRadius: '8px', cursor: 'pointer',
    fontSize: '14px', color: COLORS.textPrimary, fontWeight: 500,
    transition: 'background-color 0.2s',
  },
  logoContainer: {
    textAlign: 'center',
    paddingTop: '40px',
  },
  footerLogo: {
    width: '150px',
    height: 'auto',
    opacity: 0.7
  }
};