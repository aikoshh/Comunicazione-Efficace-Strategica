import React, { useState } from 'react';
import { Exercise, AnalysisResult, VoiceAnalysisResult, Entitlements, AnalysisHistoryItem, ExerciseType } from '../types';
import { COLORS, EXERCISE_TYPE_ICONS } from '../constants';
import { BackIcon, SendIcon, MicIcon, TargetIcon, LightbulbIcon, QuestionIcon } from './Icons';
import { soundService } from '../services/soundService';
import { useSpeech } from '../hooks/useSpeech';
import { analyzeResponse, analyzeParaverbalResponse } from '../services/geminiService';
import { hasProAccess } from '../services/monetizationService';
import { FullScreenLoader } from './Loader';
import { useToast } from '../hooks/useToast';
import { QuestionLibraryModal } from './QuestionLibraryModal';
import { PreparationChecklistModal } from './PreparationChecklistModal';

interface ExerciseScreenProps {
  exercise: Exercise;
  moduleColor: string;
  onComplete: (result: AnalysisResult | VoiceAnalysisResult, userResponse: string, exerciseId: string, type: 'written' | 'verbal') => void;
  onBack: () => void;
  entitlements: Entitlements | null;
  analysisHistory: { [exerciseId: string]: AnalysisHistoryItem };
  onApiKeyError: (error: string) => void;
}

export const ExerciseScreen: React.FC<ExerciseScreenProps> = ({
  exercise,
  moduleColor,
  onComplete,
  onBack,
  entitlements,
  onApiKeyError
}) => {
  const [userResponse, setUserResponse] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { addToast } = useToast();
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeech();
  
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);

  const isPro = hasProAccess(entitlements);
  const exerciseType = exercise.exerciseType || ExerciseType.WRITTEN;
  const ExerciseIcon = EXERCISE_TYPE_ICONS[exerciseType];

  const handleAnalyze = async () => {
    soundService.playClick();
    const responseText = exerciseType === ExerciseType.VERBAL ? transcript : userResponse;
    if (!responseText.trim()) {
      addToast('La risposta non può essere vuota.', 'error');
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
        if (exerciseType === ExerciseType.VERBAL) {
            const result = await analyzeParaverbalResponse(responseText, exercise.scenario, exercise.task);
            onComplete(result, responseText, exercise.id, 'verbal');
        } else {
            const result = await analyzeResponse(exercise, responseText, entitlements, {});
            onComplete(result, responseText, exercise.id, 'written');
        }
    } catch (error: any) {
        console.error(error);
        if (error.message.includes('API key') || error.message.includes('API_KEY')) {
            onApiKeyError(error.message);
        } else {
            addToast(error.message || "Si è verificato un errore sconosciuto.", 'error');
        }
        setIsAnalyzing(false);
    }
  };
  
  const handleRecordToggle = () => {
    if(isListening) {
        soundService.playStopRecording();
        stopListening();
    } else {
        soundService.playStartRecording();
        startListening();
    }
  };

  if (isAnalyzing) {
    return <FullScreenLoader estimatedTime={exerciseType === ExerciseType.VERBAL ? 25 : 15} />;
  }

  return (
    <div style={styles.container}>
      <header style={{...styles.header, backgroundColor: moduleColor}}>
        <button onClick={onBack} style={styles.backButton}><BackIcon /> Indietro</button>
        <div style={styles.titleContainer}>
            <ExerciseIcon style={styles.titleIcon} />
            <h1 style={styles.title}>{exercise.title}</h1>
        </div>
      </header>
      
      <main style={styles.content}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}><TargetIcon/> Scenario</h2>
          <p style={styles.sectionText}>{exercise.scenario}</p>
        </div>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}><LightbulbIcon/> Il tuo Compito</h2>
          <p style={styles.sectionText}>{exercise.task}</p>
        </div>

        {isPro && (
            <div style={styles.proToolsContainer}>
                <button style={styles.proToolButton} onClick={() => setIsLibraryOpen(true)}><QuestionIcon/> Libreria Domande PRO</button>
                <button style={styles.proToolButton} onClick={() => setIsChecklistOpen(true)}><TargetIcon/> Checklist Preparazione</button>
            </div>
        )}
        
        <div style={styles.responseArea}>
          {exerciseType === ExerciseType.WRITTEN ? (
            <textarea
              style={styles.textarea}
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              placeholder="Scrivi qui la tua risposta..."
              rows={8}
            />
          ) : (
             <div style={styles.voiceContainer}>
                {!isSupported && <p style={styles.warningText}>Il riconoscimento vocale non è supportato da questo browser.</p>}
                <button onClick={handleRecordToggle} disabled={!isSupported} style={isListening ? styles.recordButtonActive : styles.recordButton}>
                    <MicIcon />
                    {isListening ? 'Ferma Registrazione' : 'Avvia Registrazione'}
                </button>
                <p style={styles.transcriptPreview}>{isListening ? 'In ascolto...' : (transcript ? `Trascrizione: "${transcript}"` : 'La tua trascrizione apparirà qui.')}</p>
             </div>
          )}
        </div>

        <button 
            onClick={handleAnalyze} 
            style={{...styles.analyzeButton, backgroundColor: moduleColor}}
            disabled={(exerciseType === ExerciseType.VERBAL ? !transcript : !userResponse) || isListening}
        >
            Analizza Risposta <SendIcon />
        </button>
      </main>

      {isPro && (
          <>
            <QuestionLibraryModal isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} />
            <PreparationChecklistModal isOpen={isChecklistOpen} onClose={() => setIsChecklistOpen(false)} />
          </>
      )}
    </div>
  );
};


const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: COLORS.base,
    minHeight: '100vh',
  },
  header: {
    padding: '24px',
    color: 'white',
    position: 'relative',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    padding: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px',
    marginBottom: '16px',
  },
  titleContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      justifyContent: 'center',
      textAlign: 'center'
  },
  titleIcon: {
      width: '32px',
      height: '32px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: 0,
  },
  content: {
    maxWidth: '800px',
    margin: '-40px auto 40px',
    backgroundColor: COLORS.card,
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
    position: 'relative',
    zIndex: 2,
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: COLORS.textPrimary,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingBottom: '8px',
    borderBottom: `2px solid ${COLORS.secondary}`,
    marginBottom: '12px',
  },
  sectionText: {
    fontSize: '16px',
    color: COLORS.textSecondary,
    lineHeight: 1.6,
  },
  proToolsContainer: {
      display: 'flex',
      gap: '12px',
      marginBottom: '24px',
      padding: '16px',
      backgroundColor: COLORS.cardDark,
      borderRadius: '8px'
  },
  proToolButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    border: `1px solid ${COLORS.secondary}`,
    backgroundColor: 'transparent',
    color: COLORS.secondary,
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 500
  },
  responseArea: {
    marginTop: '24px',
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
  voiceContainer: {
    textAlign: 'center',
    padding: '20px',
    border: `2px dashed ${COLORS.divider}`,
    borderRadius: '8px',
  },
  recordButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: COLORS.primary,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
  },
  recordButtonActive: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: COLORS.error,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
  },
  transcriptPreview: {
      marginTop: '16px',
      fontSize: '15px',
      color: COLORS.textSecondary,
      fontStyle: 'italic',
      minHeight: '22px'
  },
  warningText: {
      color: COLORS.error,
      marginBottom: '16px',
  },
  analyzeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    padding: '16px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '24px',
  }
};