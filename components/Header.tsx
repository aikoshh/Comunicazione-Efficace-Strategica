import React, { useState, useEffect, useRef } from 'react';
// FIX: Imported the missing UserProgress type.
import { UserProfile, Entitlements, Module, UserProgress } from '../types';
import { COLORS } from '../constants';
import { hasProAccess } from '../services/monetizationService';
import { Logo } from './Logo';
import { HomeIcon, CrownIcon, SettingsIcon, LogOutIcon, AdminIcon, SpeakerIcon, SpeakerOffIcon, FontSizeIcon, ContrastIcon, NotificationIcon, NotificationOffIcon } from './Icons';
import { soundService } from '../services/soundService';
import { useToast } from '../hooks/useToast';
import { gamificationService } from '../services/gamificationService';

interface HeaderProps {
  user: UserProfile | null;
  onLogout: () => void;
  onNavigateToHome: () => void;
  onNavigateToPaywall: () => void;
  onNavigateToAdmin: () => void;
  onNavigateToAchievements: () => void;
  entitlements: Entitlements | null;
  currentModule?: Module;
  onNavigateToModule: () => void;
  userProgress: UserProgress | undefined;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onNavigateToHome,
  onNavigateToPaywall,
  onNavigateToAdmin,
  onNavigateToAchievements,
  entitlements,
  currentModule,
  onNavigateToModule,
  userProgress
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [textSize, setTextSize] = useState('md');
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(Notification.permission === 'granted');

  const settingsRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  const isPro = hasProAccess(entitlements);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSound = localStorage.getItem('soundEnabled');
    const soundState = savedSound !== null ? JSON.parse(savedSound) : true;
    setIsSoundEnabled(soundState);
    soundService.toggleSound(soundState);

    const savedContrast = localStorage.getItem('highContrast');
    const contrastState = savedContrast !== null ? JSON.parse(savedContrast) : false;
    setHighContrast(contrastState);
    document.body.classList.toggle('high-contrast', contrastState);

    const savedTextSize = localStorage.getItem('textSize') || 'md';
    setTextSize(savedTextSize);
    document.documentElement.className = `text-${savedTextSize}`;

