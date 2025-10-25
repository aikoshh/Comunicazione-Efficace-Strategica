// components/HomeScreen.tsx
import React, { useState } from 'react';
import { Module, UserProfile, UserProgress } from '../types';
import { COLORS, MODULES } from '../constants';
import { ivanoCincinnatoImage, checkupHeaderImage, dailyChallengeMedia, checkupMedia } from '../assets';
import { LockIcon, PlayIcon, ArrowDownIcon } from './Icons';
import { hasProAccess } from '../services/monetizationService';
import { ProgressOverview } from './ProgressOverview';
import { VideoPlayerModal } from './VideoPlayerModal';
import { soundService } from '../services/soundService';

interface ModuleCardProps {
  module: Module;
  onClick: (module: Module) => void;
  isLocked?: boolean;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ module, onClick, isLocked }) => {
  const isHeaderVideo = module.headerImage && module.headerImage.toLowerCase().endsWith('.mp4');
  
  const handleMouseEnter = () => {
    soundService.playHover();
  };

  return (
    <div style={{ ...styles.moduleCard, ...(isLocked ? styles.moduleCardLocked : {}) }} onClick={() => !isLocked && onClick(module)} onMouseEnter={handleMouseEnter}>
      <div style={styles.cardImageContainer}>
        {isHeaderVideo ? (
            <video src={module.headerImage} style={styles.cardImage} autoPlay muted loop playsInline />
        ) : (
            <img src={module.headerImage} alt={module.title} style={styles.cardImage} />
        )}
        <div style={styles.cardOverlay} />
        {isLocked && <LockIcon style={styles.lockIcon} />}
      </div>
      <div style={styles.cardContent}>
        <module.icon style={{ ...styles.moduleIcon, color: module.color }} />
        <h3 style={styles.moduleTitle}>{module.title}</h3>
        <p style={styles.moduleDescription}>{module.description}</p>
      </div>
    </div>
  );
};

interface ActionCardProps {
    title: string;
    description: string;
    mediaUrl: string;
    onClick: () => void;
    buttonText: string;
}

const ActionCard: React.FC<ActionCardProps> = ({ title, description, mediaUrl, onClick, buttonText }) => {
    const isVideo = mediaUrl.toLowerCase().endsWith('.mp4');
    return (
        <div style={styles.actionCard}>
            {isVideo ? (
                 <video src={mediaUrl} style={styles.actionCardImage} autoPlay muted loop playsInline />
            ) : (
                <img src={mediaUrl} alt={title} style={styles.actionCardImage} />
            )}
            <div style={styles.actionCardContent}>
                <h2 style={styles.actionCardTitle}>{title}</h2>
                <p style={styles.actionCardDescription}>{description}</p>
                <button style={styles.actionCardButton} onClick={onClick}>
                    {buttonText}
                </button>
            </div>
        </div>
    );
};


interface HomeScreenProps {
  user: UserProfile;
  progress: UserProgress | undefined;
  onSelectModule: (module: Module) => void;
  onStartCheckup: () => void;
  onStartDailyChallenge: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ user, progress, onSelectModule, onStartCheckup, onStartDailyChallenge }) => {
    const [isIntroVideoOpen, setIsIntroVideoOpen] = useState(false);
    const isPro = hasProAccess(null); // This should be based on entitlements, passing null as placeholder
    const hasCompletedCheckup = !!progress?.checkupProfile;

    const handlePlayIntro = () => {
        soundService.playClick();
        setIsIntroVideoOpen(true);
    }
    
  return (
    <div style={styles.container}>
      <main style={styles.mainContent}>
        <ProgressOverview user={user} progress={progress} />

        <div style={styles.introVideoContainer}>
            <div style={styles.videoCircleWrapper} onClick={handlePlayIntro}>
                <img src={ivanoCincinnatoImage} alt="Dr. Ivano Cincinnato" style={styles.videoCircleImage} />
                <div style={styles.videoCircleOverlay}>
                    <PlayIcon style={styles.videoPlayIcon} />
                </div>
            </div>
        </div>

        <div style={styles.startTrainingContainer}>
            <h2 style={styles.startTrainingText}>Inizia ora il tuo allenamento!</h2>
            <ArrowDownIcon style={styles.startTrainingArrow} />
        </div>
        
        <ActionCard
            title="Sfida del Giorno"
            description="Mettiti alla prova con un esercizio a sorpresa per mantenere affilate le tue abilità strategiche."
            mediaUrl={dailyChallengeMedia}
            onClick={onStartDailyChallenge}
            buttonText="Inizia Sfida"
        />

        {!hasCompletedCheckup && (
            <ActionCard
                title="Valuta il tuo Livello Iniziale"
                description="Completa il check-up strategico per scoprire il tuo profilo di comunicatore e ottenere un percorso di allenamento personalizzato."
                mediaUrl={checkupMedia}
                onClick={onStartCheckup}
                buttonText="Inizia il Check-up (3 min)"
            />
        )}
        
        <h2 style={styles.sectionTitle}>Il Tuo Percorso del Comunicatore</h2>
        <div style={styles.modulesGrid}>
          {MODULES.map(module => (
            <ModuleCard
              key={module.id}
              module={module}
              onClick={onSelectModule}
              isLocked={module.isPro && !isPro}
            />
          ))}
        </div>

        {hasCompletedCheckup && (
             <ActionCard
                title="Rifai il Check-up Strategico"
                description="Misura i tuoi progressi e aggiorna il tuo profilo alla luce dei nuovi allenamenti."
                mediaUrl={checkupMedia}
                onClick={onStartCheckup}
                buttonText="Rifai il Check-up"
            />
        )}
      </main>
      
      <VideoPlayerModal isOpen={isIntroVideoOpen} onClose={() => setIsIntroVideoOpen(false)} videoSrc="https://www.centroclinicaformazionestrategica.it/CES-APP/images/presentazione-iniziale.MP4" />
    </div>
  );
};

