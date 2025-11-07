// components/HistoryScreen.tsx
import React from 'react';
import { UserProgress, Exercise } from '../types';
import { COLORS, MODULES, DAILY_CHALLENGES } from '../constants';
import { HistoryIcon } from './Icons';
import { mainLogoUrl } from '../assets';
import { soundService } from '../services/soundService';

interface HistoryScreenProps {
  userProgress: UserProgress;
  onReviewExercise: (exerciseId: string) => void;
}

const findExerciseById = (id: string): Partial<Exercise> => {
    const allModuleExercises = MODULES.flatMap(m => m.exercises);
    const allExercises = [...allModuleExercises, ...DAILY_CHALLENGES];
    const exercise = allExercises.find(e => e.id === id);

    if (exercise) return exercise;
    if (id.startsWith('custom_')) return { title: 'Esercizio Personalizzato' };
    
    // Fallback if exercise is not in current constants (e.g., old daily challenge)
    return { title: `Esercizio #${id}` };
};

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ userProgress, onReviewExercise }) => {
  const historyItems = Object.entries(userProgress.analysisHistory || {})
    .map(([exerciseId, historyItem]) => ({
      exerciseId,
      ...historyItem,
      exercise: findExerciseById(exerciseId),
    }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
  const handleReviewClick = (id: string) => {
      soundService.playClick();
      onReviewExercise(id);
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <HistoryIcon style={styles.headerIcon} />
        <h1 style={styles.title}>Storico delle Tue Analisi</h1>
        <p style={styles.subtitle}>Rivedi i tuoi esercizi passati per consolidare l'apprendimento e monitorare i tuoi progressi.</p>
      </header>

      <main style={styles.main}>
        {historyItems.length === 0 ? (
          <div style={styles.emptyState}>
            <p>Non hai ancora completato nessun esercizio.</p>
            <p>Inizia un modulo per vedere qui la tua cronologia!</p>
          </div>
        ) : (
          <div style={styles.historyList}>
            {historyItems.map(item => (
              <div key={item.exerciseId} style={styles.historyItem}>
                <div style={styles.itemContent}>
                  <h2 style={styles.itemTitle}>{item.exercise.title}</h2>
                  <p style={styles.itemDate}>
                    Analisi del: {new Date(item.timestamp).toLocaleString('it-IT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div style={styles.itemActions}>
                    <div style={styles.scoreBadge}>
                        {item.score}
                    </div>
                    <button style={styles.reviewButton} onClick={() => handleReviewClick(item.exerciseId)}>
                        Rivedi Analisi
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <div style={styles.logoContainer}>
        <img src={mainLogoUrl} alt="CES Coach Logo" style={styles.footerLogo} />
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        maxWidth: '900px',
        margin: '0 auto',
        padding: '40px 20px',
        minHeight: 'calc(100vh - 64px)'
    },
    header: {
        textAlign: 'center',
        marginBottom: '40px'
    },
    headerIcon: {
        width: '48px',
        height: '48px',
        color: COLORS.primary,
        marginBottom: '16px'
    },
    title: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: COLORS.primary,
        margin: 0
    },
    subtitle: {
        fontSize: '18px',
        color: COLORS.textSecondary,
        marginTop: '8px'
    },
    main: {
        backgroundColor: COLORS.card,
        padding: '24px',
        borderRadius: '12px',
        border: `1px solid ${COLORS.divider}`
    },
    emptyState: {
        textAlign: 'center',
        padding: '40px',
        fontSize: '16px',
        color: COLORS.textSecondary
    },
    historyList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    historyItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        backgroundColor: COLORS.cardDark,
        borderRadius: '8px',
        borderLeft: `4px solid ${COLORS.secondary}`,
        flexWrap: 'wrap',
        gap: '16px'
    },
    itemContent: {
        flex: '1 1 300px'
    },
    itemTitle: {
        fontSize: '18px',
        fontWeight: 600,
        margin: '0 0 8px 0',
        color: COLORS.textPrimary
    },
    itemDate: {
        fontSize: '14px',
        color: COLORS.textSecondary,
        margin: 0
    },
    itemActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexShrink: 0
    },
    scoreBadge: {
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: COLORS.primary,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '18px',
        border: `2px solid ${COLORS.card}`
    },
    reviewButton: {
        padding: '10px 18px',
        fontSize: '15px',
        fontWeight: 500,
        border: 'none',
        backgroundColor: COLORS.secondary,
        color: 'white',
        borderRadius: '8px',
        cursor: 'pointer'
    },
    logoContainer: {
        textAlign: 'center',
        paddingTop: '40px'
    },
    footerLogo: {
        width: '150px',
        height: 'auto',
        opacity: 0.7
    }
};