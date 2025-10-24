import React, { useState, useEffect } from 'react';
import { ToastMessage } from '../types';
import { COLORS } from '../constants';
import { CheckCircleIcon, WarningIcon, InfoIcon, CloseIcon } from './Icons';

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

// FIX: Added 'badge' property to satisfy the Record<ToastType, ...> type.
const ICONS: Record<ToastMessage['type'], React.FC<any>> = {
  success: CheckCircleIcon,
  error: WarningIcon,
  info: InfoIcon,
  badge: CheckCircleIcon, // Using CheckCircleIcon as a default for badge
};

// FIX: Added 'badge' property to satisfy the Record<ToastType, ...> type.
const COLORS_MAP: Record<ToastMessage['type'], string> = {
    success: COLORS.success,
    error: COLORS.error,
    info: COLORS.primary,
    badge: COLORS.warning,
};

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      // Let animation finish before unmounting
      setTimeout(() => onDismiss(toast.id), 300);
    }, 5000); // 5 seconds duration

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  // FIX: Added custom rendering for 'badge' type toasts to display badge info.
  if (toast.type === 'badge' && toast.badge) {
    const BadgeIcon = toast.badge.icon;
    const color = COLORS_MAP[toast.type];
    const toastStyle: React.CSSProperties = {
      ...styles.toast,
      backgroundColor: COLORS.card,
      borderLeft: `5px solid ${color}`,
      animation: isExiting ? 'toast-exit 0.3s ease-out forwards' : 'toast-enter 0.3s ease-out forwards',
    };

    return (
      <div style={toastStyle}>
        <BadgeIcon style={{...styles.icon, color}} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <p style={{...styles.message, fontWeight: 'bold', margin: 0, color: COLORS_MAP.badge }}>{toast.badge.title}</p>
          <p style={{...styles.message, margin: 0}}>{toast.message}</p>
        </div>
        <button onClick={handleDismiss} style={styles.closeButton}>
          <CloseIcon width={18} height={18}/>
        </button>
      </div>
    );
  }

  const Icon = ICONS[toast.type];
  const color = COLORS_MAP[toast.type];
  
  const toastStyle: React.CSSProperties = {
    ...styles.toast,
    backgroundColor: COLORS.card,
    borderLeft: `5px solid ${color}`,
    animation: isExiting ? 'toast-exit 0.3s ease-out forwards' : 'toast-enter 0.3s ease-out forwards',
  };

  return (
    <div style={toastStyle}>
      <Icon style={{...styles.icon, color}} />
      <p style={styles.message}>{toast.message}</p>
      <button onClick={handleDismiss} style={styles.closeButton}>
        <CloseIcon width={18} height={18}/>
      </button>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  toast: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    marginBottom: '16px',
    width: '350px',
    maxWidth: '90vw',
  },
  icon: {
      width: '24px',
      height: '24px',
      marginRight: '16px',
      flexShrink: 0,
  },
  message: {
      flex: 1,
      margin: 0,
      fontSize: '15px',
      color: COLORS.textPrimary,
      lineHeight: 1.5,
  },
  closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: COLORS.textSecondary,
      marginLeft: '16px',
      padding: '4px',
  }
};