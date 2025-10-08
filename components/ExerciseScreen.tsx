import React, { useState, useEffect } from 'react';
import { Exercise, ExerciseType, AnalysisResult, VoiceAnalysisResult } from '../types';
import { useSpeech } from '../hooks/useSpeech';
import { analyzeResponse, analyzeParaverbalResponse } from '../services/geminiService';
import { Loader } from './Loader';
import { COLORS } from '../constants';
import { BackIcon, MicIcon, SendIcon, WrittenIcon, VerbalIcon, SpeakerIcon, SpeakerOffIcon } from './Icons';
import { soundService } from '../services/soundService';

interface ExerciseScreenProps {
  exercise: Exercise;
  onCompleteWritten: (result: AnalysisResult) => void;
  onCompleteVerbal: (result: VoiceAnalysisResult) => void;
  onBack: () => void;
  onApiKeyError: (error: string) => void;
}

export const ExerciseScreen: React.FC<ExerciseScreenProps> = ({ exercise, onCompleteWritten, onCompleteVerbal, onBack, onApiKeyError }) => {
  const [userResponse, setUserResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isListening, transcript, startListening, stopListening, isSupported, speak, isSpeaking, stopSpeaking } = useSpeech();

  const isVerbalExercise = exercise.exerciseType === ExerciseType.VERBAL;

  useEffect(() => {
    if (transcript) {
      setUserResponse(transcript);
    }
  }, [transcript]);

  const handleScenarioPlayback = () => {
    soundService.playClick();
    if (isSpeaking) {
        stopSpeaking();
    } else {
        speak(`${exercise.title}. Scenario: ${exercise.scenario}. Compito: ${exercise.task}`);
    }
  };
  
  const handleStartListening = () => {
    soundService.playStartRecording();
    startListening();
  }

  const handleStopListening = () => {
    soundService.playStopRecording();
    stopListening();
  }
  
  const handleBackClick = () => {
    soundService.playClick();
    onBack();
  }

  const handleSubmit = async () => {
    soundService.playClick();
    if (!userResponse.trim()) {
      setError("La risposta non può essere vuota.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      if(isVerbalExercise) {
        const result = await analyzeParaverbalResponse(userResponse, exercise.scenario, exercise.task);
        onCompleteVerbal(result);
      } else {
        const result = await analyzeResponse(userResponse, exercise.scenario, exercise.task, true); // Assume verbal input for text too
        onCompleteWritten(result);
      }
    } catch (e: any) {
      console.error(e);
      if (e.message.includes('API_KEY')) {
        onApiKeyError(e.message);
      } else {
        setError(e.message || "Si è verificato un errore sconosciuto.");
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
                <p style={styles.transcript}>{isListening ? 'Sto ascoltando...' : (userResponse || 'Tocca il microfono per registrare la tua risposta.')}</p>
                <button
                    onClick={isListening ? handleStopListening : handleStartListening}
                    style={{ ...styles.micButton, animation: !isListening && !isLoading ? 'pulse 2s infinite' : 'none' }}
                    disabled={isLoading}
                >
                    <MicIcon color="white" width={32} height={32} />
                </button>
                {userResponse && !isListening && (
                    <button onClick={handleSubmit} style={styles.mainButton} disabled={isLoading}>
                        Invia per Analisi
                    </button>
                )}
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
          placeholder="Scrivi qui la tua risposta..."
          rows={6}
          disabled={isLoading}
        />
        <button onClick={handleSubmit} style={{...styles.mainButton, ...(!userResponse.trim() || isLoading ? styles.mainButtonDisabled : {})}} disabled={isLoading || !userResponse.trim()}>
          Invia Risposta <SendIcon color="white" />
        </button>
      </div>
    );
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div style={styles.container}>
      <button onClick={handleBackClick} style={styles.backButton}>
        <BackIcon /> Indietro
      </button>
      <div style={styles.scenarioCard}>
        <div style={styles.scenarioHeader}>
            <h1 style={styles.title}>{exercise.title}</h1>
            <button onClick={handleScenarioPlayback} style={styles.speakerButton} aria-label={isSpeaking ? "Ferma lettura" : "Leggi scenario"}>
                {isSpeaking ? <SpeakerOffIcon color={COLORS.secondary}/> : <SpeakerIcon color={COLORS.secondary}/>}
            </button>
        </div>
        <p style={styles.scenarioText}><strong>Scenario:</strong> {exercise.scenario}</p>
        <p style={styles.taskText}><strong>Compito:</strong> {exercise.task}</p>
      </div>

      {/* Hide toggle for verbal-only exercises */}
      {!isVerbalExercise && (
        <div style={styles.toggleContainer}>
            <button
                style={{ ...styles.toggleButton, ...styles.toggleButtonActive }}
            >
                <WrittenIcon /> Risposta Scritta
            </button>
        </div>
      )}
      
      <div style={styles.responseSection}>
        <h2 style={styles.responseTitle}>La tua risposta</h2>
        {error && <p style={styles.errorText}>{error}</p>}
        {renderInputArea()}
      </div>

    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '32px' },
  backButton: { 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px', 
      background: 'transparent', 
      color: COLORS.textPrimary, 
      border: `1px solid ${COLORS.divider}`, 
      borderRadius: '8px', 
      padding: '10px 16px', 
      cursor: 'pointer', 
      fontSize: '14px', 
      fontWeight: '500',
      alignSelf: 'flex-start',
      transition: 'all 0.2s ease'
  },
  scenarioCard: { backgroundColor: COLORS.card, borderRadius: '12px', padding: '24px', border: `1px solid ${COLORS.divider}`, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' },
  scenarioHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px'},
  title: { fontSize: '24px', color: COLORS.textPrimary, margin: 0, fontWeight: 'bold' },
  speakerButton: { background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', transition: 'background-color 0.2s ease' },
  scenarioText: { fontSize: '16px', color: COLORS.textSecondary, lineHeight: '1.6', marginBottom: '12px' },
  taskText: { fontSize: '16px', color: COLORS.textPrimary, lineHeight: '1.6', fontWeight: '500' },
  toggleContainer: { display: 'flex', gap: '8px', justifyContent: 'center', backgroundColor: COLORS.divider, padding: '6px', borderRadius: '12px' },
  toggleButton: { flex: 1, padding: '10px 16px', fontSize: '16px', border: 'none', background: 'transparent', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', color: COLORS.textSecondary, fontWeight: 500 },
  toggleButtonActive: { backgroundColor: COLORS.card, color: COLORS.textPrimary, fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  responseSection: { display: 'flex', flexDirection: 'column', gap: '16px'},
  responseTitle: {fontSize: '20px', color: COLORS.textPrimary, margin: 0, fontWeight: 'bold'},
  inputContainer: { display: 'flex', flexDirection: 'column', gap: '16px'},
  textarea: { width: '100%', padding: '16px', fontSize: '16px', borderRadius: '12px', border: `1px solid ${COLORS.divider}`, resize: 'vertical', fontFamily: 'inherit', backgroundColor: COLORS.card, color: COLORS.textPrimary, transition: 'border-color 0.2s, box-shadow 0.2s' },
  mainButton: { padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', borderRadius: '8px', border: 'none', background: COLORS.primaryGradient, color: 'white', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', alignSelf: 'center', boxShadow: '0 4px 15px rgba(14, 58, 93, 0.3)' },
  mainButtonDisabled: { background: '#ccc', cursor: 'not-allowed', opacity: 0.7, boxShadow: 'none' },
  verbalContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '20px', backgroundColor: COLORS.card, borderRadius: '12px', border: `1px solid ${COLORS.divider}` },
  transcript: { fontSize: '18px', color: COLORS.textPrimary, minHeight: '50px', textAlign: 'center', fontStyle: 'italic' },
  micButton: { width: '72px', height: '72px', borderRadius: '50%', background: COLORS.primaryGradient, border: '4px solid white', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
  micButtonListening: { backgroundColor: COLORS.error, background: COLORS.error },
  errorText: { color: COLORS.error, textAlign: 'center', fontWeight: '500' },
};