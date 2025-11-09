// components/VoiceAnalysisReportScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import { VoiceAnalysisResult, Exercise, Entitlements } from '../types';
import { COLORS, VOICE_RUBRIC_CRITERIA } from '../constants';
import { RetryIcon, NextIcon, LightbulbIcon, TargetIcon, DownloadIcon, HomeIcon, SpeakerIcon, PlayIcon } from './Icons';
import { hasProAccess } from '../services/monetizationService';
import { soundService } from '../services/soundService';
import { UpsellBanner } from './UpsellBanner';
import { PRODUCTS } from '../products';
import { printService } from '../services/printService';
import { PrintPreviewModal } from './PrintPreviewModal';
import { useToast } from '../hooks/useToast';
import { synthesizeSpeech } from '../services/textToSpeechService';
import { Spinner } from './Loader';
import { mainLogoUrl } from '../assets';
import { useSpeech } from '../hooks/useSpeech';

interface VoiceAnalysisReportScreenProps {
  result: VoiceAnalysisResult;
  exercise: Exercise;
  onRetry: () => void;
  onNextExercise: () => void;
  nextExerciseLabel: string;
  entitlements: Entitlements | null;
  onNavigateToPaywall: () => void;
  userResponse: string;
  isReview?: boolean;
}

export const VoiceAnalysisReportScreen: React.FC<VoiceAnalysisReportScreenProps> = ({
  result, exercise, onRetry, onNextExercise, nextExerciseLabel, entitlements, onNavigateToPaywall, userResponse, isReview
}) => {
  const isPro = hasProAccess(entitlements);
  const [printHtml, setPrintHtml] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { addToast } = useToast();
  
  // Get local TTS functions as a fallback
  const { speak: localSpeak, isSpeaking: isLocalSpeaking, cancelSpeaking: cancelLocalSpeaking } = useSpeech();

  const overallScore = Math.round((result.scores || []).reduce((acc, s) => acc + s.score, 0) / (result.scores?.length || 1) * 10);
  
  useEffect(() => {
    if(!isReview) {
        soundService.playScoreSound(overallScore);
    }
    window.scrollTo(0, 0);
    // Cleanup audio on unmount
    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
            URL.revokeObjectURL(audioRef.current.src);
        }
        // Also cancel local speech
        cancelLocalSpeaking();
    };
  }, [overallScore, isReview, cancelLocalSpeaking]);
  
  const handlePrint = async () => {
    soundService.playClick();
    if (!isPro) {
        onNavigateToPaywall();
        return;
    }
    const html = printService.getReportHTML('print-area-voice', `Report Vocale: ${exercise.title}`);
    setPrintHtml(html);
    setIsPrintModalOpen(true);
  };
  
  const handlePlayIdeal = async () => {
      soundService.playClick();

      // If cloud audio is playing, stop it
      if (isPlaying && audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setIsPlaying(false);
          return;
      }
      
      // If local audio is playing, stop it
      if (isLocalSpeaking) {
          cancelLocalSpeaking();
          return;
      }

      setIsSynthesizing(true);
      try {
          const audio = await synthesizeSpeech(result.suggested_delivery.ideal_script);
          
          if (audio) { // Success with cloud TTS
              audioRef.current = audio;

              const onEnded = () => {
                  setIsPlaying(false);
                  if (audioRef.current) URL.revokeObjectURL(audioRef.current.src);
                  audioRef.current = null;
              };

              audio.addEventListener('play', () => setIsPlaying(true));
              audio.addEventListener('pause', () => setIsPlaying(false));
              audio.addEventListener('ended', onEnded);
              
              await audio.play();
          } else { // Fallback to local TTS
              addToast("Voce PRO non disponibile, si userà la voce di sistema.", 'info');
              localSpeak(result.suggested_delivery.ideal_script);
          }

      } catch (error: any) {
          addToast(error.message || "Errore durante la sintesi vocale. Si userà la voce di sistema.", 'error');
          localSpeak(result.suggested_delivery.ideal_script);
      } finally {
          setIsSynthesizing(false);
      }
  };

  const renderPlayButtonContent = () => {
      if (isSynthesizing) {
          return <Spinner size={22} color="white" />;
      }
      if (isPlaying || isLocalSpeaking) {
          return <>Ferma</>;
      }
      return <><PlayIcon /> Ascolta Versione Ideale</>;
  };

  return (
    <div style={styles.container} className="report-screen-mobile-padding">
      <div id="print-area-voice" style={styles.card}>
        <div style={styles.header}>
            <h1 style={styles.title}>Report Analisi Vocale</h1>
            {isPro && <button onClick={handlePrint} style={styles.printButton} className="no-print"><DownloadIcon/> Esporta PDF</button>}
        </div>

        <div style={styles.userResponseContainer}>
            <h2 style={{...styles.sectionTitle, color: COLORS.textAccent}}>La Tua Risposta (Trascrizione)</h2>
            <p style={styles.userResponseText}>"{userResponse}"</p>
        </div>

        {result.realTimeMetricsSummary && (
             <div style={{...styles.section, backgroundColor: COLORS.cardDark, padding: '20px', borderRadius: '12px'}}>
                <h2 style={{...styles.sectionTitle, borderBottom: 'none'}}>Riepilogo Performance Live</h2>
                <div style={styles.metricsGrid}>
                    <div><strong>Ritmo Medio:</strong> {result.realTimeMetricsSummary.avgWpm} parole/minuto</div>
                    <div><strong>Parole Riempitive:</strong> {result.realTimeMetricsSummary.totalFillers}</div>
                    <div><strong>Conteggio Pause:</strong> {result.realTimeMetricsSummary.totalPauses}</div>
                    <div><strong>Variazione Tono:</strong> {result.realTimeMetricsSummary.avgPitchVariation.toFixed(0)} / 100</div>
                    <div><strong>Gamma Dinamica:</strong> {result.realTimeMetricsSummary.avgDynamicRange.toFixed(0)} / 100</div>
                </div>
            </div>
        )}

        <div style={styles.rubricContainer}>
            <h2 style={{...styles.sectionTitle, borderBottom: 'none'}}><TargetIcon style={{color: COLORS.primary}}/> Analisi Paraverbale (AI)</h2>
            {(result.scores || []).map((item) => {
                const criterion = VOICE_RUBRIC_CRITERIA.find(c => c.id === item.criterion_id);
                return (
                    <div key={item.criterion_id} style={styles.rubricItem}>
                        <div style={styles.rubricLabel}>{criterion?.label || item.criterion_id}</div>
                        <div style={styles.rubricMeterContainer}>
                            <div style={{...styles.rubricMeter, width: `${item.score * 10}%`}} />
                            <span>{item.score}/10</span>
                        </div>
                        <div style={styles.rubricJustification}>{item.justification}</div>
                    </div>
                )
            })}
        </div>

        <div style={styles.section}>
            <h2 style={styles.sectionTitle}><LightbulbIcon style={{color: COLORS.secondary}}/> Feedback del Coach</h2>
            <div style={styles.feedbackGrid}>
                <div style={styles.feedbackCard}>
                    <h3>Punti di Forza</h3>
                    <ul>{(result.strengths || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
                <div style={styles.feedbackCard}>
                    <h3>Aree di Miglioramento</h3>
                    <ul>{(result.improvements || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
            </div>
        </div>

        {isPro ? (
          <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Consegna Ideale (PRO)</h2>
              <div style={styles.idealDeliveryContainer}>
                  <p><strong>Istruzioni:</strong> {result.suggested_delivery.instructions}</p>
                  <p><strong>Testo annotato:</strong> {result.suggested_delivery.annotated_text}</p>
                  <button onClick={handlePlayIdeal} style={styles.playButton} disabled={isSynthesizing}>
                      {renderPlayButtonContent()}
                  </button>
              </div>
          </div>
        ) : (
             <UpsellBanner product={PRODUCTS[0]} score={overallScore} onDetails={onNavigateToPaywall}/>
        )}
      </div>

      <div style={styles.buttonContainer}>
          {isReview ? (
             <>
                <button onClick={onRetry} style={styles.secondaryButton}><RetryIcon /> Riprova Esercizio</button>
                <button onClick={onNextExercise} style={styles.primaryButton}><HomeIcon /> {nextExerciseLabel}</button>
            </>
          ) : (
            <>
                <button onClick={onRetry} style={styles.secondaryButton}><RetryIcon /> Riprova</button>
                <button onClick={onNextExercise} style={styles.primaryButton}>{nextExerciseLabel} <NextIcon /></button>
            </>
          )}
      </div>
       <div style={styles.logoContainer}>
        <img src={mainLogoUrl} alt="CES Coach Logo" style={styles.footerLogo} />
      </div>
      <PrintPreviewModal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} htmlContent={printHtml} onPrint={() => printService.triggerPrint(printHtml!)} />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { backgroundColor: COLORS.base, padding: '40px 20px' },
  card: { backgroundColor: COLORS.card, borderRadius: '12px', padding: '32px', maxWidth: '900px', margin: '0 auto', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', border: `1px solid ${COLORS.divider}` },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${COLORS.divider}`, paddingBottom: '16px', marginBottom: '24px' },
  title: { fontSize: '28px', fontWeight: 'bold', color: COLORS.textPrimary, margin: 0 },
  printButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: `1px solid ${COLORS.secondary}`, backgroundColor: 'transparent', color: COLORS.secondary, borderRadius: '8px', cursor: 'pointer' },
  userResponseContainer: { backgroundColor: COLORS.cardDark, padding: '20px', borderRadius: '12px', marginBottom: '24px' },
  userResponseText: { fontSize: '16px', fontStyle: 'italic', color: COLORS.textSecondary, lineHeight: 1.7, margin: 0 },
  section: { marginBottom: '32px' },
  sectionTitle: { fontSize: '20px', color: COLORS.textPrimary, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: `2px solid ${COLORS.secondary}`, paddingBottom: '8px' },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    fontSize: '15px'
  },
  rubricContainer: { marginBottom: '32px' },
  rubricItem: { borderBottom: `1px solid ${COLORS.divider}`, padding: '16px 0' },
  rubricLabel: { fontWeight: 600, fontSize: '16px', marginBottom: '8px' },
  rubricMeterContainer: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' },
  rubricMeter: { height: '10px', backgroundColor: COLORS.secondary, borderRadius: '5px' },
  rubricJustification: { fontSize: '14px', color: COLORS.textSecondary, fontStyle: 'italic' },
  
  feedbackGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' },
  feedbackCard: { backgroundColor: COLORS.cardDark, padding: '16px', borderRadius: '8px' },
  
  idealDeliveryContainer: {
    backgroundColor: 'rgba(88, 166, 166, 0.1)',
    padding: '20px',
    borderRadius: '8px',
  },
  playButton: {
      marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      padding: '10px 16px', border: 'none', backgroundColor: COLORS.secondary,
      color: 'white', borderRadius: '8px', cursor: 'pointer', minWidth: '220px', minHeight: '41px'
  },
  
  buttonContainer: { display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '32px' },
  secondaryButton: { padding: '12px 24px', fontSize: '16px', border: `1px solid ${COLORS.secondary}`, backgroundColor: 'transparent', color: COLORS.secondary, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  primaryButton: { padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', border: 'none', backgroundColor: COLORS.secondary, color: 'white', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  logoContainer: { textAlign: 'center', paddingTop: '40px', paddingBottom: '40px' },
  footerLogo: { width: '150px', height: 'auto', opacity: 0.7 }
};