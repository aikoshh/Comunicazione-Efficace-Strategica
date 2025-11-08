// components/ExerciseScreen.tsx
import React, { useState, useEffect } from 'react';
import { Exercise, AnalysisResult, VoiceAnalysisResult, Entitlements, AnalysisHistoryItem, ExerciseType, RealTimeMetricsSummary } from '../types';
import { COLORS } from '../constants';
import { MicIcon, SendIcon, SpeakerIcon, LightbulbIcon } from './Icons';
import { FullScreenLoader } from './Loader';
import { useToast } from '../hooks/useToast';
import { useSpeech } from '../hooks/useSpeech';
import { analyzeWrittenResponse, analyzeVerbalResponse } from '../services/geminiService';
import { soundService } from '../services/soundService';
import { hasProAccess } from '../services/monetizationService';
import { QuestionLibraryModal } from './QuestionLibraryModal';
import { PreparationChecklistModal } from './PreparationChecklistModal';
import RealTimeVoiceAnalysis from './RealTimeVoiceAnalysis';

interface ExerciseScreenProps {
  exercise: Exercise;
  moduleColor: string;
  onComplete: (
    result: AnalysisResult | VoiceAnalysisResult,
    userResponse: string,
    exercise: Exercise,
    type: 'written' | 'verbal'
  ) => void;
  entitlements: Entitlements | null;
  analysisHistory: { [exerciseId: string]: AnalysisHistoryItem };
  onApiKeyError: (error: string) => void;
}

