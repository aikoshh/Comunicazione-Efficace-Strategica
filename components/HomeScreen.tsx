import React, { useState } from 'react';
import { UserProfile, UserProgress, Module, Entitlements } from '../types';
import { MODULES, COLORS } from '../constants';
import { hasProAccess } from '../services/monetizationService';
import { LockIcon, CrownIcon, PlayIcon, TargetIcon, LightbulbIcon } from './Icons';
import { soundService } from '../services/soundService';
import { ProgressOverview } from './ProgressOverview';
import { ProgressAnalytics } from './ProgressAnalytics';
import { VideoPlayerModal } from './VideoPlayerModal';
import { 
    checkupHeaderImage,
    dailyChallengeHeaderImage,
} from '../assets';

type Screen = 'preloading' | 'login' | 'home' | 'module' | 'exercise' | 'analysisReport' | 'strategicCheckup' | 'communicatorProfile' | 'customSetup' | 'chatTrainer' | 'apiKeyError' | 'paywall' | 'admin' | 'achievements' | 'competence_report' | 'levels';

interface HomeScreenProps {
    user: UserProfile;
    progress: UserProgress | undefined;
    onSelectModule: (module: Module) => void;
    onStartCheckup: () => void;
    onNavigateToReport: () => void;
    onStartDailyChallenge: () => void;
    entitlements: Entitlements | null;
    onNavigate: (screen: Screen) => void;
}

const MediaDisplay: React.FC<{ src: string; alt: string; style: React.CSSProperties, className?: string }> = ({ src, alt, style, className }) => {
    const isVideo = src && src.toLowerCase().endsWith('.mp4');
    if (isVideo) {
        return (
            <video 
                src={src} 
                style={style} 
                className={className}
                autoPlay 
                muted 
                loop 
                playsInline 
                title={alt} 
            />
        );
    }
    return <img src={src} alt={alt} style={style} className={className} loading="lazy" />;
};

const hoverStyles = `
    .action-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 28px rgba(0,0,0,0.15);
    }
    .module-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 28px rgba(0,0,0,0.15);
    }
    .module-card:hover .module-image {
        transform: scale(1.05);
    }
    .module-card:hover .play-icon {
        transform: scale(1.2);
    }
`;

