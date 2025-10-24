import React, { useState, useEffect } from 'react';
import { Exercise, AnalysisResult, VoiceAnalysisResult, Entitlements, AnalysisHistoryItem, ExerciseType } from '../types';
import { COLORS, EXERCISE_TYPE_ICONS } from '../constants';
import { BackIcon, MicIcon, SendIcon, SpeakerIcon, SpeakerOffIcon, LightbulbIcon, CheckCircleIcon } from './Icons';
import { useSpeech } from '../hooks/useSpeech';
import { analyzeResponse, analyzeParaverbalResponse } from '../services/geminiService';
import { FullScreenLoader } from './Loader';
import { useToast } from '../hooks/useToast';
import { hasProAccess } from '../services/monetizationService';
import { soundService } from '../services/soundService';
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
  analysisHistory,
  onApiKeyError,
}) => {
  const [userResponse, setUserResponse] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isQuestionLibraryOpen, setIsQuestionLibraryOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const { addToast } = useToast();
  const { isListening, transcript, startListening, stopListening, isSupported, speak, isSpeaking, stopSpeaking } = useSpeech();

  const isPro = hasProAccess(entitlements);
  const exerciseType = exercise.exerciseType || ExerciseType.WRITTEN;
  const isVerbal = exerciseType === ExerciseType.VERBAL;
  const ExerciseIcon = EXERCISE_TYPE_ICONS[exerciseType];

  useEffect(() => {
    // When the transcript from speech recognition updates, update our userResponse state.
    if (isVerbal && transcript) {
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
      let result;
      if (isVerbal) {
        result = await analyzeParaverbalResponse(userResponse, exercise.scenario, exercise.task);
      } else {
        result = await analyzeResponse(exercise, userResponse, entitlements, analysisHistory);
      }
      onComplete(result, userResponse, exercise.id, isVerbal ? 'verbal' : 'written');
    } catch (error: any) {
      console.error("Analysis failed:", error);
      if (error.message.includes('API key') || error.message.includes('API_KEY')) {
        onApiKeyError(error.message);
      } else {
        addToast(error.message || 'Si è verificato un errore durante l\'analisi.', 'error');
        setIsAnalyzing(false);
      }
    }
  };
  
  const handleToggleListening = () => {
    if(isListening) {
        soundService.playStopRecording();
        stopListening();
    } else {
        soundService.playStartRecording();
        startListening();
    }
  };

  const handleSpeakScenario = () => {
      if(isSpeaking) {
          stopSpeaking();
      } else {
          speak(`${exercise.scenario}. Il tuo compito è: ${exercise.task}`);
      }
  };

  if (isAnalyzing) {
    return <FullScreenLoader estimatedTime={isVerbal ? 20 : 15} />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.titleContainer}>
            <ExerciseIcon style={{...styles.icon, color: moduleColor}}/>
            <h1 style={styles.title}>{exercise.title}</h1>
        </div>
        
        <div style={styles.section}>
            <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Scenario</h2>
                <button onClick={handleSpeakScenario} style={styles.speakButton} title="Ascolta lo scenario">
                    {isSpeaking ? <SpeakerOffIcon/> : <SpeakerIcon/>}
                </button>
            </div>
          <p style={styles.sectionText}>{exercise.scenario}</p>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Il tuo Compito</h2>
          </div>
          <p style={styles.sectionText}>{exercise.task}</p>
        </div>

        {isVerbal ? (
             <div style={styles.responseArea}>
                {isSupported ? (
                     <div style={{textAlign: 'center'}}>
                        <button onClick={handleToggleListening} style={{...styles.micButton, ...(isListening ? styles.micButtonActive : {})}}>
                            <MicIcon width={32} height={32}/>
                        </button>
                        <p style={styles.micStatusText}>{isListening ? "Registrazione in corso... Parla ora." : "Premi per registrare la tua risposta"}</p>
                        <p style={styles.transcriptPreview}>{transcript || "La trascrizione apparirà qui."}</p>
                     </div>
                ) : (
                    <p style={styles.micStatusText}>La registrazione vocale non è supportata da questo browser.</p>
                )}
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
            </div>
        )}
        
        {isPro && !isVerbal && (
            <div style={styles.proTools}>
                <button onClick={() => setIsChecklistOpen(true)} style={styles.proToolButton}><CheckCircleIcon/> Checklist di Preparazione</button>
                <button onClick={() => setIsQuestionLibraryOpen(true)} style={styles.proToolButton}><LightbulbIcon/> Libreria Domande PRO</button>
            </div>
        )}

      </div>
      
      <footer style={styles.footer}>
          <button onClick={onBack} style={styles.secondaryButton}><BackIcon/> Indietro</button>
          <button onClick={handleSubmit} style={{...styles.primaryButton, backgroundColor: moduleColor}} disabled={!userResponse.trim()}>
              Invia per Analisi <SendIcon/>
          </button>
      </footer>
      
      {isPro && (
          <>
            <QuestionLibraryModal isOpen={isQuestionLibraryOpen} onClose={() => setIsQuestionLibraryOpen(false)} />
            <PreparationChecklistModal isOpen={isChecklistOpen} onClose={() => setIsChecklistOpen(false)} />
          </>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '40px 20px 120px' },
  content: { backgroundColor: COLORS.card, padding: '32px', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', border: `1px solid ${COLORS.divider}` },
  titleContainer: { display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: `2px solid ${COLORS.divider}`, marginBottom: '24px' },
  icon: { width: '32px', height: '32px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: COLORS.primary, margin: 0 },
  section: { marginBottom: '24px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  sectionTitle: { fontSize: '18px', fontWeight: 600, color: COLORS.textPrimary, margin: 0, paddingBottom: '8px', borderBottom: `2px solid ${COLORS.secondary}` },
  speakButton: { background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textSecondary },
  sectionText: { fontSize: '16px', color: COLORS.textSecondary, lineHeight: 1.7 },
  responseArea: { marginTop: '24px' },
  textarea: { width: '100%', padding: '16px', fontSize: '16px', borderRadius: '8px', border: `1px solid ${COLORS.divider}`, resize: 'vertical', fontFamily: 'inherit', backgroundColor: 'white' },
  micButton: { width: '80px', height: '80px', borderRadius: '50%', border: `2px solid ${COLORS.secondary}`, backgroundColor: COLORS.card, color: COLORS.secondary, display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto', cursor: 'pointer', transition: 'all 0.2s' },
  micButtonActive: { backgroundColor: COLORS.error, color: 'white', borderColor: COLORS.error },
  micStatusText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: '16px' },
  transcriptPreview: { textAlign: 'center', fontStyle: 'italic', color: COLORS.textPrimary, minHeight: '24px' },
  proTools: { display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px', paddingTop: '24px', borderTop: `1px solid ${COLORS.divider}` },
  proToolButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'none', border: `1px solid ${COLORS.secondary}`, color: COLORS.secondary, borderRadius: '8px', cursor: 'pointer', fontWeight: 500 },
  footer: { position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.card, padding: '16px 24px', borderTop: `1px solid ${COLORS.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 -2px 10px rgba(0,0,0,0.05)', zIndex: 50 },
  secondaryButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '16px', border: `1px solid ${COLORS.secondary}`, backgroundColor: 'transparent', color: COLORS.secondary, borderRadius: '8px', cursor: 'pointer', fontWeight: 500 },
  primaryButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '16px', fontWeight: 'bold', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer' },
};