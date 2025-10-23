// components/Header.tsx
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Entitlements, Module } from '../types';
import { COLORS } from '../constants';
import { mainLogoUrl } from '../assets';
import { hasProAccess } from '../services/monetizationService';
import { 
    CrownIcon, 
    SettingsIcon, 
    LogOutIcon, 
    AdminIcon, 
    SpeakerIcon, 
    SpeakerOffIcon, 
    ContrastIcon,
    FontSizeIcon,
    NotificationIcon,
    NotificationOffIcon,
    HomeIcon,
} from './Icons';
import { soundService } from '../services/soundService';
import { useToast } from '../hooks/useToast';

interface HeaderProps {
  user: UserProfile | null;
  onLogout: () => void;
  onNavigateToHome: () => void;
  onNavigateToPaywall: () => void;
  onNavigateToAdmin: () => void;
  entitlements: Entitlements | null;
  currentModule?: Module;
  onNavigateToModule: () => void;
}

const hoverStyle = `
  .header-button:hover {
    background-color: ${COLORS.cardDark};
  }
  .dropdown-item:hover {
    background-color: ${COLORS.cardDark};
  }
  .text-size-button:hover {
     background-color: ${COLORS.divider};
  }
`;

type TextSizeType = 'small' | 'medium' | 'large';

