import React from 'react';
import { COLORS } from '../constants';

export const Loader = () => (
  <div style={styles.container}>
    <div style={styles.spinner}></div>
    <p style={styles.text}>Analisi in corso...</p>
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
    backgroundColor: COLORS.fondo,
  },
  spinner: {
    border: `4px solid #f3f3f3`,
    borderTop: `4px solid ${COLORS.accentoVerde}`,
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
  },
  text: {
    marginTop: '16px',
    color: COLORS.nero,
    fontSize: '18px',
  },
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
