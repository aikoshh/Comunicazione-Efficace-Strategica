import React from 'react';
import { Module, Exercise, DifficultyLevel } from '../types';
import { COLORS, SAGE_PALETTE } from '../constants';
import { HomeIcon } from './Icons';

interface ModuleScreenProps {
  module: Module;
  onSelectExercise: (exercise: Exercise) => void;
  onBack: () => void;
}

const difficultyColors: { [key in DifficultyLevel]: string } = {
  [DifficultyLevel.BASE]: '#4CAF50',
  [DifficultyLevel.INTERMEDIO]: '#FFC107',
  [DifficultyLevel.AVANZATO]: '#F44336',
};

const hoverStyle = `
  .exercise-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }
  .menu-button:hover {
    opacity: 0.9;
  }
`;

export const ModuleScreen: React.FC<ModuleScreenProps> = ({ module, onSelectExercise, onBack }) => {
  return (
    <div style={styles.container}>
       <style>{hoverStyle}</style>
      <header style={styles.header}>
        <button onClick={onBack} style={styles.backButton} className="menu-button">
          <HomeIcon /> Menu
        </button>
        <div style={styles.titleContainer}>
            <module.icon width={32} height={32} color={COLORS.secondary} />
            <h1 style={styles.title}>{module.title}</h1>
        </div>
        <p style={styles.description}>{module.description}</p>
      </header>
      <main style={styles.exerciseList}>
        {module.exercises.map((exercise, index) => {
          const cardStyle = {
            ...styles.exerciseCard,
            backgroundColor: SAGE_PALETTE[index % SAGE_PALETTE.length],
          };
          return (
            <div key={exercise.id} className="exercise-card" style={cardStyle} onClick={() => onSelectExercise(exercise)}>
              <div style={styles.exerciseHeader}>
                  <h2 style={styles.exerciseTitle}>{exercise.title}</h2>
                  <span style={{...styles.difficultyBadge, backgroundColor: difficultyColors[exercise.difficulty]}}>
                      {exercise.difficulty}
                  </span>
              </div>
              <p style={styles.exerciseScenarioPreview}>{exercise.scenario.substring(0, 100)}...</p>
            </div>
          )
        })}
      </main>
      <div style={styles.footer}>
        <button onClick={onBack} style={styles.footerButton} className="menu-button">
           <HomeIcon /> Torna al Menu Principale
        </button>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 20px 80px',
    backgroundColor: COLORS.base,
    minHeight: '100vh',
  },
  header: {
    marginBottom: '48px',
    textAlign: 'center',
    paddingTop: '60px', // Add padding to avoid overlap with the absolute positioned button
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: COLORS.secondary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    position: 'absolute',
    top: '20px',
    left: '20px',
    transition: 'all 0.2s ease',
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '12px',
  },
  title: {
    fontSize: '32px',
    color: COLORS.textPrimary,
    fontWeight: 'bold'
  },
  description: {
    fontSize: '18px',
    color: COLORS.textSecondary,
    lineHeight: 1.6
  },
  exerciseList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  exerciseCard: {
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    border: `1px solid transparent`,
    textAlign: 'left'
  },
  exerciseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '8px',
  },
  difficultyBadge: {
    color: 'white',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    flexShrink: 0
  },
  exerciseTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'white',
    margin: 0
  },
  exerciseScenarioPreview: {
    fontSize: '14px',
    color: 'white',
    lineHeight: 1.5,
    margin: 0,
  },
  footer: {
      marginTop: '40px',
      display: 'flex',
      justifyContent: 'center',
  },
  footerButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: COLORS.secondary,
      border: 'none',
      borderRadius: '8px',
      padding: '12px 24px',
      cursor: 'pointer',
      fontSize: '16px',
      color: 'white',
      fontWeight: '500',
      transition: 'all 0.2s ease',
  },
};