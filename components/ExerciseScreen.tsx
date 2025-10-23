import React, { useState, useEffect } from 'react';
import type { Exercise, Entitlements, AnalysisResult, UserProgress, VoiceAnalysisResult } from '../types';
import { COLORS } from '../constants';
import { BackIcon, MicIcon, SendIcon } from './Icons';
import { useSpeech } from '../hooks/useSpeech';
import { analyzeResponse, analyzeParaverbalResponse } from '../services/geminiService';
import { FullScreenLoader } from './Loader';
import { useToast } from '../hooks/useToast';
import { soundService } from '../services/soundService';

interface ExerciseScreenProps {
  exercise: Exercise;
  moduleColor: string;
  onComplete: (result: AnalysisResult | VoiceAnalysisResult, userResponse: string, exerciseId: string, type: 'written' | 'verbal') => void;
  onBack: () => void;
  entitlements: Entitlements | null;
  analysisHistory: UserProgress['analysisHistory'];
  onApiKeyError: (error: string) => void;
}

export const ExerciseScreen: React.FC<ExerciseScreenProps> = ({
  exercise,
  moduleColor,
  onComplete,
  onBack,
  entitlements,
  analysisHistory,
  onApiKeyError
}) => {
  const [userResponse, setUserResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeech();

  const isVerbal = exercise.exerciseType === 'Vocale';

  useEffect(() => {
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
    setIsSubmitting(true);
    try {
      if (isVerbal) {
        const result = await analyzeParaverbalResponse(userResponse, exercise.scenario, exercise.task);
        onComplete(result, userResponse, exercise.id, 'verbal');
      } else {
        const result = await analyzeResponse(exercise, userResponse, entitlements, analysisHistory);
        onComplete(result, userResponse, exercise.id, 'written');
      }
    } catch (error: any) {
      console.error(error);
      if (error.message.includes('API key') || error.message.includes('API_KEY')) {
        onApiKeyError(error.message);
      } else {
        addToast(error.message || 'Si è verificato un errore sconosciuto.', 'error');
      }
      setIsSubmitting(false);
    }
  };

  const toggleRecording = () => {
    if (isListening) {
      soundService.playStopRecording();
      stopListening();
    } else {
      soundService.playStartRecording();
      startListening();
    }
  };

  if (isSubmitting) {
    return <FullScreenLoader estimatedTime={isVerbal ? 25 : 15} />;
  }
  
  const headerImage = exercise.headerImage || 'default_image_path.jpg'; // Fallback
  const isHeaderVideo = headerImage.toLowerCase().endsWith('.mp4');

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        {isHeaderVideo ? (
            <video src={headerImage} style={styles.headerImage} autoPlay muted loop playsInline />
        ) : (
            <img src={headerImage} alt={exercise.title} style={styles.headerImage} />
        )}
      </header>
      
      <div style={styles.content}>
          <div style={styles.titleContainer}>
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

          <div style={styles.responseArea}>
            {isVerbal ? (
              <div style={styles.verbalContainer}>
                {!isSupported && <p style={{color: COLORS.error}}>Il riconoscimento vocale non è supportato da questo browser.</p>}
                <button onClick={toggleRecording} style={{...styles.micButton, ...(isListening ? styles.micButtonActive : {})}} disabled={!isSupported}>
                    <MicIcon width={32} height={32} />
                    <span>{isListening ? 'Ferma Registrazione' : 'Avvia Registrazione'}</span>
                </button>
                <p style={styles.transcriptPreview}>{isListening ? 'In ascolto...' : (userResponse ? `Trascrizione: "${userResponse}"` : 'Premi per registrare la tua risposta.')}</p>
              </div>
            ) : (
              <textarea
                style={styles.textarea}
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                placeholder="Scrivi qui la tua risposta..."
                rows={6}
              />
            )}
          </div>
      </div>
      
      <footer style={styles.footer}>
          <button onClick={onBack} style={styles.secondaryButton}><BackIcon/> Indietro</button>
          <button onClick={handleSubmit} style={styles.primaryButton} disabled={!userResponse.trim()}>Invia per Analisi <SendIcon/></button>
      </footer>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '0 0 100px 0',
  },
  header: { position: 'relative', height: '250px' },
  headerImage: {
    width: '100%', height: '100%', objectFit: 'cover',
  },
  content: {
    backgroundColor: COLORS.base,
    padding: '24px',
    borderRadius: '12px 12px 0 0',
    marginTop: '-20px',
    position: 'relative',
    boxShadow: '0 -4px 15px rgba(0,0,0,0.1)'
  },
  titleContainer: {
    backgroundColor: COLORS.card, padding: '20px',
    borderRadius: '12px', textAlign: 'center', marginBottom: '24px',
    border: `1px solid ${COLORS.divider}`
  },
  title: {
    fontSize: '24px', fontWeight: 'bold', color: COLORS.primary, margin: 0,
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '18px', fontWeight: 600, color: COLORS.textPrimary,
    paddingBottom: '8px', borderBottom: `2px solid ${COLORS.secondary}`,
    marginBottom: '12px'
  },
  sectionText: {
    fontSize: '16px', color: COLORS.textSecondary, lineHeight: 1.6
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
  verbalContainer: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '16px', padding: '24px', backgroundColor: COLORS.cardDark,
    borderRadius: '12px'
  },
  micButton: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', width: '120px', height: '120px',
    borderRadius: '50%', border: 'none', cursor: 'pointer',
    backgroundColor: COLORS.secondary, color: 'white',
    transition: 'all 0.3s ease'
  },
  micButtonActive: {
    backgroundColor: COLORS.error,
    transform: 'scale(1.1)',
    boxShadow: '0 0 20px rgba(220, 53, 69, 0.5)'
  },
  transcriptPreview: {
    fontSize: '14px', color: COLORS.textSecondary, fontStyle: 'italic',
    textAlign: 'center', minHeight: '40px'
  },
  footer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    padding: '16px 24px',
    borderTop: `1px solid ${COLORS.divider}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
    zIndex: 50,
  },
  secondaryButton: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '12px 20px', fontSize: '16px',
    border: `1px solid ${COLORS.secondary}`,
    backgroundColor: 'transparent', color: COLORS.secondary,
    borderRadius: '8px', cursor: 'pointer', fontWeight: 500,
  },
  primaryButton: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '12px 20px', fontSize: '16px', fontWeight: 'bold',
    border: 'none', backgroundColor: COLORS.secondary,
    color: 'white', borderRadius: '8px', cursor: 'pointer',
  }
};