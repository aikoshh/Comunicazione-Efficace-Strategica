import React, { useEffect } from 'react';
import type { CommunicatorProfile } from '../types';
import { COLORS } from '../constants';
import { CheckCircleIcon, TargetIcon } from './Icons';
import { soundService } from '../services/soundService';

interface CommunicatorProfileScreenProps {
  profile?: CommunicatorProfile;
  onContinue: () => void;
}

export const CommunicatorProfileScreen: React.FC<CommunicatorProfileScreenProps> = ({ profile, onContinue }) => {

    useEffect(() => {
        soundService.playSuccess();
    }, []);

  if (!profile) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Errore nella Generazione del Profilo</h1>
          <p style={styles.description}>
            Non è stato possibile generare il tuo profilo. Per favore, prova a ricaricare la pagina.
          </p>
          <button onClick={onContinue} style={styles.button}>Torna alla Home</button>
        </div>
      </div>
    );
  }

  const handleContinueClick = () => {
    soundService.playClick();
    onContinue();
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{animation: 'popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both'}}>
            <p style={styles.congratsText}>Check-up Completato!</p>
            <h1 style={styles.title}>Il tuo Profilo del Comunicatore è:</h1>
            <h2 style={styles.profileTitle}>{profile.profileTitle}</h2>
            <p style={styles.description}>{profile.profileDescription}</p>
        </div>

        <div style={styles.feedbackGrid}>
            <div style={{...styles.feedbackCard, animation: 'fadeInUp 0.5s 0.4s ease-out both'}}>
                <h3 style={styles.sectionTitle}><CheckCircleIcon style={{color: COLORS.success}}/> I tuoi Punti di Forza</h3>
                <ul style={styles.list}>
                    {profile.strengths.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
            </div>
            <div style={{...styles.feedbackCard, animation: 'fadeInUp 0.5s 0.6s ease-out both'}}>
                <h3 style={styles.sectionTitle}><TargetIcon style={{color: COLORS.warning}}/> Le tue Aree di Allenamento</h3>
                <ul style={styles.list}>
                    {profile.areasToImprove.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
            </div>
        </div>
        
        <div style={{animation: 'fadeInUp 0.5s 0.8s ease-out both'}}>
            <p style={styles.nextStepText}>
                Ora sei pronto per iniziare il tuo percorso di allenamento. Usa questo profilo come guida per scegliere i tuoi primi moduli.
            </p>
            <button onClick={handleContinueClick} style={styles.button}>Inizia Allenamento</button>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: COLORS.base,
    padding: '20px',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '800px',
    textAlign: 'center',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
  },
  congratsText: {
    color: COLORS.secondary,
    fontSize: '16px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: '28px',
    color: COLORS.textPrimary,
    marginTop: '8px',
    marginBottom: '16px',
  },
  profileTitle: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: COLORS.primary,
    background: `linear-gradient(45deg, ${COLORS.primary}, ${COLORS.secondary})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '0 auto 16px',
  },
  description: {
    fontSize: '18px',
    color: COLORS.textSecondary,
    lineHeight: 1.6,
    maxWidth: '600px',
    margin: '0 auto 32px',
  },
  feedbackGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    textAlign: 'left',
    marginBottom: '40px',
  },
  feedbackCard: {
      backgroundColor: COLORS.cardDark,
      padding: '24px',
      borderRadius: '12px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: COLORS.textPrimary,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  list: {
    listStylePosition: 'inside',
    paddingLeft: 0,
    margin: 0,
    fontSize: '16px',
    lineHeight: 1.7,
    color: COLORS.textSecondary,
  },
  nextStepText: {
    fontSize: '16px',
    color: COLORS.textSecondary,
    marginBottom: '24px',
  },
  button: {
    padding: '14px 28px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'white',
    background: COLORS.primaryGradient,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, filter 0.2s ease'
  },
};