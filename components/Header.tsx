import React from 'react';
import { UserProfile, Entitlements, Module } from '../types';
import { COLORS } from '../constants';
import { CrownIcon, LogOutIcon, AdminIcon, HomeIcon, BackIcon } from './Icons';
import { hasProAccess } from '../services/monetizationService';
import { soundService } from '../services/soundService';
import { Logo } from './Logo';

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
  const isPro = hasProAccess(entitlements);

  const handleNav = (action: () => void) => {
    soundService.playClick();
    action();
  };

  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <div style={styles.logoContainer} onClick={() => handleNav(onNavigateToHome)}>
          <Logo style={{ height: '40px', width: 'auto' }} />
        </div>
        <nav style={styles.nav}>
            <button onClick={() => handleNav(onNavigateToHome)} style={styles.navLink}>
                <HomeIcon/> Home
            </button>
            {currentModule && onNavigateToModule && (
                <>
                    <span style={styles.breadcrumbSeparator}>/</span>
                    <button onClick={() => handleNav(onNavigateToModule)} style={styles.navLink}>
                        <currentModule.icon/> {currentModule.title}
                    </button>
                </>
            )}
        </nav>
      </div>

      <div style={styles.right}>
        {!isPro && (
          <button onClick={() => handleNav(onNavigateToPaywall)} style={styles.proButton}>
            <CrownIcon />
            <span>Diventa PRO</span>
          </button>
        )}
        {user?.isAdmin && (
            <button onClick={() => handleNav(onNavigateToAdmin)} style={{...styles.iconButton, ...styles.adminButton}} title="Admin Panel">
                <AdminIcon/>
            </button>
        )}
        <button onClick={() => handleNav(onLogout)} style={styles.iconButton} title="Logout">
          <LogOutIcon />
        </button>
        <span style={styles.userName}>{user?.firstName}</span>
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
    zIndex: 100
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  logoContainer: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  },
  nav: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
  },
  navLink: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: 500,
      color: COLORS.textSecondary,
      padding: '8px 12px',
      borderRadius: '8px',
  },
  breadcrumbSeparator: {
      color: COLORS.textSecondary,
      fontWeight: 'bold'
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  proButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 'bold',
    backgroundColor: COLORS.warning,
    color: COLORS.textPrimary,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  iconButton: {
      background: 'none',
      border: '1px solid transparent',
      color: COLORS.textSecondary,
      padding: '8px',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
  },
  adminButton: {
      color: COLORS.error,
  },
  userName: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
};