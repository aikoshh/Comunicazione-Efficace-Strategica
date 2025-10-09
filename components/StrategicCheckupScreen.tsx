import React, { useState, useEffect, useRef } from 'react';
import { Exercise, AnalysisResult, CommunicatorProfile } from '../types';
import { STRATEGIC_CHECKUP_EXERCISES, COLORS } from '../constants';
import { Loader } from './Loader';
import { generateCommunicatorProfile, analyzeText } from '../services/analyzeService';
import { Logo } from './Logo';
import { MicIcon } from './Icons';
import { soundService } from '../services/soundService';
import { useSpeech } from '../hooks/useSpeech';

const safeResult = {
  ...result,
  strengths: result?.strengths ?? [],
  improvements: result?.improvements ?? [],
  actions: result?.actions ?? [],
  areasForImprovement: result?.areasForImprovement ?? [],
  scores: result?.scores ?? [],
  suggestedResponse: result?.suggestedResponse ?? { short: '', long: '' },
};


interface StrategicCheckupScreenProps {
  onSelectExercise: (exercise: Exercise, isCheckup: boolean, checkupStep: number, totalCheckupSteps: number) => void;
  onCompleteCheckup: (profile: CommunicatorProfile) => void;
  onApiKeyError: (error: string) => void;
  onBack: () => void;
}

export const StrategicCheckupScreen: React.FC<StrategicCheckupScreenProps> = ({ onSelectExercise, onCompleteCheckup, onApiKeyError, onBack }) => {
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
      const result = await analyzeText(response, exercise.scenario, exercise.task, false);
      const newResults = [...analysisResults, { exerciseId: exercise.id, analysis: result }];
      setAnalysisResults(newResults);

      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        const profile = await generateCommunicatorProfile(newResults);
        onCompleteCheckup(profile);
      }
    } catch (e: any) {
      const errorMessage = e.message || "Si è verificato un errore sconosciuto.";
      if (errorMessage.toUpperCase().includes('GOOGLE_API_KEY')) {
        onApiKeyError(errorMessage);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackClick = () => {
    soundService.playClick();
    onBack();
  };

  if (isLoading) {
    return <Loader estimatedTime={30} />;
  }
  
  const currentExercise = STRATEGIC_CHECKUP_EXERCISES[currentStep];

  const StandaloneExercise: React.FC = () => {
    const [userResponse, setUserResponse] = useState('');
    const { isListening, transcript, startListening, stopListening, isSupported } = useSpeech();
    const textBeforeListening = useRef('');

    useEffect(() => {
      if (isListening) {
        setUserResponse((textBeforeListening.current || '') + transcript);
      }
    }, [transcript, isListening]);
    
    const handleSubmit = () => {
        soundService.playClick();
        if (!userResponse.trim()) {
            setError("La risposta non può essere vuota.");
            return;
        }
        handleCompleteExercise(userResponse);
    };

    const handleToggleDictation = () => {
        if (isListening) {
            soundService.playStopRecording();
            stopListening();
        } else {
            soundService.playStartRecording();
            textBeforeListening.current = userResponse ? userResponse + ' ' : '';
            startListening();
        }
    };

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
                placeholder="Scrivi qui la tua risposta migliore..."
                rows={6}
            />
            {isSupported && (
                 <button
                    onClick={handleToggleDictation}
                    style={{...styles.dictationButton, ...(isListening ? styles.dictationButtonListening : {})}}
                >
                    <MicIcon />
                    {isListening ? 'Ferma Dettatura' : 'Rispondi a Voce'}
                </button>
            )}
            <button onClick={handleSubmit} style={styles.button}>
                {currentStep < totalSteps - 1 ? 'Avanti e Conferma' : 'Completa e Genera Profilo'}
            </button>
            {error && <p style={{color: COLORS.error, marginTop: '12px'}}>{error}</p>}
            <button onClick={handleBackClick} style={styles.exitButton}>
                Esci dal Check Up
            </button>
        </div>
    );
  };

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
    animation: 'fadeInUp 0.5s ease-out',
    position: 'relative',
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
      display: 'flex',
      flexDirection: 'column',
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
    transition: 'transform 0.2s ease, filter 0.2s ease',
  },
  dictationButton: {
      padding: '10px 20px',
      fontSize: '16px',
      fontWeight: '500',
      borderRadius: '8px',
      border: `1px solid ${COLORS.warning}`,
      background: '#FFFBEA',
      color: COLORS.textAccent,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      alignSelf: 'center',
      marginTop: '16px'
  },
  dictationButtonListening: {
      background: COLORS.error,
      color: 'white',
      border: `1px solid ${COLORS.error}`,
  },
  exitButton: {
    marginTop: '24px',
    backgroundColor: '#E67E22',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 'bold',
    alignSelf: 'center',
    textDecoration: 'none',
    boxShadow: '0 4px 12px rgba(230, 126, 34, 0.3)',
    transition: 'all 0.2s ease',
  },
};
