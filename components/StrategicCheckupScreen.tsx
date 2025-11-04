// components/StrategicCheckupScreen.tsx
import React, { useState, useRef } from 'react';
import { CommunicatorProfile, Entitlements } from '../types';
import { COLORS, STRATEGIC_CHECKUP_EXERCISES } from '../constants';
import { SendIcon } from './Icons';
import { generateCommunicatorProfile } from '../services/geminiService';
import { FullScreenLoader } from './Loader';
import { useToast } from '../hooks/useToast';
import { soundService } from '../services/soundService';

interface StrategicCheckupScreenProps {
  onComplete: (profile: CommunicatorProfile) => void;
  entitlements: Entitlements | null;
  onApiKeyError: (error: string) => void;
}

export const StrategicCheckupScreen: React.FC<StrategicCheckupScreenProps> = ({ onComplete, onApiKeyError }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();
  const mainContentRef = useRef<HTMLDivElement>(null);

  const exercises = STRATEGIC_CHECKUP_EXERCISES;
  const currentExercise = exercises[currentStep];
  const isLastStep = currentStep === exercises.length - 1;

  const handleNext = async () => {
    if (!currentResponse.trim()) {
      addToast('La risposta non può essere vuota.', 'error');
      return;
    }
    soundService.playClick();
    const newResponses = [...responses, currentResponse];
    setResponses(newResponses);
    setCurrentResponse('');
    
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }

    if (isLastStep) {
      setIsLoading(true);
      try {
        const profile = await generateCommunicatorProfile(
          newResponses.map((resp, index) => ({
            exerciseTitle: exercises[index].title,
            userResponse: resp,
          }))
        );
        onComplete(profile);
      } catch (error: any) {
        console.error(error);
        if (error.message.includes('API key')) {
          onApiKeyError(error.message);
        } else {
          addToast(error.message || 'Si è verificato un errore sconosciuto.', 'error');
        }
        setIsLoading(false);
      }
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  if (isLoading) {
    return <FullScreenLoader estimatedTime={25} />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.content} ref={mainContentRef}>
        <div style={styles.progressContainer}>
            <div style={styles.progressBar}>
                <div style={{...styles.progressBarFill, width: `${((currentStep + 1) / exercises.length) * 100}%`}}/>
            </div>
            <span style={styles.progressText}>Domanda {currentStep + 1} di {exercises.length}</span>
        </div>
        
        <div style={styles.titleContainer}>
          <h1 style={styles.title}>{currentExercise.title}</h1>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Scenario</h2>
          <p style={styles.sectionText}>{currentExercise.scenario}</p>
        </div>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Il tuo Compito</h2>
          <p style={styles.sectionText}>{currentExercise.task}</p>
        </div>

        <div style={styles.responseArea}>
          <textarea
            style={styles.textarea}
            value={currentResponse}
            onChange={(e) => setCurrentResponse(e.target.value)}
            placeholder="Scrivi qui la tua risposta..."
            rows={6}
          />
        </div>
        <footer style={styles.footer}>
            <button onClick={handleNext} style={styles.primaryButton} disabled={!currentResponse.trim()}>
                {isLastStep ? 'Genera Profilo' : 'Prossima Domanda'} <SendIcon/>
            </button>
        </footer>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '40px 20px' },
  content: {
    backgroundColor: COLORS.card, padding: '24px', borderRadius: '12px',
    position: 'relative', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: `1px solid ${COLORS.divider}`
  },
  progressContainer: { marginBottom: '24px' },
  progressBar: { height: '8px', backgroundColor: COLORS.divider, borderRadius: '4px', overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.secondary, borderRadius: '4px', transition: 'width 0.3s ease' },
  progressText: { fontSize: '14px', color: COLORS.textSecondary, textAlign: 'right', marginTop: '8px' },
  titleContainer: {
    backgroundColor: COLORS.card, padding: '20px', borderRadius: '12px', textAlign: 'center', marginBottom: '24px',
    border: `1px solid ${COLORS.divider}`
  },
  title: { fontSize: '24px', fontWeight: 'bold', color: COLORS.primary, margin: 0 },
  section: { marginBottom: '24px' },
  sectionTitle: {
    fontSize: '18px', fontWeight: 600, color: COLORS.textPrimary, paddingBottom: '8px',
    borderBottom: `2px solid ${COLORS.secondary}`, marginBottom: '12px'
  },
  sectionText: { fontSize: '16px', color: COLORS.textSecondary, lineHeight: 1.6 },
  responseArea: { marginTop: '24px' },
  textarea: {
    width: '100%', padding: '12px 16px', fontSize: '16px', borderRadius: '8px',
    border: `1px solid ${COLORS.divider}`, resize: 'vertical', fontFamily: 'inherit', backgroundColor: 'white'
  },
  footer: {
    padding: '16px 24px',
    marginTop: '24px',
    marginRight: '-24px',
    marginLeft: '-24px',
    marginBottom: '-24px',
    borderTop: `1px solid ${COLORS.divider}`,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: '0 0 12px 12px',
  },
  primaryButton: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '16px',
    fontWeight: 'bold', border: 'none', backgroundColor: COLORS.secondary, color: 'white',
    borderRadius: '8px', cursor: 'pointer'
  }
};
