import React from 'react';
import type { UserProgress } from '../types';
import { MODULES, COLORS } from '../constants';
import { BarChartIcon, TrendingUpIcon } from './Icons';

interface ProgressAnalyticsProps {
  userProgress: UserProgress;
}

const ProgressBar: React.FC<{ value: number; color: string; }> = ({ value, color }) => (
    <div style={styles.progressBarContainer}>
        <div style={{ ...styles.progressBarFill, width: `${value}%`, backgroundColor: color }} />
    </div>
);


export const ProgressAnalytics: React.FC<ProgressAnalyticsProps> = ({ userProgress }) => {
    const totalExercises = MODULES.filter(m => !m.isCustom).reduce((acc, module) => acc + module.exercises.length, 0);
    const completedCount = userProgress.completedExerciseIds?.length || 0;
    const completionPercentage = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0;

    const scores = userProgress.scores || [];
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    return (
        <section style={styles.container}>
            <h2 style={styles.sectionTitle}>Statistiche di Progresso</h2>
            <div style={styles.grid}>
                <div style={styles.card}>
                     <div style={styles.statItem}>
                        <div style={styles.statHeader}>
                            <BarChartIcon style={{color: COLORS.primary}} />
                            <h3 style={styles.cardTitle}>Esercizi Completati</h3>
                        </div>
                        <ProgressBar value={completionPercentage} color={COLORS.warning} />
                        <div style={styles.statFooter}>
                            <span>{completedCount} / {totalExercises}</span>
                            <span>{completionPercentage.toFixed(0)}%</span>
                        </div>
                     </div>
                </div>
                 <div style={styles.card}>
                     <div style={styles.statItem}>
                        <div style={styles.statHeader}>
                            <TrendingUpIcon style={{color: COLORS.primary}} />
                            <h3 style={styles.cardTitle}>Punteggio Medio</h3>
                        </div>
                        <ProgressBar value={averageScore} color={COLORS.warning} />
                        <div style={styles.statFooter}>
                            <span>Qualità media delle risposte</span>
                            <span>{averageScore.toFixed(0)} / 100</span>
                        </div>
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
    },
    card: {
        backgroundColor: COLORS.card,
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        border: `1px solid ${COLORS.divider}`,
    },
    statItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    statHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    cardTitle: {
        fontSize: '18px',
        fontWeight: 600,
        color: COLORS.textPrimary,
        margin: 0,
    },
    progressBarContainer: {
        width: '100%',
        height: '16px',
        backgroundColor: COLORS.divider,
        borderRadius: '8px',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: '8px',
        transition: 'width 0.5s ease-out',
        background: `linear-gradient(90deg, ${COLORS.warning} 0%, #FFD700 100%)`,
    },
    statFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '14px',
        color: COLORS.textSecondary,
        fontWeight: 500
    }
};