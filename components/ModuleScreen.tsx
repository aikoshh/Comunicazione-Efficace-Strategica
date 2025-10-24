import React, { useState } from 'react';
import { Module, Exercise, Entitlements, AnalysisHistoryItem } from '../types';
import { COLORS } from '../constants';
import { hasProAccess } from '../services/monetizationService';
import { BackIcon, CheckCircleIcon, LockIcon } from './Icons';
import { soundService } from '../services/soundService';
import { ExercisePreviewModal } from './ExercisePreviewModal';

interface ModuleScreenProps {
  module: Module;
  moduleColor: string;
  onSelectExercise: (exercise: Exercise) => void;
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
  const [previewingExercise, setPreviewingExercise] = useState<Exercise | null>(null);
  const isPro = hasProAccess(entitlements);

  const handleExerciseClick = (exercise: Exercise) => {
    soundService.playClick();
    if (module.isPro && !isPro) {
      // This case should ideally be handled on the home screen, but as a safeguard:
      return; 
    }
    setPreviewingExercise(exercise);
  };
  
  const handleStartExercise = (exercise: Exercise) => {
    onSelectExercise(exercise);
    setPreviewingExercise(null);
  };

  const isHeaderVideo = module.headerImage && module.headerImage.toLowerCase().endsWith('.mp4');

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        {isHeaderVideo ? (
            <video src={module.headerImage} style={styles.headerImage} autoPlay muted loop playsInline />
        ) : (
            <img src={module.headerImage} alt={module.title} style={styles.headerImage} />
        )}
        <div style={styles.headerOverlay} />
        <div style={styles.headerContent}>
            <button onClick={onBack} style={styles.backButton}><BackIcon /> Torna alla Home</button>
            <div style={styles.titleContainer}>
                <module.icon style={styles.moduleIcon} />
                <h1 style={styles.title}>{module.title}</h1>
            </div>
            <p style={styles.description}>{module.description}</p>
        </div>
      </header>
      
      <main style={styles.mainContent}>
        <div style={styles.exerciseList}>
          {module.exercises.map((exercise, index) => {
            const isCompleted = completedExerciseIds.includes(exercise.id);
            const canReview = !!analysisHistory[exercise.id];

            return (
              <div key={exercise.id} style={styles.exerciseItem} onClick={() => handleExerciseClick(exercise)}>
                <div style={styles.exerciseNumber}>{index + 1}</div>
                <div style={styles.exerciseDetails}>
                    <h2 style={styles.exerciseTitle}>{exercise.title}</h2>
                    <span style={{...styles.difficultyBadge, backgroundColor: COLORS.secondary}}>{exercise.difficulty}</span>
                </div>
                <div style={styles.exerciseActions}>
                    {isCompleted && <CheckCircleIcon style={{color: COLORS.success}} title="Completato"/>}
                    {canReview && <button onClick={(e) => { e.stopPropagation(); onReviewExercise(exercise.id); }} style={styles.reviewButton}>Rivedi</button>}
                </div>
              </div>
            );
          })}
        </div>
        {module.isPro && !isPro && (
            <div style={styles.proLockOverlay}>
                <LockIcon style={{width: 48, height: 48, color: 'white'}}/>
                <h2 style={styles.proLockTitle}>Modulo PRO</h2>
                <p style={styles.proLockText}>Sblocca questo modulo e tutte le funzionalità avanzate con CES Coach PRO.</p>
            </div>
        )}
      </main>

      {previewingExercise && (
        <ExercisePreviewModal
            exercise={previewingExercise}
            color={moduleColor}
            onClose={() => setPreviewingExercise(null)}
            onStart={handleStartExercise}
        />
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { backgroundColor: COLORS.base, minHeight: '100vh' },
  header: { position: 'relative', height: '300px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  headerImage: { position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 },
  headerOverlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(28, 62, 94, 0.7)', zIndex: 2 },
  headerContent: { zIndex: 3, textAlign: 'center', padding: '20px' },
  backButton: { background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', position: 'absolute', top: '20px', left: '20px' },
  titleContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' },
  moduleIcon: { width: '40px', height: '40px' },
  title: { fontSize: '32px', fontWeight: 'bold', margin: 0 },
  description: { fontSize: '18px', maxWidth: '600px', margin: '0 auto', opacity: 0.9 },
  mainContent: { maxWidth: '800px', margin: '-60px auto 40px', backgroundColor: COLORS.card, borderRadius: '12px', padding: '32px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', position: 'relative', zIndex: 4 },
  exerciseList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  exerciseItem: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', backgroundColor: COLORS.cardDark, borderRadius: '8px', cursor: 'pointer', border: `1px solid ${COLORS.divider}` },
  exerciseNumber: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: COLORS.primary, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 },
  exerciseDetails: { flex: 1 },
  exerciseTitle: { fontSize: '18px', fontWeight: 600, color: COLORS.textPrimary, margin: '0 0 8px 0' },
  difficultyBadge: { padding: '4px 8px', borderRadius: '6px', color: 'white', fontSize: '12px', fontWeight: 500 },
  exerciseActions: { display: 'flex', alignItems: 'center', gap: '12px' },
  reviewButton: { background: COLORS.secondary, color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' },
  proLockOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(28, 62, 94, 0.9)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center', padding: '20px' },
  proLockTitle: { fontSize: '24px', fontWeight: 'bold', margin: '16px 0 8px 0' },
  proLockText: { fontSize: '16px', lineHeight: 1.6, maxWidth: '400px', margin: 0 },
};
