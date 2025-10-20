import React, { useState, useEffect } from 'react';
import type { Module, User, UserProgress, Exercise } from '../types';
import { MODULES, COLORS, MODULE_PALETTE } from '../constants';
import { smilingPerson, dailyChallengePerson, checkupImage } from '../assets';
import { ProgressOverview } from './ProgressOverview';
import { ProgressAnalytics } from './ProgressAnalytics';
import { getDailyChallenge } from '../services/progressionService';
import { CheckCircleIcon, TargetIcon, LockIcon, SettingsIcon, ArrowDownIcon } from './Icons';
import { soundService } from '../services/soundService';

interface HomeScreenProps {
  onSelectModule: (module: Module, color: string) => void;
  onSelectExercise: (exercise: Exercise, isCheckup?: boolean, checkupStep?: number, totalCheckupSteps?: number, moduleColor?: string) => void;
  onStartCheckup: () => void;
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
  .module-card:not(.locked):active {
    transform: translateY(-4px) scale(0.98);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  }
  .daily-challenge:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(14, 58, 93, 0.2);
  }
  .daily-challenge:active {
    transform: translateY(-2px) scale(0.99);
    box-shadow: 0 4px 15px rgba(14, 58, 93, 0.25);
  }
  .checkup-prompt:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(88, 166, 166, 0.25);
  }
  .checkup-prompt:active {
    transform: translateY(-2px) scale(0.99);
    box-shadow: 0 4px 15px rgba(88, 166, 166, 0.3);
  }
