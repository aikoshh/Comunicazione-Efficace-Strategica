// components/RealTimeVoiceAnalysis.tsx
import React from 'react';
import { RealTimeMetrics } from '../types';
import { COLORS } from '../constants';
import { MicIcon, SendIcon } from './Icons';
import { Spinner } from './Loader';

interface RealTimeVoiceAnalysisProps {
  isListening: boolean;
  onStart: () => void;
  onStopAndSubmit: () => void;
  metrics: RealTimeMetrics;
  transcript: React.ReactNode;
}

const MetricDisplay: React.FC<{ label: string; value: string | number; unit?: string }> = ({ label, value, unit }) => (
    <div style={styles.metricBox}>
        <div style={styles.metricValue}>{value}</div>
        <div style={styles.metricLabel}>{label} {unit && `(${unit})`}</div>
    </div>
);

const RealTimeVoiceAnalysis: React.FC<RealTimeVoiceAnalysisProps> = ({ 
  isListening, 
  onStart, 
  onStopAndSubmit, 
  metrics, 
  transcript,
}) => {

  const handleMainButtonClick = () => {
    if (isListening) {
      onStopAndSubmit();
    } else {
      onStart();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.metricsGrid}>
        <div style={styles.vuMeterBox}>
            <div style={styles.metricLabel}>Volume</div>
            <div style={styles.vuMeter}>
                <div style={{...styles.vuMeterFill, height: `${metrics.volume}%`}} />
            </div>
        </div>
        
        <MetricDisplay label="Ritmo" value={metrics.wpm} unit="parole/min" />
        <MetricDisplay label="Parole Riempitive" value={metrics.fillerCount} />
        <MetricDisplay label="Gamma Dinamica" value={metrics.dynamicRange.toFixed(0)} />
      </div>

      <div style={styles.transcriptContainer}>
        {transcript || (isListening ? 'In ascolto...' : 'Premi il microfono per iniziare a registrare...')}
      </div>

      <div style={styles.controls}>
        <button 
          onClick={handleMainButtonClick} 
          style={{...styles.micButton, ...(isListening ? styles.micButtonActive : {})}}
          aria-label={isListening ? 'Ferma e analizza' : 'Inizia registrazione'}
        >
          <MicIcon />
        </button>
        <p style={styles.micLabel}>
            {isListening ? 'Premi per fermare e analizzare' : 'Premi per registrare'}
        </p>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: COLORS.cardDark,
    borderRadius: '12px',
    padding: '24px',
    border: `1px solid ${COLORS.divider}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '16px',
    textAlign: 'center',
  },
  metricBox: {
    backgroundColor: COLORS.card,
    padding: '16px',
    borderRadius: '8px',
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  metricLabel: {
    fontSize: '12px',
    color: COLORS.textSecondary,
    marginTop: '4px',
  },
  vuMeterBox: {
    backgroundColor: COLORS.card,
    padding: '16px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  vuMeter: {
    width: '20px',
    height: '60px',
    backgroundColor: COLORS.divider,
    borderRadius: '4px',
    position: 'relative',
    overflow: 'hidden',
    marginTop: '8px',
    display: 'flex',
    alignItems: 'flex-end',
  },
  vuMeterFill: {
    width: '100%',
    backgroundColor: COLORS.secondary,
    transition: 'height 0.1s ease-out',
  },
  transcriptContainer: {
    minHeight: '100px',
    width: '100%',
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '8px',
    border: `1px solid ${COLORS.divider}`,
    fontSize: '16px',
    lineHeight: 1.6,
    color: COLORS.textPrimary,
    boxSizing: 'border-box'
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px'
  },
  micButton: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: COLORS.secondary,
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  },
  micButtonActive: {
    backgroundColor: COLORS.error,
    transform: 'scale(1.1)',
    boxShadow: `0 0 20px ${COLORS.error}80`,
  },
  micLabel: {
      fontSize: '14px',
      fontWeight: 500,
      color: COLORS.textSecondary,
      margin: 0
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 24px',
    fontSize: '18px',
    fontWeight: 'bold',
    border: 'none',
    backgroundColor: COLORS.secondary,
    color: 'white',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  }
};

export default RealTimeVoiceAnalysis;