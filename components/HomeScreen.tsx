import React, { useState } from 'react';
import type { Module, UserProfile, UserProgress, Exercise, Entitlements } from '../types';
import { COLORS, MODULES } from '../constants';
import { ProgressOverview } from './ProgressOverview';
import { dailyChallengeHeaderImage, checkupHeaderImage, chatTrainerCardImage, ivanoCincinnatoImage, homeScreenHeaderVideo } from '../assets';
import { VideoPlayerModal } from './VideoPlayerModal';
import { soundService } from '../services/soundService';
import { hasProAccess } from '../services/monetizationService';
// FIX: Added LockIcon to imports.
import { CrownIcon, PlayIcon, ArrowDownIcon, LockIcon } from './Icons';
import { ProgressAnalytics } from './ProgressAnalytics';

interface HomeScreenProps {
  user: UserProfile;
  progress: UserProgress | undefined;
  entitlements: Entitlements | null;
  dailyChallenge: Exercise;
  onSelectModule: (module: Module) => void;
  onStartDailyChallenge: (exercise: Exercise) => void;
  onStartCheckup: () => void;
  onStartChatTrainer: () => void;
  onNavigateToPaywall: () => void;
  onNavigateToCompetenceReport: () => void;
}

const hoverStyle = `
  .action-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
  }
  .action-card:active {
    transform: translateY(-4px) scale(0.99);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }
  .video-intro-circle:hover {
    transform: scale(1.05);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }
  .video-intro-circle:hover .play-icon-overlay {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }
`;

const ProgressionPath: React.FC<{
  userProgress: UserProgress | undefined;
  userHasPro: boolean;
  onSelectModule: (module: Module) => void;
  onNavigateToPaywall: () => void;
}> = ({ userProgress, userHasPro, onSelectModule, onNavigateToPaywall }) => {

    const isModuleCompleted = (module: Module) => {
        if (module.exercises.length === 0) return false;
        return module.exercises.every(ex => userProgress?.completedExerciseIds.includes(ex.id));
    };

    const arePrerequisitesMet = (module: Module) => {
        if (!module.prerequisites || module.prerequisites.length === 0) {
            return true;
        }
        return module.prerequisites.every(prereqId => {
            const prereqModule = MODULES.find(m => m.id === prereqId);
            return prereqModule ? isModuleCompleted(prereqModule) : false;
        });
    };
    
    const nonCustomModules = MODULES.filter(m => !m.isCustom);

    return (
        <div style={styles.pathContainer}>
            {nonCustomModules.map((module, index) => {
                const isPrereqMet = arePrerequisitesMet(module);
                const isModulePro = module.isPro ?? false;
                const isLockedBySubscription = isModulePro && !userHasPro;
                const isLocked = !isPrereqMet || isLockedBySubscription;

                const completedCount = module.exercises.filter(e => userProgress?.completedExerciseIds.includes(e.id)).length;
                const totalCount = module.exercises.length;
                const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
                
                const handleClick = () => {
                    if (isLockedBySubscription) {
                        onNavigateToPaywall();
                    } else if (!isLocked) {
                        onSelectModule(module);
                    }
                };
                
                return (
                    <React.Fragment key={module.id}>
                        <div 
                            style={{ ...styles.pathNode, ...(isLocked ? styles.pathNodeLocked : {}) }}
                            onClick={handleClick}
                        >
                            <div style={styles.nodeIconContainer}>
                                <module.icon style={{...styles.nodeIcon, color: isLocked ? COLORS.textSecondary : COLORS.primary }}/>
                            </div>
                            <div style={styles.nodeContent}>
                                <h3 style={styles.nodeTitle}>{module.title}</h3>
                                {isLocked && (
                                  <div style={styles.lockReason}>
                                    <LockIcon style={{width: 16, height: 16}}/>
                                    <span>
                                      {isLockedBySubscription ? "Richiede PRO" : "Completa il modulo precedente"}
                                    </span>
                                  </div>
                                )}
                                <div style={styles.nodeProgressBar}>
                                    <div style={{...styles.nodeProgressBarFill, width: `${progressPercentage}%`}}/>
                                </div>
                                <span style={styles.nodeProgressText}>{completedCount}/{totalCount}</span>
                            </div>
                             {isModulePro && <div style={styles.proBadge}><CrownIcon /> PRO</div>}
                        </div>
                        {index < nonCustomModules.length - 1 && <div style={styles.pathConnector} />}
                    </React.Fragment>
                );
            })}
        </div>
    );
};


