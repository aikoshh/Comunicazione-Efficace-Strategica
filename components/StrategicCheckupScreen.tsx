import React, { useState } from 'react';
import { Exercise, AnalysisResult, CommunicatorProfile } from '../types';
import { STRATEGIC_CHECKUP_EXERCISES, COLORS } from '../constants';
import { ExerciseScreen } from './ExerciseScreen';
import { Loader } from './Loader';
import { generateCommunicatorProfile, analyzeResponse } from '../services/geminiService';
import { Logo } from './Logo';

interface StrategicCheckupScreenProps {
  onSelectExercise: (exercise: Exercise, isCheckup: boolean, checkupStep: number, totalCheckupSteps: number) => void;
  onCompleteCheckup: (profile: CommunicatorProfile) => void;
  onApiKeyError: (error: string) => void;
}

export const StrategicCheckupScreen: React.FC<StrategicCheckupScreenProps> = ({ onSelectExercise, onCompleteCheckup, onApiKeyError }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<{ exerciseId: string; analysis: AnalysisResult }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = STRATEGIC_CHECKUP_EXERCISES.length;

  const handleCompleteExercise = async (response: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const exercise = STRATEGIC_CHECKUP_EXERCISES[currentStep];
      const result = await analyzeResponse(response, exercise.scenario, exercise.task, false);
      const newResults = [...analysisResults, { exerciseId: exercise.id, analysis: result }];
      setAnalysisResults(newResults);

      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Last step completed, generate profile
        const profile = await generateCommunicatorProfile(newResults);
        onCompleteCheckup(profile);
      }
    } catch (e: any) {
      if (e.message.includes('API_KEY')) {
        onApiKeyError(e.message);
      } else {
        setError(e.message || "An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loader />;
  }
  
  const currentExercise = STRATEGIC_CHECKUP_EXERCISES[currentStep];

  // Since ExerciseScreen is complex, we re-use it in a simplified form.
  // We'll wrap it or create a simplified version for the checkup.
  const StandaloneExercise: React.FC = () => {
    const [userResponse, setUserResponse] = useState('');
    
    const handleSubmit = () => {
        if (!userResponse.trim()) {
            setError("La risposta non può essere vuota.");
            return;
        }
        handleCompleteExercise(userResponse);
    }

    return (
        <div style={styles.exerciseContainer}>
            <p style={styles.scenarioText}><strong>Scenario:</strong> {currentExercise.scenario}</p>
            <div style={styles.taskContainer}>
                <p style={styles.taskText}><strong>Compito:</strong> {currentExercise.task}</p>
            </div>
            <textarea
                style={styles.textarea}
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                placeholder="Scrivi qui la tua risposta..."
                rows={6}
            />
            <button onClick={handleSubmit} style={styles.button}>
                {currentStep < totalSteps - 1 ? 'Prossimo Passo' : 'Completa e Genera Profilo'}
            </button>
            {error && <p style={{color: COLORS.error, marginTop: '12px'}}>{error}</p>}
        </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <header style={styles.header}>
            <Logo />
            <h1 style={styles.title}>Check-up Strategico Iniziale</h1>
            <p style={styles.subtitle}>
              Rispondi a {totalSteps} brevi scenari per creare il tuo profilo di comunicatore personalizzato.
            </p>
        </header>
        
        <div style={styles.progressContainer}>
            <div style={styles.progressBar}>
                <div style={{...styles.progressBarFill, width: `${((currentStep + 1) / totalSteps) * 100}%`}}></div>
            </div>
            <span style={styles.progressText}>Passo {currentStep + 1} di {totalSteps}</span>
        </div>

        <h2 style={styles.exerciseTitle}>{currentExercise.title}</h2>
        <StandaloneExercise />

      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: COLORS.base,
    padding: '20px',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: '12px',
    padding: '40px',
    width: '100%',
    maxWidth: '800px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
    animation: 'fadeInUp 0.5s ease-out'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: '16px'
  },
  subtitle: {
    fontSize: '16px',
    color: COLORS.textSecondary,
    maxWidth: '500px',
    margin: '8px auto 0',
  },
  progressContainer: {
      marginBottom: '24px',
  },
  progressBar: {
      height: '8px',
      backgroundColor: COLORS.divider,
      borderRadius: '4px',
      overflow: 'hidden',
  },
  progressBarFill: {
      height: '100%',
      backgroundColor: COLORS.secondary,
      borderRadius: '4px',
      transition: 'width 0.4s ease-in-out',
  },
  progressText: {
      display: 'block',
      textAlign: 'right',
      marginTop: '8px',
      fontSize: '14px',
      color: COLORS.textSecondary,
      fontWeight: 500
  },
  exerciseTitle: {
      fontSize: '22px',
      fontWeight: '600',
      color: COLORS.textPrimary,
      marginBottom: '16px',
      textAlign: 'center'
  },
  exerciseContainer: {
      backgroundColor: COLORS.cardDark,
      padding: '24px',
      borderRadius: '12px',
  },
  scenarioText: { fontSize: '16px', color: COLORS.textSecondary, lineHeight: '1.6' },
  taskContainer: {
    margin: '16px 0',
    padding: '16px',
    backgroundColor: 'rgba(88, 166, 166, 0.1)',
    borderRadius: '8px',
    borderLeft: `4px solid ${COLORS.secondary}`,
  },
  taskText: { fontSize: '16px', color: COLORS.textPrimary, lineHeight: '1.6', fontWeight: '500', margin: 0 },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    borderRadius: '8px',
    border: `1px solid ${COLORS.divider}`,
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  button: {
    display: 'block',
    width: '100%',
    marginTop: '16px',
    padding: '14px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    background: COLORS.primaryGradient,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, filter 0.2s ease'
  },
};