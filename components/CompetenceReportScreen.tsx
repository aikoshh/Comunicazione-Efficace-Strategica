// components/CompetenceReportScreen.tsx
import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { UserProgress, CompetenceKey, Exercise, AnalysisResult, VoiceAnalysisResult, AnalysisHistoryItem } from '../types';
import { COLORS, MODULES } from '../constants';
import { EXERCISE_TO_COMPETENCE_MAP } from '../services/competenceService';
import { BackIcon, CheckCircleIcon, TargetIcon, LightbulbIcon, LockIcon } from './Icons';
import { mainLogoUrl } from '../assets';

interface CompetenceReportScreenProps {
  userProgress: UserProgress;
  onBack: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  isPro: boolean;
  onNavigateToPaywall: () => void;
}

const COMPETENCE_DETAILS: Record<CompetenceKey, { label: string; description: string; color: string }> = {
  ascolto: { label: 'Ascolto', description: 'Capacità di comprendere non solo le parole, ma anche le intenzioni e le emozioni.', color: '#3498db' },
  riformulazione: { label: 'Riformulazione', description: 'Abilità di rispecchiare, chiarire e dare feedback in modo costruttivo.', color: '#2ecc71' },
  assertivita: { label: 'Assertività', description: 'Esprimere i propri bisogni e opinioni in modo chiaro e rispettoso.', color: '#f1c40f' },
  gestione_conflitto: { label: 'Gestione Conflitto', description: 'Trasformare i disaccordi in opportunità di dialogo e soluzione.', color: '#e74c3c' },
};

const getAllExercises = () => MODULES.flatMap(m => m.exercises);

const processHistoryForChart = (history: UserProgress['analysisHistory']) => {
    if (!history || Object.keys(history).length < 2) return [];

    // FIX: Explicitly cast to AnalysisHistoryItem[] to resolve typing errors.
    const dataPoints = (Object.values(history) as AnalysisHistoryItem[])
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map(item => ({
            date: new Date(item.timestamp).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
            competence: item.competence,
            score: item.score
        }));

    const chartData: { date: string; [key: string]: any }[] = [];
    const lastScores: Partial<Record<CompetenceKey, number>> = {};

    dataPoints.forEach(point => {
        lastScores[point.competence] = point.score;
        chartData.push({
            date: point.date,
            ...lastScores
        });
    });

    return chartData;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: 'white', padding: '10px', border: `1px solid ${COLORS.divider}`, borderRadius: '8px' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{`Data: ${label}`}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ margin: '4px 0 0 0', color: p.color }}>
            {`${COMPETENCE_DETAILS[p.dataKey as CompetenceKey].label}: ${p.value.toFixed(1)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};


export const CompetenceReportScreen: React.FC<CompetenceReportScreenProps> = ({ userProgress, onBack, onSelectExercise, isPro, onNavigateToPaywall }) => {
  const allExercises = getAllExercises();
  const chartData = processHistoryForChart(userProgress.analysisHistory);

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
        
        <section style={{...styles.competenceSection, padding: isPro ? '24px' : '0' }}>
           <h2 style={{...styles.competenceTitle, paddingLeft: isPro ? '0' : '24px', paddingTop: isPro ? '0' : '24px'}}>Andamento Storico (PRO)</h2>
           {isPro ? (
                <>
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            {(Object.keys(COMPETENCE_DETAILS) as CompetenceKey[]).map(key => (
                                <Line key={key} type="monotone" dataKey={key} name={COMPETENCE_DETAILS[key].label} stroke={COMPETENCE_DETAILS[key].color} strokeWidth={2} dot={{ r: 4 }} connectNulls />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <p style={{textAlign: 'center', color: COLORS.textSecondary, padding: '40px 0'}}>Completa più esercizi per visualizzare i tuoi progressi nel tempo.</p>
                )}
                </>
           ) : (
                <div style={styles.proUpsell} onClick={onNavigateToPaywall}>
                    <LockIcon width={48} height={48} />
                    <h3>Sblocca l'Analisi Storica</h3>
                    <p>Passa a PRO per visualizzare i tuoi miglioramenti nel tempo e identificare i trend di crescita.</p>
                    <button style={styles.proButton}>Scopri i Vantaggi PRO</button>
                </div>
           )}
        </section>

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
                    if (!historyItem) return null;
                    const analysisResult = historyItem.result;
                    const getFirstStrength = () => {
                        if('strengths' in analysisResult) return (analysisResult as AnalysisResult).strengths[0];
                        return 'Analisi completata.';
                    }
                    
                    return (
                      <div key={ex.id} style={styles.exerciseCard}>
                        <p style={styles.exerciseTitle}>{ex.title}</p>
                        <p style={styles.userResponse}><strong>Tua risposta:</strong> "{historyItem.userResponse}"</p>
                        <p style={styles.feedbackSummary}><strong>Feedback ricevuto:</strong> {getFirstStrength()}</p>
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
  proUpsell: {
    backgroundColor: COLORS.cardDark,
    padding: '24px',
    borderRadius: '0 0 12px 12px',
    textAlign: 'center',
    cursor: 'pointer',
  },
  proButton: {
      marginTop: '16px',
      padding: '10px 20px',
      fontSize: '15px',
      fontWeight: 'bold',
      color: 'white',
      background: COLORS.primaryGradient,
      border: 'none',
      borderRadius: '8px',
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
