// components/HomeScreen.tsx
import React, { useState, useMemo } from 'react';
import {
  UserProfile,
  UserProgress,
  Entitlements,
  Module,
} from '../types';
import { MODULES, COLORS, OBJECTIVE_MODULE_MAP } from '../constants';
import { hasProAccess } from '../services/monetizationService';
import { ProgressOverview } from './ProgressOverview';
import { ProgressAnalytics } from './ProgressAnalytics';
import { WarmUpCard } from './WarmUpCard';
import { soundService } from '../services/soundService';
import { LockIcon, CrownIcon } from './Icons';
import { homeScreenHeaderVideo, checkupMedia, dailyChallengeMedia } from '../assets';

// Props for ModuleCard component
interface ModuleCardProps {
  module: Module;
  onSelect: (module: Module) => void;
  isProUser: boolean;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ module, onSelect, isProUser }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isLocked = module.isPro && !isProUser;
  const isHeaderVideo = module.headerImage && module.headerImage.toLowerCase().endsWith('.mp4');
  const isClickable = !(isLocked && module.isCustom);

  const handleCardClick = () => {
    if (!isClickable) return;
    soundService.playClick();
    onSelect(module);
  };

  const cardStyle: React.CSSProperties = {
    ...styles.moduleCard,
    ...(isLocked ? styles.moduleCardLocked : {}),
    ...(isHovered && isClickable ? styles.moduleCardHover : {}),
  };

  if (!isClickable) {
    cardStyle.cursor = 'default';
  }

  return (
    <div
      style={cardStyle}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.cardImageContainer}>
        {isHeaderVideo ? (
          <video src={module.headerImage} style={styles.cardImage} autoPlay muted loop playsInline />
        ) : (
          <img src={module.headerImage} alt={module.title} style={styles.cardImage} />
        )}
        <div style={styles.cardImageOverlay} />
        {isLocked && (
          <div style={styles.lockOverlay}>
            <LockIcon style={{ color: 'white', width: 32, height: 32 }} />
          </div>
        )}
        {module.isPro && (
          <div style={styles.proBadge}><CrownIcon width={16} height={16}/> PRO</div>
        )}
      </div>
      <div style={styles.cardContent}>
        <div style={styles.cardHeader}>
          <module.icon style={{ ...styles.moduleIcon, color: module.color }} />
          <h3 style={styles.moduleTitle}>{module.title}</h3>
        </div>
        <p style={styles.moduleDescription}>{module.description}</p>
      </div>
    </div>
  );
};