export const HomeScreen: React.FC<HomeScreenProps> = ({ user, progress, onSelectModule, onStartCheckup, onNavigateToReport, onStartDailyChallenge, entitlements, onNavigate }) => {
    const [videoToPlay, setVideoToPlay] = useState<string | null>(null);
    const isPro = hasProAccess(entitlements);

    const handleModuleClick = (module: Module) => {
        soundService.playClick();
        if (module.isPro && !isPro) {
            onNavigate('paywall');
        } else {
            onSelectModule(module);
        }
    };

    const isCheckupCompleted = !!progress?.checkupProfile;
    const hasProgress = progress && progress.completedExerciseIds.length > 0;

    const handlePlayVideo = (e: React.MouseEvent, videoSrc: string) => {
        e.stopPropagation();
        soundService.playClick();
        setVideoToPlay(videoSrc);
    }
    
    return (
        <div style={styles.pageContainer}>
            <style>{hoverStyles}</style>
            
            <main style={styles.mainContent}>
                <ProgressOverview user={user} progress={progress} />
                
                <section style={styles.actionsGrid}>
                    {!isCheckupCompleted && (
                        <div className="action-card" style={styles.actionCard} onClick={onStartCheckup}>
                           <MediaDisplay src={checkupHeaderImage} alt="Valuta il tuo livello" style={styles.actionCardImage} />
                           <div style={styles.actionCardContent}>
                               <TargetIcon style={styles.actionCardIcon} />
                               <div>
                                   <h2 style={styles.actionCardTitle}>Valuta il tuo Livello</h2>
                                   <p style={styles.actionCardText}>Inizia con 3 domande per scoprire il tuo profilo di comunicatore.</p>
                               </div>
                           </div>
                        </div>
                    )}
                     <div className="action-card" style={styles.actionCard} onClick={onStartDailyChallenge}>
                        <MediaDisplay src={dailyChallengeHeaderImage} alt="Sfida del giorno" style={styles.actionCardImage} />
                        <div style={styles.actionCardContent}>
                            <LightbulbIcon style={styles.actionCardIcon} />
                            <div>
                                <h2 style={styles.actionCardTitle}>Sfida del Giorno</h2>
                                <p style={styles.actionCardText}>Un esercizio quotidiano per tenerti in allenamento. Inizia ora!</p>
                            </div>
                        </div>
                    </div>
                </section>
                
                {hasProgress && progress && (
                    <ProgressAnalytics userProgress={progress} onNavigateToReport={onNavigateToReport} onSelectModule={handleModuleClick} />
                )}
                
                <section>
                    <h2 style={styles.sectionTitle}>Moduli di Allenamento</h2>
                    <div style={styles.modulesGrid}>
                        {MODULES.map(module => {
                            const isProModule = module.isPro;
                            const isLocked = isProModule && !isPro;

                            return (
                                <div key={module.id} className="module-card" style={styles.moduleCard} onClick={() => handleModuleClick(module)}>
                                    <div style={styles.moduleImageContainer}>
                                        <MediaDisplay src={module.headerImage || ''} alt={module.title} style={styles.moduleImage} className="module-image" />
                                        <div style={styles.moduleImageOverlay} />
                                        {module.headerImage?.toLowerCase().endsWith('.mp4') && (
                                            <div style={styles.playIcon} className="play-icon" onClick={(e) => handlePlayVideo(e, module.headerImage!)}>
                                                <PlayIcon/>
                                            </div>
                                        )}
                                        {isLocked && <div style={styles.lockOverlay}><LockIcon/><p>PRO</p></div>}
                                    </div>
                                    <div style={styles.moduleContent}>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: module.color}}>
                                            <module.icon/>
                                            <h3 style={styles.moduleTitle}>{module.title}</h3>
                                            {isProModule && <CrownIcon style={{width: 18, height: 18}}/>}
                                        </div>
                                        <p style={styles.moduleDescription}>{module.description}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>

            </main>
             {videoToPlay && <VideoPlayerModal isOpen={!!videoToPlay} onClose={() => setVideoToPlay(null)} videoSrc={videoToPlay} />}
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    pageContainer: { backgroundColor: COLORS.base },
    mainContent: { maxWidth: '1200px', margin: '40px auto', padding: '0 32px' },
    actionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '48px' },
    actionCard: { backgroundColor: COLORS.card, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'all 0.3s ease' },
    actionCardImage: { width: '100%', height: '150px', objectFit: 'cover' },
    actionCardContent: { padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' },
    actionCardIcon: { width: 28, height: 28, color: COLORS.secondary, flexShrink: 0 },
    actionCardTitle: { fontSize: '18px', fontWeight: 'bold', color: COLORS.textPrimary, margin: '0 0 4px 0' },
    actionCardText: { fontSize: '14px', color: COLORS.textSecondary, margin: 0, lineHeight: 1.5 },
    sectionTitle: { fontSize: '24px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '24px', borderBottom: `3px solid ${COLORS.secondary}`, paddingBottom: '8px' },
    modulesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' },
    moduleCard: { backgroundColor: COLORS.card, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column' },
    moduleImageContainer: { position: 'relative', height: '180px', overflow: 'hidden' },
    moduleImage: { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' },
    moduleImageOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 50%)' },
    playIcon: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 50, height: 50, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.primary, transition: 'transform 0.2s ease' },
    lockOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(28, 62, 94, 0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: '8px' },
    moduleContent: { padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' },
    moduleTitle: { fontSize: '18px', fontWeight: 'bold', margin: 0 },
    moduleDescription: { fontSize: '14px', color: COLORS.textSecondary, margin: '12px 0 0 0', lineHeight: 1.5, flex: 1 },
};
