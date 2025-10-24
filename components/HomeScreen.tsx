import React, { useState } from 'react';
import { UserProfile, UserProgress, Entitlements, Module, Exercise } from '../types';
import { MODULES, COLORS } from '../constants';
import * as assets from '../assets';
import { hasProAccess } from '../services/monetizationService';
import { ProgressOverview } from './ProgressOverview';
import { ProgressAnalytics } from './ProgressAnalytics';
import { soundService } from '../services/soundService';
import { VideoPlayerModal } from './VideoPlayerModal';
import { PlayIcon, CrownIcon } from './Icons';

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

const MediaDisplay: React.FC<{ src: string; alt: string; style: React.CSSProperties; onPlay?: () => void }> = ({ src, alt, style, onPlay }) => {
    const isVideo = src && src.toLowerCase().endsWith('.mp4');
    if (isVideo) {
        return (
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={onPlay}>
                <video src={src} style={style} muted loop playsInline title={alt} />
                <div style={styles.playIconOverlay}>
                    <PlayIcon style={styles.playIcon} />
                </div>
            </div>
        );
    }
    return <img src={src} alt={alt} style={style} loading="lazy" />;
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
  const isPro = hasProAccess(entitlements);

  const handlePlayVideo = (src: string) => {
    soundService.playClick();
    setVideoModalSrc(src);
    setIsVideoModalOpen(true);
  };

  const handleModuleSelect = (module: Module) => {
    soundService.playClick();
    if (module.isPro && !isPro) {
      onNavigateToPaywall();
    } else {
      onSelectModule(module);
    }
  };

  const isCheckupCompleted = !!progress?.checkupProfile;

  return (
    <div style={styles.container}>
        <header style={styles.header}>
            <MediaDisplay src={assets.homeScreenHeaderVideo} alt="Presentazione CES Coach" style={styles.headerVideo} onPlay={() => handlePlayVideo(assets.homeScreenHeaderVideo)} />
        </header>

        <main style={styles.mainContent}>
            <ProgressOverview user={user} progress={progress} />

            <section style={styles.cardsGrid}>
                {/* Daily Challenge */}
                <div style={{...styles.card, ...styles.dailyChallengeCard}} onClick={() => onStartDailyChallenge(dailyChallenge)}>
                    <h2 style={styles.cardTitle}>Sfida del Giorno</h2>
                    <p style={styles.cardDescription}>{dailyChallenge.title}</p>
                </div>

                {/* Checkup or Competence Report */}
                {isCheckupCompleted ? (
                    <div style={styles.card} onClick={onNavigateToCompetenceReport}>
                        <h2 style={styles.cardTitle}>Report Competenze</h2>
                        <p style={styles.cardDescription}>Analizza i tuoi progressi e le aree di miglioramento.</p>
                    </div>
                ) : (
                    <div style={{...styles.card, ...styles.checkupCard}} onClick={onStartCheckup}>
                        <h2 style={styles.cardTitle}>Check-up Iniziale</h2>
                        <p style={styles.cardDescription}>Scopri il tuo profilo di comunicatore in 3 minuti.</p>
                    </div>
                )}
            </section>
            
            <ProgressAnalytics 
                userProgress={progress || { completedExerciseIds: [], scores: [], competenceScores: { ascolto: 0, riformulazione: 0, assertivita: 0, gestione_conflitto: 0}, analysisHistory: {}, xp: 0, level: 1, streak: 0, lastCompletionDate: null, unlockedBadges: [] }} 
                onNavigateToReport={onNavigateToCompetenceReport}
                onSelectModule={handleModuleSelect}
            />

            <section>
                <h2 style={styles.sectionTitle}>Moduli di Allenamento</h2>
                <div style={styles.modulesGrid}>
                    {MODULES.map(module => (
                        <div key={module.id} style={styles.moduleCard} onClick={() => handleModuleSelect(module)}>
                            {module.isPro && !isPro && <div style={styles.proBadge}><CrownIcon /> PRO</div>}
                            <module.icon style={styles.moduleIcon}/>
                            <h3 style={styles.moduleTitle}>{module.title}</h3>
                            <p style={styles.moduleDescription}>{module.description}</p>
                        </div>
                    ))}
                </div>
            </section>
        </main>
        <VideoPlayerModal isOpen={isVideoModalOpen} onClose={() => setIsVideoModalOpen(false)} videoSrc={videoModalSrc} />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { backgroundColor: COLORS.base },
    header: { height: '300px', width: '100%', position: 'relative', overflow: 'hidden' },
    headerVideo: { width: '100%', height: '100%', objectFit: 'cover' },
    mainContent: { maxWidth: '1000px', margin: '-80px auto 40px', padding: '0 20px', position: 'relative', zIndex: 2 },
    cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '24px' },
    card: { padding: '24px', borderRadius: '12px', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' },
    dailyChallengeCard: { background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`, color: 'white' },
    checkupCard: { backgroundColor: COLORS.card, border: `1px solid ${COLORS.divider}` },
    cardTitle: { fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0' },
    cardDescription: { fontSize: '15px', lineHeight: 1.5, margin: 0, opacity: 0.9 },
    sectionTitle: { fontSize: '24px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '24px' },
    modulesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' },
    moduleCard: { backgroundColor: COLORS.card, padding: '24px', borderRadius: '12px', border: `1px solid ${COLORS.divider}`, cursor: 'pointer', position: 'relative' },
    proBadge: { position: 'absolute', top: '16px', right: '16px', background: COLORS.warning, color: 'black', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' },
    moduleIcon: { width: '32px', height: '32px', color: COLORS.primary, marginBottom: '16px' },
    moduleTitle: { fontSize: '18px', fontWeight: 'bold', color: COLORS.textPrimary, margin: '0 0 8px 0' },
    moduleDescription: { fontSize: '14px', color: COLORS.textSecondary, lineHeight: 1.6, margin: 0 },
    playIconOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    playIcon: { width: '64px', height: '64px', color: 'white', opacity: 0.8 },
};
