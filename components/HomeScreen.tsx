import React, { useState } from 'react';
import { UserProfile, UserProgress, Entitlements, Module } from '../types';
import { MODULES, COLORS } from '../constants';
import { soundService } from '../services/soundService';
import { hasProAccess } from '../services/monetizationService';
import { LockIcon, CrownIcon } from './Icons';
import { ProgressOverview } from './ProgressOverview';
import { ProgressAnalytics } from './ProgressAnalytics';
import { VideoPlayerModal } from './VideoPlayerModal';
import { dailyChallengeMedia, checkupMedia } from '../assets';

// FIX: Defined the specific navigation screens used within the HomeScreen component.
type Screen = 'paywall';

interface HomeScreenProps {
  user: UserProfile | null;
  progress: UserProgress | undefined;
  onSelectModule: (module: Module) => void;
  onStartCheckup: () => void;
  onNavigateToReport: () => void;
  onStartDailyChallenge: () => void;
  entitlements: Entitlements | null;
  onNavigate: (screen: Screen) => void;
}

const MediaDisplay: React.FC<{ src: string; alt: string; style: React.CSSProperties }> = ({ src, alt, style }) => {
    const isVideo = src && src.toLowerCase().endsWith('.mp4');
    if (isVideo) {
        return (
            <video 
                src={src} 
                style={style} 
                autoPlay 
                muted 
                loop 
                playsInline 
                title={alt} 
            />
        );
    }
    return <img src={src} alt={alt} style={style} loading="lazy" />;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  progress,
  onSelectModule,
  onStartCheckup,
  onNavigateToReport,
  onStartDailyChallenge,
  entitlements,
  onNavigate,
}) => {
  const [videoModal, setVideoModal] = useState<{ isOpen: boolean; src: string }>({ isOpen: false, src: '' });
  const isPro = hasProAccess(entitlements);

  if (!user || progress === undefined) {
    return null; // Or a loader, but App.tsx handles loading state
  }
  
  const handleModuleClick = (module: Module) => {
    soundService.playClick();
    if (module.isPro && !isPro) {
        onNavigate('paywall');
    } else {
        onSelectModule(module);
    }
  };
  
  const handleStartCheckup = () => {
    soundService.playClick();
    onStartCheckup();
  };
  
  const handleStartDailyChallenge = () => {
    soundService.playClick();
    onStartDailyChallenge();
  };

  return (
    <div style={styles.container}>
      {user && progress && <ProgressOverview user={user} progress={progress} />}
      
      <div style={styles.grid}>
        <div style={{...styles.card, ...styles.largeCard}} onClick={handleStartDailyChallenge}>
            <MediaDisplay src={dailyChallengeMedia} alt="Sfida del Giorno" style={styles.cardImage} />
            <div style={styles.cardOverlay} />
            <div style={styles.cardContent}>
                <h2 style={styles.cardTitle}>Sfida del Giorno</h2>
                <p style={styles.cardDescription}>Mettiti alla prova con uno scenario nuovo ogni giorno.</p>
            </div>
        </div>
        <div style={{...styles.card, ...styles.largeCard}} onClick={handleStartCheckup}>
            <MediaDisplay src={checkupMedia} alt="Check-up Strategico" style={styles.cardImage} />
            <div style={styles.cardOverlay} />
            <div style={styles.cardContent}>
                <h2 style={styles.cardTitle}>Check-up Strategico</h2>
                <p style={styles.cardDescription}>Scopri il tuo profilo di comunicatore e le aree di miglioramento.</p>
            </div>
        </div>
      </div>

      <ProgressAnalytics userProgress={progress} onNavigateToReport={onNavigateToReport} onSelectModule={handleModuleClick} />
      
      <h2 style={styles.sectionTitle}>Moduli di Allenamento</h2>
      <div style={styles.grid}>
        {MODULES.map((module) => (
          <div key={module.id} style={styles.card} onClick={() => handleModuleClick(module)}>
            <MediaDisplay src={module.headerImage} alt={module.title} style={styles.cardImage} />
            <div style={styles.cardOverlay} />
            <div style={styles.cardContent}>
                <div style={styles.cardHeader}>
                  <module.icon style={{width: 24, height: 24, color: 'white'}} />
                  {module.isPro && (
                      <span style={{...styles.proBadge, ...(!isPro ? styles.proBadgeLocked : {})}}>
                        {isPro ? <CrownIcon width={16} height={16} /> : <LockIcon width={16} height={16} />}
                        PRO
                      </span>
                  )}
                </div>
                <h3 style={styles.cardTitleSmall}>{module.title}</h3>
                <p style={styles.cardDescriptionSmall}>{module.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      <VideoPlayerModal 
        isOpen={videoModal.isOpen}
        onClose={() => setVideoModal({isOpen: false, src: ''})}
        videoSrc={videoModal.src}
      />
    </div>
  );
};


const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: '24px',
    borderBottom: `3px solid ${COLORS.secondary}`,
    paddingBottom: '8px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginBottom: '48px',
  },
  card: {
    position: 'relative',
    borderRadius: '16px',
    overflow: 'hidden',
    cursor: 'pointer',
    height: '250px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  largeCard: {
    height: '200px',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    position: 'absolute',
    zIndex: 1,
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(to top, rgba(28, 62, 94, 0.9) 0%, rgba(28, 62, 94, 0.2) 60%, transparent 100%)',
    zIndex: 2,
  },
  cardContent: {
    position: 'relative',
    zIndex: 3,
    padding: '20px',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    height: '100%',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: '20px',
    left: '20px',
    right: '20px',
  },
  proBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(255, 193, 7, 0.8)',
    color: COLORS.textPrimary,
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  proBadgeLocked: {
    backgroundColor: 'rgba(108, 117, 125, 0.8)',
    color: 'white',
  },
  cardTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    lineHeight: 1.2,
  },
  cardDescription: {
    fontSize: '15px',
    margin: 0,
    opacity: 0.9,
    lineHeight: 1.5,
  },
  cardTitleSmall: {
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
  },
  cardDescriptionSmall: {
    fontSize: '14px',
    margin: 0,
    opacity: 0.9,
    lineHeight: 1.4,
  }
};
