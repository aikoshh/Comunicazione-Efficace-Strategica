// components/AchievementsScreen.tsx
import React from 'react';
import type { UserProgress, Achievement } from '../types';
import { COLORS } from '../constants';
import { ACHIEVEMENTS } from '../services/gamificationService';

interface AchievementsScreenProps {
  progress: UserProgress;
  onBack: () => void;
}

export const AchievementsScreen: React.FC<AchievementsScreenProps> = ({ progress, onBack }) => {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>I Tuoi Traguardi</h1>
      <div style={styles.grid}>
        {ACHIEVEMENTS.map(achievement => {
          const isUnlocked = achievement.isUnlocked(progress);
          return (
            <div key={achievement.id} style={{...styles.card, ...(isUnlocked ? styles.cardUnlocked : styles.cardLocked)}}>
              <achievement.icon style={{...styles.icon, color: isUnlocked ? COLORS.success : COLORS.textSecondary}} />
              <h3 style={styles.cardTitle}>{achievement.title}</h3>
              <p style={styles.cardDescription}>{achievement.description}</p>
            </div>
          );
        })}
      </div>
      <button onClick={onBack} style={styles.backButton}>Torna alla Home</button>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        maxWidth: '900px',
        margin: '0 auto',
        padding: '40px 20px',
    },
    title: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: COLORS.primary,
        textAlign: 'center',
        marginBottom: '40px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '24px',
    },
    card: {
        backgroundColor: COLORS.card,
        padding: '24px',
        borderRadius: '12px',
        textAlign: 'center',
        transition: 'transform 0.2s, box-shadow 0.2s',
    },
    cardLocked: {
        filter: 'grayscale(80%)',
        opacity: 0.7,
    },
    cardUnlocked: {
        border: `2px solid ${COLORS.success}`,
        boxShadow: `0 0 15px ${COLORS.success}30`,
    },
    icon: {
        width: '48px',
        height: '48px',
        marginBottom: '16px',
    },
    cardTitle: {
        fontSize: '18px',
        fontWeight: 'bold',
        margin: '0 0 8px 0',
    },
    cardDescription: {
        fontSize: '14px',
        color: COLORS.textSecondary,
        lineHeight: 1.5,
        margin: 0,
    },
    backButton: {
        display: 'block',
        margin: '40px auto 0',
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: 'bold',
        color: 'white',
        background: COLORS.primary,
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
    }
};