const styles: { [key:string]: React.CSSProperties } = {
    container: {
        backgroundColor: COLORS.base,
    },
    mainContent: {
        maxWidth: '1200px',
        margin: '24px auto 40px',
        padding: '0 32px',
        position: 'relative',
        zIndex: 4,
    },
    introVideoContainer: {
        display: 'flex',
        justifyContent: 'center',
        margin: '32px 0 16px',
    },
    videoCircleWrapper: {
        position: 'relative',
        width: '150px',
        height: '150px',
        borderRadius: '50%',
        cursor: 'pointer',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    },
    videoCircleImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    videoCircleOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(28, 62, 94, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.3s ease',
    },
    videoPlayIcon: {
        color: 'white',
        width: '48px',
        height: '48px',
        transition: 'transform 0.3s ease',
    },
    startTrainingContainer: {
        textAlign: 'center',
        margin: '16px 0 32px',
    },
    startTrainingText: {
        fontSize: '22px',
        fontWeight: 600,
        color: COLORS.primary,
        marginBottom: '8px',
    },
    startTrainingArrow: {
        color: COLORS.secondary,
        width: '32px',
        height: '32px',
        animation: 'bounce 2s infinite',
    },
    sectionTitle: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: COLORS.primary,
        margin: '48px 0 24px 0',
        borderBottom: `3px solid ${COLORS.secondary}`,
        paddingBottom: '8px',
    },
    modulesGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '24px',
    },
    moduleCard: {
        backgroundColor: COLORS.card,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    },
    moduleCardLocked: {
        cursor: 'not-allowed',
    },
    cardImageContainer: {
        position: 'relative',
        height: '180px',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    cardOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    lockIcon: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '40px',
        height: '40px',
        color: 'rgba(255,255,255,0.8)',
    },
    cardContent: {
        padding: '24px',
    },
    moduleIcon: {
        width: '32px',
        height: '32px',
        marginBottom: '12px',
    },
    moduleTitle: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        margin: '0 0 8px 0',
    },
    moduleDescription: {
        fontSize: '14px',
        color: COLORS.textSecondary,
        lineHeight: 1.6,
        margin: 0,
    },
    actionCard: {
        backgroundColor: COLORS.card,
        borderRadius: '16px',
        display: 'flex',
        gap: '32px',
        padding: '32px',
        alignItems: 'center',
        marginTop: '24px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
    },
    actionCardImage: {
        width: '150px',
        height: '150px',
        objectFit: 'cover',
        borderRadius: '12px',
        flexShrink: 0,
    },
    actionCardContent: {},
    actionCardTitle: {
        fontSize: '22px',
        fontWeight: 'bold',
        color: COLORS.primary,
        margin: '0 0 12px 0',
    },
    actionCardDescription: {
        fontSize: '16px',
        color: COLORS.textSecondary,
        lineHeight: 1.6,
        margin: '0 0 20px 0',
    },
    actionCardButton: {
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: 'bold',
        color: 'white',
        backgroundColor: COLORS.secondary,
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
    },
};