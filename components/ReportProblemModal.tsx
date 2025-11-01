// components/ReportProblemModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { COLORS } from '../constants';
import { CloseIcon, SendIcon } from './Icons';
import { soundService } from '../services/soundService';
import { addProblemReport } from '../services/firebase';
import { useToast } from '../hooks/useToast';
import { UserProfile } from '../types';
import { Spinner } from './Loader';

interface ReportProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
}

export const ReportProblemModal: React.FC<ReportProblemModalProps> = ({ isOpen, onClose, user }) => {
  const [reportText, setReportText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
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
        // Reset text when modal is closed
        setReportText('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isSending) return;
    soundService.playClick();
    onClose();
  };
  
  const handleSend = async () => {
      if (!reportText.trim() || !user) {
          return;
      }
      soundService.playClick();
      setIsSending(true);
      try {
          await addProblemReport(user.uid, user.email, `${user.firstName} ${user.lastName}`, reportText);
          addToast("Segnalazione inviata con successo! Grazie.", 'success');
          onClose();
      } catch (error) {
          console.error("Failed to send report:", error);
          addToast("Errore durante l'invio della segnalazione. Riprova.", 'error');
      } finally {
          setIsSending(false);
      }
  };

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div 
        style={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-problem-title"
        tabIndex={-1}
      >
        <header style={styles.header}>
            <h2 id="report-problem-title" style={styles.title}>Segnala un Problema</h2>
            <button onClick={handleClose} style={styles.closeButton} aria-label="Chiudi modale" disabled={isSending}>
              <CloseIcon />
            </button>
        </header>
        <div style={styles.content}>
          <p style={styles.description}>
            Descrivi il problema che hai riscontrato. La tua segnalazione verrà inviata al nostro team di supporto e ci aiuterà a migliorare l'applicazione.
          </p>
          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            style={styles.textarea}
            placeholder="Scrivi qui la tua segnalazione..."
            rows={8}
            disabled={isSending}
          />
        </div>
        <footer style={styles.footer}>
            <button 
                onClick={handleSend} 
                style={{...styles.sendButton, ...(!reportText.trim() || isSending ? styles.buttonDisabled : {})}}
                disabled={!reportText.trim() || isSending}
            >
                {isSending ? <Spinner size={20} color="white" /> : <SendIcon/>}
                {isSending ? 'Invio in corso...' : 'Invia la segnalazione'}
            </button>
        </footer>
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
  description: {
    fontSize: '15px', color: COLORS.textSecondary,
    margin: '0 0 16px 0', lineHeight: 1.6,
  },
  textarea: {
    width: '100%', padding: '12px 16px', fontSize: '16px', borderRadius: '8px',
    border: `1px solid ${COLORS.divider}`, resize: 'vertical', fontFamily: 'inherit',
    backgroundColor: 'white', boxSizing: 'border-box'
  },
  footer: {
      padding: '20px 24px',
      borderTop: `1px solid ${COLORS.divider}`,
      textAlign: 'right',
      flexShrink: 0,
      backgroundColor: COLORS.cardDark
  },
  sendButton: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    border: 'none',
    backgroundColor: COLORS.secondary,
    color: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minHeight: '49px'
  },
  buttonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
  }
};