interface HomeScreenProps {
  user: UserProfile;
  progress: UserProgress | undefined;
  entitlements: Entitlements | null;
  onSelectModule: (module: Module) => void;
  onStartCheckup: () => void;
  onNavigateToReport: () => void;
  onStartDailyChallenge: () => void;
  onNavigate: (screen: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  progress,
  entitlements,
  onSelectModule,
  onStartCheckup,
  onNavigateToReport,
  onStartDailyChallenge,
}) => {
    const isPro = hasProAccess(entitlements);

    const firstName = user.firstName.trim().toLowerCase();
    // Heuristic for Italian names to determine gender. Not perfect but a good approximation.
    const isLikelyFemale = firstName.endsWith('a') && !['andrea', 'luca', 'nicola', 'elia', 'mattia'].includes(firstName);
    const welcomeWord = isLikelyFemale ? "Benvenuta" : "Benvenuto";

    const { subtitle, recommendedModules, otherModules } = useMemo(() => {
        const objective = progress?.mainObjective;
        if (objective) {
            const recommendedIds = OBJECTIVE_MODULE_MAP[objective] || [];
            const recModules = MODULES.filter(m => recommendedIds.includes(m.id));
            const otherMods = MODULES.filter(m => !recommendedIds.includes(m.id));
            const objectiveAction = objective.split(' ')[0].toLowerCase().replace('\'', '');
            
            return {
                subtitle: `Oggi ci alleniamo per ${objectiveAction} ${objective.split(' ').slice(1).join(' ')}`,
                recommendedModules: recModules,
                otherModules: otherMods,
            };
        }
        return {
            subtitle: 'Inizia subito il tuo allenamento!',
            recommendedModules: [],
            otherModules: MODULES,
        };
    }, [progress?.mainObjective]);
    
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <video src={homeScreenHeaderVideo} style={styles.headerVideo} autoPlay muted loop playsInline />
        <div style={styles.headerOverlay} />
        <div style={styles.headerContent}>
          <h1 style={styles.mainTitle}>
            {welcomeWord} in<br />
            CES Coach
          </h1>
          <p style={styles.mainSubtitle}>{subtitle}</p>
        </div>
      </header>
      
      <main style={styles.mainContent}>
        <ProgressOverview user={user} progress={progress} />
        
        <WarmUpCard />
        
        {progress && (
          <ProgressAnalytics 
            userProgress={progress}
            onNavigateToReport={onNavigateToReport}
            onSelectModule={onSelectModule}
          />
        )}
        
        <section style={styles.specialCardsSection}>
            <div style={styles.specialCard} onClick={() => { soundService.playClick(); onStartCheckup(); }}>
                 <video src={checkupMedia} style={styles.specialCardMedia} autoPlay muted loop playsInline />
                 <div style={styles.specialCardOverlay} />
                 <div style={styles.specialCardContent}>
                    <h2 style={styles.specialCardTitle}>Valuta il tuo Livello</h2>
                    <p style={styles.specialCardText}>Inizia con un check-up strategico per scoprire il tuo profilo di comunicatore.</p>
                 </div>
            </div>
             <div style={styles.specialCard} onClick={() => { soundService.playClick(); onStartDailyChallenge(); }}>
                 <video src={dailyChallengeMedia} style={styles.specialCardMedia} autoPlay muted loop playsInline />
                 <div style={styles.specialCardOverlay} />
                 <div style={styles.specialCardContent}>
                    <h2 style={styles.specialCardTitle}>Sfida del Giorno</h2>
                    <p style={styles.specialCardText}>Allenati con uno scenario nuovo ogni giorno e mantieni le tue abilità affinate.</p>
                 </div>
            </div>
        </section>

        {recommendedModules.length > 0 && (
             <section>
              <h2 style={styles.sectionTitle}>Consigliati per Te</h2>
              <div style={styles.modulesGrid}>
                {recommendedModules.map(module => (
                  <ModuleCard key={module.id} module={module} onSelect={onSelectModule} isProUser={isPro} />
                ))}
              </div>
            </section>
        )}

        <section>
          <h2 style={styles.sectionTitle}>{recommendedModules.length > 0 ? "Altri Moduli" : "Moduli di Allenamento"}</h2>
          <div style={styles.modulesGrid}>
            {otherModules.map(module => (
              <ModuleCard 
                key={module.id} 
                module={module} 
                onSelect={onSelectModule}
                isProUser={isPro}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { backgroundColor: COLORS.base, minHeight: '100vh' },
  header: {
    position: 'relative',
    height: '40vh',
    minHeight: '300px',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center'
  },
  headerVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: 1
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(28, 62, 94, 0.7)',
    zIndex: 2
  },
  headerContent: {
    zIndex: 3,
    padding: '20px',
  },
  mainTitle: {
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontWeight: 'bold',
    margin: '0 0 16px 0',
    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
    lineHeight: 1.2,
  },
  mainSubtitle: {
    fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
    maxWidth: '600px',
    margin: '0 auto',
    opacity: 0.9,
    textShadow: '0 1px 3px rgba(0,0,0,0.5)'
  },
  mainContent: {
    maxWidth: '1200px',
    margin: '-80px auto 40px',
    padding: '0 24px',
    position: 'relative',
    zIndex: 4,
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: '24px',
    borderBottom: `3px solid ${COLORS.secondary}`,
    paddingBottom: '8px',
    marginTop: '48px',
  },
  modulesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  },
  moduleCard: {
    backgroundColor: COLORS.card,
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    border: `1px solid ${COLORS.divider}`,
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  moduleCardHover: {
    transform: 'scale(1.03)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
  },
  moduleCardLocked: {
      cursor: 'pointer' // Or 'not-allowed' if we want to block it more obviously
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
  cardImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 50%)'
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(28, 62, 94, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proBadge: {
      position: 'absolute',
      top: '12px',
      right: '12px',
      backgroundColor: COLORS.warning,
      color: COLORS.textPrimary,
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
  },
  cardContent: {
    padding: '20px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px'
  },
  moduleIcon: {
    width: '24px',
    height: '24px',
    flexShrink: 0,
  },
  moduleTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: COLORS.textPrimary,
    margin: 0,
  },
  moduleDescription: {
    fontSize: '14px',
    color: COLORS.textSecondary,
    lineHeight: 1.6,
    margin: 0,
    height: '65px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical' as 'vertical',
  },
  specialCardsSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginBottom: '48px'
  },
  specialCard: {
      position: 'relative',
      height: '200px',
      borderRadius: '12px',
      overflow: 'hidden',
      cursor: 'pointer',
      boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
  },
  specialCardMedia: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
  },
  specialCardOverlay: {
      position: 'absolute',
      top: 0, left: 0, width: '100%', height: '100%',
      background: 'linear-gradient(135deg, rgba(28, 62, 94, 0.8) 0%, rgba(88, 166, 166, 0.7) 100%)',
  },
  specialCardContent: {
      position: 'absolute',
      bottom: '20px', left: '20px', right: '20px',
      color: 'white',
  },
  specialCardTitle: {
      fontSize: '22px',
      fontWeight: 'bold',
      margin: '0 0 8px 0',
      textShadow: '0 1px 3px rgba(0,0,0,0.5)'
  },
  specialCardText: {
      fontSize: '15px',
      margin: 0,
      opacity: 0.9,
  }
};