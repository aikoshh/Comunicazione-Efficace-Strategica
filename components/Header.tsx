import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Entitlements, Module } from '../types';
import { COLORS } from '../constants';
import {
  CrownIcon,
  LogOutIcon,
  AdminIcon,
  HomeIcon,
  SettingsIcon,
  SpeakerIcon,
  SpeakerOffIcon,
  FontSizeIcon,
  ContrastIcon,
  NotificationIcon,
  NotificationOffIcon
} from './Icons';
import { hasProAccess } from '../services/monetizationService';
import { soundService } from '../services/soundService';
import { mainLogoUrl } from '../assets';

interface HeaderProps {
  user: UserProfile | null;
  onLogout: () => void;
  onNavigateToHome: () => void;
  onNavigateToPaywall: () => void;
  onNavigateToAdmin: () => void;
  entitlements: Entitlements | null;
  currentModule?: Module;
  onNavigateToModule?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onNavigateToHome,
  onNavigateToPaywall,
  onNavigateToAdmin,
  entitlements,
  currentModule,
  onNavigateToModule,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(soundService.isEnabled);
  const [textSize, setTextSize] = useState('text-md');
  const [isHighContrast, setIsHighContrast] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const isPro = hasProAccess(entitlements);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.classList.remove('text-sm', 'text-md', 'text-lg');
    document.body.classList.add(textSize);
  }, [textSize]);

  useEffect(() => {
    if (isHighContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  const handleToggleSound = () => {
    soundService.toggleSound();
    setIsSoundEnabled(soundService.isEnabled);
  };

  const handleNav = (action: () => void) => {
    soundService.playClick();
    action();
    setIsMenuOpen(false);
  };

  return (
    <header style={styles.header} className="main-header">
      <div style={styles.left}>
        <div style={styles.logoContainer} onClick={() => handleNav(onNavigateToHome)}>
          <img src={mainLogoUrl} alt="CES Coach Logo" style={{ height: '40px', width: 'auto' }} />
        </div>
        <div style={styles.navContainer}>
          <button onClick={() => handleNav(onNavigateToHome)} style={styles.navLink}>
            <HomeIcon style={{ color: COLORS.secondary }} />
          </button>
           {isPro && (
             <div style={styles.proBadgeHeader}>
               <CrownIcon width={16} height={16} />
               <span>PRO</span>
             </div>
           )}
        </div>
      </div>
      
       {currentModule && onNavigateToModule && (
         <div style={styles.moduleBreadcrumb} onClick={() => handleNav(onNavigateToModule)}>
            <currentModule.icon style={{ width: 20, height: 20 }}/>
            <span>{currentModule.title}</span>
         </div>
       )}

      <div style={styles.right} ref={menuRef}>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={styles.iconButton} title="Impostazioni">
          <SettingsIcon />
        </button>
        {isMenuOpen && (
          <div style={styles.dropdownMenu}>
            {user?.isAdmin && <button onClick={() => handleNav(onNavigateToAdmin)} style={styles.menuItem}><AdminIcon /> Pannello Admin</button>}
            
            {isPro ? (
                 <div style={{...styles.menuItem, cursor: 'default', color: COLORS.textSecondary}}>
                    <CrownIcon />
                    <span>Versione PRO Attiva</span>
                </div>
            ) : (
                <button onClick={() => handleNav(onNavigateToPaywall)} style={styles.menuItem}><CrownIcon /> Attiva PRO</button>
            )}

            <div style={styles.menuDivider} />

            <button onClick={handleToggleSound} style={styles.menuItem}>
              {isSoundEnabled ? <SpeakerIcon /> : <SpeakerOffIcon />}
              {isSoundEnabled ? 'Disattiva Audio' : 'Attiva Audio'}
            </button>
            
            <div style={styles.menuItem}>
              <FontSizeIcon />
              <div style={styles.textSizeGroup}>
                  <button style={{...styles.textSizeButton, ...(textSize === 'text-sm' ? styles.textSizeButtonActive : {})}} onClick={() => setTextSize('text-sm')}>A</button>
                  <button style={{...styles.textSizeButton, ...(textSize === 'text-md' ? styles.textSizeButtonActive : {})}} onClick={() => setTextSize('text-md')}>A</button>
                  <button style={{...styles.textSizeButton, ...(textSize === 'text-lg' ? styles.textSizeButtonActive : {})}} onClick={() => setTextSize('text-lg')}>A</button>
              </div>
            </div>

            <button onClick={() => setIsHighContrast(!isHighContrast)} style={styles.menuItem}>
              <ContrastIcon />
              {isHighContrast ? 'Disattiva Contrasto' : 'Alto Contrasto'}
            </button>

            <div style={styles.menuDivider} />
            <button onClick={() => handleNav(onLogout)} style={styles.menuItem}><LogOutIcon /> Logout</button>
          </div>
        )}
      </div>
    </header>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: COLORS.card,
    borderBottom: `1px solid ${COLORS.divider}`,
    height: '64px',
    boxSizing: 'border-box',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  left: { display: 'flex', alignItems: 'center', gap: '16px' },
  logoContainer: { cursor: 'pointer', display: 'flex', alignItems: 'center' },
  navContainer: { display: 'flex', alignItems: 'center', gap: '12px' },
  navLink: {
      background: 'none', border: 'none', cursor: 'pointer',
      padding: '8px', borderRadius: '8px', display: 'flex',
  },
  proBadgeHeader: {
    display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px',
    fontSize: '12px', fontWeight: 'bold', backgroundColor: 'rgba(255, 193, 7, 0.2)',
    color: '#A85100', borderRadius: '6px',
  },
  moduleBreadcrumb: {
      display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
      fontSize: '15px', fontWeight: 500, color: COLORS.textSecondary,
      position: 'absolute', left: '50%', transform: 'translateX(-50%)',
  },
  right: { display: 'flex', alignItems: 'center', position: 'relative' },
  iconButton: {
      background: 'none', border: '1px solid transparent', color: COLORS.textSecondary,
      padding: '8px', borderRadius: '8px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  dropdownMenu: {
      position: 'absolute',
      top: '100%',
      right: 0,
      backgroundColor: COLORS.card,
      borderRadius: '8px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
      border: `1px solid ${COLORS.divider}`,
      width: '260px',
      zIndex: 101,
      padding: '8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
  },
  menuItem: {
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 12px', borderRadius: '6px',
      background: 'none', border: 'none', cursor: 'pointer',
      textAlign: 'left', fontSize: '15px', color: COLORS.textPrimary,
      width: '100%',
  },
  menuDivider: { height: '1px', backgroundColor: COLORS.divider, margin: '4px 8px' },
  textSizeGroup: { display: 'flex', gap: '4px' },
  textSizeButton: {
      border: `1px solid ${COLORS.divider}`, borderRadius: '4px',
      background: 'transparent', cursor: 'pointer',
  },
  textSizeButtonActive: {
      background: COLORS.secondary, color: 'white', borderColor: COLORS.secondary,
  }
};