export const HomeScreen: React.FC<HomeScreenProps> = ({ user, progress, entitlements, onSelectModule, dailyChallenge, onStartDailyChallenge, onStartCheckup, onStartChatTrainer, onNavigateToPaywall, onNavigateToCompetenceReport }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const userHasPro = hasProAccess(entitlements);

  return (
    <div style={styles.container}>
      <style>{hoverStyle}</style>
      <ProgressOverview user={user} progress={progress} />

      <div style={styles.videoIntroContainer}>
        <div 
            style={styles.videoIntroCircle} 
            className="video-intro-circle"
            onClick={() => {
                soundService.playClick();
                setVideoUrl(homeScreenHeaderVideo);
            }}
        >
          <img src={ivanoCincinnatoImage} alt="Presentazione CES Coach" style={styles.videoIntroImage} />
          <div style={styles.playIconOverlay} className="play-icon-overlay">
            <PlayIcon color="white" width={48} height={48} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
          </div>
        </div>
        <h2 style={styles.videoIntroTitle}>Inizia ora il tuo allenamento!</h2>
        <ArrowDownIcon style={styles.bouncingArrow} />
      </div>

      <div style={styles.grid}>
        <div 
          style={{...styles.actionCard, backgroundImage: `url(${dailyChallengeHeaderImage})`, border: `3px solid ${COLORS.warning}`}} 
          className="action-card"
          onClick={() => onStartDailyChallenge(dailyChallenge)}
        >
          <div style={styles.actionCardOverlay} />
          <div style={styles.actionCardContent}>
            <h2 style={styles.actionCardTitle}>Sfida del Giorno</h2>
            <p style={styles.actionCardDescription}>{dailyChallenge.title}</p>
          </div>
        </div>
        
        {!progress?.checkupProfile && (
            <div 
                style={{...styles.actionCard, backgroundImage: `url(${checkupHeaderImage})`}} 
                className="action-card"
                onClick={onStartCheckup}
            >
                <div style={styles.actionCardOverlay} />
                <div style={styles.actionCardContent}>
                    <h2 style={styles.actionCardTitle}>Check-up Iniziale</h2>
                    <p style={styles.actionCardDescription}>Scopri il tuo profilo di comunicatore</p>
                </div>
            </div>
        )}

         <div 
            style={{...styles.actionCard, backgroundImage: `url(${chatTrainerCardImage})`}} 
            className="action-card"
            onClick={userHasPro ? onStartChatTrainer : onNavigateToPaywall}
          >
            <div style={styles.actionCardOverlay} />
            <div style={styles.actionCardContent}>
              <h2 style={styles.actionCardTitle}>Chat Strategica</h2>
              <p style={styles.actionCardDescription}>Allenati a scrivere messaggi efficaci con l'AI Trainer.</p>
            </div>
            {!userHasPro && (
                <div style={styles.proBadge}><CrownIcon /> PRO</div>
            )}
          </div>
      </div>

      <h2 style={styles.sectionTitle}>Il Tuo Percorso del Comunicatore</h2>
      <ProgressionPath 
        userProgress={progress}
        userHasPro={userHasPro}
        onSelectModule={onSelectModule}
        onNavigateToPaywall={onNavigateToPaywall}
      />


      {progress && <ProgressAnalytics userProgress={progress} onNavigateToReport={onNavigateToCompetenceReport} onSelectModule={onSelectModule} />}

      {videoUrl && <VideoPlayerModal isOpen={!!videoUrl} onClose={() => setVideoUrl(null)} videoSrc={videoUrl} />}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  videoIntroContainer: {
    textAlign: 'center',
    margin: '40px 0',
    animation: 'fadeInUp 0.5s ease-out both',
  },
  videoIntroCircle: {
    position: 'relative',
    width: '180px',
    height: '180px',
    borderRadius: '50%',
    margin: '0 auto',
    cursor: 'pointer',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    overflow: 'hidden',
  },
  videoIntroImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  playIconOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80px',
    height: '80px',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
    transition: 'opacity 0.3s ease, transform 0.3s ease',
  },
  videoIntroTitle: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: '20px',
    marginBottom: '8px',
  },
  bouncingArrow: {
    color: COLORS.secondary,
    width: '48px',
    height: '48px',
    marginTop: '16px',
    animation: 'bounce 2s infinite',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
    marginBottom: '40px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: '24px',
    borderBottom: `3px solid ${COLORS.secondary}`,
    paddingBottom: '8px',
  },
  proBadge: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    backgroundColor: COLORS.warning,
    color: 'black',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  actionCard: {
    borderRadius: '16px',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.3s, box-shadow 0.3s',
    position: 'relative',
    height: '250px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  actionCardOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 60%)',
  },
  actionCardContent: {
    padding: '20px',
    position: 'relative',
    zIndex: 1,
    color: 'white',
  },
  actionCardTitle: {
    fontSize: '22px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
  },
  actionCardDescription: {
    fontSize: '15px',
    lineHeight: 1.5,
    margin: 0,
    opacity: 0.9,
  },
  pathContainer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '40px',
  },
  pathNode: {
    backgroundColor: COLORS.card,
    borderRadius: '16px',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    maxWidth: '600px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'transform 0.3s, box-shadow 0.3s',
    border: `2px solid transparent`,
    position: 'relative',
  },
  pathNodeLocked: {
    cursor: 'not-allowed',
    backgroundColor: COLORS.cardDark,
    color: COLORS.textSecondary,
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
  },
  nodeIconContainer: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: COLORS.divider,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginRight: '16px',
  },
  nodeIcon: {
    width: '32px',
    height: '32px',
  },
  nodeContent: {
    flex: 1,
  },
  nodeTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
  },
  lockReason: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      color: COLORS.textSecondary,
      marginBottom: '8px',
  },
  nodeProgressBar: {
    height: '8px',
    backgroundColor: COLORS.divider,
    borderRadius: '4px',
    marginBottom: '4px',
  },
  nodeProgressBarFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: '4px',
  },
  nodeProgressText: {
      fontSize: '12px',
      color: COLORS.textSecondary,
      fontWeight: 500
  },
  pathConnector: {
    width: '4px',
    height: '32px',
    backgroundColor: COLORS.accentBeige,
  },
};