// components/SuggestionStyleModal.tsx
// FIX: Create full content for the Suggestion Style Modal component.
import React, { useEffect, useRef } from 'react';
import { ResponseStyle } from '../types';
import { COLORS } from '../constants';
import { CloseIcon } from './Icons';
import { soundService } from '../services/soundService';

interface SuggestionStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStyle: (style: ResponseStyle) => void;
  currentStyle: ResponseStyle;
}

const stylesData: Record<ResponseStyle, { title: string, description: string, color: string }> = {
    'Empatica': {
        title: 'Risposta Empatica',
        description: 'Mette al primo posto la relazione e la comprensione emotiva. Utile per de-escalare tensioni e costruire fiducia.',
        color: '#2E7D32' // Green
    },
    'Diretta': {
        title: 'Risposta Diretta',
        description: 'Va dritta al punto in modo chiaro e conciso. Utile quando la chiarezza è prioritaria e non ci sono ambiguità.',
        color: '#C62828' // Red
    },
    'Strategica': {
        title: 'Risposta Strategica',
        description: 'Si concentra sull\'obiettivo a lungo termine, usando domande e riformulazioni per guidare la conversazione. La scelta più versatile.',
        color: '#1C3E5E' // Blue
    }
};

export const SuggestionStyleModal: React.FC<SuggestionStyleModalProps> = ({ isOpen, onClose, onSelectStyle, currentStyle }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    soundService.playClick();
    onClose();
  };
  
  const handleSelect = (style: ResponseStyle) => {
    soundService.playClick();
    onSelectStyle(style);
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div 
        style={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="style-modal-title"
        tabIndex={-1}
      >
        <header style={styles.header}>
            <h2 id="style-modal-title" style={styles.title}>Scegli lo Stile della Risposta</h2>
            <button onClick={handleClose} style={styles.closeButton} aria-label="Chiudi modale">
              <CloseIcon />
            </button>
        </header>
        <div style={styles.content}>
          <p style={styles.description}>
            Seleziona lo stile che preferisci per i suggerimenti generati dall'AI. Puoi cambiarlo in qualsiasi momento.
          </p>
          <div style={styles.optionsContainer}>
            {(Object.keys(stylesData) as ResponseStyle[]).map(style => (
              <div 
                key={style}
                style={{
                  ...styles.optionCard,
                  ...(currentStyle === style ? { borderColor: stylesData[style].color, boxShadow: `0 0 10px ${stylesData[style].color}40` } : {})
                }}
                onClick={() => handleSelect(style)}
              >
                <h3 style={{...styles.optionTitle, color: stylesData[style].color}}>{stylesData[style].title}</h3>
                <p style={styles.optionDescription}>{stylesData[style].description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 1000, padding: '20px'
  },
  modal: {
    backgroundColor: COLORS.card,
    borderRadius: '16px',
    width: '100%', maxWidth: '600px',
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
  title: {
    fontSize: '22px', fontWeight: 'bold', color: COLORS.primary,
    margin: 0
  },
  closeButton: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '4px', color: COLORS.textSecondary
  },
  content: {
    overflowY: 'auto',
    padding: '24px',
  },
  description: {
    fontSize: '15px', color: COLORS.textSecondary,
    margin: '0 0 24px 0', lineHeight: 1.6,
    textAlign: 'center'
  },
  optionsContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
  },
  optionCard: {
      backgroundColor: COLORS.cardDark,
      padding: '20px',
      borderRadius: '12px',
      border: `2px solid transparent`,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
  },
  optionTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      margin: '0 0 8px 0',
  },
  optionDescription: {
      fontSize: '14px',
      color: COLORS.textSecondary,
      lineHeight: 1.5,
      margin: 0,
  }
};