export const Header: React.FC<HeaderProps> = ({ user, onLogout, onNavigateToHome, onNavigateToPaywall, onNavigateToAdmin, entitlements, currentModule, onNavigateToModule }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const userHasPro = hasProAccess(entitlements);
  const menuRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  // Settings state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [textSize, setTextSize] = useState<TextSizeType>('medium');
  const [notificationsEnabled, setNotificationsEnabled] = useState(Notification.permission === 'granted');

  // Load settings from localStorage on initial render
  useEffect(() => {
    const savedSound = localStorage.getItem('ces-coach-sound');
    const savedContrast = localStorage.getItem('ces-coach-contrast');
    const savedTextSize = localStorage.getItem('ces-coach-textSize');
    
    if (savedSound) {
        const isEnabled = savedSound === 'true';
        setSoundEnabled(isEnabled);
        soundService.toggleSound(isEnabled);
    }
    if (savedContrast) {
        const isHighContrast = savedContrast === 'true';
        setHighContrast(isHighContrast);
        document.body.classList.toggle('high-contrast', isHighContrast);
    }
    if (savedTextSize) {
        const size = savedTextSize as TextSizeType;
        setTextSize(size);
        const sizeMap = { small: '14px', medium: '16px', large: '18px' };
        document.documentElement.style.fontSize = sizeMap[size];
    }
  }, []);
  
  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setIsMenuOpen(false);
        }
    };
    if (isMenuOpen) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    soundService.toggleSound(newState);
    localStorage.setItem('ces-coach-sound', String(newState));
    addToast(newState ? 'Audio attivato' : 'Audio disattivato', 'info');
  };

  const handleToggleContrast = () => {
    const newState = !highContrast;
    setHighContrast(newState);
    document.body.classList.toggle('high-contrast', newState);
    localStorage.setItem('ces-coach-contrast', String(newState));
  };
  
  const handleChangeTextSize = (size: TextSizeType) => {
    setTextSize(size);
    const sizeMap = { small: '14px', medium: '16px', large: '18px' };
    document.documentElement.style.fontSize = sizeMap[size];
    localStorage.setItem('ces-coach-textSize', size);
  };

  const handleToggleNotifications = async () => {
    if (Notification.permission === 'granted') {
        setNotificationsEnabled(false);
        addToast('Le notifiche push sono state disattivate (simulato).', 'info');
    } else if (Notification.permission === 'denied') {
        addToast('Permesso negato. Abilita le notifiche dalle impostazioni del browser.', 'error');
    } else {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            setNotificationsEnabled(true);
            addToast('Notifiche push attivate!', 'success');
            new Notification('CES Coach', { body: 'Sei pronto per la tua prossima sfida!' });
        } else {
            setNotificationsEnabled(false);
            addToast('Permesso per le notifiche non concesso.', 'info');
        }
    }
  };


  return (
    <header style={styles.header}>
      <style>{hoverStyle}</style>
      <div style={styles.leftSection}>
        <div style={styles.logoContainer} onClick={onNavigateToHome}>
          <img src={mainLogoUrl} alt="CES Coach Logo" style={{ height: '40px', width: 'auto' }} />
        </div>
        <button onClick={onNavigateToHome} style={styles.homeButton} className="header-button" title="Torna alla Home">
            <HomeIcon color={COLORS.secondary} />
        </button>
        {userHasPro && (
            <div style={styles.proBadge}>
                <CrownIcon style={{ width: 20, height: 20 }} />
                <span style={styles.proBadgeText}>PRO</span>
            </div>
        )}
      </div>

      <div style={styles.centerSection}>
          {currentModule && (
              <button style={styles.moduleBreadcrumb} className="header-button" onClick={onNavigateToModule}>
                  <span style={styles.breadcrumbText}>{currentModule.title}</span>
              </button>
          )}
      </div>
      
      <div style={styles.rightSection}>
          {user && (
            <div style={styles.userMenu} ref={menuRef}>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={styles.settingsButton} className="header-button">
                <SettingsIcon />
              </button>

              {isMenuOpen && (
                <div style={styles.dropdown}>
                  <div style={styles.dropdownHeader}>
                    <strong>{user.firstName} {user.lastName}</strong>
                    <div style={styles.emailText}>{user.email}</div>
                  </div>
                  
                  <div style={styles.dropdownSection}>
                      {user.isAdmin && (
                        <button onClick={() => { onNavigateToAdmin(); setIsMenuOpen(false); }} style={styles.dropdownItem} className="dropdown-item">
                          <AdminIcon /> Pannello Admin
                        </button>
                      )}
                      {userHasPro ? (
                        <div style={{ ...styles.dropdownItem, cursor: 'default' }}>
                            <CrownIcon />
                            <span style={{ fontWeight: 'bold' }}>Versione PRO Attiva</span>
                        </div>
                      ) : (
                         <button onClick={() => { onNavigateToPaywall(); setIsMenuOpen(false); }} style={styles.dropdownItem} className="dropdown-item">
                          <CrownIcon /> Attiva PRO
                        </button>
                      )}
                  </div>

                  <div style={styles.dropdownSection}>
                      <div style={styles.sectionTitle}>Impostazioni</div>
                      <button onClick={handleToggleSound} style={styles.dropdownItem} className="dropdown-item">
                          {soundEnabled ? <SpeakerIcon/> : <SpeakerOffIcon/>} {soundEnabled ? 'Disattiva Audio' : 'Attiva Audio'}
                      </button>
                      <button onClick={handleToggleNotifications} style={styles.dropdownItem} className="dropdown-item">
                          {notificationsEnabled ? <NotificationIcon/> : <NotificationOffIcon/>} Notifiche Push
                      </button>
                      <button onClick={handleToggleContrast} style={styles.dropdownItem} className="dropdown-item">
                          <ContrastIcon/> Alto Contrasto
                      </button>
                       <div style={styles.dropdownItem}>
                          <FontSizeIcon/>
                          <div style={styles.textSizeContainer}>
                              <button onClick={() => handleChangeTextSize('small')} style={{...styles.textSizeButton, fontSize: '12px', ...(textSize === 'small' ? styles.textSizeButtonActive : {})}} className="text-size-button">A</button>
                              <button onClick={() => handleChangeTextSize('medium')} style={{...styles.textSizeButton, fontSize: '14px', ...(textSize === 'medium' ? styles.textSizeButtonActive : {})}} className="text-size-button">A</button>
                              <button onClick={() => handleChangeTextSize('large')} style={{...styles.textSizeButton, fontSize: '16px', ...(textSize === 'large' ? styles.textSizeButtonActive : {})}} className="text-size-button">A</button>
                          </div>
                       </div>
                  </div>

                  <div style={styles.dropdownSection}>
                      <button onClick={() => { onLogout(); setIsMenuOpen(false); }} style={{...styles.dropdownItem, color: COLORS.error}} className="dropdown-item">
                        <LogOutIcon /> Logout
                      </button>
                  </div>

                </div>
              )}
            </div>
          )}
      </div>
    </header>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    height: '64px',
    padding: '0 24px',
    backgroundColor: COLORS.card,
    borderBottom: `1px solid ${COLORS.divider}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1,
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
  },
  homeButton: {
      background: 'none',
      border: '1px solid transparent',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
  },
  centerSection: {
    flex: 2,
    display: 'flex',
    justifyContent: 'center',
  },
  moduleBreadcrumb: {
    background: 'none',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    maxWidth: '400px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  breadcrumbText: {
    color: COLORS.textSecondary,
    fontWeight: 600,
    fontSize: '16px',
  },
  rightSection: {
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  userMenu: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  settingsButton: {
      background: 'none',
      border: '1px solid transparent',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: COLORS.textSecondary,
      transition: 'background-color 0.2s, color 0.2s',
  },
  dropdown: {
    position: 'absolute',
    top: '52px',
    right: 0,
    backgroundColor: COLORS.card,
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    border: `1px solid ${COLORS.divider}`,
    width: '260px',
    overflow: 'hidden',
    zIndex: 110,
    animation: 'popIn 0.2s ease-out'
  },
  dropdownHeader: {
    padding: '16px',
    borderBottom: `1px solid ${COLORS.divider}`,
  },
  emailText: {
    fontSize: '13px',
    color: COLORS.textSecondary,
    wordBreak: 'break-all',
  },
  dropdownSection: {
      padding: '8px 0',
      borderBottom: `1px solid ${COLORS.divider}`,
  },
  sectionTitle: {
      padding: '4px 16px',
      fontSize: '12px',
      fontWeight: 600,
      color: COLORS.textSecondary,
      textTransform: 'uppercase',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '12px 16px',
    border: 'none',
    background: 'none',
    textAlign: 'left',
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    color: COLORS.textPrimary,
  },
  textSizeContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    gap: '4px'
  },
  textSizeButton: {
    border: `1px solid ${COLORS.divider}`,
    background: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  textSizeButtonActive: {
    backgroundColor: COLORS.secondary,
    color: 'white',
    borderColor: COLORS.secondary,
  },
  proBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 8px',
  },
  proBadgeText: {
    color: COLORS.secondary,
    fontWeight: 'bold',
    fontSize: '14px',
  },
};