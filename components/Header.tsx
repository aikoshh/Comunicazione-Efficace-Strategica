import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, Entitlements, Module, UserProgress } from '../types';
import { COLORS } from '../constants';
import { Logo } from './Logo';
import { HomeIcon, NextIcon, CrownIcon, AdminIcon, LogOutIcon } from './Icons';
import { hasProAccess } from '../services/monetizationService';
import { soundService } from '../services/soundService';

interface HeaderProps {
  user: UserProfile | null;
  onLogout: () => void;
  onNavigateToHome: () => void;
  onNavigateToPaywall: () => void;
  onNavigateToAdmin: () => void;
  onNavigateToAchievements: () => void;
  entitlements: Entitlements | null;
  currentModule?: Module;
  onNavigateToModule?: () => void;
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
  
  const handleNavigation = (navAction: () => void) => {
    soundService.playClick();
    navAction();
    setIsMenuOpen(false);
  }

  const userInitials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '';

  return (
    <header style={styles.header}>
      <div style={styles.leftSection}>
        <Logo style={styles.logo} onClick={() => handleNavigation(onNavigateToHome)} />
        <nav style={styles.breadcrumbs}>
          <button onClick={() => handleNavigation(onNavigateToHome)} style={styles.breadcrumbLink}><HomeIcon width={18} height={18}/> Home</button>
          {currentModule && onNavigateToModule && (
            <>
              <NextIcon style={styles.breadcrumbSeparator} />
              <button onClick={() => handleNavigation(onNavigateToModule)} style={styles.breadcrumbLink}>{currentModule.title}</button>
            </>
          )}
        </nav>
      </div>
      {user && (
        <div style={styles.rightSection} ref={menuRef}>
          {userProgress && (
            <div style={styles.progressInfo}>
                <span style={styles.level}>Livello: {userProgress.level}</span>
                <span style={styles.xp}>{userProgress.xp} XP</span>
            </div>
          )}
          <div style={styles.userMenuContainer}>
            <button style={styles.userButton} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <div style={{...styles.avatar, ...(isPro ? styles.proAvatar : {})}}>
                    {userInitials}
                    {isPro && <CrownIcon style={styles.proCrown}/>}
                </div>
                <span>{user.firstName}</span>
            </button>
            {isMenuOpen && (
              <div style={styles.dropdownMenu}>
                {!isPro && <button style={styles.dropdownItemPro} onClick={() => handleNavigation(onNavigateToPaywall)}><CrownIcon/> Passa a PRO</button>}
                <button style={styles.dropdownItem} onClick={() => handleNavigation(onNavigateToAchievements)}>I Miei Traguardi</button>
                {user.isAdmin && <button style={styles.dropdownItem} onClick={() => handleNavigation(onNavigateToAdmin)}><AdminIcon/> Admin</button>}
                <div style={styles.dropdownSeparator} />
                <button style={styles.dropdownItem} onClick={() => handleNavigation(onLogout)}><LogOutIcon/> Esci</button>
              </div>
            )}
          </div>
        </div>
      )}
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
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  logo: {
    height: '40px',
    width: 'auto',
    cursor: 'pointer'
  },
  breadcrumbs: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
  },
  breadcrumbLink: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '15px',
      color: COLORS.textSecondary
  },
  breadcrumbSeparator: {
      color: COLORS.textSecondary
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  progressInfo: {
      display: 'flex',
      gap: '12px',
      backgroundColor: COLORS.cardDark,
      padding: '6px 12px',
      borderRadius: '8px'
  },
  level: {
      fontSize: '14px',
      fontWeight: 500,
      color: COLORS.textPrimary
  },
  xp: {
      fontSize: '14px',
      fontWeight: 'bold',
      color: COLORS.secondary
  },
  userMenuContainer: {
    position: 'relative',
  },
  userButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 500
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: COLORS.primary,
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: 'bold',
    position: 'relative'
  },
  proAvatar: {
      border: `2px solid ${COLORS.warning}`
  },
  proCrown: {
      position: 'absolute',
      bottom: -4,
      right: -4,
      width: '18px',
      height: '18px',
      backgroundColor: COLORS.card,
      borderRadius: '50%',
      padding: '2px'
  },
  dropdownMenu: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    backgroundColor: COLORS.card,
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    border: `1px solid ${COLORS.divider}`,
    width: '220px',
    padding: '8px',
    zIndex: 101,
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '10px 12px',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '15px',
    borderRadius: '6px'
  },
  dropdownItemPro: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '10px 12px',
    background: COLORS.warning,
    color: COLORS.textPrimary,
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '15px',
    borderRadius: '6px',
    fontWeight: 'bold',
    marginBottom: '8px'
  },
  dropdownSeparator: {
    height: '1px',
    backgroundColor: COLORS.divider,
    margin: '8px 0',
  }
};
