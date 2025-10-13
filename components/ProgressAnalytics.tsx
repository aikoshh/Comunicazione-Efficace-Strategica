import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import type { UserProgress, CompetenceKey } from '../types';
import { COLORS } from '../constants';
import { TargetIcon } from './Icons';
import { ProgressPieManager } from '../services/progressPieManager';

interface ProgressAnalyticsProps {
  userProgress: UserProgress;
}

const COMPETENCE_LABELS: Record<CompetenceKey, string> = {
  ascolto: 'Ascolto Strategico',
  riformulazione: 'Riformulazione & Feedback',
  assertivita: 'Assertività',
  gestione_conflitto: 'Gestione del Conflitto',
};

const BASE_PIE_COLORS: Record<CompetenceKey, { h: number; s: number; l_start: number; l_end: number; }> = {
  ascolto:            { h: 180, s: 31, l_start: 80, l_end: 50 }, // secondary
  riformulazione:     { h: 207, s: 71, l_start: 70, l_end: 21 }, // primary
  assertivita:        { h: 45,  s: 100, l_start: 85, l_end: 51 }, // warning
  gestione_conflitto: { h: 354, s: 70, l_start: 85, l_end: 54 }, // error
};

// Generates a color from light to saturated based on progress
const getProgressiveColor = (key: CompetenceKey, value: number): string => {
    const max = 33;
    const progress = Math.min(value / max, 1);
    const colorParams = BASE_PIE_COLORS[key];
    const lightness = colorParams.l_start - ( (colorParams.l_start - colorParams.l_end) * progress );
    return `hsl(${colorParams.h}, ${colorParams.s}%, ${lightness}%)`;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
         <div style={styles.tooltip}>
            <p style={styles.tooltipLabel}>{`${payload[0].name}: ${payload[0].value.toFixed(1)}%`}</p>
        </div>
    )
  }
  return null;
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent * 100 < 5) return null; // Don't render tiny labels
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontWeight="bold" fontSize="14px">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export const ProgressAnalytics: React.FC<ProgressAnalyticsProps> = ({ userProgress }) => {
    const competenceScores = userProgress.competenceScores || { ascolto: 0, riformulazione: 0, assertivita: 0, gestione_conflitto: 0 };
    
    // Calculate overall progress based on the raw (capped at 33) competence scores.
    // FIX: Add explicit types for accumulator and value in reduce to fix type inference issue.
    const sumOfCompetencies = Object.values(competenceScores).reduce((sum: number, score: number) => sum + score, 0);
    const overallProgress = sumOfCompetencies / 4;

    // Use the manager to get the normalized data for the pie chart
    const pieManager = new ProgressPieManager(competenceScores);
    const slices = pieManager.getData();

    const competenceData = [
      { key: 'ascolto', name: COMPETENCE_LABELS.ascolto, value: slices.ascolto },
      { key: 'riformulazione', name: COMPETENCE_LABELS.riformulazione, value: slices.riformulazione },
      { key: 'assertivita', name: COMPETENCE_LABELS.assertivita, value: slices.assertivita },
      { key: 'gestione_conflitto', name: COMPETENCE_LABELS.gestione_conflitto, value: slices.gestione_conflitto },
      { key: 'nessuna', name: 'Nessuna Competenza', value: slices.nessuna },
    ].filter(item => item.value > 0.01); // Filter out tiny slices to prevent render issues

    const renderLegendText = (value: string) => {
        const isNoCompetence = value === 'Nessuna Competenza';
        // Use a darker color for competence labels for better readability.
        const textColor = isNoCompetence ? COLORS.textSecondary : COLORS.primary;
        return <span style={{ color: textColor, fontWeight: 500 }}>{value}</span>;
    };

    return (
        <section style={styles.container}>
            <h2 style={styles.sectionTitle}>Statistiche di Progresso</h2>
            <div style={styles.grid}>
                <div style={styles.card}>
                     <h3 style={styles.cardTitle}><TargetIcon/> Grafico delle competenze acquisite</h3>
                     <>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={competenceData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                    outerRadius={110}
                                    innerRadius={60}
                                    fill="#8884d8"
                                    dataKey="value"
                                    paddingAngle={5}
                                >
                                    {competenceData.map((entry, index) => (
                                        <Cell 
                                          key={`cell-${index}`} 
                                          fill={entry.key !== 'nessuna' ? getProgressiveColor(entry.key as CompetenceKey, entry.value) : COLORS.divider} 
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend 
                                    iconSize={12} 
                                    wrapperStyle={{fontSize: '14px', marginTop: '15px'}}
                                    formatter={renderLegendText}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={styles.overallProgressContainer}>
                            <span style={styles.overallProgressLabel}>Progresso Complessivo</span>
                            <div style={styles.overallProgressBar}>
                                <div style={{...styles.overallProgressBarFill, width: `${overallProgress}%`}}/>
                            </div>
                            <span style={styles.overallProgressValue}>{overallProgress.toFixed(1)}%</span>
                        </div>
                        </>
                </div>
            </div>
        </section>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        marginBottom: '48px',
        animation: 'fadeInUp 0.5s 0.2s ease-out both'
    },
    sectionTitle: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: '24px',
        borderBottom: `3px solid ${COLORS.secondary}`,
        paddingBottom: '8px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '24px',
    },
    card: {
        backgroundColor: COLORS.card,
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        border: `1px solid ${COLORS.divider}`,
    },
    cardTitle: {
        fontSize: '18px',
        fontWeight: 600,
        color: COLORS.textPrimary,
        margin: '0 0 24px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    tooltip: {
        backgroundColor: 'rgba(28, 28, 30, 0.9)',
        color: 'white',
        border: 'none',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    },
    tooltipLabel: {
        margin: 0,
        fontWeight: 'bold',
        fontSize: '14px',
    },
    overallProgressContainer: {
        marginTop: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    overallProgressLabel: {
        fontSize: '14px',
        fontWeight: 500,
        color: COLORS.textSecondary,
    },
    overallProgressBar: {
        flex: 1,
        height: '10px',
        backgroundColor: COLORS.divider,
        borderRadius: '5px',
        overflow: 'hidden',
    },
    overallProgressBarFill: {
        height: '100%',
        backgroundColor: COLORS.secondary,
        borderRadius: '5px',
        transition: 'width 0.5s ease-out',
    },
    overallProgressValue: {
        fontSize: '14px',
        fontWeight: 'bold',
        color: COLORS.primary,
    },
};
