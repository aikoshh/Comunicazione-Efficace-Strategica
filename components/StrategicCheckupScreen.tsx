import React, { useState, useEffect, useRef } from 'react';
import { Exercise, AnalysisResult, CommunicatorProfile, Entitlements } from '../types';
import { COLORS } from '../constants';
import { FullScreenLoader } from './Loader';
import { generateCommunicatorProfile, analyzeResponse } from '../services/geminiService';
import { Logo } from './Logo';
import { MicIcon } from './Icons';
import { soundService } from '../services/soundService';
import { useSpeech } from '../hooks/useSpeech';
import { useToast } from '../hooks/useToast';
import { useLocalization } from '../context/LocalizationContext';
import { getContent } from '../locales/content';

interface StrategicCheckupScreenProps {
  onCompleteCheckup: (profile: CommunicatorProfile) => void;
  onApiKeyError: (error: string) => void;
  onBack: () => void;
  entitlements: Entitlements | null;
}

export const StrategicCheckupScreen: React.FC<StrategicCheckupScreenProps> = ({ onCompleteCheckup, onApiKeyError, onBack, entitlements }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userResponses, setUserResponses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();
  const { lang, t } = useLocalization();
  const stepContainerRef = useRef<HTMLDivElement>(null);
  
  const STRATEGIC_CHECKUP_EXERCISES = getContent(lang).STRATEGIC_CHECKUP_EXERCISES;

  useEffect(() => {
    if (currentStep > 0 && stepContainerRef.current) {
        stepContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentStep]);

  const totalSteps = STRATEGIC_CHECKUP_EXERCISES.length;

  const handleFinalAnalysisAndProfileGeneration = async (finalResponses: string[]) => {
      setIsLoading(true);
      try {
        const analysisPromises = finalResponses.map((response, index) => {
          const exercise = STRATEGIC_CHECKUP_EXERCISES[index];
          return analyzeResponse(response, exercise.scenario, exercise.task, entitlements, false, lang);
        });
        
        const allAnalysisResults = await Promise.all(analysisPromises);
        
        const formattedResults = allAnalysisResults.map((analysis, index) => ({
          exerciseId: STRATEGIC_CHECKUP_EXERCISES[index].id,
          analysis,
        }));

        const profile = await generateCommunicatorProfile(formattedResults, lang);
        onCompleteCheckup(profile);
      } catch (e: any) {
        onApiKeyError(e.message);
      } finally {
        setIsLoading(false);
      }
  };
  
  const handleStepSubmit = (response: string) => {
    const newResponses = [...userResponses, response];
    setUserResponses(newResponses);
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinalAnalysisAndProfileGeneration(newResponses);
    }
  };

  const handleBackClick = () => {
    soundService.playClick();
    onBack();
  };

  if (isLoading) {
    return <FullScreenLoader estimatedTime={30} />;
  }
  
  const currentExercise = STRATEGIC_CHECKUP_EXERCISES[currentStep];

  const StandaloneExercise: React.FC = () => {
    const [userResponse, setUserResponse] = useState('');
    const { isListening, transcript, startListening, stopListening, isSupported } = useSpeech(lang);
    const textBeforeListening = useRef('');

    useEffect(() => {
      if (isListening) {
        setUserResponse(textBeforeListening.current + transcript);
      }
    }, [transcript, isListening]);
    
    const handleSubmit = () => {
        soundService.playClick();
        if (!userResponse.trim()) {
            addToast(t('responseEmptyError'), 'error');
            return;
        }
        handleStepSubmit(userResponse);
    }

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
            <p style={styles.scenarioText}><strong>{t('scenarioLabel')}:</strong> {currentExercise.scenario}</p>
            <div style={styles.taskContainer}>
                <p style={styles.taskText}><strong>{t('taskLabel')}:</strong> {currentExercise.task}</p>
            </div>
            <textarea
                style={styles.textarea}
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                placeholder={t('textAreaPlaceholder')}
                rows={6}
            />
            {isSupported && (
                <button
                    onClick={handleToggleDictation}
                    style={{...styles.dictationButton, ...(isListening ? styles.dictationButtonListening : {})}}
                >
                    <MicIcon />
                    {isListening ? t('stopDictation') : t('respondWithVoice')}
                </button>
            )}
            <button onClick={handleSubmit} style={styles.button}>
                {currentStep < totalSteps - 1 ? t('nextStep') : t('completeAndGenerateProfile')}
            </button>
            <button onClick={handleBackClick} style={styles.exitButton}>
                {t('exitCheckup')}
            </button>
        </div>
    );
  }
  
  const titleParts = currentExercise.title.split(': ');

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <header style={styles.header}>
            <Logo />
            <h1 style={styles.title}>{t('strategicCheckupTitle')}</h1>
            <p style={styles.subtitle}>
              {t('strategicCheckupSubtitle').replace('{totalSteps}', totalSteps.toString())}
            </p>
        </header>
        
        <div style={styles.progressContainer} ref={stepContainerRef}>
            <div style={styles.progressBar}>
                <div style={{...styles.progressBarFill, width: `${((currentStep + 1) / totalSteps) * 100}%`}}></div>
            </div>
            <span style={styles.progressText}>{t('step')} {currentStep + 1} {t('of')} {totalSteps}</span>
        </div>

        <h2 style={styles.exerciseTitle}>
            {titleParts[0]}:
            <br />
            <span style={{ fontWeight: 400 }}>{titleParts[1]}</span>
        </h2>
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
      fontWeight: 600,
      color: COLORS.textPrimary,
      marginBottom: '16px',
      textAlign: 'center',
      lineHeight: 1.4,
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
    backgroundColor: '#FFFFFF',
    color: '#1C1C1E',
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
    marginTop: '16px',
    background: 'transparent',
    color: COLORS.textSecondary,
    border: 'none',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontSize: '14px',
    alignSelf: 'center',
  },
};