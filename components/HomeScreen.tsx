import React, { useState, useEffect } from 'react';
import type { Module, User, UserProgress, Exercise } from '../types';
import { MODULES, COLORS, SAGE_PALETTE } from '../constants';
import { Logo } from './Logo';
import { ProgressOverview } from './ProgressOverview';
import { getDailyChallenge } from '../services/progressionService';
import { CheckCircleIcon } from './Icons';
import { soundService } from '../services/soundService';

interface HomeScreenProps {
  onSelectModule: (module: Module) => void;
  onSelectExercise: (exercise: Exercise) => void;
  currentUser: User | null;
  userProgress: UserProgress | undefined;
}

const hoverStyle = `
  .module-card:not(.locked):hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }
  .module-card:not(.locked):hover .card-image {
    transform: scale(1.05);
  }
  .daily-challenge:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(14, 58, 93, 0.2);
  }
`;

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectModule, onSelectExercise, currentUser, userProgress }) => {
  const [dailyChallenge, setDailyChallenge] = useState<Exercise | null>(null);

  useEffect(() => {
    setDailyChallenge(getDailyChallenge());
  }, []);

  const completedModuleIds = userProgress?.completedModuleIds || [];
  const foundationalModules = MODULES.filter(m => m.category === 'Fondamentali' || !m.category);
  const sectoralPacks = MODULES.filter(m => m.category === 'Pacchetti Settoriali');

  const handleModuleClick = (module: Module, isLocked: boolean) => {
      if (isLocked) {
          soundService.playStopRecording(); // A "denied" sound
      } else {
          soundService.playClick();
          onSelectModule(module);
      }
  };
  
  const handleDailyChallengeClick = () => {
      if (dailyChallenge) {
          soundService.playClick();
          onSelectExercise(dailyChallenge);
      }
  };

  const isDailyChallengeCompleted = () => {
      if (!userProgress || !dailyChallenge) return false;
      const completedIds = userProgress.completedExerciseIds || [];
      return completedIds.includes(dailyChallenge.id);
  };

  const renderModuleGrid = (modules: Module[]) => (
    <div style={styles.moduleGrid}>
      {modules.map((module, index) => {
        const prerequisites = module.prerequisites || [];
        const isLocked = prerequisites.length > 0 && !prerequisites.every(id => completedModuleIds.includes(id));
        
        const cardStyle = {
          ...styles.moduleCard,
          backgroundColor: isLocked ? '#B0BEC5' : SAGE_PALETTE[index % SAGE_PALETTE.length],
          animation: `fadeInUp 0.5s ${index * 0.05}s ease-out both`,
          cursor: isLocked ? 'not-allowed' : 'pointer',
        };

        return (
          <div 
            key={module.id} 
            className="module-card" 
            style={cardStyle} 
            onClick={() => handleModuleClick(module, isLocked)}
            onMouseEnter={() => !isLocked && soundService.playHover()}
            >
            {isLocked && (
                <div style={styles.lockOverlay}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    <span style={styles.lockText}>Completa i moduli propedeutici per sbloccare</span>
                </div>
            )}
            <div style={{ ...styles.cardImageContainer, filter: isLocked ? 'grayscale(80%)' : 'none' }}>
                {module.cardImage && <img src={module.cardImage} alt={module.title} style={styles.cardImage} className="card-image"/>}
            </div>
            <div style={styles.cardContent}>
              <div style={styles.cardHeader}>
                <module.icon style={styles.cardIcon} />
                <h2 style={styles.cardTitle}>{module.title}</h2>
              </div>
              <p style={styles.cardDescription}>{module.description}</p>
            </div>
          </div>
        )
      })}
    </div>
  );

  return (
    <div style={styles.container}>
      <style>{hoverStyle}</style>
      <header style={styles.header}>
        <Logo />
        <h1 style={styles.title}>Centro di Allenamento</h1>
         <p style={styles.subtitle}>
            Seleziona la tua prossima sessione dalla Mappa delle Competenze o affronta la Sfida del Giorno.
        </p>
      </header>
      
      {currentUser && <ProgressOverview user={currentUser} progress={userProgress} />}
      
      <main style={currentUser ? {marginTop: '48px'} : {}}>
        {dailyChallenge && (
            <section style={{marginBottom: '48px'}}>
                 <h2 style={styles.sectionTitle}>Sfida del Giorno</h2>
                 <div style={styles.dailyChallenge} className="daily-challenge" onClick={handleDailyChallengeClick}>
                    <div>
                        <h3 style={styles.challengeTitle}>{dailyChallenge.task}</h3>
                        <p style={styles.challengeScenario}>Scenario: {dailyChallenge.scenario.substring(0,100)}...</p>
                    </div>
                    {isDailyChallengeCompleted() && (
                        <div style={styles.completedBadge}>
                            <CheckCircleIcon color="white"/>
                            <span>Completata!</span>
                        </div>
                    )}
                 </div>
            </section>
        )}

        <section>
          <h2 style={styles.sectionTitle}>Mappa delle Competenze</h2>
          <h3 style={styles.categoryTitle}>Fondamentali</h3>
          {renderModuleGrid(foundationalModules)}

          {sectoralPacks.length > 0 && (
            <div style={{ marginTop: '48px' }}>
                <h3 style={styles.categoryTitle}>Pacchetti Settoriali Professionali</h3>
                {renderModuleGrid(sectoralPacks)}
            </div>
          )}
        </section>

      </main>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', backgroundColor: COLORS.base, minHeight: '100vh' },
    header: { textAlign: 'center', marginBottom: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
    title: { fontSize: '32px', fontWeight: 'bold', color: COLORS.textPrimary, margin: '16px 0 0 0' },
    subtitle: { fontSize: '16px', color: COLORS.textSecondary, maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 },
    sectionTitle: { fontSize: '24px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '24px', borderBottom: `3px solid ${COLORS.secondary}`, paddingBottom: '8px' },
    categoryTitle: { fontSize: '20px', fontWeight: 'bold', color: COLORS.textSecondary, marginTop: '24px', marginBottom: '16px' },
    dailyChallenge: {
        background: COLORS.primaryGradient,
        color: 'white',
        padding: '24px',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 15px rgba(14, 58, 93, 0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px',
    },
    challengeTitle: { margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 },
    challengeScenario: { margin: 0, fontSize: '15px', opacity: 0.9, lineHeight: 1.5 },
    completedBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: '8px 16px',
        borderRadius: '20px',
        fontWeight: 500,
        flexShrink: 0
    },
    moduleGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' },
    moduleCard: {
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
    },
    lockOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(14, 58, 93, 0.8)',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        textAlign: 'center',
        padding: '20px',
    },
    lockText: {
        marginTop: '12px',
        fontSize: '14px',
        fontWeight: 500,
    },
    cardImageContainer: { width: '100%', height: '180px', overflow: 'hidden' },
    cardImage: { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' },
    cardContent: { padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' },
    cardHeader: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' },
    cardIcon: { width: '32px', height: '32px', color: 'white', flexShrink: 0 },
    cardTitle: { fontSize: '20px', fontWeight: '600', color: 'white', margin: 0 },
    cardDescription: { fontSize: '15px', color: 'white', lineHeight: 1.6, flexGrow: 1, margin: 0 },
};