    if (Notification.permission === 'granted') {
      setPushNotificationsEnabled(true);
    }
  }, []);

  // Click outside handler for settings dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;
  
  // FIX: This calculation was causing a crash because `gamificationService.LEVELS` does not exist
  // and the result `levelProgress` was not used in the component's JSX.
  // const xpForNextLevel = userProgress ? (gamificationService.LEVELS[userProgress.level] || Infinity) : Infinity;
  // const xpForCurrentLevel = userProgress ? (gamificationService.LEVELS[userProgress.level - 1] || 0) : 0;
  // const levelProgress = userProgress ? Math.max(0, ((userProgress.xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100) : 0;

  const handleToggleSound = () => {
    const newState = !isSoundEnabled;
    setIsSoundEnabled(newState);
    soundService.toggleSound(newState);
    localStorage.setItem('soundEnabled', JSON.stringify(newState));
    addToast(newState ? 'Audio attivato' : 'Audio disattivato', 'info');
  };

  const handleToggleHighContrast = () => {
    const newState = !highContrast;
    setHighContrast(newState);
    document.body.classList.toggle('high-contrast', newState);
    localStorage.setItem('highContrast', JSON.stringify(newState));
  };
  
  const handleChangeTextSize = (size: 'sm' | 'md' | 'lg') => {
    setTextSize(size);
    document.documentElement.className = `text-${size}`;
    localStorage.setItem('textSize', size);
  };

  const handlePushNotificationToggle = async () => {
    if (Notification.permission === 'granted') {
        // We can't "un-grant" permission, so we just toggle our internal state
        const newState = !pushNotificationsEnabled;
        setPushNotificationsEnabled(newState);
        addToast(newState ? 'Notifiche Push Abilitate' : 'Notifiche Push Disabilitate (dalle impostazioni app)', 'info');
    } else if (Notification.permission === 'denied') {
        addToast("Permesso negato. Abilita le notifiche dalle impostazioni del browser.", 'error');
    } else {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            setPushNotificationsEnabled(true);
            addToast('Notifiche Push Abilitate!', 'success');
        } else {
            addToast("Permesso per le notifiche non concesso.", 'info');
        }
    }
  };
  
  const handleSettingsClick = () => {
    soundService.playClick();
    setIsSettingsOpen(!isSettingsOpen);
  }

  return (
    <header style={styles.header} className="main-header">
       <style>{`
        .header-breadcrumb:hover { background-color: ${COLORS.cardDark}; }
        .header-icon-button:hover { background-color: ${COLORS.cardDark}; }
        .header-pro-button:hover { transform: translateY(-2px); }
        .header-dropdown-item:hover { background-color: ${COLORS.cardDark}; }
      `}</style>
      <div style={styles.leftSection} className="header-left">
        <Logo style={styles.logo} onClick={onNavigateToHome}/>
        <button style={styles.iconButton} className="header-icon-button" onClick={onNavigateToHome} title="Home">
            <HomeIcon style={{color: COLORS.secondary}} />
        </button>
        {isPro && (
            <div style={styles.proBadge}>
                <CrownIcon width={18} height={18}/>
                <span>PRO</span>
            </div>
        )}
      </div>

       {currentModule && (
        <div style={styles.moduleBreadcrumb} className="header-module-breadcrumb" onClick={onNavigateToModule}>
            <span>{currentModule.title}</span>
        </div>
      )}

      <div style={styles.rightSection} className="header-right">
        <div style={styles.settingsContainer} ref={settingsRef}>
            <button style={styles.iconButton} className="header-icon-button" onClick={handleSettingsClick} title="Impostazioni">
                <SettingsIcon />
            </button>

          {isSettingsOpen && (
            <div style={styles.settingsDropdown}>
              <div style={styles.dropdownHeader}>
                  <div style={styles.avatar}>{user.firstName.charAt(0)}{user.lastName.charAt(0)}</div>
                  <div>
                    <p style={styles.dropdownUserName}>{user.firstName} {user.lastName}</p>
                    <p style={styles.dropdownUserEmail}>{user.email}</p>
                  </div>
              </div>

              {user.isAdmin && (
                <button style={styles.dropdownItem} className="header-dropdown-item" onClick={onNavigateToAdmin}>
                    <AdminIcon /><span>Pannello Admin</span>
                </button>
              )}

              {isPro ? (
                 <div style={{...styles.dropdownItem, cursor: 'default'}}>
                    <CrownIcon /><span>Versione PRO Attiva</span>
                </div>
              ) : (
                <button style={styles.dropdownItem} className="header-dropdown-item" onClick={onNavigateToPaywall}>
                    <CrownIcon /><span>Attiva PRO</span>
                </button>
              )}

              <div style={styles.dropdownSeparator}>Impostazioni</div>

              <button style={styles.dropdownItem} className="header-dropdown-item" onClick={handleToggleSound}>
                  {isSoundEnabled ? <SpeakerIcon /> : <SpeakerOffIcon />}
                  <span>{isSoundEnabled ? 'Disattiva Audio' : 'Attiva Audio'}</span>
              </button>

               <button style={styles.dropdownItem} className="header-dropdown-item" onClick={handlePushNotificationToggle}>
                  {pushNotificationsEnabled ? <NotificationIcon /> : <NotificationOffIcon />}
                  <span>{pushNotificationsEnabled ? 'Notifiche On' : 'Notifiche Off'}</span>
              </button>

              <button style={styles.dropdownItem} className="header-dropdown-item" onClick={handleToggleHighContrast}>
                  <ContrastIcon />
                  <span>{highContrast ? 'Contrasto Normale' : 'Alto Contrasto'}</span>
              </button>
              
              <div style={{...styles.dropdownItem, justifyContent: 'space-between'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}><FontSizeIcon /><span>Dim. Testo</span></div>
                <div style={styles.textSizeGroup}>
                    <button onClick={() => handleChangeTextSize('sm')} style={{...styles.textSizeButton, ...(textSize === 'sm' ? styles.textSizeButtonActive : {})}}>A</button>
                    <button onClick={() => handleChangeTextSize('md')} style={{...styles.textSizeButton, ...(textSize === 'md' ? styles.textSizeButtonActive : {})}}>A</button>
                    <button onClick={() => handleChangeTextSize('lg')} style={{...styles.textSizeButton, ...(textSize === 'lg' ? styles.textSizeButtonActive : {})}}>A</button>
                </div>
              </div>

              <div style={styles.dropdownSeparator}></div>

              <button style={{...styles.dropdownItem, color: COLORS.error}} className="header-dropdown-item" onClick={onLogout}>
                <LogOutIcon />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 24px',
        backgroundColor: COLORS.card,
        borderBottom: `1px solid ${COLORS.divider}`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: '64px',
        boxSizing: 'border-box'
    },
    leftSection: { display: 'flex', alignItems: 'center', gap: '16px' },
    logo: { height: '40px', cursor: 'pointer' },
    proBadge: {
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '4px 10px', backgroundColor: '#FFFBEA',
        border: '1px solid #F6E05E', borderRadius: '8px',
        fontSize: '14px', fontWeight: 'bold', color: '#B45309'
    },
    moduleBreadcrumb: {
      padding: '8px 16px',
      borderRadius: '8px',
      backgroundColor: COLORS.card,
      border: `1px solid ${COLORS.divider}`,
      fontSize: '14px',
      fontWeight: 500,
      color: COLORS.textPrimary,
      cursor: 'pointer',
      textAlign: 'center',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '400px',
      transition: 'background-color 0.2s',
    },
    rightSection: { display: 'flex', alignItems: 'center', gap: '16px' },
    iconButton: {
        background: 'transparent', border: 'none', color: COLORS.textSecondary,
        cursor: 'pointer', padding: '8px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background-color 0.2s',
    },
    settingsContainer: { position: 'relative' },
    settingsDropdown: {
        position: 'absolute', top: 'calc(100% + 8px)', right: 0,
        backgroundColor: COLORS.card, borderRadius: '12px',
        border: `1px solid ${COLORS.divider}`, boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
        width: '300px', overflow: 'hidden', zIndex: 101,
        animation: 'fadeInUp 0.2s ease-out'
    },
    dropdownHeader: {
        padding: '16px', borderBottom: `1px solid ${COLORS.divider}`,
        display: 'flex', alignItems: 'center', gap: '12px'
    },
    avatar: {
        width: '40px', height: '40px', borderRadius: '50%',
        backgroundColor: COLORS.secondary, color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 'bold', fontSize: '16px', textTransform: 'uppercase',
    },
    dropdownUserName: { fontWeight: 'bold', margin: '0 0 4px 0', color: COLORS.textPrimary },
    dropdownUserEmail: { fontSize: '13px', color: COLORS.textSecondary, margin: 0, wordBreak: 'break-all' },
    dropdownItem: {
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 16px', width: '100%', textAlign: 'left',
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: '15px', color: COLORS.textPrimary, transition: 'background-color 0.2s'
    },
    dropdownSeparator: {
        height: '1px', backgroundColor: COLORS.divider, margin: '8px 0',
        fontSize: '11px', color: COLORS.textSecondary, padding: '0 16px 4px',
        fontWeight: 500, textTransform: 'uppercase'
    },
    textSizeGroup: {
        display: 'flex',
        border: `1px solid ${COLORS.divider}`,
        borderRadius: '6px'
    },
    textSizeButton: {
        background: 'none', border: 'none', padding: '6px 10px',
        cursor: 'pointer', color: COLORS.textSecondary
    },
    textSizeButtonActive: {
        backgroundColor: COLORS.secondary, color: 'white'
    }
};