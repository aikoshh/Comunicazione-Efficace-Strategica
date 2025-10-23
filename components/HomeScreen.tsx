// components/HomeScreen.tsx
import React, { useState } from 'react';
import type { Module, UserProfile, UserProgress, Exercise, Entitlements } from '../types';
import { COLORS, MODULES } from '../constants';
import { ProgressOverview } from './ProgressOverview';
import { dailyChallengeHeaderImage, checkupHeaderImage, chatTrainerCardImage, ivanoCincinnatoImage, homeScreenHeaderVideo } from '../assets';
import { VideoPlayerModal } from './VideoPlayerModal';
import { soundService } from '../services/soundService';
import { hasProAccess } from '../services/monetizationService';
import { CrownIcon, PlayIcon, ArrowDownIcon } from './Icons';
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
  .module-card:hover, .action-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
  }
  .module-card:active, .action-card:active {
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

const ModuleCard: React.FC<{
  module: Module;
  onClick: () => void;
  completedExercises: number;
  totalExercises: number;
  isPro: boolean;
  userHasPro: boolean;
}> = ({ module, onClick, completedExercises, totalExercises, isPro, userHasPro }) => {
  const progress = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;
  const isLocked = isPro && !userHasPro;

  const cardStyle: React.CSSProperties = {
    ...styles.moduleCard,
    ...(isLocked ? styles.moduleCardLocked : {}),
  };
  
  const isHeaderVideo = module.headerImage && module.headerImage.toLowerCase().endsWith('.mp4');

  return (
    <div style={cardStyle} onClick={!isLocked ? onClick : undefined} className="module-card">
       {isHeaderVideo ? (
        <video src={module.headerImage} style={styles.cardImage} autoPlay muted loop playsInline />
      ) : (
        <img src={module.headerImage} alt={module.title} style={styles.cardImage} />
      )}
      <div style={styles.cardContent}>
        <div style={styles.cardHeader}>
          <module.icon style={styles.cardIcon} />
          <h3 style={styles.cardTitle}>{module.title}</h3>
        </div>
        <p style={styles.cardDescription}>{module.description}</p>
      </div>
      <div style={styles.cardFooter}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressBarFill, width: `${progress}%` }} />
        </div>
        <span style={styles.progressText}>{completedExercises}/{totalExercises}</span>
      </div>
      {isLocked && (
        <div style={styles.proBadge}>
          <CrownIcon /> PRO
        </div>
      )}
    </div>
  );
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ user, progress, entitlements, onSelectModule, dailyChallenge, onStartDailyChallenge, onStartCheckup, onStartChatTrainer, onNavigateToPaywall, onNavigateToCompetenceReport }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const userHasPro = hasProAccess(entitlements);

  const completedExerciseIds = progress?.completedExerciseIds || [];

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
          style={{...styles.actionCard, backgroundImage: `url(${dailyChallengeHeaderImage})`}} 
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
      </div>

      <h2 style={styles.sectionTitle}>Moduli di Allenamento</h2>
      <div style={styles.grid}>
        {MODULES.map((module) => {
          if(module.id === 'm7') { // Special handling for chat trainer
            return (
              <div 
                key={module.id}
                style={{...styles.actionCard, backgroundImage: `url(${chatTrainerCardImage})`}} 
                className="action-card"
                onClick={userHasPro ? onStartChatTrainer : onNavigateToPaywall}
              >
                <div style={styles.actionCardOverlay} />
                <div style={styles.actionCardContent}>
                  <h2 style={styles.actionCardTitle}>{module.title}</h2>
                  <p style={styles.actionCardDescription}>{module.description}</p>
                </div>
                {module.isPro && !userHasPro && (
                    <div style={styles.proBadge}><CrownIcon /> PRO</div>
                )}
              </div>
            );
          }

          const completed = module.exercises.filter(e => completedExerciseIds.includes(e.id)).length;
          const total = module.exercises.length;
          
          return (
            <ModuleCard
              key={module.id}
              module={module}
              onClick={() => (module.isPro && !userHasPro) ? onNavigateToPaywall() : onSelectModule(module)}
              completedExercises={completed}
              totalExercises={total}
              isPro={!!module.isPro}
              userHasPro={userHasPro}
            />
          );
        })}
      </div>

      {progress && <ProgressAnalytics userProgress={progress} onNavigateToReport={onNavigateToCompetenceReport} />}

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
  videoIntroText: {
    fontSize: '16px',
    color: COLORS.textSecondary,
    maxWidth: '500px',
    margin: '0 auto',
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
  moduleCard: {
    backgroundColor: COLORS.card,
    borderRadius: '16px',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
    transition: 'transform 0.3s, box-shadow 0.3s',
    position: 'relative',
  },
  moduleCardLocked: {
      cursor: 'default',
      filter: 'grayscale(50%)',
  },
  cardImage: {
    width: '100%',
    height: '180px',
    objectFit: 'cover',
  },
  cardContent: {
    padding: '20px',
    flex: '1',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  cardIcon: {
    width: '28px',
    height: '28px',
    color: COLORS.primary,
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0,
    color: COLORS.textPrimary,
  },
  cardDescription: {
    fontSize: '14px',
    color: COLORS.textSecondary,
    lineHeight: 1.6,
    margin: 0,
  },
  cardFooter: {
    padding: '20px',
    borderTop: `1px solid ${COLORS.divider}`,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  progressBar: {
    flex: 1,
    height: '8px',
    backgroundColor: COLORS.divider,
    borderRadius: '4px',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: '4px',
  },
  progressText: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: COLORS.textSecondary,
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
};