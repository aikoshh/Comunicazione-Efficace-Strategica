import React from 'react';
import { Module, Exercise, DifficultyLevel } from '../types';
import { COLORS } from '../constants';
import { HomeIcon } from './Icons';

interface ModuleScreenProps {
  module: Module;
  onSelectExercise: (exercise: Exercise) => void;
  onBack: () => void;
}

const difficultyColors: { [key in DifficultyLevel]: string } = {
  [DifficultyLevel.BASE]: '#31C48D',
  [DifficultyLevel.INTERMEDIO]: '#F4A731',
  [DifficultyLevel.AVANZATO]: '#E5484D',
};

export const ModuleScreen: React.FC<ModuleScreenProps> = ({ module, onSelectExercise, onBack }) => {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          Torna al Menu
          <HomeIcon />
        </button>
        <div style={styles.titleContainer}>
            <module.icon width={40} height={40} color={COLORS.nero} />
            <h1 style={styles.title}>{module.title}</h1>
        </div>
        <p style={styles.description}>{module.description}</p>
      </header>
      <main style={styles.exerciseList}>
        {module.exercises.map((exercise, index) => (
          <div key={exercise.id} style={styles.exerciseCard} onClick={() => onSelectExercise(exercise)}>
            <div style={styles.exerciseHeader}>
                <span style={styles.exerciseNumber}>Esercizio {index + 1}</span>
                <span style={{...styles.difficultyBadge, backgroundColor: difficultyColors[exercise.difficulty]}}>
                    {exercise.difficulty}
                </span>
            </div>
            <h2 style={styles.exerciseTitle}>{exercise.title}</h2>
          </div>
        ))}
      </main>
      <div style={styles.footer}>
        <button onClick={onBack} style={styles.footerButton}>
          Torna al Menu
          <HomeIcon />
        </button>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 20px',
    backgroundColor: COLORS.fondo,
    minHeight: '100vh',
  },
  header: {
    marginBottom: '40px',
    textAlign: 'center',
    paddingTop: '60px', // Add padding to avoid overlap with the absolute positioned button
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: COLORS.salviaVerde,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    position: 'absolute',
    top: '20px',
    left: '20px',
    transition: 'background-color 0.2s ease',
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '32px',
    color: COLORS.nero,
  },
  description: {
    fontSize: '18px',
    color: '#666',
  },
  exerciseList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  exerciseCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    border: '1px solid #eee',
  },
  exerciseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  exerciseNumber: {
    fontSize: '14px',
    color: '#777',
    fontWeight: '500',
  },
  difficultyBadge: {
    color: 'white',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  exerciseTitle: {
    fontSize: '20px',
    color: COLORS.nero,
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
      background: COLORS.salviaVerde,
      border: 'none',
      borderRadius: '8px',
      padding: '10px 20px',
      cursor: 'pointer',
      fontSize: '16px',
      color: 'white',
      fontWeight: '500',
      transition: 'background-color 0.2s ease',
  },
};