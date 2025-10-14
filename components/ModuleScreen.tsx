import React, { useState } from 'react';
import { Module, Exercise, DifficultyLevel, ExerciseType, Entitlements } from '../types';
import { COLORS, SAGE_PALETTE, EXERCISE_TYPE_ICONS } from '../constants';
import { HomeIcon, CheckCircleIcon, QuestionIcon, TargetIcon } from './Icons';
import { soundService } from '../services/soundService';
import { hasProAccess } from '../services/monetizationService';
import { QuestionLibraryModal } from './QuestionLibraryModal';
import { PreparationChecklistModal } from './PreparationChecklistModal';
import { ExercisePreviewModal } from './ExercisePreviewModal';

interface ModuleScreenProps {
  module: Module;
  onSelectExercise: (exercise: Exercise) => void;
  onReviewExercise: (exerciseId: string) => void;
  onBack: () => void;
  completedExerciseIds: string[];
  entitlements: Entitlements | null;
}

const difficultyColors: { [key in DifficultyLevel]: string } = {
  [DifficultyLevel.BASE]: '#4CAF50',
  [DifficultyLevel.INTERMEDIO]: '#FFC107',
  [DifficultyLevel.AVANZATO]: '#F44336',
};

const hoverStyle = `
  .exercise-card:not(.completed):hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
    border-left-color: white;
  }
  .exercise-card:not(.completed):active {
    transform: translateY(-2px) scale(0.99);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  }
  .pro-feature-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(14, 58, 93, 0.15);
  }
   .pro-feature-button:active {
    transform: translateY(0) scale(0.98);
  }
`;

export const ModuleScreen: React.FC<ModuleScreenProps> = ({ module, onSelectExercise, onReviewExercise, onBack, completedExerciseIds, entitlements }) => {
  const [isLibraryModalOpen, setLibraryModalOpen] = useState(false);
  const [isChecklistModalOpen, setChecklistModalOpen] = useState(false);
  const [previewingExercise, setPreviewingExercise] = useState<Exercise | null>(null);
  
  const handleExerciseClick = (exercise: Exercise) => {
    soundService.playClick();
    setPreviewingExercise(exercise);
  }

  const handleCardClick = (exercise: Exercise) => {
    const isCompleted = completedExerciseIds.includes(exercise.id);
    if (isCompleted) {
        soundService.playClick();
        onReviewExercise(exercise.id);
    } else {
        handleExerciseClick(exercise);
    }
  };

  const handleStartExercise = (exercise: Exercise) => {
      setPreviewingExercise(null);
      onSelectExercise(exercise);
  };
  
  const showProFeatures = module.id === 'm3' && hasProAccess(entitlements);

  return (
    <>
    <div style={styles.container}>
       <style>{hoverStyle}</style>
      <header style={styles.header}>
        <div style={styles.titleContainer}>
            <module.icon width={32} height={32} color={COLORS.secondary} />
            <h1 style={styles.title}>{module.title}</h1>
        </div>
        <p style={styles.description}>{module.description}</p>
      </header>
      
      {showProFeatures && (
          <div style={styles.proFeaturesContainer}>
              <button 
                  onClick={() => { soundService.playClick(); setLibraryModalOpen(true); }} 
                  style={styles.proFeatureButton} 
                  className="pro-feature-button"
              >
                  <QuestionIcon/> Libreria Domande PRO
              </button>
              <button 
                  onClick={() => { soundService.playClick(); setChecklistModalOpen(true); }} 
                  style={styles.proFeatureButton}
                  className="pro-feature-button"
              >
                  <TargetIcon/> Checklist Preparazione PRO
              </button>
          </div>
      )}
      
      <main style={styles.exerciseList}>
        {module.exercises.map((exercise, index) => {
          const isCompleted = completedExerciseIds.includes(exercise.id);
          
          const baseCardStyle = {
            ...styles.exerciseCard,
            backgroundColor: SAGE_PALETTE[index % SAGE_PALETTE.length],
            animation: `fadeInUp 0.4s ${0.1 + index * 0.05}s ease-out both`,
          };

          const cardStyle = isCompleted
            ? {
                ...baseCardStyle,
                filter: 'saturate(0.6)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.07)',
              }
            : baseCardStyle;
            
          const exerciseType = exercise.exerciseType || ExerciseType.WRITTEN;
          const ExerciseIcon = EXERCISE_TYPE_ICONS[exerciseType];

          return (
            <div 
              key={exercise.id} 
              className={`exercise-card ${isCompleted ? 'completed' : ''}`}
              style={cardStyle} 
              onClick={() => handleCardClick(exercise)}
              onMouseEnter={() => soundService.playHover()}
            >
              <div style={styles.exerciseHeader}>
                  <div style={styles.exerciseTitleContainer}>
                    <ExerciseIcon style={styles.exerciseTypeIcon} />
                    <h2 style={styles.exerciseTitle}>{exercise.title}</h2>
                  </div>
                  <div style={styles.badgesContainer}>
                      {isCompleted && (
                        <span style={styles.completedBadge}>
                          <CheckCircleIcon width={16} height={16} />
                          Completato
                        </span>
                      )}
                      <span style={{...styles.difficultyBadge, backgroundColor: difficultyColors[exercise.difficulty]}}>
                          {exercise.difficulty}
                      </span>
                  </div>
              </div>
              <p style={styles.exerciseScenarioPreview} title={exercise.scenario}>
                {exercise.scenario.substring(0, 100)}...
              </p>
            </div>
          )
        })}
      </main>
    </div>
    <QuestionLibraryModal isOpen={isLibraryModalOpen} onClose={() => setLibraryModalOpen(false)} />
    <PreparationChecklistModal isOpen={isChecklistModalOpen} onClose={() => setChecklistModalOpen(false)} />
    {previewingExercise && (
        <ExercisePreviewModal 
            exercise={previewingExercise}
            onClose={() => setPreviewingExercise(null)}
            onStart={handleStartExercise}
        />
    )}
    </>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 20px 80px',
    backgroundColor: COLORS.base,
    minHeight: 'calc(100vh - 64px)',
  },
  header: {
    marginBottom: '48px',
    textAlign: 'center',
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
  proFeaturesContainer: {
      display: 'flex',
      justifyContent: 'center',
      gap: '16px',
      marginBottom: '32px',
      paddingBottom: '32px',
      borderBottom: `1px solid ${COLORS.divider}`,
  },
  proFeatureButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '12px 20px',
      fontSize: '15px',
      fontWeight: 'bold',
      color: 'white',
      background: COLORS.primaryGradient,
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(14, 58, 93, 0.2)',
      transition: 'all 0.2s ease',
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
    transition: 'transform 0.3s, box-shadow 0.3s, border-left-color 0.3s, filter 0.3s',
    borderLeft: `5px solid transparent`,
    textAlign: 'left'
  },
  exerciseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '8px',
  },
  exerciseTitleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
    minWidth: 0,
  },
  exerciseTypeIcon: {
    width: '24px',
    height: '24px',
    color: 'white',
    flexShrink: 0,
  },
  badgesContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  completedBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: 'white',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
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
    margin: 0,
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  exerciseScenarioPreview: {
    fontSize: '14px',
    color: 'white',
    lineHeight: 1.5,
    margin: 0,
  },
};