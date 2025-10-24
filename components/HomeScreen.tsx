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

    return (
        <div style={styles.container}>
            <ProgressOverview user={user} progress={progress} />

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
                <div style={{...styles.card, ...styles.chatTrainerCard}} onClick={onStartChatTrainer}>
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
                            </div>
                        )
                    })}
                </div>
            </section>
            
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
        position: 'relative'
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
        color: COLORS.secondary
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
    }
};