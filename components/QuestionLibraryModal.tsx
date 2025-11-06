import React, { useEffect, useRef, useState } from 'react';
import { COLORS } from '../constants';
import { QUESTION_LIBRARY } from '../proContent';
import { CloseIcon, QuestionIcon, CopyIcon, CheckCircleIcon } from './Icons';
import { soundService } from '../services/soundService';
import { useToast } from '../hooks/useToast';

interface QuestionLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuestionLibraryModal: React.FC<QuestionLibraryModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [copiedQuestion, setCopiedQuestion] = useState<string | null>(null);
  const { addToast } = useToast();

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
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    soundService.playClick();
    onClose();
  };
  
  const handleCopy = (questionText: string) => {
    soundService.playClick();
    navigator.clipboard.writeText(questionText).then(() => {
      addToast('Domanda copiata!', 'success');
      setCopiedQuestion(questionText);
      setTimeout(() => setCopiedQuestion(null), 2000); // Reset after 2 seconds
    }, (err) => {
      addToast('Errore durante la copia.', 'error');
      console.error('Could not copy text: ', err);
    });
  };

  const hoverStyle = `
    .question-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.08);
    }
    .copy-button:hover {
      background-color: ${COLORS.card};
    }
  `;

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <style>{hoverStyle}</style>
      <div 
        style={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="q-lib-title"
        tabIndex={-1}
      >
        <header style={styles.header}>
            <h2 id="q-lib-title" style={styles.title}><QuestionIcon/> Libreria Domande Strategiche PRO</h2>
            <button onClick={handleClose} style={styles.closeButton} aria-label="Chiudi modale">
              <CloseIcon />
            </button>
        </header>
        <div style={styles.content}>
          {QUESTION_LIBRARY.map(category => (
            <div key={category.category} style={styles.category}>
              <h3 style={styles.categoryTitle}>{category.category}</h3>
              <p style={styles.categoryDescription}>{category.description}</p>
              <div style={styles.questionList}>
                {category.questions.map(q => (
                  <div key={q.question} style={styles.questionItem} className="question-card">
                    <div style={styles.questionContent}>
                        <p style={styles.questionText}>"{q.question}"</p>
                        <p style={styles.questionDescription}>{q.description}</p>
                    </div>
                    <button 
                        style={styles.copyButton} 
                        className="copy-button"
                        onClick={() => handleCopy(q.question)}
                        title="Copia domanda"
                    >
                      {copiedQuestion === q.question ? (
                        <CheckCircleIcon style={{color: COLORS.success}} />
                      ) : (
                        <CopyIcon />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
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
    width: '100%', maxWidth: '800px',
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
    margin: 0, display: 'flex', alignItems: 'center', gap: '12px'
  },
  closeButton: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '4px', color: COLORS.textSecondary
  },
  content: {
    overflowY: 'auto',
    padding: '24px',
  },
  category: {
    marginBottom: '28px',
  },
  categoryTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: COLORS.textPrimary,
    margin: '0 0 8px 0',
    borderLeft: `3px solid ${COLORS.secondary}`,
    paddingLeft: '12px',
  },
  categoryDescription: {
    fontSize: '14px',
    color: COLORS.textSecondary,
    margin: '0 0 16px 15px',
    lineHeight: 1.5,
  },
  questionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    paddingLeft: '15px',
  },
  questionItem: {
    backgroundColor: COLORS.cardDark,
    padding: '16px',
    borderRadius: '12px',
    borderLeft: `4px solid ${COLORS.secondary}`,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 4px 6px rgba(0,0,0,0.04)',
  },
  questionContent: {
    flex: 1,
  },
  questionText: {
    fontSize: '16px',
    fontWeight: 600,
    color: COLORS.textPrimary,
    margin: '0 0 8px 0',
    fontStyle: 'italic',
  },
  questionDescription: {
    fontSize: '14px',
    color: COLORS.textSecondary,
    margin: 0,
    lineHeight: 1.5,
  },
  copyButton: {
    flexShrink: 0,
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: `1px solid ${COLORS.divider}`,
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: COLORS.textSecondary,
    transition: 'background-color 0.2s ease, color 0.2s ease',
  }
};