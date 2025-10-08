import React, { useState } from 'react';
import type { Module, User, UserProgress } from '../types';
import { MODULES, COLORS, SAGE_PALETTE } from '../constants';
import { Logo } from './Logo';
import { ProgressOverview } from './ProgressOverview';
import { ChevronDownIcon } from './Icons';

interface HomeScreenProps {
  onSelectModule: (module: Module) => void;
  currentUser: User | null;
  userProgress: UserProgress | undefined;
}

const hoverStyle = `
  .module-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  }
`;

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectModule, currentUser, userProgress }) => {
  const [isSectoralExpanded, setIsSectoralExpanded] = useState(false);
  const foundationalModules = MODULES.filter(m => m.category === 'Fondamentali' || !m.category);
  const sectoralPacks = MODULES.filter(m => m.category === 'Pacchetti Settoriali');

  const renderModuleGrid = (modules: Module[], offset: number = 0) => (
    <div style={styles.moduleGrid}>
      {modules.map((module, index) => {
        const cardStyle = {
          ...styles.moduleCard,
          backgroundColor: SAGE_PALETTE[(index + offset) % SAGE_PALETTE.length],
        };
        return (
          <div key={module.id} className="module-card" style={cardStyle} onClick={() => onSelectModule(module)}>
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
        )
      })}
    </div>
  );

  return (
    <div style={styles.container}>
      <style>{hoverStyle}</style>
      <header style={styles.header}>
        <Logo />
        <h1 style={styles.title}>Comunicazione Efficace Strategica®</h1>
         <p style={styles.subtitle}>
            Inizia ora il tuo allenamento personalizzato per migliorare rapidamente e in modo concreto la tua comunicazione.
        </p>
      </header>
      
      {currentUser && <ProgressOverview user={currentUser} progress={userProgress} />}
      
      <main style={currentUser ? {marginTop: '48px'} : {}}>
        <section>
          <h2 style={styles.sectionTitle}>Scegli l'allenamento e inizia subito…!</h2>
          {renderModuleGrid(foundationalModules)}
        </section>

        {sectoralPacks.length > 0 && (
          <section style={{ marginTop: '48px' }}>
             <div onClick={() => setIsSectoralExpanded(!isSectoralExpanded)} style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Pacchetti Settoriali Professionali</h2>
                <ChevronDownIcon 
                    style={{
                        ...styles.chevronIcon,
                        transform: isSectoralExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                />
             </div>
             <div style={{
                maxHeight: isSectoralExpanded ? '2000px' : '0',
                opacity: isSectoralExpanded ? 1 : 0,
                overflow: 'hidden',
                transition: 'max-height 0.7s ease-in-out, opacity 0.5s ease-in-out',
             }}>
                <div style={{ paddingTop: '24px' }}>
                    {renderModuleGrid(sectoralPacks, foundationalModules.length)}
                </div>
             </div>
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
        fontSize: '32px',
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        margin: '16px 0 0 0',
    },
    subtitle: {
        fontSize: '16px',
        color: COLORS.textSecondary,
        maxWidth: '600px',
        margin: '0 auto',
        lineHeight: 1.6,
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
        paddingBottom: '8px',
        borderBottom: `2px solid ${COLORS.divider}`,
    },
    sectionTitle: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#306A6A',
        margin: 0,
        padding: 0,
        border: 'none',
    },
    chevronIcon: {
        width: '28px',
        height: '28px',
        color: COLORS.textSecondary,
        transition: 'transform 0.3s ease',
    },
    moduleGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        marginTop: '24px',
    },
    moduleCard: {
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        cursor: 'pointer',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid transparent`,
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
        color: 'white',
        flexShrink: 0,
    },
    cardTitle: {
        fontSize: '20px',
        fontWeight: '600',
        color: 'white',
        margin: 0,
    },
    cardDescription: {
        fontSize: '15px',
        color: 'white',
        lineHeight: 1.6,
        flexGrow: 1,
        margin: 0,
    },
};