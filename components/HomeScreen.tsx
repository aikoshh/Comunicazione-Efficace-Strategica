import React, { useState } from 'react';
import { UserProfile, UserProgress, Entitlements, Module, Exercise } from '../types';
import { COLORS, MODULES } from '../constants';
import * as assets from '../assets';
import { CrownIcon, FlameIcon, LockIcon, SendIcon, TargetIcon, ArrowDownIcon, PlayIcon } from './Icons';
import { ProgressOverview } from './ProgressOverview';
import { soundService } from '../services/soundService';
import { hasProAccess } from '../services/monetizationService';
import { VideoPlayerModal } from './VideoPlayerModal';
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

const MediaPreview: React.FC<{ src: string; alt: string; }> = ({ src, alt }) => {
    const isVideo = src && src.toLowerCase().endsWith('.mp4');
    const style = styles.moduleCardMedia;
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


const MediaDisplay: React.FC<{ src: string; alt: string; style: React.CSSProperties, onClick?: () => void }> = ({ src, alt, style, onClick }) => {
    const isVideo = src && src.toLowerCase().endsWith('.mp4');
    if (isVideo) {
        return (
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={onClick}>
                <video 
                    src={src} 
                    style={style} 
                    muted 
                    playsInline 
                    title={alt} 
                />
                <div style={styles.playIconOverlay}>
                    <PlayIcon color="white" width={48} height={48} />
                </div>
            </div>
        );
    }
    return <img src={src} alt={alt} style={style} loading="lazy" onClick={onClick} />;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
    user,
    progress,
    entitlements,
    dailyChallenge,
    onSelectModule,
    onStartDailyChallenge,
    onStartCheckup,
    onStartChatTrainer,
    onNavigateToPaywall,
    onNavigateToCompetenceReport,
}) => {
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [videoModalSrc, setVideoModalSrc] = useState('');

    const openVideoModal = (src: string) => {
        setVideoModalSrc(src);
        setIsVideoModalOpen(true);
    };

    const isPro = hasProAccess(entitlements);
    const hasCompletedCheckup = !!progress?.checkupProfile;

    const handleChatTrainerClick = () => {
        if (isPro) {
            onStartChatTrainer();
        } else {
            soundService.playClick();
            onNavigateToPaywall();
        }
    };

    return (
        <div style={styles.container}>
             <style>{`
                @keyframes bounce {
                  0%, 20%, 50%, 80%, 100% {
                    transform: translateY(0);
                  }
                  40% {
                    transform: translateY(-10px);
                  }
                  60% {
                    transform: translateY(-5px);
                  }
                }
                .intro-video-container:hover {
                    transform: scale(1.05);
                }
                .intro-video-container:hover .intro-play-icon-overlay {
                    opacity: 1;
                }
              `}</style>
            <ProgressOverview user={user} progress={progress} />

            <section style={styles.introSection}>
                <div style={styles.introVideoContainer} className="intro-video-container" onClick={() => openVideoModal(assets.homeScreenHeaderVideo)}>
                    <img src={assets.ivanoCincinnatoImage} alt="Introduzione alla CES" style={styles.introImage} />
                    <div style={styles.introPlayIconOverlay} className="intro-play-icon-overlay">
                        <PlayIcon color="white" width={48} height={48} />
                    </div>
                </div>
                <h2 style={styles.introTitle}>Inizia ora il tuo allenamento!</h2>
                <ArrowDownIcon style={styles.introArrow} />
            </section>

            <section style={styles.cardsGrid}>
                {/* Daily Challenge Card */}
                <div style={{...styles.card, ...styles.dailyChallengeCard}} onClick={() => onStartDailyChallenge(dailyChallenge)}>
                    <MediaDisplay src={assets.dailyChallengeMedia} alt="Sfida del Giorno" style={styles.cardMedia} onClick={() => openVideoModal(assets.dailyChallengeMedia)} />
                    <div style={styles.cardContent}>
                        <h3 style={styles.cardTitle}><FlameIcon style={{color: COLORS.error}}/> Sfida del Giorno</h3>
                        <p style={styles.cardDescription}>{dailyChallenge.title}</p>
                    </div>
                </div>

                {/* Checkup Card */}
                {!hasCompletedCheckup && (
                    <div style={{...styles.card, ...styles.checkupCard}} onClick={onStartCheckup}>
                        <MediaDisplay src={assets.checkupMedia} alt="Valuta il tuo livello" style={styles.cardMedia} onClick={() => openVideoModal(assets.checkupMedia)} />
                        <div style={styles.cardContent}>
                            <h3 style={styles.cardTitle}><TargetIcon/> Valuta il tuo Livello</h3>
                            <p style={styles.cardDescription}>Inizia con un check-up per scoprire il tuo profilo di comunicatore.</p>
                        </div>
                    </div>
                )}

                 {/* Chat Trainer Card */}
                <div style={{...styles.card, ...styles.chatTrainerCard}} onClick={handleChatTrainerClick}>
                     {!isPro && <div style={styles.proBadge}><CrownIcon/> PRO</div>}
                    <MediaDisplay src={assets.chatTrainerCardImage} alt="Chat Strategica" style={styles.cardMedia} />
                    <div style={styles.cardContent}>
                        <h3 style={styles.cardTitle}><SendIcon/> Chat Strategica (AI Trainer)</h3>
                        <p style={styles.cardDescription}>Usa l'AI per generare risposte strategiche a email e messaggi.</p>
                    </div>
                </div>
            </section>
            
            {progress && progress.completedExerciseIds.length > 0 && (
                <ProgressAnalytics userProgress={progress} onNavigateToReport={onNavigateToCompetenceReport} onSelectModule={onSelectModule} />
            )}

            <section style={styles.modulesSection}>
                <h2 style={styles.sectionTitle}>Moduli di Allenamento <ArrowDownIcon/></h2>
                <div style={styles.modulesGrid}>
                    {MODULES.map(module => {
                        if (module.id === 'm6') { // Special card for Custom Training
                            const isLocked = module.isPro && !isPro;
                            const handleCustomTrainingClick = () => {
                                if (isLocked) {
                                    soundService.playClick();
                                    onNavigateToPaywall();
                                } else {
                                    onSelectModule(module);
                                }
                            };
                            return (
                                <div key={module.id} style={{...styles.moduleCard, ...styles.customTrainingCard}} onClick={handleCustomTrainingClick}>
                                    {isLocked && <div style={{...styles.proBadge, zIndex: 4}}><CrownIcon/> PRO</div>}
                                    <video src={assets.allenamentoPersonalizzatoVideo} style={styles.customTrainingVideoBg} autoPlay loop muted playsInline />
                                    <div style={{...styles.customTrainingOverlay, ...(isLocked ? {backgroundColor: 'rgba(28, 62, 94, 0.8)'} : {})}} />
                                    <div style={styles.customTrainingContent}>
                                        <div style={styles.moduleCardIcon}><module.icon color="white"/></div>
                                        <h3 style={{...styles.moduleCardTitle, color: 'white'}}>{module.title}</h3>
                                        <p style={{...styles.moduleCardDescription, color: '#eee'}}>{module.description}</p>
                                    </div>
                                </div>
                            )
                        }

                        const isLocked = module.isPro && !isPro;
                        const handleModuleClick = () => {
                            if (isLocked) {
                                soundService.playClick();
                                onNavigateToPaywall();
                            } else {
                                onSelectModule(module);
                            }
                        };
                        return (
                            <div key={module.id} style={{...styles.moduleCard, ...(isLocked ? styles.moduleCardLocked : {})}} onClick={handleModuleClick}>
                                {isLocked && <div style={styles.lockOverlay}><LockIcon color="white"/></div>}
                                <div style={styles.moduleCardIcon}><module.icon/></div>
                                <h3 style={styles.moduleCardTitle}>{module.title}</h3>
                                <p style={styles.moduleCardDescription}>{module.description}</p>
                                <div style={styles.moduleCardMediaContainer}>
                                    <MediaPreview src={module.headerImage} alt={module.title} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>
            
            {hasCompletedCheckup && (
                 <div style={{...styles.card, ...styles.checkupCard, marginTop: '48px', textAlign: 'center'}} onClick={onStartCheckup}>
                    <div style={styles.cardContent}>
                        <h3 style={styles.cardTitle}><TargetIcon/> Rifai il Check-up Strategico</h3>
                        <p style={styles.cardDescription}>Misura i tuoi progressi e aggiorna il tuo profilo alla luce dei nuovi allenamenti.</p>
                    </div>
                </div>
            )}

            <VideoPlayerModal 
                isOpen={isVideoModalOpen}
                onClose={() => setIsVideoModalOpen(false)}
                videoSrc={videoModalSrc}
            />
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px',
    },
    introSection: {
        textAlign: 'center',
        margin: '40px 0',
        animation: 'fadeInUp 0.5s ease-out',
    },
    introVideoContainer: {
        position: 'relative',
        width: '180px',
        height: '180px',
        margin: '0 auto 16px',
        cursor: 'pointer',
        borderRadius: '50%',
        overflow: 'hidden',
        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
        transition: 'transform 0.3s ease',
    },
    introImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: '50%',
    },
    introPlayIconOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(28, 62, 94, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0,
        transition: 'opacity 0.3s ease',
    },
    introTitle: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: COLORS.primary,
        margin: '0 0 8px 0',
    },
    introArrow: {
        color: COLORS.secondary,
        width: '32px',
        height: '32px',
        animation: 'bounce 2s infinite',
    },
    cardsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '48px',
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
    },
    dailyChallengeCard: { border: `2px solid ${COLORS.error}` },
    checkupCard: { border: `2px solid ${COLORS.secondary}` },
    chatTrainerCard: { border: `2px solid ${COLORS.warning}` },
    cardMedia: {
        width: '100%',
        height: '180px',
        objectFit: 'cover',
    },
    cardContent: {
        padding: '20px',
        flex: 1
    },
    cardTitle: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        margin: '0 0 8px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    cardDescription: {
        fontSize: '15px',
        color: COLORS.textSecondary,
        lineHeight: 1.6,
        margin: 0,
    },
    proBadge: {
        position: 'absolute',
        top: '12px',
        right: '12px',
        backgroundColor: 'rgba(255,193,7, 0.9)',
        color: COLORS.textPrimary,
        padding: '4px 10px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        zIndex: 2,
    },
    playIconOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modulesSection: {
        marginTop: '48px',
    },
    sectionTitle: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: '24px',
        borderBottom: `3px solid ${COLORS.secondary}`,
        paddingBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    modulesGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
    },
    moduleCard: {
        backgroundColor: COLORS.card,
        padding: '24px',
        borderRadius: '12px',
        border: `1px solid ${COLORS.divider}`,
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
    },
    moduleCardLocked: {
        backgroundColor: COLORS.cardDark,
    },
    lockOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(28, 62, 94, 0.7)',
        color: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '12px',
        zIndex: 2
    },
    moduleCardIcon: {
        width: '48px',
        height: '48px',
        margin: '0 auto 16px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '50%',
        backgroundColor: COLORS.secondary + '20',
        color: COLORS.secondary,
        flexShrink: 0
    },
    moduleCardTitle: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        margin: '0 0 8px 0',
    },
    moduleCardDescription: {
        fontSize: '14px',
        color: COLORS.textSecondary,
        lineHeight: 1.5,
        margin: 0,
        flex: '1 1 auto'
    },
    moduleCardMediaContainer: {
        marginTop: '16px',
        borderRadius: '8px',
        overflow: 'hidden',
        height: '120px',
        backgroundColor: COLORS.cardDark
    },
    moduleCardMedia: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    customTrainingCard: {
        position: 'relative',
        overflow: 'hidden',
        padding: '24px',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        minHeight: '280px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
    },
    customTrainingVideoBg: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: 'translate(-50%, -50%)',
        zIndex: 1,
    },
    customTrainingOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(28, 62, 94, 0.6)',
        zIndex: 2,
    },
    customTrainingContent: {
        position: 'relative',
        zIndex: 3,
    }
};