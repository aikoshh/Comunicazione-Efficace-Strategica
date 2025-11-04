// components/ExerciseScreen.tsx
// FIX: Populating the full content of the missing ExerciseScreen.tsx file.
import React, { useState } from 'react';
import { Exercise, AnalysisResult, VoiceAnalysisResult, Entitlements, AnalysisHistoryItem, ExerciseType } from '../types';
import { COLORS, EXERCISE_TYPE_ICONS } from '../constants';
import { analyzeWrittenResponse, analyzeVerbalResponse, generateSuggestedResponse } from '../services/geminiService';
import { useToast } from '../hooks/useToast';
import { FullScreenLoader, Spinner } from './Loader';
import { SendIcon, MicIcon, LightbulbIcon } from './Icons';
import { hasProAccess } from '../services/monetizationService';
import { useSpeech } from '../hooks/useSpeech';
import { QuestionLibraryModal } from './QuestionLibraryModal';
import { PreparationChecklistModal } from './PreparationChecklistModal';
import { soundService } from '../services/soundService';
import { mainLogoUrl } from '../assets';

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

export const ExerciseScreen: React.FC<ExerciseScreenProps> = ({
  exercise,
  moduleColor,
  onComplete,
  entitlements,
  onApiKeyError,
}) => {
  const [userResponse, setUserResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const { addToast } = useToast();
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeech();
  
  const isPro = hasProAccess(entitlements);
  const exerciseType = exercise.exerciseType || ExerciseType.WRITTEN;
  const ExerciseIcon = EXERCISE_TYPE_ICONS[exerciseType];
  
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);

  const handleComplete = async () => {
    soundService.playClick();
    const responseToAnalyze = exerciseType === ExerciseType.VERBAL ? transcript : userResponse;
    if (!responseToAnalyze.trim()) {
      addToast('La risposta non può essere vuota.', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      let result;
      if (exerciseType === ExerciseType.VERBAL) {
        result = await analyzeVerbalResponse(exercise, responseToAnalyze);
      } else {
        result = await analyzeWrittenResponse(exercise, responseToAnalyze, isPro);
      }
      onComplete(result, responseToAnalyze, exercise, exerciseType);
    } catch (error: any) {
      console.error("Analysis failed:", error);
      if (error.message && (error.message.includes('API key') || error.message.includes('API_KEY'))) {
        onApiKeyError(error.message);
      } else {
        addToast(error.message || "Si è verificato un errore durante l'analisi.", 'error');
      }
      setIsLoading(false);
    }
  };

  const handleSuggestResponse = async () => {
    soundService.playClick();
    setIsSuggesting(true);
    try {
        const suggestion = await generateSuggestedResponse(exercise);
        setUserResponse(suggestion);
    } catch (error: any) {
        console.error("Suggestion failed:", error);
        if (error.message && (error.message.includes('API key') || error.message.includes('API_KEY'))) {
            onApiKeyError(error.message);
        } else {
            addToast(error.message || "Impossibile generare il suggerimento.", 'error');
        }
    } finally {
        setIsSuggesting(false);
    }
  };
  
  const handleToggleListening = () => {
    if (isListening) {
      soundService.playStopRecording();
      stopListening();
    } else {
      soundService.playStartRecording();
      startListening();
    }
  };

  if (isLoading) {
    return <FullScreenLoader estimatedTime={exerciseType === ExerciseType.VERBAL ? 25 : 15} />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.titleContainer}>
          <ExerciseIcon style={{...styles.icon, color: moduleColor}} />
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
        
        {isPro && (
            <div style={styles.proToolsContainer}>
                <button style={styles.proToolButton} onClick={() => setIsQuestionModalOpen(true)}>Libreria Domande PRO</button>
                <button style={styles.proToolButton} onClick={() => setIsChecklistModalOpen(true)}>Checklist Preparazione PRO</button>
            </div>
        )}
        
        <div style={styles.responseArea}>
          {exerciseType === ExerciseType.VERBAL ? (
            <>
              {!isSupported && <p style={styles.notSupported}>Il riconoscimento vocale non è supportato da questo browser.</p>}
              <textarea
                style={{ ...styles.textarea, minHeight: '120px' }}
                value={transcript}
                readOnly
                placeholder="La trascrizione della tua risposta apparirà qui..."
              />
            </>
          ) : (
            <textarea
              style={styles.textarea}
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              placeholder="Scrivi qui la tua risposta..."
              rows={8}
            />
          )}
        </div>
        <footer style={styles.footer}>
          {exerciseType === ExerciseType.VERBAL ? (
            <>
              <button onClick={handleToggleListening} style={isListening ? styles.stopButton : styles.recordButton} disabled={!isSupported}>
                <MicIcon />
                <span>{isListening ? 'Ferma Registrazione' : 'Avvia Registrazione'}</span>
              </button>
              <button onClick={handleComplete} style={styles.primaryButton} disabled={isListening || !transcript.trim()}>
                Analizza Risposta <SendIcon />
              </button>
            </>
          ) : (
            <>
              <button onClick={handleSuggestResponse} style={styles.secondaryButton} disabled={isLoading || isSuggesting}>
                  {isSuggesting ? <Spinner size={20} /> : <LightbulbIcon />}
                  <span>{isSuggesting ? 'Genero...' : 'Suggerisci Risposta'}</span>
              </button>
              <button onClick={handleComplete} style={styles.primaryButton} disabled={!userResponse.trim() || isLoading || isSuggesting}>
                Invia per Analisi <SendIcon />
              </button>
            </>
          )}
        </footer>
      </div>

      <div style={styles.logoContainer}>
        <img src={mainLogoUrl} alt="CES Coach Logo" style={styles.footerLogo} />
      </div>
      
      {isPro && <QuestionLibraryModal isOpen={isQuestionModalOpen} onClose={() => setIsQuestionModalOpen(false)} />}
      {isPro && <PreparationChecklistModal isOpen={isChecklistModalOpen} onClose={() => setIsChecklistModalOpen(false)} />}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  content: {
    backgroundColor: COLORS.card,
    padding: '32px',
    borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
    border: `1px solid ${COLORS.divider}`
  },
  titleContainer: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' },
  icon: { width: '32px', height: '32px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: COLORS.textPrimary, margin: 0 },
  section: { marginBottom: '24px' },
  sectionTitle: {
    fontSize: '18px', fontWeight: 600, color: COLORS.textPrimary, paddingBottom: '8px',
    borderBottom: `2px solid ${COLORS.secondary}`, marginBottom: '12px'
  },
  sectionText: { fontSize: '16px', color: COLORS.textSecondary, lineHeight: 1.6, whiteSpace: 'pre-wrap' },
  responseArea: { marginTop: '24px' },
  textarea: {
    width: '100%', padding: '12px 16px', fontSize: '16px', borderRadius: '8px',
    border: `1px solid ${COLORS.divider}`, resize: 'vertical', fontFamily: 'inherit',
    backgroundColor: 'white', boxSizing: 'border-box'
  },
  footer: {
    marginTop: '32px',
    padding: '16px 32px',
    margin: '32px -32px -32px -32px',
    borderTop: `1px solid ${COLORS.divider}`,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: COLORS.card,
    borderRadius: '0 0 12px 12px',
  },
  primaryButton: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '16px',
    fontWeight: 'bold', border: 'none', backgroundColor: COLORS.secondary, color: 'white',
    borderRadius: '8px', cursor: 'pointer'
  },
  secondaryButton: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '16px',
    fontWeight: 'bold', border: `1px solid ${COLORS.secondary}`, backgroundColor: 'transparent', color: COLORS.secondary,
    borderRadius: '8px', cursor: 'pointer'
  },
  recordButton: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '16px',
    fontWeight: 'bold', border: 'none', backgroundColor: COLORS.success, color: 'white',
    borderRadius: '8px', cursor: 'pointer'
  },
  stopButton: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '16px',
    fontWeight: 'bold', border: 'none', backgroundColor: COLORS.error, color: 'white',
    borderRadius: '8px', cursor: 'pointer'
  },
  notSupported: { color: COLORS.error, fontWeight: 'bold' },
  proToolsContainer: {
    display: 'flex',
    gap: '12px',
    margin: '24px 0',
    paddingTop: '16px',
    borderTop: `1px dashed ${COLORS.divider}`
  },
  proToolButton: {
    padding: '8px 16px',
    fontSize: '14px',
    border: `1px solid ${COLORS.warning}`,
    backgroundColor: '#FFFBEA',
    color: COLORS.textAccent,
    borderRadius: '8px',
    cursor: 'pointer'
  },
  logoContainer: {
    textAlign: 'center',
    paddingTop: '40px',
  },
  footerLogo: {
    width: '150px',
    height: 'auto',
    opacity: 0.7
  }
};