export const ExerciseScreen: React.FC<ExerciseScreenProps> = ({ exercise, moduleColor, onComplete, entitlements, onApiKeyError }) => {
  const [userResponse, setUserResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const { addToast } = useToast();

  const isPro = hasProAccess(entitlements);
  const isVerbal = exercise.exerciseType === ExerciseType.VERBAL;

  const { 
    isListening, 
    startListening, 
    stopListening, 
    liveMetrics, 
    highlightedTranscript, 
    speak, 
    isSpeaking, 
    cancelSpeaking,
  } = useSpeech();
  
  const handleStopAndSubmit = async () => {
    if (!isListening) return;

    const { finalTranscript, finalSummary } = stopListening();

    if (!finalTranscript || !finalSummary) {
      addToast('Nessuna registrazione da analizzare.', 'error');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
        const result = await analyzeVerbalResponse(exercise, finalTranscript, finalSummary);
        onComplete(result, finalTranscript, exercise, 'verbal');
    } catch (error: any) {
        console.error(error);
        if (error.message.includes('API key')) {
            onApiKeyError(error.message);
        } else {
            addToast(error.message || "Si è verificato un errore sconosciuto.", 'error');
        }
    } finally {
        setIsLoading(false);
    }
  };


  const handleWrittenSubmit = async () => {
    if (!userResponse.trim()) {
      addToast('La risposta non può essere vuota.', 'error');
      return;
    }
    soundService.playClick();
    setIsLoading(true);

    try {
      const result = await analyzeWrittenResponse(exercise, userResponse, isPro);
      onComplete(result, userResponse, exercise, 'written');
    } catch (error: any) {
      console.error(error);
      if (error.message.includes('API key')) {
        onApiKeyError(error.message);
      } else {
        addToast(error.message || "Si è verificato un errore sconosciuto.", 'error');
      }
      setIsLoading(false);
    }
  };
  
  const handleSpeakScenario = () => {
      soundService.playClick();
      if (isSpeaking) {
          cancelSpeaking();
      } else {
          const textToSpeak = `Scenario: ${exercise.scenario}. Compito: ${exercise.task}`;
          speak(textToSpeak);
      }
  }

  if (isLoading) {
    return <FullScreenLoader estimatedTime={isVerbal ? 15 : 20} />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.titleContainer}>
          <h1 style={styles.title}>{exercise.title}</h1>
          <span style={{ ...styles.difficultyBadge, backgroundColor: moduleColor }}>{exercise.difficulty}</span>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Scenario</h2>
          <p style={styles.sectionText}>{exercise.scenario}</p>
        </div>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Il tuo Compito</h2>
          <p style={styles.sectionText}>{exercise.task}</p>
        </div>
        <button onClick={handleSpeakScenario} style={styles.speakButton}><SpeakerIcon /> {isSpeaking ? 'Interrompi audio' : 'Ascolta lo scenario'}</button>
        
        {isPro && (
            <div style={styles.proToolsContainer}>
                <button onClick={() => setIsLibraryOpen(true)} style={styles.proToolButton}>
                    <LightbulbIcon/> Libreria Domande PRO
                </button>
                <button onClick={() => setIsChecklistOpen(true)} style={styles.proToolButton}>
                    <LightbulbIcon/> Checklist Preparazione PRO
                </button>
            </div>
        )}

        <div style={styles.responseArea}>
          {isVerbal ? (
            <RealTimeVoiceAnalysis
              isListening={isListening}
              onStart={startListening}
              onStopAndSubmit={handleStopAndSubmit}
              metrics={liveMetrics}
              transcript={highlightedTranscript}
            />
          ) : (
            <>
              <textarea
                style={styles.textarea}
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                placeholder="Scrivi qui la tua risposta..."
                rows={8}
              />
              <div style={styles.writtenSubmitContainer}>
                <button onClick={handleWrittenSubmit} style={styles.primaryButton} disabled={!userResponse.trim()}>
                    Invia Analisi <SendIcon/>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {isLibraryOpen && <QuestionLibraryModal isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} />}
      {isChecklistOpen && <PreparationChecklistModal isOpen={isChecklistOpen} onClose={() => setIsChecklistOpen(false)} />}
    </div>
  );
};

// Styles for ExerciseScreen component
const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '40px 20px' },
  content: {
    backgroundColor: COLORS.card, padding: '24px', borderRadius: '12px',
    position: 'relative', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: `1px solid ${COLORS.divider}`
  },
  titleContainer: {
    backgroundColor: COLORS.card, padding: '20px', borderRadius: '12px', textAlign: 'center', marginBottom: '24px',
    border: `1px solid ${COLORS.divider}`
  },
  title: { fontSize: '24px', fontWeight: 'bold', color: COLORS.primary, margin: '0 0 12px 0' },
  difficultyBadge: { padding: '4px 12px', borderRadius: '6px', color: 'white', fontSize: '14px', fontWeight: 500 },
  section: { marginBottom: '24px' },
  sectionTitle: {
    fontSize: '18px', fontWeight: 600, color: COLORS.textPrimary, paddingBottom: '8px',
    borderBottom: `2px solid ${COLORS.secondary}`, marginBottom: '12px'
  },
  sectionText: { fontSize: '16px', color: COLORS.textSecondary, lineHeight: 1.6 },
  speakButton: {
      display: 'flex', alignItems: 'center', gap: '8px',
      background: 'transparent', border: `1px solid ${COLORS.divider}`, padding: '8px 12px',
      borderRadius: '8px', cursor: 'pointer', color: COLORS.textSecondary, marginBottom: '24px'
  },
  proToolsContainer: {
      display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap'
  },
  proToolButton: {
      display: 'flex', alignItems: 'center', gap: '8px',
      background: '#FFFBEA', border: `1px solid ${COLORS.warning}`, padding: '10px 16px',
      borderRadius: '8px', cursor: 'pointer', color: COLORS.textPrimary, fontWeight: 500,
  },
  responseArea: { marginTop: '24px' },
  textarea: {
    width: '100%', padding: '12px 16px', fontSize: '16px', borderRadius: '8px',
    border: `1px solid ${COLORS.divider}`, resize: 'vertical', fontFamily: 'inherit', backgroundColor: 'white',
    boxSizing: 'border-box'
  },
  writtenSubmitContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '16px',
  },
  verbalContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
  micButton: {
    width: '80px', height: '80px', borderRadius: '50%', border: 'none',
    backgroundColor: COLORS.secondary, color: 'white', display: 'flex',
    justifyContent: 'center', alignItems: 'center', cursor: 'pointer',
    transition: 'background-color 0.2s, transform 0.2s',
  },
  micButtonActive: {
      backgroundColor: COLORS.error, transform: 'scale(1.1)'
  },
  transcriptPreview: {
      fontStyle: 'italic', color: COLORS.textSecondary, textAlign: 'center',
      minHeight: '40px', padding: '8px', backgroundColor: COLORS.cardDark,
      borderRadius: '8px', width: '100%'
  },
  primaryButton: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '16px',
    fontWeight: 'bold', border: 'none', backgroundColor: COLORS.secondary, color: 'white',
    borderRadius: '8px', cursor: 'pointer'
  },
};