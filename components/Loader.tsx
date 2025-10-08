import React from 'react';
import { COLORS } from '../constants';

export const Loader = () => (
  <div style={styles.container}>
    <div style={styles.dotsContainer}>
      <div style={{...styles.dot, animationDelay: '0s'}}></div>
      <div style={{...styles.dot, animationDelay: '0.2s'}}></div>
      <div style={{...styles.dot, animationDelay: '0.4s'}}></div>
    </div>
    <p style={styles.text}>Analisi in corso...</p>
    <p style={styles.subtext}>L'AI sta elaborando la tua risposta.</p>
  </div>
);

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    textAlign: 'center',
    backgroundColor: COLORS.base,
  },
  dotsContainer: {
    display: 'flex',
    gap: '12px',
  },
  dot: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: COLORS.primary,
    animation: 'pulse-dot 1.4s infinite ease-in-out both',
  },
  text: {
    marginTop: '32px',
    color: COLORS.textPrimary,
    fontSize: '18px',
    fontWeight: 500,
  },
  subtext: {
    color: COLORS.textSecondary,
    fontSize: '14px',
  }
};

const keyframes = `
@keyframes pulse-dot {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.0);
    opacity: 1;
  }
}
`;
const styleSheet = document.getElementById('app-keyframes-loader');
if (!styleSheet) {
    const newStyleSheet = document.createElement("style");
    newStyleSheet.id = 'app-keyframes-loader';
    newStyleSheet.innerText = keyframes;
    document.head.appendChild(newStyleSheet);
}