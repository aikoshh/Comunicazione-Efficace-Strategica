import React, { useEffect, useRef } from 'react';
import { COLORS } from '../constants';
import { CloseIcon } from './Icons';
import { soundService } from '../services/soundService';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string | null;
  onPrint: () => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ isOpen, onClose, htmlContent, onPrint }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !htmlContent) return null;

  const handlePrintClick = () => {
    soundService.playClick();
    onPrint();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div 
        style={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="print-preview-title"
        tabIndex={-1}
      >
        <header style={styles.header}>
          <h2 id="print-preview-title" style={styles.title}>Anteprima di Stampa</h2>
          <button onClick={onClose} style={styles.closeButton} aria-label="Chiudi Anteprima">
            <CloseIcon />
          </button>
        </header>
        <div style={styles.content}>
          <iframe
            srcDoc={htmlContent}
            style={styles.iframe}
            title="Anteprima Report"
          />
        </div>
        <footer style={styles.footer}>
          <button onClick={handlePrintClick} style={styles.printButton}>
            Stampa / Salva come PDF
          </button>
        </footer>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    backgroundColor: COLORS.card,
    borderRadius: '12px',
    width: '100%',
    maxWidth: '800px',
    height: '90vh',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    animation: 'popIn 0.3s ease-out',
    display: 'flex',
    flexDirection: 'column',
    outline: 'none',
  },
  header: {
    padding: '16px 24px',
    borderBottom: `1px solid ${COLORS.divider}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: COLORS.primary,
    margin: 0
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    color: COLORS.textSecondary
  },
  content: {
    flex: 1,
    overflow: 'hidden',
    padding: '8px',
    backgroundColor: COLORS.cardDark,
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    backgroundColor: 'white',
  },
  footer: {
    padding: '16px 24px',
    borderTop: `1px solid ${COLORS.divider}`,
    textAlign: 'right',
    flexShrink: 0,
    backgroundColor: COLORS.card,
  },
  printButton: {
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