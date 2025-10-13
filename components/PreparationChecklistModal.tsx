import React, { useState, useEffect } from 'react';
import { COLORS } from '../constants';
import { CloseIcon, TargetIcon } from './Icons';
import { soundService } from '../services/soundService';
import { useLocalization } from '../context/LocalizationContext';
import { getContent } from '../locales/content';

interface PreparationChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PreparationChecklistModal: React.FC<PreparationChecklistModalProps> = ({ isOpen, onClose }) => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const { lang } = useLocalization();
  const { PREPARATION_CHECKLIST } = getContent(lang);
  const totalItems = PREPARATION_CHECKLIST.length;
  const progress = (checkedItems.size / totalItems) * 100;

  // Reset state when modal is opened
  useEffect(() => {
    if (isOpen) {
      setCheckedItems(new Set());
    }
  }, [isOpen]);

  const handleToggleCheck = (id: string) => {
    soundService.playHover();
    const newCheckedItems = new Set(checkedItems);
    if (newCheckedItems.has(id)) {
      newCheckedItems.delete(id);
    } else {
      newCheckedItems.add(id);
    }
    setCheckedItems(newCheckedItems);
  };

  const handleClose = () => {
    soundService.playClick();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header style={styles.header}>
            <h2 style={styles.title}><TargetIcon/> Checklist di Preparazione PRO</h2>
            <button onClick={handleClose} style={styles.closeButton} aria-label="Chiudi modale">
              <CloseIcon />
            </button>
        </header>
        <div style={styles.progressContainer}>
            <div style={styles.progressBar}>
                <div style={{ ...styles.progressBarFill, width: `${progress}%` }} />
            </div>
            <span style={styles.progressText}>{checkedItems.size} / {totalItems} completati</span>
        </div>
        <div style={styles.content}>
          <p style={styles.description}>
            Usa questa checklist prima di una conversazione importante per assicurarti di essere preparato strategicamente.
          </p>
          <div style={styles.checklist}>
            {PREPARATION_CHECKLIST.map(item => (
              <div key={item.id} style={styles.checklistItem} onClick={() => handleToggleCheck(item.id)}>
                <div style={{...styles.checkbox, ...(checkedItems.has(item.id) ? styles.checkboxChecked : {})}}>
                  {checkedItems.has(item.id) && '✔'}
                </div>
                <span style={{...styles.checklistItemText, ...(checkedItems.has(item.id) ? styles.checklistItemTextChecked : {})}}>
                  {item.text}
                </span>
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
  progressContainer: {
      padding: '16px 24px',
      borderBottom: `1px solid ${COLORS.divider}`,
  },
  progressBar: {
      height: '8px',
      backgroundColor: COLORS.divider,
      borderRadius: '4px',
      overflow: 'hidden',
  },
  progressBarFill: {
      height: '100%',
      backgroundColor: COLORS.success,
      borderRadius: '4px',
      transition: 'width 0.3s ease-in-out',
  },
  progressText: {
      fontSize: '12px',
      color: COLORS.textSecondary,
      textAlign: 'right',
      marginTop: '6px',
      fontWeight: 500
  },
  content: {
    overflowY: 'auto',
    padding: '24px',
  },
  description: {
    fontSize: '15px', color: COLORS.textSecondary,
    margin: '0 0 24px 0', lineHeight: 1.5,
    textAlign: 'center'
  },
  checklist: {
    display: 'flex', flexDirection: 'column', gap: '12px',
  },
  checklistItem: {
    display: 'flex', alignItems: 'center', gap: '16px',
    backgroundColor: COLORS.cardDark,
    padding: '16px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  },
  checkbox: {
    width: '24px', height: '24px',
    borderRadius: '6px',
    border: `2px solid ${COLORS.secondary}`,
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
    transition: 'all 0.2s ease',
    fontSize: '16px', fontWeight: 'bold'
  },
  checkboxChecked: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
    color: 'white',
  },
  checklistItemText: {
    fontSize: '16px', color: COLORS.textPrimary,
    transition: 'all 0.2s ease'
  },
  checklistItemTextChecked: {
    textDecoration: 'line-through',
    color: COLORS.textSecondary,
  }
};