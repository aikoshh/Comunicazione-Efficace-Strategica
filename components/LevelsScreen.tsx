// components/LevelsScreen.tsx
import React from 'react';
import { COLORS } from '../constants';
import { mainLogoUrl } from '../assets';

interface LevelsScreenProps {
}

const levels = [
  {
    label: "Comunicatore poco efficace",
    scoreRange: "0-39",
    description: "Tendi a comunicare in modo reattivo. Il tuo focus è sul problema immediato, ma potresti perdere di vista l'obiettivo strategico a lungo termine.",
    color: COLORS.error,
  },
  {
    label: "Comunicatore quasi efficace",
    scoreRange: "40-69",
    description: "Stai iniziando a usare tecniche di comunicazione più consapevoli. A volte riesci a essere strategico, ma non in modo consistente, specialmente sotto pressione.",
    color: COLORS.warning,
  },
  {
    label: "Comunicatore efficace",
    scoreRange: "70-89",
    description: "Sei un buon comunicatore. Gestisci la maggior parte delle situazioni con efficacia, ascolti attivamente e formuli i tuoi messaggi in modo chiaro.",
    color: COLORS.success,
  },
  {
    label: "Comunicatore efficace e strategico",
    scoreRange: "90-100",
    description: "Eccellente! Non solo comunichi chiaramente, ma lo fai con uno scopo preciso. Sai come guidare le conversazioni per raggiungere risultati specifici, mantenendo relazioni positive.",
    color: COLORS.secondary,
  },
];

export const LevelsScreen: React.FC<LevelsScreenProps> = () => {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Livelli di Competenza</h1>
        <p style={styles.subtitle}>
          Il tuo punteggio riflette il tuo livello attuale. Ogni esercizio che completi ti aiuta a salire di livello.
        </p>
      </header>
      <main style={styles.main}>
        {levels.map((level, index) => (
          <div key={index} style={{...styles.levelCard, borderLeftColor: level.color}}>
            <div style={styles.levelHeader}>
              <h2 style={styles.levelLabel}>{level.label}</h2>
              <span style={{...styles.scoreBadge, backgroundColor: level.color}}>
                {level.scoreRange}
              </span>
            </div>
            <p style={styles.levelDescription}>{level.description}</p>
          </div>
        ))}
      </main>
      <div style={styles.logoContainer}>
        <img src={mainLogoUrl} alt="CES Coach Logo" style={styles.footerLogo} />
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: COLORS.primary,
    margin: 0,
  },
  subtitle: {
    fontSize: '18px',
    color: COLORS.textSecondary,
    marginTop: '8px',
    lineHeight: 1.6,
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  levelCard: {
    backgroundColor: COLORS.card,
    borderRadius: '8px',
    padding: '24px',
    borderLeft: '5px solid',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
  },
  levelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  levelLabel: {
    fontSize: '20px',
    fontWeight: 600,
    color: COLORS.textPrimary,
    margin: 0,
  },
  scoreBadge: {
    padding: '6px 12px',
    borderRadius: '16px',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  levelDescription: {
    fontSize: '16px',
    color: COLORS.textSecondary,
    lineHeight: 1.6,
    margin: 0,
  },
  logoContainer: {
    textAlign: 'center',
    paddingTop: '40px',
  },
  footerLogo: {
    width: '150px',
    height: 'auto',
    opacity: 0.7
  }
};