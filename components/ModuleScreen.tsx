import React, { useState } from 'react';
import { Module, Exercise, Entitlements, AnalysisHistoryItem } from '../types';
import { COLORS } from '../constants';
import { BackIcon, CheckCircleIcon, CrownIcon, LockIcon, PlayIcon } from './Icons';
import { soundService } from '../services/soundService';
import { hasProAccess } from '../services/monetizationService';
import { ExercisePreviewModal } from './ExercisePreviewModal';

interface ModuleScreenProps {
  module: Module;
  moduleColor: string;
  onSelectExercise: (exercise: Exercise, module: Module) => void;
  onReviewExercise: (exerciseId: string) => void;
  onBack: () => void;
  completedExerciseIds: string[];
  entitlements: Entitlements | null;
  analysisHistory: { [exerciseId: string]: AnalysisHistoryItem };
}

export const ModuleScreen: React.FC<ModuleScreenProps> = ({
  module,
  moduleColor,
  onSelectExercise,
  onReviewExercise,
  onBack,
  completedExerciseIds,
  entitlements,
  analysisHistory
}) => {
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const isPro = hasProAccess(entitlements);
    const isLocked = module.isPro && !isPro;
    const isHeaderVideo = module.headerImage && module.headerImage.toLowerCase().endsWith('.mp4');

    const handleStartExercise = (exercise: Exercise) => {
        if (isLocked) {
            // This case should ideally be handled by disabling the button, but as a fallback:
            console.warn("Attempted to start an exercise in a locked module.");
            return;
        }
        onSelectExercise(exercise, module);
    };

    const handlePreviewExercise = (exercise: Exercise) => {
        soundService.playClick();
        setSelectedExercise(exercise);
    };
    
    const handleClosePreview = () => {
        setSelectedExercise(null);
    };

    const hoverStyle = `
      .exercise-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.08);
      }
      .back-button:hover {
        background-color: ${COLORS.cardDark};
      }
    `;

    return (
        <div style={styles.container}>
            <style>{hoverStyle}</style>
            <div style={styles.header}>
                 {isHeaderVideo ? (
                    <video 
                        src={module.headerImage} 
                        style={styles.headerImage} 
                        autoPlay 
                        muted 
                        loop 
                        playsInline 
                        title={`Video per ${module.title}`} 
                    />
                ) : (
                    <img src={module.headerImage} alt={`Illustrazione per ${module.title}`} style={styles.headerImage} />
                )}
                <div style={styles.headerOverlay} />
                <button onClick={() => { soundService.playClick(); onBack(); }} style={styles.backButton} className="back-button">
                    <BackIcon /> Torna alla Home
                </button>
                <div style={styles.headerContent}>
                    <div style={{...styles.iconContainer, backgroundColor: moduleColor}}>
                        <module.icon width={32} height={32} color="white" />
                    </div>
                    <h1 style={styles.title}>{module.title}</h1>
                    <p style={styles.description}>{module.description}</p>
                </div>
            </div>

            <div style={styles.exerciseList}>
                {module.exercises.map((exercise) => {
                    const isCompleted = completedExerciseIds.includes(exercise.id);
                    const lastScore = isCompleted && analysisHistory[exercise.id] ? (analysisHistory[exercise.id].result as any).score : null;
                    
                    return (
                        <div key={exercise.id} style={styles.exerciseItem} className="exercise-item" onClick={() => handlePreviewExercise(exercise)}>
                            <div style={{ flex: 1 }}>
                                <div style={styles.exerciseTitleContainer}>
                                    <h2 style={styles.exerciseTitle}>{exercise.title}</h2>
                                    {isCompleted && <CheckCircleIcon style={{ color: COLORS.success, flexShrink: 0 }} />}
                                </div>
                                <span style={{...styles.difficultyBadge, backgroundColor: `${moduleColor}30`, color: moduleColor}}>
                                    {exercise.difficulty}
                                </span>
                            </div>
                            <div style={styles.actions}>
                                {isCompleted && lastScore !== null && <span style={styles.scoreText}>Punteggio: {lastScore}/100</span>}
                                {isCompleted && <button style={styles.reviewButton} onClick={(e) => { e.stopPropagation(); onReviewExercise(exercise.id); }}>Rivedi</button>}
                                <button style={{...styles.startButton, backgroundColor: moduleColor}} onClick={(e) => { e.stopPropagation(); handleStartExercise(exercise); }} disabled={isLocked}>
                                    {isCompleted ? "Riprova" : "Inizia"}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {isLocked && (
                <div style={styles.lockedModuleBanner}>
                    <CrownIcon />
                    <div>
                        <h3 style={styles.lockedTitle}>Questo è un modulo PRO</h3>
                        <p style={styles.lockedDescription}>Sblocca tutti i moduli e le funzionalità avanzate per accelerare la tua crescita.</p>
                    </div>
                    {/* The paywall navigation should be handled by App.tsx, but this is a direct trigger */}
                    <button style={styles.unlockButton} onClick={() => { /* onNavigateToPaywall() can be called here if passed down */ }}>Sblocca PRO</button>
                </div>
            )}
            
            {selectedExercise && (
                <ExercisePreviewModal 
                    exercise={selectedExercise}
                    color={moduleColor}
                    onClose={handleClosePreview}
                    onStart={handleStartExercise}
                />
            )}
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '40px 20px', minHeight: '100vh' },
  header: { position: 'relative', borderRadius: '16px', overflow: 'hidden', marginBottom: '40px' },
  headerImage: { width: '100%', height: '280px', objectFit: 'cover', display: 'block' },
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(28,62,94,0.8) 20%, rgba(0,0,0,0.2) 100%)' },
  backButton: { position: 'absolute', top: '20px', left: '20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 2, transition: 'background-color 0.2s' },
  headerContent: { position: 'absolute', bottom: '24px', left: '24px', right: '24px', color: 'white', zIndex: 1 },
  iconContainer: { width: '56px', height: '56px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' },
  title: { fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0', textShadow: '0 2px 4px rgba(0,0,0,0.5)' },
  description: { fontSize: '18px', margin: 0, maxWidth: '700px', textShadow: '0 1px 3px rgba(0,0,0,0.5)' },
  exerciseList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  exerciseItem: {
    backgroundColor: COLORS.card, padding: '20px', borderRadius: '12px', border: `1px solid ${COLORS.divider}`,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
    cursor: 'pointer', transition: 'all 0.2s ease-out'
  },
  exerciseTitleContainer: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' },
  exerciseTitle: { fontSize: '18px', fontWeight: 600, color: COLORS.textPrimary, margin: 0 },
  difficultyBadge: { fontSize: '12px', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' },
  actions: { display: 'flex', alignItems: 'center', gap: '16px' },
  scoreText: { fontSize: '14px', fontWeight: 500, color: COLORS.textSecondary },
  reviewButton: { padding: '8px 16px', fontSize: '14px', border: `1px solid ${COLORS.secondary}`, backgroundColor: 'transparent', color: COLORS.secondary, borderRadius: '8px', cursor: 'pointer' },
  startButton: { padding: '8px 16px', fontSize: '14px', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  lockedModuleBanner: {
    marginTop: '40px', backgroundColor: COLORS.cardDark, padding: '24px', borderRadius: '12px',
    display: 'flex', alignItems: 'center', gap: '20px', borderLeft: `5px solid ${COLORS.warning}`
  },
  lockedTitle: { fontSize: '18px', fontWeight: 'bold', color: COLORS.textPrimary, margin: '0 0 4px 0' },
  lockedDescription: { fontSize: '15px', color: COLORS.textSecondary, margin: 0 },
  unlockButton: { marginLeft: 'auto', padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', border: 'none', backgroundColor: COLORS.warning, color: COLORS.textPrimary, borderRadius: '8px', cursor: 'pointer' }
};