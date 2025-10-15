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
  onGoToAdmin: () => void;
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
    background-color: #F8AD66;
    filter: brightness(0.98);
  }
  .pro-panel-button:hover {
    filter: brightness(1.1);
  }
  .admin-button:hover {
    background-color: ${COLORS.cardDark};
  }
`;

const scrollbarStyle = `
  .breadcrumbs-container::-webkit-scrollbar {
    display: none; /* For Chrome, Safari, and Opera */
  }
  .breadcrumbs-container {
    -ms-overflow-style: none;  /* For Internet Explorer and Edge */
    scrollbar-width: none;  /* For Firefox */
  }
`;

export const Header: React.FC<HeaderProps> = ({ currentUser, breadcrumbs, onLogout, onGoToPaywall, onGoToAdmin, isPro, isSoundEnabled, onToggleSound }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const getInitials = (user: User) => {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  const handleToggleSettings = () => {
      setIsSettingsOpen(!isSettingsOpen);
  }

  const handleGoToPaywallClick = () => {
    onGoToPaywall();
    setIsSettingsOpen(false);
  };

  const handleGoToAdminClick = () => {
    onGoToAdmin();
    setIsSettingsOpen(false);
  };

  const handleToggleSoundClick = () => {
    onToggleSound();
    // Keep settings open when toggling sound
  };

  const handleLogoutClick = () => {
    onLogout();
    setIsSettingsOpen(false);
  };

  return (
    <>
      <style>{hoverStyle}{scrollbarStyle}</style>
      <header style={styles.header}>
        <nav style={styles.nav}>
          <div style={styles.navContent}>
              <div style={styles.breadcrumbs} className="breadcrumbs-container">
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
                    <h3 style={styles.settingsTitle}>Impostazioni e Profilo</h3>
                    <button onClick={handleToggleSettings} style={styles.settingsCloseButton} className="settings-close-button" aria-label="Chiudi impostazioni">
                        <CloseIcon />
                    </button>
                </div>
                <div style={styles.settingsContent}>
                    {currentUser && (
                        <div style={styles.settingsUserDisplay}>
                            <div style={styles.avatar}>
                                {getInitials(currentUser)}
                            </div>
                            <div style={styles.userInfoText}>
                                <span style={styles.userName}>{currentUser.firstName} {currentUser.lastName}</span>
                                <span style={styles.userEmail}>{currentUser.email}</span>
                            </div>
                        </div>
                    )}

                    {currentUser && currentUser.expiryDate && (() => {
                        const expiry = new Date(currentUser.expiryDate);
                        const now = new Date();
                        const created = new Date(currentUser.createdAt);
                        
                        const totalDuration = expiry.getTime() - created.getTime();
                        const elapsed = Math.max(0, now.getTime() - created.getTime());
                        const progressPercentage = totalDuration > 0 ? Math.min(100, (elapsed / totalDuration) * 100) : 100;

                        const diffTime = expiry.getTime() - now.getTime();
                        const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

                        let barColor = COLORS.success;
                        if (daysRemaining <= 3) {
                            barColor = COLORS.error;
                        } else if (daysRemaining <= 7) {
                            barColor = COLORS.warning;
                        }

                        return (
                            <div style={styles.subscriptionStatus}>
                                <div style={styles.statusHeader}>
                                    <span style={styles.statusTitle}>Stato Abbonamento</span>
                                    <span style={styles.statusDays}>{daysRemaining > 0 ? `${daysRemaining} giorni rimasti` : 'Scaduto'}</span>
                                </div>
                                <div style={styles.progressBar}>
                                    <div style={{ ...styles.progressBarFill, width: `${progressPercentage}%`, backgroundColor: barColor }} />
                                </div>
                            </div>
                        );
                    })()}

                    {currentUser?.isAdmin && (
                        <button onClick={handleGoToAdminClick} style={{...styles.settingsPanelButton, ...styles.adminButton}} className="admin-button">
                            Pannello di Amministrazione
                        </button>
                    )}

                    {!isPro && (
                        <button onClick={handleGoToPaywallClick} style={{...styles.settingsPanelButton, ...styles.proPanelButton}} className="pro-panel-button">
                            Sblocca PRO
                        </button>
                    )}
                    <div style={styles.settingsOption}>
                        <span>Audio applicazione</span>
                        <button 
                            onClick={handleToggleSoundClick} 
                            style={styles.soundButton}
                            className="sound-button"
                            aria-label={isSoundEnabled ? "Disattiva suoni" : "Attiva suoni"}
                        >
                            {isSoundEnabled ? <SpeakerIcon /> : <SpeakerOffIcon />}
                        </button>
                    </div>

                    {currentUser && (
                         <button onClick={handleLogoutClick} style={{...styles.settingsPanelButton, ...styles.logoutButton}} className="logout-button">
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
  },
  navContent: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
  },
  breadcrumbs: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    whiteSpace: 'nowrap',
    overflowX: 'auto',
    minWidth: 0,
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
    flexShrink: 0,
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexShrink: 0,
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
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: COLORS.secondary,
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: 'bold',
    fontSize: '16px',
    flexShrink: 0,
  },
  userName: {
    fontSize: '16px',
    fontWeight: 600,
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
  settingsUserDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    paddingBottom: '16px',
    marginBottom: '8px',
    borderBottom: `1px solid ${COLORS.divider}`,
  },
  userInfoText: {
    display: 'flex',
    flexDirection: 'column',
  },
  userEmail: {
    fontSize: '14px',
    color: COLORS.textSecondary,
  },
  subscriptionStatus: {
    paddingBottom: '16px',
    marginBottom: '8px',
    borderBottom: `1px solid ${COLORS.divider}`,
  },
  statusHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px',
  },
  statusTitle: {
      fontSize: '14px',
      fontWeight: 500,
      color: COLORS.textSecondary,
  },
  statusDays: {
      fontSize: '14px',
      fontWeight: 'bold',
      color: COLORS.textPrimary,
  },
  progressBar: {
      height: '6px',
      backgroundColor: COLORS.divider,
      borderRadius: '3px',
      overflow: 'hidden',
  },
  progressBarFill: {
      height: '100%',
      borderRadius: '3px',
      transition: 'width 0.5s ease-in-out',
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
  },
  adminButton: {
    backgroundColor: COLORS.cardDark,
    color: COLORS.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    border: `1px solid ${COLORS.primary}`,
  },
  proPanelButton: {
    backgroundColor: COLORS.secondary,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    transition: 'filter 0.2s ease',
  },
  logoutButton: {
    backgroundColor: '#FABD7F',
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    border: 'none',
  },
};