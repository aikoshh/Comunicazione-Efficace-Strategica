import React, { useState, useEffect, useRef } from 'react';
import { Exercise, ExerciseType, AnalysisResult, VoiceAnalysisResult, Entitlements } from '../types';
import { useSpeech } from '../hooks/useSpeech';
import { analyzeResponse, analyzeParaverbalResponse } from '../services/geminiService';
import { FullScreenLoader } from './Loader';
import { COLORS, EXERCISE_TYPE_ICONS } from '../constants';
import { BackIcon, MicIcon, SendIcon, SpeakerIcon, SpeakerOffIcon } from './Icons';
import { soundService } from '../services/soundService';
import { useToast } from '../hooks/useToast';

interface ExerciseScreenProps {
  exercise: Exercise;
  onCompleteWritten: (result: AnalysisResult, userResponse: string) => void;
  onCompleteVerbal: (result: VoiceAnalysisResult, userResponse: string) => void;
  onSkip: (exerciseId: string) => void;
  onBack: () => void;
  onApiKeyError: (error: string) => void;
  entitlements: Entitlements | null;
  isCheckup?: boolean;
  checkupStep?: number;
  totalCheckupSteps?: number;
}

export const ExerciseScreen: React.FC<ExerciseScreenProps> = ({ 
    exercise, 
    onCompleteWritten, 
    onCompleteVerbal,
    onSkip,
    onBack, 
    onApiKeyError,
    entitlements,
    isCheckup,
    checkupStep,
    totalCheckupSteps
}) => {
  const [userResponse, setUserResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();
  const { isListening, transcript, startListening, stopListening, isSupported, speak, isSpeaking, stopSpeaking } = useSpeech();
  const textBeforeListening = useRef('');

  useEffect(() => {
    window.scrollTo(0, 0);
    // Cleanup function to stop any active speech synthesis when the component unmounts
    return () => {
        stopSpeaking();
    };
  }, [stopSpeaking]);

  const isVerbalExercise = exercise.exerciseType === ExerciseType.VERBAL;
  const effectiveExerciseType = exercise.exerciseType || ExerciseType.WRITTEN;
  const ExerciseIcon = EXERCISE_TYPE_ICONS[effectiveExerciseType];

  // Effect for VERBAL exercises (transcript replaces everything)
  useEffect(() => {
    if (isVerbalExercise && transcript) {
      setUserResponse(transcript);
    }
  }, [transcript, isVerbalExercise]);
  
  // Effect for DICTATION in written exercises (transcript appends)
  useEffect(() => {
    if (!isVerbalExercise && isListening) {
      setUserResponse(textBeforeListening.current + transcript);
    }
  }, [transcript, isListening, isVerbalExercise]);


  const handleScenarioPlayback = () => {
    soundService.playClick();
    if (isSpeaking) {
        stopSpeaking();
    } else {
        speak(`${exercise.title}. Scenario: ${exercise.scenario}. Compito: ${exercise.task}`);
    }
  };
  
  // For dedicated verbal exercises
  const handleStartListening = () => {
    soundService.playStartRecording();
    startListening();
  }

  // For dedicated verbal exercises
  const handleStopListening = () => {
    soundService.playStopRecording();
    stopListening();
  }
  
  // For dictation button in written exercises
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
  
  const handleBackClick = () => {
    soundService.playClick();
    onBack();
  }

  const handleSkipClick = () => {
      onSkip(exercise.id);
  }

  const handleSubmit = async () => {
    soundService.playClick();
    const finalResponse = userResponse.trim();
    if (!finalResponse) {
      addToast("La risposta non può essere vuota.", 'error');
      return;
    }
    setIsLoading(true);
    try {
      if(isVerbalExercise) {
        const result = await analyzeParaverbalResponse(finalResponse, exercise.scenario, exercise.task);
        onCompleteVerbal(result, finalResponse);
      } else {
        const result = await analyzeResponse(finalResponse, exercise.scenario, exercise.task, entitlements, false, exercise.customObjective);
        onCompleteWritten(result, finalResponse);
      }
    } catch (e: any) {
      console.error(e);
      if (e.message.includes('API_KEY')) {
        onApiKeyError(e.message);
      } else {
        addToast(e.message || "Si è verificato un errore sconosciuto.", 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderInputArea = () => {
    if (isVerbalExercise) {
        if (!isSupported) {
            return <p style={styles.errorText}>Il riconoscimento vocale non è supportato da questo browser.</p>
        }
        return (
            <div style={styles.verbalContainer}>
                <p style={styles.transcript}>{userResponse || (isListening ? 'Sto ascoltando...' : 'La tua trascrizione apparirà qui.')}</p>
                <button
                    onClick={isListening ? handleStopListening : handleStartListening}
                    style={{ ...styles.verbalRecordButton, animation: !isListening && !isLoading ? 'pulse 2s infinite' : 'none' }}
                    disabled={isLoading}
                >
                    <MicIcon color="white" width={28} height={28} />
                    <span style={styles.verbalRecordButtonText}>{isListening ? 'Registrazione in Corso...' : 'Clicca per Dettare'}</span>
                </button>
                <div style={styles.actionsContainer}>
                    {userResponse && !isListening && (
                        <button onClick={handleSubmit} style={styles.mainButton} disabled={isLoading}>
                            Invia per Analisi
                        </button>
                    )}
                     <button onClick={handleSkipClick} style={styles.skipButton} disabled={isLoading}>
                        Salta Esercizio
                    </button>
                </div>
            </div>
        );
    }
    
    // Default to written input for standard exercises
    return (
      <div style={styles.inputContainer}>
        <textarea
          style={styles.textarea}
          value={userResponse}
          onChange={(e) => setUserResponse(e.target.value)}
          placeholder="Scrivi qui la tua risposta migliore..."
          rows={6}
          disabled={isLoading}
        />
        <div style={styles.actionsContainer}>
            {isSupported && (
                <button
                    onClick={handleToggleDictation}
                    style={{...styles.dictationButton, ...(isListening ? styles.dictationButtonListening : {})}}
                    disabled={isLoading}
                >
                    <MicIcon />
                    {isListening ? 'Ferma Dettatura' : 'Rispondi a Voce'}
                </button>
            )}
            <button onClick={handleSubmit} style={{...styles.mainButton, ...(!userResponse.trim() || isLoading ? styles.mainButtonDisabled : {})}} disabled={isLoading || !userResponse.trim()}>
              Invia Risposta <SendIcon color="white" />
            </button>
            <button onClick={handleSkipClick} style={styles.skipButton} disabled={isLoading}>
                Salta Esercizio
            </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <FullScreenLoader estimatedTime={isVerbalExercise ? 20 : 15} />;
  }

  return (
    <div style={styles.container}>
       <button onClick={handleBackClick} style={styles.backButton}>
            <BackIcon /> Torna al Modulo
        </button>
      <div style={styles.scenarioCard}>
        <div style={styles.scenarioHeader}>
            <h1 style={styles.title}>{exercise.title}</h1>
            <button onClick={handleScenarioPlayback} style={styles.speakerButton} aria-label={isSpeaking ? "Ferma lettura" : "Leggi scenario"}>
                {isSpeaking ? <SpeakerOffIcon color={COLORS.secondary}/> : <SpeakerIcon color={COLORS.secondary}/>}
            </button>
        </div>
        {isCheckup && (
          <div style={styles.checkupHeader}>
              Passo {checkupStep} di {totalCheckupSteps}
          </div>
         )}
        <p style={styles.scenarioText}><strong>Scenario:</strong> {exercise.scenario}</p>
        <div style={styles.taskContainer}>
          <p style={styles.taskText}><strong>Compito:</strong> {exercise.task}</p>
        </div>
        {exercise.customObjective && (
             <div style={styles.customObjectiveContainer}>
                <p style={styles.taskText}><strong>Tuo Obiettivo:</strong> {exercise.customObjective}</p>
            </div>
        )}
      </div>
      
      <div style={styles.responseSection}>
        <h2 style={styles.responseTitle}>
            <ExerciseIcon />
            Risposta
        </h2>
        {renderInputArea()}
      </div>

    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '24px' },
  backButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: 'transparent',
      border: `1px solid ${COLORS.divider}`,
      borderRadius: '8px',
      padding: '8px 16px',
      cursor: 'pointer',
      fontSize: '15px',
      color: COLORS.textSecondary,
      fontWeight: '500',
      transition: 'all 0.2s ease',
      alignSelf: 'flex-start',
      marginBottom: '-8px'
  },
  checkupHeader: {
      textAlign: 'center',
      fontSize: '16px',
      fontWeight: 'bold',
      color: 'white',
      backgroundColor: COLORS.secondary,
      padding: '8px 16px',
      borderRadius: '20px',
      alignSelf: 'center',
      marginBottom: '16px'
  },
  scenarioCard: { backgroundColor: COLORS.card, borderRadius: '12px', padding: '24px', border: `1px solid ${COLORS.divider}`, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' },
  scenarioHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px'},
  title: { fontSize: '24px', color: COLORS.textPrimary, margin: 0, fontWeight: 'bold' },
  speakerButton: { background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', transition: 'background-color 0.2s ease' },
  scenarioText: { fontSize: '16px', color: COLORS.textSecondary, lineHeight: '1.6' },
  taskContainer: { marginTop: '16px', padding: '16px', backgroundColor: 'rgba(88, 166, 166, 0.1)', borderRadius: '8px', borderLeft: `4px solid ${COLORS.secondary}` },
  customObjectiveContainer: { marginTop: '16px', padding: '16px', backgroundColor: 'rgba(255, 193, 7, 0.15)', borderRadius: '8px', borderLeft: `4px solid ${COLORS.warning}` },
  taskText: { fontSize: '16px', color: COLORS.textPrimary, lineHeight: '1.6', fontWeight: '500', margin: 0 },
  responseSection: { display: 'flex', flexDirection: 'column', gap: '16px'},
  responseTitle: {fontSize: '20px', color: COLORS.textPrimary, margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px'},
  inputContainer: { display: 'flex', flexDirection: 'column', gap: '16px'},
  textarea: { width: '100%', padding: '16px', fontSize: '16px', borderRadius: '12px', border: `1px solid ${COLORS.divider}`, resize: 'vertical', fontFamily: 'inherit', backgroundColor: COLORS.card, color: COLORS.textPrimary, transition: 'border-color 0.2s, box-shadow 0.2s' },
  actionsContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      marginTop: '8px',
  },
  mainButton: { padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', borderRadius: '8px', border: 'none', background: COLORS.primaryGradient, color: 'white', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', alignSelf: 'stretch', boxShadow: '0 4px 15px rgba(14, 58, 93, 0.3)' },
  mainButtonDisabled: { background: '#ccc', cursor: 'not-allowed', opacity: 0.7, boxShadow: 'none' },
  skipButton: {
      background: 'transparent',
      border: 'none',
      color: COLORS.textSecondary,
      textDecoration: 'underline',
      cursor: 'pointer',
      fontSize: '14px',
      padding: '8px',
  },
  verbalContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '20px', backgroundColor: COLORS.card, borderRadius: '12px', border: `1px solid ${COLORS.divider}` },
  transcript: { fontSize: '18px', color: COLORS.textPrimary, minHeight: '50px', textAlign: 'center', fontStyle: 'italic' },
  verbalRecordButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '16px 32px',
    fontSize: '18px',
    fontWeight: 'bold',
    borderRadius: '12px',
    border: 'none',
    background: COLORS.primaryGradient,
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 15px rgba(14, 58, 93, 0.3)',
  },
  verbalRecordButtonText: {
    minWidth: '180px', // Prevents layout shift when text changes
    textAlign: 'center',
  },
  errorText: { color: COLORS.error, textAlign: 'center', fontWeight: '500' },
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
      alignSelf: 'stretch',
  },
  dictationButtonListening: {
      background: COLORS.error,
      color: 'white',
      border: `1px solid ${COLORS.error}`,
  },
};