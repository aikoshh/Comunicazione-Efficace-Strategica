// components/RealTimeVoiceAnalysis.tsx
import React from 'react';
import { RealTimeMetrics } from '../types';
import { COLORS } from '../constants';

interface RealTimeVoiceAnalysisProps {
  metrics: RealTimeMetrics;
}

const MetricDisplay: React.FC<{ label: string; value: string | number; color?: string; unit?: string }> = ({ label, value, color, unit }) => (
    <div style={styles.metric}>
        <span style={styles.metricLabel}>{label}</span>
        <span style={{...styles.metricValue, color: color || COLORS.textPrimary}}>{value}{unit && <span style={styles.metricUnit}> {unit}</span>}</span>
    </div>
);

const Gauge: React.FC<{ label: string; value: number; color: string; }> = ({ label, value, color }) => {
    const safeValue = Math.max(0, Math.min(100, value));
    return (
        <div style={styles.gaugeContainer}>
            <div style={styles.gauge}>
                <div style={{...styles.gaugeFill, width: `${safeValue}%`, backgroundColor: color}} />
            </div>
            <span style={styles.gaugeLabel}>{label}</span>
        </div>
    )
};


export const RealTimeVoiceAnalysis: React.FC<RealTimeVoiceAnalysisProps> = ({ metrics }) => {
  return (
    <div style={styles.container}>
        <div style={styles.grid}>
            <Gauge label="Volume" value={metrics.volume} color={COLORS.success} />
            <Gauge label="Variazione Tono" value={metrics.pitchVariation} color={COLORS.secondary} />
            <Gauge label="Gamma Dinamica" value={metrics.dynamicRange} color={COLORS.primary} />
            
            <MetricDisplay label="Ritmo" value={metrics.wpm} unit="parole/min" />
            <MetricDisplay label="Pause" value={metrics.pauseCount} />
            <MetricDisplay label="Parole Riempitive" value={metrics.fillerCount} color={metrics.fillerCount > 3 ? COLORS.error : COLORS.textPrimary} />
        </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: COLORS.cardDark,
    borderRadius: '12px',
    padding: '16px',
    border: `1px solid ${COLORS.divider}`,
    animation: 'fadeIn 0.3s ease-out'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
  },
  metric: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: COLORS.card,
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: '13px',
    color: COLORS.textSecondary,
    marginBottom: '4px',
    fontWeight: 500
  },
  metricValue: {
    fontSize: '22px',
    fontWeight: 'bold',
  },
  metricUnit: {
    fontSize: '14px',
    fontWeight: 'normal',
    color: COLORS.textSecondary
  },
  gaugeContainer: {
    gridColumn: '1 / -1', // Make gauges span full width on small screens
  },
  gauge: {
    height: '10px',
    width: '100%',
    backgroundColor: COLORS.divider,
    borderRadius: '5px',
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: '5px',
    transition: 'width 0.2s linear',
  },
  gaugeLabel: {
      fontSize: '13px',
      color: COLORS.textSecondary,
      marginTop: '6px',
      fontWeight: 500,
      textAlign: 'center',
      display: 'block'
  },
};
