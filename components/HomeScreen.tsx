import React from 'react';
import type { Module } from '../types';
import { MODULES, COLORS } from '../constants';

interface HomeScreenProps {
  onSelectModule: (module: Module) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectModule }) => {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>
            <strong>Comunicazione Efficace Strategica®</strong>
        </h1>
        <p style={styles.subtitle}>
            Inizia ora il tuo allenamento personalizzato per migliorare rapidamente e in modo concreto la tua comunicazione.
        </p>
      </header>
      <main style={styles.moduleGrid}>
        {MODULES.map(module => (
          <div key={module.id} style={styles.moduleCard} onClick={() => onSelectModule(module)}>
            {module.cardImage && <img src={module.cardImage} alt={module.title} style={styles.cardImage} />}
            <div style={styles.cardContent}>
              <div style={styles.cardHeader}>
                <module.icon style={styles.cardIcon} />
                <h2 style={styles.cardTitle}>{module.title}</h2>
              </div>
              <p style={styles.cardDescription}>{module.description}</p>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px',
        backgroundColor: COLORS.fondo,
        minHeight: '100vh',
        fontFamily: 'sans-serif',
    },
    header: {
        textAlign: 'center',
        marginBottom: '48px',
    },
    title: {
        fontSize: '40px',
        color: COLORS.nero,
        marginBottom: '8px',
    },
    subtitle: {
        fontSize: '18px',
        color: '#555',
        maxWidth: '600px',
        margin: '0 auto',
        lineHeight: 1.6,
    },
    moduleGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
    },
    moduleCard: {
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 8px 16px rgba(0,0,0,0.07)',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #eee',
    },
    cardImage: {
        width: '100%',
        height: '180px',
        objectFit: 'cover',
        backgroundColor: '#f0f0f0',
    },
    cardContent: {
        padding: '24px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px',
    },
    cardIcon: {
        width: '24px',
        height: '24px',
        color: COLORS.nero,
        flexShrink: 0,
    },
    cardTitle: {
        fontSize: '22px',
        color: COLORS.nero,
        margin: 0,
    },
    cardDescription: {
        fontSize: '16px',
        color: '#666',
        lineHeight: 1.5,
        flexGrow: 1,
        margin: 0,
    },
};
