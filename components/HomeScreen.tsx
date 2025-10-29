// components/HomeScreen.tsx
import React, { useState } from 'react';
import { UserProfile, UserProgress, Entitlements, Module } from '../types';
import { MODULES, COLORS } from '../constants';
import { hasProAccess } from '../services/monetizationService';
import { ProgressOverview } from './ProgressOverview';
import { ProgressAnalytics } from './ProgressAnalytics';
import { VideoPlayerModal } from './VideoPlayerModal';
import { LockIcon, CrownIcon } from './Icons';
import { soundService } from '../services/soundService';
import {
    homeScreenHeaderVideo,
    checkupMedia,
    dailyChallengeMedia,
} from '../assets';

interface HomeScreenProps {
  user: UserProfile;
  progress: UserProgress | undefined;
  onSelectModule: (module: Module) => void;
  onStartCheckup: () => void;
  onNavigateToReport: () => void;
  onStartDailyChallenge: () => void;
  entitlements: Entitlements | null;
  onNavigate: (screen: string) => void;
}

const FeatureCard: React.FC<{
  title: string;
  description: string;
  mediaSrc: string;
  onClick: () => void;
  icon: React.FC<any>;
}> = ({ title, description, mediaSrc, onClick, icon: Icon }) => {
    const isVideo = mediaSrc.toLowerCase().endsWith('.mp4');
    return (
        <div style={styles.featureCard} onClick={onClick}>
            {isVideo ? (
                <video src={mediaSrc} style={styles.featureMedia} autoPlay muted loop playsInline />
            ) : (
                <img src={mediaSrc} alt={title} style={styles.featureMedia} />
            )}
            <div style={styles.featureContent}>
                <Icon style={styles.featureIcon} />
                <div>
                    <h3 style={styles.featureTitle}>{title}</h3>
                    <p style={styles.featureDescription}>{description}</p>
                </div>
            </div>
        </div>
    );
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
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const isPro = hasProAccess(entitlements);

    const handleModuleClick = (module: Module) => {
        soundService.playClick();
        if (module.isPro && !isPro) {
            onNavigate('paywall');
        } else {
            onSelectModule(module);
        }
    };

    return (
        <div style={styles.container}>
            <header style={styles.heroSection}>
                <video src={homeScreenHeaderVideo} style={styles.heroVideo} autoPlay muted loop playsInline />
                <div style={styles.heroOverlay}></div>
                <div style={styles.heroContent}>
                    <h1 style={styles.heroTitle}>Benvenuto in CES Coach, {user.firstName}!</h1>
                    <p style={styles.heroSubtitle}>Il tuo percorso per padroneggiare la comunicazione strategica inizia ora.</p>
                    <button onClick={() => setIsVideoModalOpen(true)} style={styles.playButton}>
                        Guarda il video introduttivo
                    </button>
                </div>
            </header>
            
            <main style={styles.mainContent}>
                <ProgressOverview user={user} progress={progress} />

                <section style={styles.featuresGrid}>
                    <FeatureCard 
                        title="Valuta il tuo livello"
                        description="Completa il check-up per scoprire il tuo profilo di comunicatore."
                        mediaSrc={checkupMedia}
                        onClick={() => { soundService.playClick(); onStartCheckup(); }}
                        icon={MODULES.find(m => m.id === 'm7')!.icon}
                    />
                     <FeatureCard 
                        title="Sfida del Giorno"
                        description="Mettiti alla prova con uno scenario nuovo ogni giorno."
                        mediaSrc={dailyChallengeMedia}
                        onClick={() => { soundService.playClick(); onStartDailyChallenge(); }}
                        icon={MODULES.find(m => m.id === 'm3')!.icon}
                    />
                </section>
                
                {progress && progress.completedExerciseIds.length > 0 && (
                    <ProgressAnalytics
                        userProgress={progress}
                        onNavigateToReport={onNavigateToReport}
                        onSelectModule={handleModuleClick}
                    />
                )}

                <section>
                    <h2 style={styles.sectionTitle}>Moduli di Allenamento</h2>
                    <div style={styles.moduleGrid}>
                        {MODULES.map(module => {
                            const showLock = module.isPro && !isPro;
                            return (
                                <div key={module.id} style={styles.moduleCard} onClick={() => handleModuleClick(module)}>
                                    <div style={styles.moduleImageContainer}>
                                        {module.headerImage.toLowerCase().endsWith('.mp4') ? (
                                            <video src={module.headerImage} style={styles.moduleImage} autoPlay muted loop playsInline />
                                        ) : (
                                            <img src={module.headerImage} alt={module.title} style={styles.moduleImage} />
                                        )}
                                        {showLock && <div style={styles.lockOverlay}><LockIcon color="white" /></div>}
                                    </div>
                                    <div style={styles.moduleContent}>
                                        <div style={styles.moduleHeader}>
                                            <module.icon style={{...styles.moduleIcon, color: module.color}}/>
                                            <h3 style={styles.moduleTitle}>{module.title}</h3>
                                            {module.isPro && <CrownIcon style={styles.proIcon} />}
                                        </div>
                                        <p style={styles.moduleDescription}>{module.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>

            <VideoPlayerModal 
                isOpen={isVideoModalOpen}
                onClose={() => setIsVideoModalOpen(false)}
                videoSrc={homeScreenHeaderVideo}
            />
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { backgroundColor: COLORS.base },
    heroSection: {
        position: 'relative', height: '400px', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center'
    },
    heroVideo: { position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 },
    heroOverlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(28, 62, 94, 0.7)', zIndex: 2 },
    heroContent: { zIndex: 3, padding: '20px' },
    heroTitle: { fontSize: '36px', fontWeight: 'bold', margin: '0 0 16px 0' },
    heroSubtitle: { fontSize: '18px', maxWidth: '600px', margin: '0 auto 24px' },
    playButton: {
        padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', color: COLORS.primary,
        backgroundColor: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer',
    },
    mainContent: {
        maxWidth: '1200px', margin: '-80px auto 40px',
        padding: '0 32px', position: 'relative', zIndex: 4
    },
    featuresGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px', marginBottom: '48px'
    },
    featureCard: {
        backgroundColor: COLORS.card, borderRadius: '12px', overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(0,0,0,0.1)', cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s'
    },
    featureMedia: { width: '100%', height: '180px', objectFit: 'cover' },
    featureContent: { padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' },
    featureIcon: { width: '40px', height: '40px', color: COLORS.secondary, flexShrink: 0 },
    featureTitle: { fontSize: '18px', fontWeight: 600, color: COLORS.textPrimary, margin: '0 0 4px 0' },
    featureDescription: { fontSize: '14px', color: COLORS.textSecondary, margin: 0, lineHeight: 1.5 },
    sectionTitle: {
        fontSize: '24px', fontWeight: 'bold', color: COLORS.primary,
        marginBottom: '24px', borderBottom: `3px solid ${COLORS.secondary}`, paddingBottom: '8px'
    },
    moduleGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px'
    },
    moduleCard: {
        backgroundColor: COLORS.card, borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)', cursor: 'pointer',
        border: `1px solid ${COLORS.divider}`, overflow: 'hidden'
    },
    moduleImageContainer: { position: 'relative', height: '180px' },
    moduleImage: { width: '100%', height: '100%', objectFit: 'cover' },
    lockOverlay: {
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
        alignItems: 'center', justifyContent: 'center'
    },
    moduleContent: { padding: '20px' },
    moduleHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
    moduleIcon: { width: '28px', height: '28px' },
    moduleTitle: { fontSize: '18px', fontWeight: 600, color: COLORS.textPrimary, margin: 0 },
    proIcon: { width: '20px', height: '20px', color: COLORS.warning, marginLeft: 'auto' },
    moduleDescription: { fontSize: '14px', color: COLORS.textSecondary, margin: 0, lineHeight: 1.6 },
};
