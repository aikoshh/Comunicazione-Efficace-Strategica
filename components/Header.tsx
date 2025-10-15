import React, { useState } from 'react';
import type { User, Breadcrumb } from '../types';
import { COLORS } from '../constants';
import { Logo } from './Logo';
import { ChevronRightIcon, SpeakerIcon, SpeakerOffIcon, SettingsIcon, CloseIcon } from './Icons';


interface HeaderProps {
  currentUser: User | null;
  breadcrumbs: Breadcrumb[];
  onLogout: () => void;
  onGoToPaywall: () => void;
  isPro: boolean;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
}

const hoverStyle = `
  .header-link:hover {
    color: ${COLORS.secondary};
  }
  .settings-button:hover, .sound-button:hover, .settings-close-button:hover {
    background-color: ${COLORS.cardDark};
  }
  .settings-panel-button:hover {
    background-color: ${COLORS.cardDark};
  }
  .logout-button:hover {
    background-color: ${COLORS.divider};
  }
  .pro-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(88, 166, 166, 0.3);
  }
`;

export const Header: React.FC<HeaderProps> = ({ currentUser, breadcrumbs, onLogout, onGoToPaywall, isPro, isSoundEnabled, onToggleSound }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const getInitials = (user: User) => {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  const handleToggleSettings = () => {
      setIsSettingsOpen(!isSettingsOpen);
  }

  return (
    <>
      <style>{hoverStyle}</style>
      <header style={styles.header}>
        <nav style={styles.nav}>
          <div style={styles.navContent}>
              <div style={styles.breadcrumbs}>
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    <span
                      style={{
                        ...styles.crumb,
                        ...(crumb.onClick ? styles.crumbLink : {}),
                      }}
                      className={crumb.onClick ? 'header-link' : ''}
                      onClick={crumb.onClick}
                    >
                      {index === 0 && <Logo style={styles.logoIcon}/>}
                      {crumb.label}
                    </span>
                    {index < breadcrumbs.length - 1 && (
                      <ChevronRightIcon style={styles.separator} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div style={styles.userSection}>
                {!isPro && (
                    <button style={styles.proButton} className="pro-button" onClick={onGoToPaywall}>
                        Sblocca PRO
                    </button>
                )}
                {currentUser && (
                    <div style={styles.userDisplay}>
                        <div style={styles.avatar}>
                            {getInitials(currentUser)}
                        </div>
                        <span style={styles.userName}>{currentUser.firstName}</span>
                    </div>
                )}
                <button 
                    onClick={handleToggleSettings} 
                    style={styles.settingsButton}
                    className="settings-button"
                    aria-label="Apri impostazioni"
                >
                    <SettingsIcon />
                </button>
              </div>
          </div>
        </nav>
      </header>
      
      {isSettingsOpen && (
          <>
            <div style={styles.settingsOverlay} onClick={handleToggleSettings} />
            <div style={styles.settingsPanel}>
                <div style={styles.settingsHeader}>
                    <h3 style={styles.settingsTitle}>Impostazioni</h3>
                    <button onClick={handleToggleSettings} style={styles.settingsCloseButton} className="settings-close-button" aria-label="Chiudi impostazioni">
                        <CloseIcon />
                    </button>
                </div>
                <div style={styles.settingsContent}>
                    <div style={styles.settingsOption}>
                        <span>Audio applicazione</span>
                        <button 
                            onClick={onToggleSound} 
                            style={styles.soundButton}
                            className="sound-button"
                            aria-label={isSoundEnabled ? "Disattiva suoni" : "Attiva suoni"}
                        >
                            {isSoundEnabled ? <SpeakerIcon /> : <SpeakerOffIcon />}
                        </button>
                    </div>

                    {currentUser && (
                         <button onClick={onLogout} style={{...styles.settingsPanelButton, ...styles.logoutButton}} className="logout-button">
                            Logout
                         </button>
                    )}
                </div>
            </div>
          </>
      )}
    </>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    borderBottom: `1px solid ${COLORS.divider}`,
    zIndex: 100,
    height: '64px',
    padding: '0 24px',
  },
  nav: {
    height: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    overflowX: 'auto',
    scrollbarWidth: 'none', // For Firefox
  },
  navContent: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: '32px',
      width: '100%',
      minWidth: '500px', // Ensures content doesn't wrap and forces scroll on small screens
  },
  breadcrumbs: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    whiteSpace: 'nowrap',
  },
  crumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    color: COLORS.textSecondary,
    fontWeight: 500,
  },
  crumbLink: {
    cursor: 'pointer',
    transition: 'color 0.2s ease',
  },
  logoIcon: {
      width: '28px',
      height: '28px',
  },
  separator: {
    width: '20px',
    height: '20px',
    color: COLORS.divider,
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  proButton: {
    backgroundColor: COLORS.secondary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 5px rgba(88, 166, 166, 0.2)',
    whiteSpace: 'nowrap'
  },
  userDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '6px 0px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: COLORS.secondary,
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  userName: {
    fontSize: '15px',
    fontWeight: 500,
    color: COLORS.textPrimary,
  },
  settingsButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: COLORS.textPrimary,
    transition: 'background-color 0.2s ease',
  },
  settingsOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 101,
    animation: 'fadeIn 0.3s ease-out'
  },
  settingsPanel: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '320px',
    maxWidth: '90vw',
    height: '100%',
    backgroundColor: COLORS.card,
    boxShadow: '-5px 0 25px rgba(0,0,0,0.15)',
    zIndex: 102,
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideIn 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
  },
  settingsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: `1px solid ${COLORS.divider}`,
    flexShrink: 0,
  },
  settingsTitle: {
      margin: 0,
      fontSize: '18px',
      fontWeight: 'bold',
      color: COLORS.textPrimary,
  },
  settingsCloseButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: COLORS.textSecondary,
      transition: 'background-color 0.2s ease',
  },
  settingsContent: {
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      flex: 1,
  },
  settingsOption: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '16px',
      color: COLORS.textPrimary,
      padding: '8px 0',
  },
  soundButton: {
    background: 'none',
    border: `1px solid ${COLORS.divider}`,
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: COLORS.textSecondary,
    transition: 'background-color 0.2s ease',
  },
  settingsPanelButton: {
    display: 'block',
    width: '100%',
    padding: '12px 20px',
    fontSize: '16px',
    border: `1px solid ${COLORS.divider}`,
    background: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'background-color 0.2s ease',
    marginTop: 'auto',
  },
  logoutButton: {
    color: COLORS.error,
    fontWeight: 500,
  },
};