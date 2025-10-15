import React, { useEffect, useRef } from 'react';
import { Exercise, ExerciseType } from '../types';
import { COLORS, EXERCISE_TYPE_ICONS } from '../constants';
import { CloseIcon } from './Icons';
import { soundService } from '../services/soundService';

interface ExercisePreviewModalProps {
  exercise: Exercise;
  onClose: () => void;
  onStart: (exercise: Exercise) => void;
}

export const ExercisePreviewModal: React.FC<ExercisePreviewModalProps> = ({ exercise, onClose, onStart }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (exercise) {
      modalRef.current?.focus();
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          handleClose();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [exercise]);

  const handleStart = () => {
    soundService.playClick();
    onStart(exercise);
  };

  const handleClose = () => {
    soundService.playClick();
    onClose();
  };
  
  const exerciseType = exercise.exerciseType || ExerciseType.WRITTEN;
  const ExerciseIcon = EXERCISE_TYPE_ICONS[exerciseType];

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div 
        style={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-preview-title"
        tabIndex={-1}
      >
        <header style={styles.header}>
            <div style={styles.titleContainer}>
                <ExerciseIcon style={styles.icon}/>
                <h2 id="exercise-preview-title" style={styles.title}>{exercise.title}</h2>
            </div>
            <button onClick={handleClose} style={styles.closeButton} aria-label="Chiudi anteprima">
              <CloseIcon />
            </button>
        </header>
        <div style={styles.content}>
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Scenario</h3>
                <p style={styles.sectionText}>{exercise.scenario}</p>
            </div>
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Il tuo Compito</h3>
                <p style={styles.sectionText}>{exercise.task}</p>
            </div>
        </div>
        <footer style={styles.footer}>
            <button onClick={handleStart} style={styles.startButton}>
                Inizia Esercizio
            </button>
        </footer>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 1000, padding: '20px'
  },
  modal: {
    backgroundColor: COLORS.card,
    borderRadius: '16px',
    width: '100%', maxWidth: '700px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    animation: 'popIn 0.3s ease-out',
    display: 'flex', flexDirection: 'column',
    maxHeight: '90vh',
    border: `1px solid ${COLORS.divider}`,
    outline: 'none',
  },
  header: {
    padding: '20px 24px',
    borderBottom: `1px solid ${COLORS.divider}`,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexShrink: 0
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  icon: {
      width: '24px',
      height: '24px',
      color: COLORS.primary,
  },
  title: {
    fontSize: '20px', fontWeight: 'bold', color: COLORS.textPrimary,
    margin: 0,
  },
  closeButton: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '4px', color: COLORS.textSecondary
  },
  content: {
    overflowY: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  section: {},
  sectionTitle: {
      fontSize: '16px',
      fontWeight: 'bold',
      color: COLORS.textPrimary,
      margin: '0 0 8px 0',
      paddingBottom: '4px',
      borderBottom: `2px solid ${COLORS.secondary}`
  },
  sectionText: {
      fontSize: '15px',
      color: COLORS.textSecondary,
      lineHeight: 1.6,
      margin: 0
  },
  footer: {
      padding: '20px 24px',
      borderTop: `1px solid ${COLORS.divider}`,
      textAlign: 'right',
      flexShrink: 0,
      backgroundColor: COLORS.cardDark
  },
  startButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    border: 'none',
    backgroundColor: COLORS.secondary,
    color: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }
};