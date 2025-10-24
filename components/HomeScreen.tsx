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
        soundService.playClick();
        setVideoModalSrc(src);
        setIsVideoModalOpen(true);
    };

    const isPro = hasProAccess(entitlements);
    const hasCompletedCheckup = !!progress?.checkupProfile;

    const allModules = MODULES;
    const unlockedModules = allModules.filter(m => {
        if (m.prerequisites.length === 0) return true;
        return m.prerequisites.every(p => progress?.completedExerciseIds.includes(p));
    });

    const checkupModule = allModules.find(m => m.id === 'm6');

    return (
        <div style={styles.container} className="home-screen-container">
            <div style={{...styles.welcomeContainer, animation: 'fadeInUp 0.5s ease-out both'}}>
                <ProgressOverview user={user} progress={progress} />
            </div>

            <div style={styles.introSection}>
                <div style={styles.introImageContainer} onClick={() => openVideoModal(assets.homeScreenHeaderVideo)}>
                    <img src={assets.ivanoCincinnatoImage} alt="Dr. Ivano Cincinnato" style={styles.introImage} />
                    <div style={styles.playOverlay}><PlayIcon color="white" width={32} height={32}/></div>
                </div>
                <h2 style={styles.introTitle}>Inizia ora il tuo allenamento!</h2>
                <ArrowDownIcon style={styles.arrowDown} />
            </div>

            <div style={styles.mainGrid}>
                {/* Daily Challenge */}
                <div style={{...styles.highlightCard, ...styles.dailyChallengeCard}} onClick={() => onStartDailyChallenge(dailyChallenge)}>
                    <div style={styles.highlightContent}>
                        <h3 style={styles.highlightTitle}><FlameIcon/> Sfida del Giorno</h3>
                        <p style={styles.highlightDescription}>{dailyChallenge.title}</p>
                    </div>
                    <img src={assets.dailyChallengeHeaderImage} style={styles.highlightImage} alt="Sfida del Giorno"/>
                </div>

                {/* Chat Trainer */}
                <div style={{...styles.highlightCard, ...styles.chatTrainerCard}} onClick={() => isPro ? onStartChatTrainer() : onNavigateToPaywall()}>
                    {!isPro && <div style={styles.proBadge}><CrownIcon/> PRO</div>}
                    <div style={styles.highlightContent}>
                        <h3 style={styles.highlightTitle}><SendIcon/> Chat Strategica (AI Trainer)</h3>
                        <p style={styles.highlightDescription}>Genera risposte strategiche a email e messaggi.</p>
                    </div>
                     <img src={assets.chatTrainerCardImage} style={styles.highlightImage} alt="Chat Strategica"/>
                </div>
            </div>
            
             <section style={styles.modulesSection}>
                <h2 style={styles.sectionTitle}>Il Tuo Percorso del Comunicatore</h2>
                <div style={styles.pathContainer}>
                    {allModules.filter(m => !m.isCustom && m.id !== 'm7').map((module, index) => {
                        const isUnlocked = unlockedModules.some(unlocked => unlocked.id === module.id);
                        const isModulePro = module.isPro && !isPro;
                        const isLocked = !isUnlocked || isModulePro;
                        const progressCount = module.exercises.length > 0 ? `${module.exercises.filter(e => progress?.completedExerciseIds.includes(e.id)).length} / ${module.exercises.length}` : '';
                        
                        return (
                             <div key={module.id} style={{...styles.moduleCard, animation: `fadeInUp 0.5s ${index * 0.1}s ease-out both`}}>
                                <div style={{...styles.moduleContent, ...(isLocked ? styles.moduleLocked : {})}} onClick={() => !isLocked ? onSelectModule(module) : (isModulePro ? onNavigateToPaywall() : {})}>
                                    {isLocked && (
                                        <div style={styles.lockIcon}>
                                            {isModulePro ? <CrownIcon width={24} height={24}/> : <LockIcon width={24} height={24}/>}
                                        </div>
                                    )}
                                    <div style={{...styles.moduleIcon, backgroundColor: isLocked ? COLORS.divider : `${COLORS.secondary}20`, color: isLocked ? COLORS.textSecondary : COLORS.secondary}}><module.icon/></div>
                                    <div>
                                        <div style={styles.moduleTitleContainer}>
                                            <h3 style={styles.moduleTitle}>{module.title}</h3>
                                            {progressCount && isUnlocked && <span style={styles.progressCount}>{progressCount}</span>}
                                        </div>
                                        <p style={styles.moduleDescription}>{module.description}</p>
                                    </div>
                                    {isUnlocked && (
                                        <div style={styles.moduleFooter}>
                                             <div style={styles.progressBar}>
                                                <div style={{width: `${(module.exercises.filter(e => progress?.completedExerciseIds.includes(e.id)).length / module.exercises.length) * 100}%`, height: '100%', backgroundColor: COLORS.secondary, borderRadius: '2px'}}/>
                                            </div>
                                            <button style={styles.improveButton}>Migliora adesso!</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>
            
            {checkupModule && (
                <div style={{...styles.highlightCard, ...styles.customModuleCard}} onClick={() => onSelectModule(checkupModule)}>
                    <video src={checkupModule.headerImage} style={styles.customModuleVideo} autoPlay loop muted playsInline/>
                    <div style={styles.highlightContent}>
                        <h3 style={styles.highlightTitle}>{hasCompletedCheckup ? "Rifai il Check-up Strategico" : "Allenamento Personalizzato"}</h3>
                        <p style={styles.highlightDescription}>{hasCompletedCheckup ? "Misura i tuoi progressi e aggiorna il tuo profilo." : "Crea un esercizio su misura per le tue sfide."}</p>
                    </div>
                </div>
            )}
            
            {progress && (
                <ProgressAnalytics userProgress={progress} onNavigateToReport={onNavigateToCompetenceReport} onSelectModule={onSelectModule} />
            )}

            {hasCompletedCheckup && (
                <div style={{...styles.highlightCard, ...styles.checkupCard}} onClick={onStartCheckup}>
                    <div style={styles.highlightContent}>
                        <h3 style={styles.highlightTitle}><TargetIcon/> Rifai il Check-up Strategico</h3>
                        <p style={styles.highlightDescription}>Misura i tuoi progressi e aggiorna il tuo profilo alla luce dei nuovi allenamenti.</p>
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
    container: { maxWidth: '1200px', margin: '0 auto', padding: '24px', },
    welcomeContainer: { marginBottom: '32px' },
    introSection: { textAlign: 'center', marginBottom: '48px', },
    introImageContainer: {
        position: 'relative', width: '130px', height: '130px', margin: '0 auto 16px',
        cursor: 'pointer', borderRadius: '50%', boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
    },
    introImage: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' },
    playOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '50%',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        opacity: 0, transition: 'opacity 0.2s',
    },
    introTitle: { fontSize: '20px', fontWeight: 'bold', color: COLORS.primary, margin: '0 0 8px 0' },
    arrowDown: { color: COLORS.secondary, animation: 'bounce 2s infinite' },
    mainGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px', marginBottom: '48px',
    },
    highlightCard: {
        backgroundColor: COLORS.card, borderRadius: '16px', overflow: 'hidden',
        boxShadow: '0 8px 25px rgba(0,0,0,0.08)', cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        display: 'flex', alignItems: 'center', gap: '20px', padding: '24px',
        position: 'relative'
    },
    dailyChallengeCard: { border: `2px solid ${COLORS.error}` },
    chatTrainerCard: { border: `2px solid ${COLORS.warning}` },
    checkupCard: { border: `2px solid ${COLORS.secondary}` },
    highlightContent: { flex: 1 },
    highlightTitle: {
        fontSize: '18px', fontWeight: 'bold', color: COLORS.textPrimary,
        margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px'
    },
    highlightDescription: { fontSize: '15px', color: COLORS.textSecondary, lineHeight: 1.6, margin: 0, },
    highlightImage: { width: '80px', height: '80px', objectFit: 'cover', borderRadius: '12px' },
    proBadge: {
        position: 'absolute', top: '12px', right: '12px',
        backgroundColor: 'rgba(255,193,7, 0.9)', color: COLORS.textPrimary,
        padding: '4px 10px', borderRadius: '8px', fontSize: '12px',
        fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 2,
    },
    modulesSection: { marginTop: '48px' },
    sectionTitle: {
        fontSize: '24px', fontWeight: 'bold', color: COLORS.primary,
        marginBottom: '24px', borderBottom: `3px solid ${COLORS.secondary}`,
        paddingBottom: '8px',
    },
    pathContainer: {
        display: 'flex', flexDirection: 'column', gap: '16px',
    },
    moduleCard: { position: 'relative' },
    moduleContent: {
        backgroundColor: COLORS.card, padding: '20px', borderRadius: '12px',
        border: `1px solid ${COLORS.divider}`, display: 'flex', gap: '20px',
        alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s ease',
    },
    moduleLocked: { filter: 'grayscale(1)', opacity: 0.7, cursor: 'not-allowed' },
    lockIcon: {
        position: 'absolute', top: '20px', right: '20px', color: 'white',
        backgroundColor: 'rgba(0,0,0,0.5)', padding: '8px', borderRadius: '50%'
    },
    moduleIcon: {
        width: '48px', height: '48px', flexShrink: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        borderRadius: '12px',
    },
    moduleTitleContainer: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' },
    moduleTitle: { fontSize: '18px', fontWeight: 'bold', color: COLORS.textPrimary, margin: 0 },
    progressCount: {
        fontSize: '14px', fontWeight: 'bold', color: COLORS.secondary,
        background: `${COLORS.secondary}20`, padding: '2px 8px', borderRadius: '6px'
    },
    moduleDescription: { fontSize: '14px', color: COLORS.textSecondary, lineHeight: 1.5, margin: 0 },
    moduleFooter: { marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' },
    progressBar: { height: '6px', flex: 1, backgroundColor: COLORS.divider, borderRadius: '3px' },
    improveButton: {
        padding: '8px 16px', fontSize: '14px', fontWeight: 'bold',
        border: 'none', backgroundColor: COLORS.secondary, color: 'white',
        borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap',
    },
    customModuleCard: {
      flexDirection: 'column',
      alignItems: 'stretch',
      padding: 0,
      height: '220px',
      marginBottom: '24px',
    },
    customModuleVideo: {
        position: 'absolute',
        top: 0, left: 0, width: '100%', height: '100%',
        objectFit: 'cover',
        borderRadius: '16px',
        zIndex: 0,
    }
};