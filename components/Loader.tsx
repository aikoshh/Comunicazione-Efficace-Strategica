import React from 'react';
import { COLORS } from '../constants';

export const Loader = () => (
  <div style={styles.container}>
    <div style={styles.spinner}></div>
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
  spinner: {
    border: `4px solid ${COLORS.divider}`,
    borderTop: `4px solid ${COLORS.primary}`,
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
  },
  text: {
    marginTop: '24px',
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
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;
const styleSheet = document.getElementById('app-keyframes');
if (!styleSheet) {
    const newStyleSheet = document.createElement("style");
    newStyleSheet.id = 'app-keyframes';
    newStyleSheet.innerText = keyframes;
    document.head.appendChild(newStyleSheet);
}