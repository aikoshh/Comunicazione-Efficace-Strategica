import React from 'react';
import type { Module, User, UserProgress } from '../types';
import { MODULES, COLORS } from '../constants';
import { Logo } from './Logo';
import { ProgressOverview } from './ProgressOverview';

interface HomeScreenProps {
  onSelectModule: (module: Module) => void;
  currentUser: User | null;
  userProgress: UserProgress | undefined;
}

const hoverStyle = `
  .module-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.08);
  }
`;

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectModule, currentUser, userProgress }) => {
  const foundationalModules = MODULES.filter(m => m.category === 'Fondamentali' || !m.category);
  const sectoralPacks = MODULES.filter(m => m.category === 'Pacchetti Settoriali');

  const renderModuleGrid = (modules: Module[]) => (
    <div style={styles.moduleGrid}>
      {modules.map(module => (
        <div key={module.id} className="module-card" style={styles.moduleCard} onClick={() => onSelectModule(module)}>
          {module.id === 'm5' && <div style={styles.newBadge}>NUOVO</div>}
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
    </div>
  );

  return (
    <div style={styles.container}>
      <style>{hoverStyle}</style>
      <header style={styles.header}>
        <Logo />
        <h1 style={styles.title}>
            Comunicazione Efficace Strategica®
        </h1>
         <p style={styles.subtitle}>
            Inizia ora il tuo allenamento personalizzato per migliorare rapidamente e in modo concreto la tua comunicazione.
        </p>
      </header>
      
      {currentUser && <ProgressOverview user={currentUser} progress={userProgress} />}
      
      <main style={currentUser ? {marginTop: '48px'} : {}}>
        <section>
          <h2 style={styles.sectionTitle}>Fondamentali della CES</h2>
          {renderModuleGrid(foundationalModules)}
        </section>

        {sectoralPacks.length > 0 && (
          <section style={{ marginTop: '48px' }}>
            <h2 style={styles.sectionTitle}>Pacchetti Settoriali Professionali</h2>
            {renderModuleGrid(sectoralPacks)}
          </section>
        )}
      </main>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px',
        backgroundColor: COLORS.base,
        minHeight: '100vh',
    },
    header: {
        textAlign: 'center',
        marginBottom: '48px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px'
    },
    title: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        margin: '8px 0 0 0',
    },
    subtitle: {
        fontSize: '16px',
        color: COLORS.textSecondary,
        maxWidth: '600px',
        margin: '0 auto',
        lineHeight: 1.6,
    },
    sectionTitle: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: '24px',
        paddingBottom: '8px',
        borderBottom: `2px solid ${COLORS.divider}`,
    },
    moduleGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
    },
    moduleCard: {
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
        cursor: 'pointer',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${COLORS.divider}`,
        position: 'relative',
    },
    newBadge: {
        position: 'absolute',
        top: '12px',
        right: '12px',
        backgroundColor: COLORS.error,
        color: 'white',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 'bold',
        zIndex: 1,
        textTransform: 'uppercase',
    },
    cardImage: {
        width: '100%',
        height: '180px',
        objectFit: 'cover',
        backgroundColor: '#f0f0f0',
    },
    cardContent: {
        padding: '20px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '12px',
    },
    cardIcon: {
        width: '32px',
        height: '32px',
        color: COLORS.primary,
        flexShrink: 0,
    },
    cardTitle: {
        fontSize: '20px',
        fontWeight: '600',
        color: COLORS.textPrimary,
        margin: 0,
    },
    cardDescription: {
        fontSize: '15px',
        color: COLORS.textSecondary,
        lineHeight: 1.6,
        flexGrow: 1,
        margin: 0,
    },
};