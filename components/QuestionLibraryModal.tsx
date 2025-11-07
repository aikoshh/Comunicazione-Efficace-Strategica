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
// components/QuestionLibraryModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import { COLORS } from '../constants';
import { QUESTION_LIBRARY } from '../proContent';
import { CloseIcon, QuestionIcon, CheckCircleIcon, CopyIcon } from './Icons';
import { soundService } from '../services/soundService';
import { useToast } from '../hooks/useToast';

interface QuestionLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuestionLibraryModal: React.FC<QuestionLibraryModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showCorrectAnimation, setShowCorrectAnimation] = useState(false);
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
    } else {
        // Reset answers when modal is closed
        setSelectedAnswers({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    soundService.playClick();
    onClose();
  };
  
  const handleAnswerSelect = (categoryIndex: number, questionIndex: number, selectedOptionIndex: number) => {
    const questionKey = `${categoryIndex}-${questionIndex}`;
    if (selectedAnswers[questionKey] !== undefined) return; // Already answered

    const question = QUESTION_LIBRARY[categoryIndex].questions[questionIndex];
    const isCorrect = selectedOptionIndex === question.correctAnswerIndex;

    if (isCorrect) {
        soundService.playSuccess();
        setShowCorrectAnimation(true);
        setTimeout(() => setShowCorrectAnimation(false), 1500); // Animation duration
    } else {
        soundService.playScoreSound(20); // Fail sound
    }

    setSelectedAnswers(prev => ({
        ...prev,
        [questionKey]: selectedOptionIndex
    }));
  };

  const handleCopyAnswer = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('Risposta copiata!', 'success');
  };

  const animationKeyframes = `
    @keyframes correct-pop-in {
      from { transform: scale(0.5); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    @keyframes correct-fade-out {
      0% { opacity: 1; background-color: rgba(255, 255, 255, 0.8); }
      70% { opacity: 1; background-color: rgba(255, 255, 255, 0.8); }
      100% { opacity: 0; pointer-events: none; }
    }
  `;

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <style>{animationKeyframes}</style>
      <div 
        style={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="q-lib-title"
        tabIndex={-1}
      >
        {showCorrectAnimation && (
            <div style={styles.correctAnimationOverlay}>
                <CheckCircleIcon style={styles.correctAnimationIcon} />
            </div>
        )}
        <header style={styles.header}>
            <h2 id="q-lib-title" style={styles.title}><QuestionIcon/> Libreria Domande Strategiche PRO</h2>
            <button onClick={handleClose} style={styles.closeButton} aria-label="Chiudi modale">
              <CloseIcon />
            </button>
        </header>
        <div style={styles.content}>
          {QUESTION_LIBRARY.map((category, catIndex) => (
            <div key={category.category} style={styles.category}>
              <h3 style={styles.categoryTitle}>{category.category}</h3>
              <p style={styles.categoryDescription}>{category.description}</p>
              <div style={styles.questionList}>
                {category.questions.map((q, qIndex) => {
                  const questionKey = `${catIndex}-${qIndex}`;
                  const selectedOption = selectedAnswers[questionKey];
                  const isAnswered = selectedOption !== undefined;

                  return (
                    <div key={q.question} style={styles.questionItem}>
                      <p style={styles.questionText}>{q.question}</p>
                      <div style={styles.optionsContainer}>
                        {q.options.map((option, optionIndex) => {
                            const isCorrect = optionIndex === q.correctAnswerIndex;
                            const isSelected = optionIndex === selectedOption;
                            let buttonStyle = styles.optionButton;
                            
                            if (isAnswered) {
                                if (isCorrect) {
                                    buttonStyle = {...buttonStyle, ...styles.correctAnswer, cursor: 'pointer'};
                                } else if (isSelected) {
                                    buttonStyle = {...buttonStyle, ...styles.incorrectAnswer};
                                } else {
                                    buttonStyle = {...buttonStyle, ...styles.disabledAnswer};
                                }
                            }

                            return (
                                <button
                                    key={optionIndex}
                                    style={buttonStyle}
                                    onClick={() => {
                                        if (isAnswered && isCorrect) {
                                            handleCopyAnswer(option);
                                        } else if (!isAnswered) {
                                            handleAnswerSelect(catIndex, qIndex, optionIndex);
                                        }
                                    }}
                                    disabled={isAnswered && !isCorrect}
                                    title={isAnswered && isCorrect ? 'Copia questa risposta' : ''}
                                >
                                    <span style={{flex: 1}}>{option}</span>
                                    {isAnswered && isCorrect && <CopyIcon style={{ marginLeft: '12px', flexShrink: 0 }} />}
                                </button>
                            );
                        })}
                      </div>
                      {isAnswered && (
                        <div style={styles.explanationContainer}>
                            <p style={styles.explanationText}>{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
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
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
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
    position: 'relative',
  },
  correctAnimationOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: '16px',
    animation: 'correct-fade-out 1.5s ease-in-out forwards',
  },
  correctAnimationIcon: {
    width: '120px',
    height: '120px',
    color: COLORS.success,
    animation: 'correct-pop-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
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
    fontSize: '18px', fontWeight: 600, color: COLORS.textPrimary,
    margin: '0 0 8px 0', borderLeft: `3px solid ${COLORS.secondary}`,
    paddingLeft: '12px',
  },
  categoryDescription: {
    fontSize: '14px', color: COLORS.textSecondary,
    margin: '0 0 16px 15px', lineHeight: 1.5,
  },
  questionList: {
    display: 'flex', flexDirection: 'column',
    gap: '24px', paddingLeft: '15px',
  },
  questionItem: {
    backgroundColor: COLORS.cardDark, padding: '20px',
    borderRadius: '12px',
  },
  questionText: {
    fontSize: '16px', fontWeight: 500,
    color: COLORS.textPrimary, margin: '0 0 16px 0',
    lineHeight: 1.6,
  },
  optionsContainer: { display: 'flex', flexDirection: 'column', gap: '10px' },
  optionButton: {
    width: '100%', padding: '14px', fontSize: '15px',
    textAlign: 'left', border: `1px solid ${COLORS.divider}`,
    borderRadius: '8px', cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: 'white', color: COLORS.textPrimary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  correctAnswer: {
    backgroundColor: '#D9F7E6', color: COLORS.success,
    borderColor: COLORS.success, fontWeight: 'bold',
  },
  incorrectAnswer: {
    backgroundColor: '#FDE2E2', color: COLORS.error,
    borderColor: COLORS.error, fontWeight: 'bold',
  },
  disabledAnswer: {
    opacity: 0.7, cursor: 'default',
    backgroundColor: COLORS.cardDark,
  },
  explanationContainer: {
    marginTop: '16px', padding: '16px',
    backgroundColor: '#FFFBEA', borderRadius: '8px',
    border: `1px solid ${COLORS.warning}`,
    animation: 'fadeIn 0.3s ease-out'
  },
  explanationText: {
    fontSize: '14px', color: COLORS.textPrimary,
    lineHeight: 1.6, margin: 0,
  },
};
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
