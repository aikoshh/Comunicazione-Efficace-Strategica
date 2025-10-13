import React from 'react';
import type { UserProgress, CompetenceKey } from '../types';
import { COLORS } from '../constants';
import { TargetIcon } from './Icons';

interface ProgressAnalyticsProps {
  userProgress: UserProgress;
}

const COMPETENCE_LABELS: Record<CompetenceKey, string> = {
  ascolto: 'Ascolto Strategico',
  riformulazione: 'Riformulazione & Feedback',
  assertivita: 'Assertività',
  gestione_conflitto: 'Gestione del Conflitto',
};

const competenceColors: Record<CompetenceKey, string> = {
    ascolto: COLORS.secondary,
    riformulazione: COLORS.primary,
    assertivita: COLORS.warning,
    gestione_conflitto: COLORS.error,
};

export const ProgressAnalytics: React.FC<ProgressAnalyticsProps> = ({ userProgress }) => {
    const competenceScores = userProgress.competenceScores || { ascolto: 0, riformulazione: 0, assertivita: 0, gestione_conflitto: 0 };
    
    const competenceData = (Object.keys(competenceScores) as CompetenceKey[]).map(key => ({
        key,
        name: COMPETENCE_LABELS[key],
        value: competenceScores[key],
        color: competenceColors[key],
    }));

    const sumOfCompetencies = competenceData.reduce((sum, comp) => sum + comp.value, 0);
    // The overall progress is the percentage of the total possible score (33 * 4 = 132).
    const overallProgress = (sumOfCompetencies / (33 * 4)) * 100;

    return (
        <section style={styles.container}>
            <h2 style={styles.sectionTitle}>Statistiche di Progresso</h2>
            <div style={styles.grid}>
                <div style={styles.card}>
                     <h3 style={styles.cardTitle}><TargetIcon/> Livello Competenze</h3>
                     
                     <div style={styles.competenceList}>
                        {competenceData.map(comp => (
                            <div key={comp.key} style={styles.competenceRow} title={`${comp.name}: ${comp.value.toFixed(1)} su 33`}>
                                <span style={styles.competenceLabel}>{comp.name}</span>
                                <div style={styles.progressBarContainer}>
                                    <div style={{ ...styles.progressBarFill, width: `${(comp.value / 33) * 100}%`, backgroundColor: comp.color }} />
                                </div>
                                <span style={styles.competenceValue}>{comp.value.toFixed(1)}</span>
                            </div>
                        ))}
                     </div>
                     
                     <div style={styles.overallProgressContainer}>
                        <span style={styles.overallProgressLabel}>Progresso Complessivo</span>
                        <div style={styles.overallProgressBar}>
                            <div style={{...styles.overallProgressBarFill, width: `${overallProgress}%`}}/>
                        </div>
                        <span style={styles.overallProgressValue}>{overallProgress.toFixed(1)}%</span>
                    </div>
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
    competenceList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        marginBottom: '24px',
    },
    competenceRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    competenceLabel: {
        flex: '0 0 180px',
        fontSize: '15px',
        color: COLORS.textSecondary,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    progressBarContainer: {
        flex: 1,
        height: '12px',
        backgroundColor: COLORS.divider,
        borderRadius: '6px',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: '6px',
        transition: 'width 0.5s ease-out',
    },
    competenceValue: {
        fontSize: '15px',
        fontWeight: 'bold',
        color: COLORS.primary,
        minWidth: '40px',
        textAlign: 'right',
    },
    overallProgressContainer: {
        marginTop: '24px',
        paddingTop: '24px',
        borderTop: `1px solid ${COLORS.divider}`,
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
