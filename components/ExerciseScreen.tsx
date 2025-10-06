import React, { useState, useEffect } from 'react';
import { Exercise, ExerciseType, AnalysisResult } from '../types';
import { useSpeech } from '../hooks/useSpeech';
import { analyzeResponse } from '../services/geminiService';
import { Loader } from './Loader';
import { COLORS } from '../constants';
import { BackIcon, MicIcon, SendIcon, WrittenIcon, VerbalIcon, SpeakerIcon, SpeakerOffIcon, InfoIcon } from './Icons';

interface ExerciseScreenProps {
  exercise: Exercise;
  onComplete: (result: AnalysisResult) => void;
  onBack: () => void;
}

export const ExerciseScreen: React.FC<ExerciseScreenProps> = ({ exercise, onComplete, onBack }) => {
  const [exerciseType, setExerciseType] = useState<ExerciseType>(ExerciseType.WRITTEN);
  const [userResponse, setUserResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const { isListening, transcript, startListening, stopListening, isSupported, speak, isSpeaking, stopSpeaking } = useSpeech();

  useEffect(() => {
    if (!process.env.API_KEY) {
        setIsDemoMode(true);
    }
  }, []);

  useEffect(() => {
    if (transcript) {
      setUserResponse(transcript);
    }
  }, [transcript]);

  const handleScenarioPlayback = () => {
    if (isSpeaking) {
        stopSpeaking();
    } else {
        speak(`${exercise.title}. Scenario: ${exercise.scenario}. Compito: ${exercise.task}`);
    }
  };

  const handleSubmit = async () => {
    if (!userResponse.trim()) {
      setError("La risposta non può essere vuota.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeResponse(userResponse, exercise.scenario, exercise.task, exerciseType === ExerciseType.VERBAL);
      onComplete(result);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Si è verificato un errore sconosciuto.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderInputArea = () => {
    if (exerciseType === ExerciseType.WRITTEN) {
      return (
        <div style={styles.inputWrapper}>
          <textarea
            style={styles.textarea}
            value={userResponse}
            onChange={(e) => setUserResponse(e.target.value)}
            placeholder="Scrivi qui la tua risposta..."
            rows={5}
            disabled={isLoading}
          />
          <button onClick={handleSubmit} style={styles.sendButton} disabled={isLoading || !userResponse.trim()}>
            <SendIcon color="white" />
          </button>
        </div>
      );
    }

    if (exerciseType === ExerciseType.VERBAL) {
      if (!isSupported) {
          return <p style={styles.errorText}>Il riconoscimento vocale non è supportato da questo browser.</p>
      }
      return (
        <div style={styles.verbalContainer}>
            <p style={styles.transcript}>{isListening ? 'Sto ascoltando...' : (userResponse || 'Tocca il microfono per registrare la tua risposta.')}</p>
            <button
                onClick={isListening ? stopListening : startListening}
                style={{ ...styles.micButton, ...(isListening ? styles.micButtonListening : {}) }}
                disabled={isLoading}
            >
                <MicIcon color="white" width={32} height={32} />
            </button>
            {userResponse && !isListening && (
                <button onClick={handleSubmit} style={styles.verbalSubmitButton} disabled={isLoading}>
                    Invia per Analisi
                </button>
            )}
        </div>
      );
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.backButton}>
        <BackIcon /> Torna agli esercizi
      </button>
      <div style={styles.scenarioCard}>
        {isDemoMode && (
            <div style={styles.demoBanner}>
                <InfoIcon style={{ flexShrink: 0 }}/>
                <span><b>Modalità Demo:</b> L'analisi fornirà un risultato di esempio.</span>
            </div>
        )}
        <div style={styles.scenarioHeader}>
            <h1 style={styles.title}>{exercise.title}</h1>
            <button onClick={handleScenarioPlayback} style={styles.speakerButton}>
                {isSpeaking ? <SpeakerOffIcon /> : <SpeakerIcon />}
            </button>
        </div>
        <p style={styles.scenarioText}><strong>Scenario:</strong> {exercise.scenario}</p>
        <p style={styles.taskText}><strong>Compito:</strong> {exercise.task}</p>
      </div>

      <div style={styles.toggleContainer}>
          <button
              style={{ ...styles.toggleButton, ...(exerciseType === ExerciseType.WRITTEN ? styles.toggleButtonActive : {}) }}
              onClick={() => setExerciseType(ExerciseType.WRITTEN)}
          >
              <WrittenIcon /> Risposta Scritta
          </button>
          <button
              style={{ ...styles.toggleButton, ...(exerciseType === ExerciseType.VERBAL ? styles.toggleButtonActive : {}) }}
              onClick={() => setExerciseType(ExerciseType.VERBAL)}
          >
              <VerbalIcon /> Risposta Vocale
          </button>
      </div>

      {error && <p style={styles.errorText}>{error}</p>}
      
      {renderInputArea()}

    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '24px' },
  backButton: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#555', alignSelf: 'flex-start' },
  scenarioCard: { backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #eee' },
  demoBanner: {
    backgroundColor: '#eef2ff',
    color: '#4338ca',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
  },
  scenarioHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'},
  title: { fontSize: '24px', color: COLORS.nero, margin: 0 },
  speakerButton: { background: 'none', border: 'none', cursor: 'pointer', padding: '8px' },
  scenarioText: { fontSize: '16px', color: '#333', lineHeight: '1.6', marginBottom: '12px' },
  taskText: { fontSize: '16px', color: COLORS.nero, lineHeight: '1.6', fontWeight: '500' },
  toggleContainer: { display: 'flex', gap: '12px', justifyContent: 'center', backgroundColor: '#f0f0f0', padding: '6px', borderRadius: '12px' },
  toggleButton: { flex: 1, padding: '10px 16px', fontSize: '16px', border: 'none', background: 'transparent', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background-color 0.2s', color: '#555' },
  toggleButtonActive: { backgroundColor: 'white', color: COLORS.nero, fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  textarea: { width: '100%', padding: '12px 16px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc', resize: 'vertical', fontFamily: 'inherit', paddingRight: '60px' },
  sendButton: { position: 'absolute', right: '8px', height: '40px', width: '40px', borderRadius: '50%', border: 'none', backgroundColor: COLORS.accentoVerde, color: 'white', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  verbalContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '12px' },
  transcript: { fontSize: '18px', color: '#333', minHeight: '50px', textAlign: 'center' },
  micButton: { width: '72px', height: '72px', borderRadius: '50%', backgroundColor: COLORS.accentoVerde, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'background-color 0.2s' },
  micButtonListening: { backgroundColor: '#E5484D' },
  verbalSubmitButton: { padding: '12px 24px', fontSize: '16px', borderRadius: '8px', border: 'none', backgroundColor: COLORS.nero, color: 'white', cursor: 'pointer' },
  errorText: { color: '#E5484D', textAlign: 'center', fontWeight: '500' },
};
