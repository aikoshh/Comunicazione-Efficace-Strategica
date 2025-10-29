// components/DailyChallengeScreen.tsx
import React, { useState } from 'react';
import { Exercise, AnalysisResult, Entitlements, AnalysisHistoryItem } from '../types';
import { ExerciseScreen } from './ExerciseScreen';
import { dailyChallengeHeaderImage } from '../assets';
import { COLORS } from '../constants';
import { TargetIcon } from './Icons';

// In a real app, this would come from a service that provides a new challenge each day.
const getDailyChallenge = (): Exercise => {
  const date = new Date();
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  
  const challenges: Exercise[] = [
    {
      id: 'daily-1',
      title: 'Negoziare una Scadenza',
      scenario: 'Un cliente importante ti chiede di anticipare la consegna di un progetto di una settimana, ma sai che questo metterebbe a rischio la qualità e stresserebbe il team.',
      task: 'Scrivi un\'email al cliente per negoziare una scadenza realistica, mantenendo un rapporto positivo e mostrando comprensione per la sua richiesta.',
      difficulty: 'Medio',
      competence: 'assertivita',
    },
    {
      id: 'daily-2',
      title: 'Gestire un Feedback Inaspettato',
      scenario: 'Durante una riunione, il tuo manager critica pubblicamente un aspetto del tuo lavoro su cui eri convinto di aver fatto bene. Ti senti sorpreso e un po\' demotivato.',
      task: 'Come rispondi sul momento per gestire la situazione professionalmente e chiedere un chiarimento in privato?',
      difficulty: 'Difficile',
      competence: 'gestione_conflitto',
    },
     {
      id: 'daily-3',
      title: 'Presentare un\'Idea Innovativa',
      scenario: 'Hai un\'idea per un nuovo processo che potrebbe far risparmiare tempo e denaro all\'azienda, ma sai che alcuni colleghi sono scettici verso i cambiamenti.',
      task: 'Scrivi le prime frasi che useresti per introdurre la tua idea in una riunione di team, cercando di catturare l\'interesse e prevenire le obiezioni.',
      difficulty: 'Medio',
      competence: 'riformulazione',
    },
  ];

  return challenges[dayOfYear % challenges.length];
};

interface DailyChallengeScreenProps {
  onComplete: (result: AnalysisResult, userResponse: string, exerciseId: string) => void;
  entitlements: Entitlements | null;
  analysisHistory: { [exerciseId: string]: AnalysisHistoryItem };
  onApiKeyError: (error: string) => void;
  onBack: () => void;
}

export const DailyChallengeScreen: React.FC<DailyChallengeScreenProps> = (props) => {
  const [dailyExercise] = useState<Exercise>(getDailyChallenge());

  return (
    <div style={{ paddingTop: '20px' }}>
      <header style={styles.header}>
        <div style={styles.titleContainer}>
            <TargetIcon style={styles.titleIcon} />
            <h1 style={styles.title}>Sfida del Giorno</h1>
        </div>
        <p style={styles.subtitle}>
            Ogni giorno un nuovo scenario per mettere alla prova le tue abilità di comunicazione strategica.
        </p>
      </header>
      <ExerciseScreen 
        exercise={dailyExercise}
        moduleColor={COLORS.primary}
        onComplete={(result, userResponse, exerciseId, type) => props.onComplete(result as AnalysisResult, userResponse, exerciseId)}
        entitlements={props.entitlements}
        analysisHistory={props.analysisHistory}
        onApiKeyError={props.onApiKeyError}
      />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    textAlign: 'center',
    marginBottom: '20px',
    maxWidth: '800px',
    margin: '0 auto 40px',
    backgroundColor: COLORS.card,
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
    position: 'relative',
    zIndex: 2,
  },
   titleContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      justifyContent: 'center',
      textAlign: 'center'
  },
  titleIcon: {
      width: '32px',
      height: '32px',
      color: COLORS.primary
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: COLORS.primary,
    margin: 0,
  },
  subtitle: {
    fontSize: '16px',
    color: COLORS.textSecondary,
    lineHeight: 1.6,
    marginTop: '12px'
  },
};
