import React from 'react';
import { ScoreExplanation } from '../types';
import { COLORS } from '../constants';
import { CloseIcon } from './Icons';

interface ExplainScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  scoreData: ScoreExplanation | null;
}

const scoreComponentLabels: Record<keyof ScoreExplanation, string> = {
  Coverage: "Copertura Moduli",
  Quality: "Qualità Esercizi",
  Consistency: "Consistenza",
  Recency: "Recenza",
  VoiceDelta: "Delta Vocale",
};

export const ExplainScoreModal: React.FC<ExplainScoreModalProps> = ({ isOpen, onClose, scoreData }) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={styles.closeButton} aria-label="Chiudi modale">
          <CloseIcon />
        </button>
        <div style={styles.modalContent}>
            <h2 style={styles.title}>Come viene calcolato il tuo punteggio</h2>
            <p style={styles.description}>
              Il tuo punteggio di Allenamento Progressivo è una media ponderata di cinque fattori chiave,
              progettata per darti una visione olistica della tua performance.
            </p>
            <div style={styles.breakdownContainer}>
              {scoreData ? (
                Object.entries(scoreData).map(([key, value]) => (
                  <div key={key} style={styles.row}>
                    <span style={styles.label}>{scoreComponentLabels[key as keyof ScoreExplanation]}</span>
                    <span style={styles.value}>{value}/100</span>
                  </div>
                ))
              ) : (
                <p>Caricamento dei dati...</p>
              )}
            </div>
            <p style={styles.formula}>
                <strong>Formula:</strong> 0.3*Coverage + 0.4*Quality + 0.1*Consistency + 0.1*Recency + 0.1*VoiceDelta
            </p>
        </div>
        <div style={styles.footer}>
            <button onClick={onClose} style={styles.footerButton}>Chiudi</button>
        </div>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: COLORS.card,
    borderRadius: '12px',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    position: 'relative',
    animation: 'fadeIn 0.3s ease-out',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '90vh',
    border: `1px solid ${COLORS.divider}`,
  },
  modalContent: {
      overflowY: 'auto',
      padding: '32px 32px 24px 32px',
  },
  closeButton: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    color: COLORS.textSecondary,
    zIndex: 1,
  },
  title: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: '12px',
  },
  description: {
      fontSize: '15px',
      color: COLORS.textSecondary,
      textAlign: 'center',
      lineHeight: 1.6,
      marginBottom: '24px',
  },
  breakdownContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      marginBottom: '24px',
  },
  row: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: COLORS.cardDark,
      padding: '12px 16px',
      borderRadius: '8px'
  },
  label: {
      fontSize: '16px',
      fontWeight: 500,
      color: COLORS.textPrimary,
  },
  value: {
      fontSize: '16px',
      fontWeight: 'bold',
      color: COLORS.secondary,
  },
  formula: {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: COLORS.textSecondary,
      backgroundColor: COLORS.cardDark,
      padding: '8px 12px',
      borderRadius: '6px',
      textAlign: 'center',
      marginTop: '16px'
  },
  footer: {
    padding: '16px 32px',
    borderTop: `1px solid ${COLORS.divider}`,
    textAlign: 'right',
    flexShrink: 0,
  },
  footerButton: {
    padding: '10px 20px',
    fontSize: '16px',
    fontWeight: '500',
    border: `1px solid ${COLORS.secondary}`,
    backgroundColor: COLORS.secondary,
    color: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
  }
};