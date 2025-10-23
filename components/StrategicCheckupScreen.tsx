import React, { useState, useEffect } from 'react';
import type { CommunicatorProfile, Exercise, AnalysisResult, Entitlements, AnalysisHistoryItem } from '../types';
import { COLORS, STRATEGIC_CHECKUP_EXERCISES } from '../constants';
import { generateCommunicatorProfile, analyzeResponse } from '../services/geminiService';
import { FullScreenLoader } from './Loader';
import { useToast } from '../hooks/useToast';
import { BackIcon, SendIcon } from './Icons';

interface StrategicCheckupScreenProps {
  onComplete: (profile: CommunicatorProfile) => void;
  onBack: () => void;
  entitlements: Entitlements | null;
  onApiKeyError: (error: string) => void;
}

const ExerciseStep: React.FC<{
  exercise: Exercise;
  step: number;
  totalSteps: number;
  onSubmit: (response: string) => void;
}> = ({ exercise, step, totalSteps, onSubmit }) => {
  const [response, setResponse] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(response);
  };

  return (
    <div style={styles.stepContainer}>
      <div style={styles.progressHeader}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressBarFill, width: `${(step / totalSteps) * 100}%` }} />
        </div>
        <span style={styles.progressText}>Passo {step} di {totalSteps}</span>
      </div>
      <h2 style={styles.stepTitle}>{exercise.title}</h2>
      <p style={styles.stepScenario}>{exercise.scenario}</p>
      <p style={styles.stepTask}>{exercise.task}</p>
      <form onSubmit={handleSubmit}>
        <textarea
          style={styles.textarea}
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Scrivi qui la tua risposta..."
          rows={5}
        />
        <button type="submit" style={styles.submitButton} disabled={!response.trim()}>
          Avanti <SendIcon />
        </button>
      </form>
    </div>
  );
};

export const StrategicCheckupScreen: React.FC<StrategicCheckupScreenProps> = ({ onComplete, onBack, entitlements, onApiKeyError }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { addToast } = useToast();

  const exercises = STRATEGIC_CHECKUP_EXERCISES;

  useEffect(() => {
    const generateProfile = async () => {
      if (currentStep === exercises.length) {
        setIsProcessing(true);
        try {
          const resultsForProfile = analysisHistory.map((item, index) => ({
            exerciseId: exercises[index].id,
            analysis: item.result as AnalysisResult
          }));
          const profile = await generateCommunicatorProfile(resultsForProfile);
          onComplete(profile);
        } catch (error: any) {
            console.error(error);
            if (error.message.includes('API key')) {
                onApiKeyError(error.message);
            } else {
                addToast(error.message || "Errore nella generazione del profilo.", 'error');
            }
          setIsProcessing(false);
        }
      }
    };
    generateProfile();
  }, [currentStep, analysisHistory, exercises, onComplete, onApiKeyError, addToast]);

  const handleStepSubmit = async (userResponse: string) => {
    setIsProcessing(true);
    try {
      const exercise = exercises[currentStep];
      const result = await analyzeResponse(exercise, userResponse, entitlements, {});
      setAnalysisHistory(prev => [...prev, { result, userResponse, timestamp: new Date().toISOString(), type: 'written' }]);
      setCurrentStep(prev => prev + 1);
    } catch (error: any) {
        console.error(error);
        if (error.message.includes('API key')) {
            onApiKeyError(error.message);
        } else {
            addToast(error.message || "Si è verificato un errore durante l'analisi.", 'error');
        }
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    const message = currentStep === exercises.length
      ? "Stiamo generando il tuo profilo personalizzato..."
      : `Analisi della risposta ${currentStep + 1} di ${exercises.length}...`;
    return <FullScreenLoader estimatedTime={20} />;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={onBack} style={styles.backButton}><BackIcon/> Torna alla Home</button>
        <h1 style={styles.title}>Check-up Strategico Iniziale</h1>
      </header>
      {currentStep < exercises.length ? (
        <ExerciseStep
          exercise={exercises[currentStep]}
          step={currentStep + 1}
          totalSteps={exercises.length}
          onSubmit={handleStepSubmit}
        />
      ) : (
        <p>Elaborazione finale...</p>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
    position: 'relative'
  },
  backButton: {
    position: 'absolute',
    top: '50%',
    left: 0,
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: COLORS.textSecondary
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  stepContainer: {
    backgroundColor: COLORS.card,
    padding: '32px',
    borderRadius: '12px',
    border: `1px solid ${COLORS.divider}`,
    animation: 'fadeInUp 0.5s ease-out'
  },
  progressHeader: {
    marginBottom: '24px',
  },
  progressBar: {
    height: '8px',
    backgroundColor: COLORS.divider,
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: '4px',
    transition: 'width 0.4s ease-in-out'
  },
  progressText: {
    textAlign: 'right',
    marginTop: '8px',
    fontSize: '14px',
    color: COLORS.textSecondary,
    fontWeight: 500
  },
  stepTitle: {
    fontSize: '22px',
    fontWeight: 600,
    color: COLORS.textPrimary,
    marginBottom: '16px'
  },
  stepScenario: {
    fontSize: '16px',
    color: COLORS.textSecondary,
    lineHeight: 1.6,
    marginBottom: '12px',
    fontStyle: 'italic',
    paddingLeft: '16px',
    borderLeft: `3px solid ${COLORS.accentBeige}`
  },
  stepTask: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: '24px'
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    borderRadius: '8px',
    border: `1px solid ${COLORS.divider}`,
    resize: 'vertical',
    fontFamily: 'inherit',
    backgroundColor: 'white'
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    border: 'none',
    backgroundColor: COLORS.secondary,
    color: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '16px',
    float: 'right'
  }
};