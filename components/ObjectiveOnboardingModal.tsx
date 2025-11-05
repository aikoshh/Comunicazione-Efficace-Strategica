import React, { useState } from 'react';
import { COLORS, MAIN_OBJECTIVES } from '../constants';
import { TargetIcon } from './Icons';
import { soundService } from '../services/soundService';

interface ObjectiveOnboardingModalProps {
  onSetObjective: (objective: string) => Promise<void>;
}

export const ObjectiveOnboardingModal: React.FC<ObjectiveOnboardingModalProps> = ({ onSetObjective }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = async (objective: string) => {
    soundService.playClick();
    setIsLoading(true);
    try {
      await onSetObjective(objective);
      // The modal will be closed by the parent component upon successful state update
    } catch (e) {
      console.error("Failed to set objective", e);
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal} role="dialog" aria-modal="true" aria-labelledby="objective-title">
        <header style={styles.header}>
          <TargetIcon style={styles.headerIcon} />
          <h1 id="objective-title" style={styles.title}>Qual è la tua sfida principale?</h1>
          <p style={styles.subtitle}>
            Scegli il tuo obiettivo primario. L'app personalizzerà la tua esperienza per aiutarti a raggiungerlo più in fretta.
          </p>
        </header>
        <div style={styles.content}>
          {MAIN_OBJECTIVES.map(objective => (
            <button
              key={objective}
              style={styles.optionButton}
              onClick={() => handleSelect(objective)}
              disabled={isLoading}
            >
              {objective}
            </button>
          ))}
        </div>
        {isLoading && <div style={styles.loaderOverlay}>Caricamento...</div>}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(28, 62, 94, 0.9)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 2000, padding: '20px'
  },
  modal: {
    backgroundColor: COLORS.card,
    borderRadius: '16px',
    width: '100%', maxWidth: '500px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
    display: 'flex', flexDirection: 'column',
    textAlign: 'center'
  },
  header: {
    padding: '32px 24px 24px',
    borderBottom: `1px solid ${COLORS.divider}`,
  },
  headerIcon: {
    width: '48px',
    height: '48px',
    color: COLORS.secondary,
    marginBottom: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: COLORS.textSecondary,
    lineHeight: 1.6,
    margin: 0,
  },
  content: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  optionButton: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '500',
    color: COLORS.textPrimary,
    backgroundColor: COLORS.card,
    border: `1px solid ${COLORS.divider}`,
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s ease',
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '16px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: COLORS.primary,
  },
};