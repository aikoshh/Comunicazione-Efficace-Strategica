// components/ExerciseScreen.tsx
import React, { useState, useEffect } from 'react';
import { Exercise, AnalysisResult, VoiceAnalysisResult, Entitlements, AnalysisHistoryItem, ExerciseType } from '../types';
import { COLORS, EXERCISE_TYPE_ICONS } from '../constants';
import { SendIcon, MicIcon } from './Icons';
import { analyzeWrittenResponse, analyzeVerbalResponse } from '../services/geminiService';
import { FullScreenLoader } from './Loader';
import { useToast } from '../hooks/useToast';
import { hasProAccess } from '../services/monetizationService';
import { useSpeech } from '../hooks/useSpeech';
import { RealTimeVoiceAnalysis } from './RealTimeVoiceAnalysis';
import { soundService } from '../services/soundService';

interface ExerciseScreenProps {
  exercise: Exercise;
  moduleColor: string;
  onComplete: (result: AnalysisResult | VoiceAnalysisResult, userResponse: string, exercise: Exercise, type: 'written' | 'verbal') => void;
  entitlements: Entitlements | null;
  analysisHistory: { [exerciseId: string]: AnalysisHistoryItem };
  onApiKeyError: (error: string) => void;
}

export const ExerciseScreen: React.FC<ExerciseScreenProps> = ({ exercise, moduleColor, onComplete, entitlements, analysisHistory, onApiKeyError }) => {
  const [userResponse, setUserResponse] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { addToast } = useToast();
  const isPro = hasProAccess(entitlements);

  const { isListening, transcript, highlightedTranscript, liveMetrics, startListening, stopListening } = useSpeech();

  const isVerbal = exercise.exerciseType === ExerciseType.VERBAL;
  const ExerciseIcon = EXERCISE_TYPE_ICONS[exercise.exerciseType || ExerciseType.WRITTEN];

  useEffect(() => {
    // If it's a verbal exercise, the transcript is the response
    if (isVerbal) {
      setUserResponse(transcript);
    }
  }, [transcript, isVerbal]);

  const handleSubmit = async () => {
    if (!userResponse.trim()) {
      addToast('La risposta non può essere vuota.', 'error');
      return;
    }
    soundService.playClick();
    setIsAnalyzing(true);
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
      setIsAnalyzing(false);
    }
  };

  const handleToggleRecording = async () => {
    if (isListening) {
      soundService.playStopRecording();
      const { finalTranscript, finalSummary } = stopListening();
      if (!finalTranscript.trim()) {
        // FIX: Changed 'warning' to 'info' to match the available ToastType options.
        addToast('Nessun audio registrato. Prova a parlare più chiaramente.', 'info');
        return;
      }
      setIsAnalyzing(true);
      try {
        const result = await analyzeVerbalResponse(exercise, finalTranscript, finalSummary);
        onComplete(result, finalTranscript, exercise, 'verbal');
      } catch (error: any) {
        console.error(error);
        if (error.message.includes('API key')) {
          onApiKeyError(error.message);
        } else {
          addToast(error.message || "Si è verificato un errore sconosciuto durante l'analisi vocale.", 'error');
        }
        setIsAnalyzing(false);
      }

    } else {
      soundService.playStartRecording();
      startListening();
    }
  };

  if (isAnalyzing) {
    return <FullScreenLoader estimatedTime={isVerbal ? 20 : 15} />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={{...styles.titleContainer, backgroundColor: moduleColor}}>
            <ExerciseIcon style={{color: 'white', width: 24, height: 24}}/>
            <h1 style={styles.title}>{exercise.title}</h1>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Scenario</h2>
          <p style={styles.sectionText}>{exercise.scenario}</p>
        </div>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Il tuo Compito</h2>
          <p style={styles.sectionText}>{exercise.task}</p>
        </div>

        {isVerbal ? (
          <div style={styles.verbalContainer}>
            <div style={styles.recordingControls}>
                <button 
                    onClick={handleToggleRecording} 
                    style={{...styles.micButton, ...(isListening ? styles.micButtonActive : {})}}
                    aria-label={isListening ? 'Ferma registrazione' : 'Inizia registrazione'}
                >
                    <MicIcon />
                </button>
                <p style={styles.recordingStatus}>{isListening ? 'Registrazione in corso...' : 'Tocca per registrare'}</p>
            </div>
            {isListening && <RealTimeVoiceAnalysis metrics={liveMetrics} />}
            <div style={styles.transcriptContainer}>
                <p style={styles.transcriptLabel}>Trascrizione in tempo reale:</p>
                <div style={styles.transcriptBox}>
                    {highlightedTranscript || <span style={{color: COLORS.textSecondary}}>In attesa di audio...</span>}
                </div>
            </div>
          </div>
        ) : (
          <div style={styles.responseArea}>
            <textarea
              style={styles.textarea}
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              placeholder="Scrivi qui la tua risposta..."
              rows={8}
            />
            <button onClick={handleSubmit} style={styles.primaryButton} disabled={!userResponse.trim()}>
              Invia per Analisi <SendIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '40px 20px' },
  content: { backgroundColor: COLORS.card, padding: '24px', borderRadius: '12px', position: 'relative', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: `1px solid ${COLORS.divider}` },
  titleContainer: { padding: '20px', borderRadius: '12px', textAlign: 'center', marginBottom: '24px', color: 'white', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' },
  title: { fontSize: '24px', fontWeight: 'bold', margin: 0 },
  section: { marginBottom: '24px' },
  sectionTitle: { fontSize: '18px', fontWeight: 600, color: COLORS.textPrimary, paddingBottom: '8px', borderBottom: `2px solid ${COLORS.secondary}`, marginBottom: '12px' },
  sectionText: { fontSize: '16px', color: COLORS.textSecondary, lineHeight: 1.6 },
  responseArea: { marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '16px' },
  textarea: { width: '100%', padding: '12px 16px', fontSize: '16px', borderRadius: '8px', border: `1px solid ${COLORS.divider}`, resize: 'vertical', fontFamily: 'inherit', backgroundColor: 'white' },
  primaryButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '16px', fontWeight: 'bold', border: 'none', backgroundColor: COLORS.secondary, color: 'white', borderRadius: '8px', cursor: 'pointer' },
  
  // Verbal specific styles
  verbalContainer: { display: 'flex', flexDirection: 'column', gap: '24px' },
  recordingControls: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  micButton: {
    width: '72px', height: '72px', borderRadius: '50%',
    backgroundColor: COLORS.secondary, color: 'white',
    border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  micButtonActive: {
      backgroundColor: COLORS.error,
      boxShadow: `0 0 0 4px ${COLORS.card}, 0 0 0 8px ${COLORS.error}50`,
  },
  recordingStatus: { fontSize: '16px', fontWeight: 500, color: COLORS.textSecondary, margin: 0 },
  transcriptContainer: { backgroundColor: COLORS.cardDark, padding: '16px', borderRadius: '8px' },
  transcriptLabel: { fontSize: '14px', fontWeight: 600, color: COLORS.textPrimary, margin: '0 0 8px 0' },
  transcriptBox: { minHeight: '80px', fontSize: '16px', lineHeight: 1.6, color: COLORS.textPrimary },
};