`;

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectModule, onSelectExercise, onStartCheckup, currentUser, userProgress }) => {
  const [dailyChallenge, setDailyChallenge] = useState<Exercise | null>(null);

  useEffect(() => {
    setDailyChallenge(getDailyChallenge());
  }, []);

  const completedModuleIds = userProgress?.completedModuleIds || [];
  const completedExerciseIds = userProgress?.completedExerciseIds || [];
  const foundationalModules = MODULES.filter(m => m.category === 'Fondamentali' || !m.category);
  const sectoralPacks = MODULES.filter(m => m.category === 'Pacchetti Settoriali');
  
  // This constant provides a default object for new users to ensure the analytics chart renders.
  const progressDataForAnalytics: UserProgress = userProgress || {
    scores: [],
    competenceScores: { ascolto: 0, riformulazione: 0, assertivita: 0, gestione_conflitto: 0 }
  };

  const handleModuleClick = (module: Module, isLocked: boolean, color: string) => {
      if (isLocked) {
          soundService.playStopRecording(); // A "denied" sound
      } else {
          soundService.playClick();
          onSelectModule(module, color);
      }
  };
  
  const handleDailyChallengeClick = () => {
      if (dailyChallenge) {
          soundService.playClick();
          const moduleForExercise = MODULES.find(m => m.exercises.some(e => e.id === dailyChallenge.id));
          let moduleColor = MODULE_PALETTE[0]; // Fallback color

          if (moduleForExercise) {
              const allModules = [...foundationalModules, ...sectoralPacks];
              const moduleIndex = allModules.findIndex(m => m.id === moduleForExercise.id);
              if (moduleIndex !== -1) {
                  moduleColor = MODULE_PALETTE[moduleIndex % MODULE_PALETTE.length];
              }
          }
          
          onSelectExercise(dailyChallenge, false, 0, 0, moduleColor);
      }
  };

  const isDailyChallengeCompleted = () => {
      if (!userProgress || !dailyChallenge) return false;
      const completedIds = userProgress.completedExerciseIds || [];
      return completedIds.includes(dailyChallenge.id);
  };

  const renderModuleGrid = (modules: Module[], colorOffset: number = 0) => (
    <div style={styles.moduleGrid}>
      {modules.map((module, index) => {
        const prerequisites = module.prerequisites || [];
        const isLocked = prerequisites.length > 0 && !prerequisites.every(id => completedModuleIds.includes(id));
        const isCompleted = !isLocked && completedModuleIds.includes(module.id);
        const completedExercisesInModule = module.exercises.filter(e => completedExerciseIds.includes(e.id)).length;
        const totalExercisesInModule = module.exercises.length;
        const moduleColor = MODULE_PALETTE[(index + colorOffset) % MODULE_PALETTE.length];

        
        const cardStyle = {
          ...styles.moduleCard,
          backgroundColor: isLocked ? '#B0BEC5' : moduleColor,
          animation: `fadeInUp 0.5s ${index * 0.05}s ease-out both`,
          cursor: isLocked ? 'not-allowed' : 'pointer',
        };

        return (
          <div 
            key={module.id} 
            className="module-card" 
            style={cardStyle} 
            onClick={() => handleModuleClick(module, isLocked, moduleColor)}
            onMouseEnter={() => !isLocked && soundService.playHover()}
            >
            {isLocked && (
                <div style={styles.lockOverlay}>
                    <LockIcon width={48} height={48} color="white" />
                    <span style={styles.lockText}>Completa i moduli propedeutici per sbloccare</span>
                </div>
            )}
             {isCompleted && (
                <div style={styles.completedOverlay}>
                    <CheckCircleIcon color="white" width={48} height={48}/>
                    <span style={styles.completedText}>Completato</span>
                </div>
            )}
            <div style={{ ...styles.cardImageContainer, filter: isLocked ? 'grayscale(80%)' : 'none' }}>
                {module.cardImage && <img src={module.cardImage} alt={module.title} style={styles.cardImage} className="card-image" loading="lazy"/>}
            </div>
            <div style={styles.cardContent}>
              <div style={styles.cardHeader}>
                <module.icon style={styles.cardIcon} />
                <h2 style={styles.cardTitle}>{module.title}</h2>
              </div>
              <p style={styles.cardDescription}>{module.description}</p>
              {!isLocked && totalExercisesInModule > 0 && (
                  <div style={styles.progressBarContainer}>
                    <div style={styles.progressText}>
                      Progresso: {completedExercisesInModule} / {totalExercisesInModule}
                    </div>
                    <div style={styles.moduleProgressBar}>
                      <div style={{...styles.moduleProgressBarFill, width: `${(completedExercisesInModule / totalExercisesInModule) * 100}%` }}/>
                    </div>
                  </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  );

  return (
    <div style={styles.container}>
      <style>{hoverStyle}</style>
      <header style={styles.header} className="homescreen-header">
        <div style={styles.headerTextContainer} className="homescreen-header-text">
            <h1 style={styles.title}>Ciao {currentUser?.firstName || 'Ospite'}!</h1>
            <p style={styles.subtitle}>
                Inizia ora il tuo Allenamento con la Comunicazione Efficace Strategica®.<br/>
                <strong style={{marginTop: '8px', display: 'inline-block'}}>Scegli da cosa vuoi iniziare...</strong>
            </p>
            <ArrowDownIcon style={styles.arrowDown} />
        </div>
        <img 
            src={smilingPerson} 
            alt="Ivano Cincinnato, fondatore di CES Coach" 
            style={styles.headerImage}
            loading="eager"
            fetchPriority="high"
        />
      </header>
      
      {currentUser && <ProgressOverview user={currentUser} progress={userProgress} />}
      
      {currentUser && <ProgressAnalytics userProgress={progressDataForAnalytics} />}
      
      <main style={currentUser ? {marginTop: '48px'} : {}}>
        
        {currentUser && !userProgress?.hasCompletedCheckup && (
          <section style={{marginBottom: '48px'}}>
            <h2 style={styles.sectionTitle}>Valutazione Iniziale</h2>
            <div style={styles.checkupCard} className="checkup-prompt" onClick={onStartCheckup}>
              <div style={styles.checkupTextContainer}>
                <h3 style={styles.checkupTitle}>Valuta il tuo Livello Iniziale</h3>
                <p style={styles.checkupText}>
                  Completa il test di analisi per scoprire il tuo profilo di comunicatore e ricevere un percorso di allenamento personalizzato.
                </p>
              </div>
              <img src={checkupImage} alt="Analisi strategica della comunicazione" style={styles.checkupImage} />
            </div>
          </section>
        )}

        {dailyChallenge && (
            <section style={{marginBottom: '48px'}}>
                 <h2 style={styles.sectionTitle}>Sfida del Giorno</h2>
                 <div style={styles.dailyChallenge} className="daily-challenge" onClick={handleDailyChallengeClick} onMouseEnter={() => soundService.playHover()}>
                    <div style={styles.challengeTextContainer}>
                        <h3 style={styles.challengeTitle}>{dailyChallenge.task}</h3>
                    </div>
                    <img src={dailyChallengePerson} alt="Persona sorridente per la sfida del giorno" style={styles.challengeImage} />
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
                {renderModuleGrid(sectoralPacks, foundationalModules.length)}
            </div>
          )}
        </section>

      </main>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', backgroundColor: COLORS.base, minHeight: '100vh' },
    header: { display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '48px', backgroundColor: COLORS.cardDark, padding: '32px', borderRadius: '12px' },
    headerTextContainer: { flex: 1 },
    headerImage: {
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        objectFit: 'cover',
        objectPosition: 'center 20%',
        border: `4px solid ${COLORS.card}`,
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    },
    title: { fontSize: '32px', fontWeight: '700', color: COLORS.primary, margin: '0 0 8px 0' },
    subtitle: { fontSize: '18px', color: COLORS.textSecondary, maxWidth: '600px', lineHeight: 1.6, margin: '0 0 16px 0' },
    arrowDown: {
        color: COLORS.success,
        width: '32px',
        height: '32px',
        marginTop: '16px',
        animation: 'bounce 2s infinite',
    },
    sectionTitle: { fontSize: '24px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '24px', borderBottom: `3px solid ${COLORS.secondary}`, paddingBottom: '8px' },
    categoryTitle: { fontSize: '20px', fontWeight: 'bold', color: COLORS.textSecondary, marginTop: '24px', marginBottom: '16px' },
    adminPanelPrompt: {
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, #1a5f8e 100%)`,
        color: 'white',
        padding: '24px',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 15px rgba(14, 58, 93, 0.2)',
        marginBottom: '48px',
        textAlign: 'center',
    },
    adminTitle: {
        margin: '8px 0',
        fontSize: '18px',
        fontWeight: 600,
    },
    adminText: {
        margin: 0,
        fontSize: '15px',
        opacity: 0.9,
    },
    checkupCard: {
        background: `linear-gradient(135deg, ${COLORS.secondary} 0%, #73B5B5 100%)`,
        color: 'white',
        borderRadius: '16px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 15px rgba(88, 166, 166, 0.2)',
        display: 'flex',
        alignItems: 'stretch',
        overflow: 'hidden',
        position: 'relative',
        minHeight: '180px',
    },
    checkupTextContainer: {
        flex: 1,
        padding: '24px 32px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
    },
    checkupImage: {
        width: '220px',
        flexShrink: 0,
        objectFit: 'cover',
        clipPath: 'polygon(25% 0, 100% 0, 100% 100%, 0% 100%)',
    },
    checkupTitle: { margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 },
    checkupText: { margin: 0, fontSize: '15px', opacity: 0.9, lineHeight: 1.5 },
    dailyChallenge: {
        background: COLORS.primaryGradient,
        color: 'white',
        borderRadius: '16px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 15px rgba(14, 58, 93, 0.15)',
        display: 'flex',
        alignItems: 'stretch',
        overflow: 'hidden',
        position: 'relative',
        minHeight: '180px',
    },
    challengeImage: {
        width: '220px',
        flexShrink: 0,
        objectFit: 'cover',
        clipPath: 'polygon(25% 0, 100% 0, 100% 100%, 0% 100%)',
    },
    challengeTextContainer: {
        flex: 1,
        padding: '24px 32px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
    },
    challengeTitle: { margin: 0, fontSize: '18px', fontWeight: 600 },
    challengeScenario: { margin: 0, fontSize: '15px', opacity: 0.9, lineHeight: 1.5 },
    completedBadge: {
        position: 'absolute',
        top: '16px',
        right: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '20px',
        fontWeight: 500,
        zIndex: 2,
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
    completedOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(40, 167, 69, 0.8)',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        textAlign: 'center',
        padding: '20px',
    },
    completedText: {
        marginTop: '12px',
        fontSize: '18px',
        fontWeight: 'bold',
    },
    cardImageContainer: { width: '100%', height: '180px', overflow: 'hidden' },
    cardImage: { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' },
    cardContent: { padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' },
    cardHeader: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' },
    cardIcon: { width: '32px', height: '32px', color: 'white', flexShrink: 0 },
    cardTitle: { fontSize: '20px', fontWeight: '600', color: 'white', margin: 0 },
    cardDescription: { fontSize: '15px', color: 'white', lineHeight: 1.6, flexGrow: 1, margin: 0 },
    progressBarContainer: {
        marginTop: '16px',
        paddingTop: '12px',
        borderTop: `1px solid rgba(255, 255, 255, 0.2)`
    },
    progressText: {
        color: 'white',
        fontSize: '13px',
        fontWeight: 500,
        marginBottom: '6px',
    },
    moduleProgressBar: {
        height: '6px',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: '3px',
        overflow: 'hidden',
    },
    moduleProgressBarFill: {
        height: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: '3px',
        transition: 'width 0.5s ease-in-out',
    },
};
