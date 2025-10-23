import React, { useState, useEffect, useRef } from 'react';
import type { UserProfile, Entitlements } from '../types';
import { COLORS } from '../constants';
import { Logo } from './Logo';
import { SettingsIcon, CrownIcon, LogOutIcon, SpeakerIcon, SpeakerOffIcon, AdminIcon, HomeIcon } from './Icons';
import { hasProAccess } from '../services/monetizationService';
import { soundService } from '../services/soundService';

interface HeaderProps {
    currentUser: UserProfile | null;
    entitlements: Entitlements | null;
    onLogout: () => void;
    onNavigateToAdmin: () => void;
    onNavigateToPaywall: () => void;
    onNavigateToHome: () => void;
}

const hoverStyle = `
  .header-button:hover, .menu-item:hover, .home-button:hover {
    background-color: ${COLORS.cardDark};
  }
  .pro-badge:hover {
    transform: scale(1.05);
  }
`;

export const Header: React.FC<HeaderProps> = ({ currentUser, entitlements, onLogout, onNavigateToAdmin, onNavigateToPaywall, onNavigateToHome }) => {
    const isPro = hasProAccess(entitlements);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSoundEnabled, setIsSoundEnabled] = useState(soundService.isEnabled);
    const menuRef = useRef<HTMLDivElement>(null);

    const toggleMenu = () => {
        setIsMenuOpen(prev => !prev);
    };

    const handleToggleSound = () => {
        soundService.toggleSound();
        setIsSoundEnabled(soundService.isEnabled);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleAdminClick = () => {
        onNavigateToAdmin();
        setIsMenuOpen(false);
    };
    
    const handleLogoutClick = () => {
        onLogout();
        setIsMenuOpen(false);
    };

    const handleActivateProClick = () => {
        onNavigateToPaywall();
        setIsMenuOpen(false);
    }
    
    const handleHomeClick = () => {
        soundService.playClick();
        onNavigateToHome();
    }

    return (
        <header style={styles.header}>
            <style>{hoverStyle}</style>
            <div style={styles.logoContainer}>
                <Logo style={styles.logo} />
                <span style={styles.appName}>
                    CES Coach {isPro && <span style={styles.proText}>Pro</span>}
                </span>
                <button style={styles.homeButton} className="home-button" onClick={handleHomeClick} title="Home">
                    <HomeIcon />
                    <span>Home</span>
                </button>
            </div>
            {currentUser && (
                <div style={styles.userInfo}>
                    {isPro && (
                        <div style={styles.proBadge} className="pro-badge" onClick={onNavigateToPaywall}>
                            <CrownIcon width={18} height={18} />
                            <span>PRO</span>
                        </div>
                    )}
                    <div style={styles.settingsContainer} ref={menuRef}>
                        <button style={styles.settingsButton} className="header-button" onClick={toggleMenu} title="Impostazioni">
                            <SettingsIcon />
                        </button>
                        {isMenuOpen && (
                            <div style={styles.dropdownMenu} className="dropdown-menu">
                                {currentUser.isAdmin && (
                                    <button style={styles.menuItem} className="menu-item" onClick={handleAdminClick}>
                                        <AdminIcon style={styles.menuIcon} />
                                        <span>Pannello Admin</span>
                                    </button>
                                )}
                                {!isPro && (
                                    <>
                                        <button style={styles.menuItem} className="menu-item" onClick={handleActivateProClick}>
                                            <CrownIcon style={styles.menuIcon} />
                                            <span>Attiva PRO</span>
                                        </button>
                                        <div style={styles.menuDivider}></div>
                                    </>
                                )}
                                <button style={styles.menuItem} className="menu-item" onClick={handleToggleSound}>
                                    {isSoundEnabled ? <SpeakerIcon style={styles.menuIcon} /> : <SpeakerOffIcon style={styles.menuIcon} />}
                                    <span>{isSoundEnabled ? 'Disattiva Audio' : 'Attiva Audio'}</span>
                                </button>
                                <div style={styles.menuDivider}></div>
                                <button style={{...styles.menuItem, color: COLORS.error}} className="menu-item" onClick={handleLogoutClick}>
                                    <LogOutIcon style={styles.menuIcon} />
                                    <span>Logout</span>
                                </button>
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
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    },
    logoContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    logo: {
        height: '40px',
        width: '40px',
    },
    appName: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    proText: {
        color: COLORS.secondary,
        fontWeight: 'bold',
    },
    homeButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '8px 16px',
        borderRadius: '8px',
        marginLeft: '24px',
        color: COLORS.textPrimary,
        fontWeight: '600',
        fontSize: '16px',
        transition: 'background-color 0.2s ease',
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
    },
    proBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: '#FFD700',
        color: '#4A3E00',
        padding: '6px 12px',
        borderRadius: '16px',
        fontWeight: 'bold',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
    },
    userName: {
        fontSize: '16px',
        color: COLORS.textSecondary,
        fontWeight: 500,
    },
    settingsContainer: {
        position: 'relative',
        display: 'flex',
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
        color: COLORS.textSecondary,
        transition: 'background-color 0.2s ease',
    },
    dropdownMenu: {
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        backgroundColor: COLORS.card,
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        width: '240px',
        zIndex: 110,
        border: `1px solid ${COLORS.divider}`,
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out',
        padding: '8px',
    },
    menuItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        padding: '12px 16px',
        background: 'none',
        border: 'none',
        textAlign: 'left',
        cursor: 'pointer',
        fontSize: '15px',
        color: COLORS.textPrimary,
        borderRadius: '6px',
        transition: 'background-color 0.2s ease',
    },
    menuIcon: {
        width: '20px',
        height: '20px',
        color: COLORS.textSecondary,
    },
    menuDivider: {
        height: '1px',
        backgroundColor: COLORS.divider,
        margin: '8px 0',
    }
};