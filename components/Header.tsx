import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { COLORS } from '../constants';
import { LogOutIcon, AdminIcon, TargetIcon, BarChartIcon, CheckCircleIcon, SettingsIcon, CrownIcon } from './Icons';
import { Logo } from './Logo';
import { soundService } from '../services/soundService';

type Screen = 'home' | 'paywall' | 'admin' | 'achievements' | 'competence_report' | 'levels';

interface HeaderProps {
    user: UserProfile;
    onLogout: () => void;
    onNavigate: (screen: Screen) => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, onNavigate }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleNavigation = (screen: Screen) => {
        soundService.playClick();
        onNavigate(screen);
        setIsMenuOpen(false);
    }
    
    const handleLogout = () => {
        soundService.playClick();
        onLogout();
        setIsMenuOpen(false);
    }

    return (
        <header style={styles.header}>
            <div style={styles.container}>
                <div style={styles.logoContainer} onClick={() => handleNavigation('home')}>
                    <Logo style={{ height: '40px', width: 'auto' }} />
                    <span style={styles.logoText}>CES Coach</span>
                </div>
                <div style={styles.userMenu}>
                    <button
                        ref={buttonRef}
                        onClick={() => {
                            soundService.playClick();
                            setIsMenuOpen(!isMenuOpen)
                        }}
                        style={styles.menuButton}
                        aria-label="Apri menu impostazioni"
                    >
                        <SettingsIcon />
                    </button>
                    {isMenuOpen && (
                        <div ref={menuRef} style={styles.dropdownMenu}>
                            <div style={styles.dropdownHeader}>
                                <div style={styles.userName}>{`${user.firstName} ${user.lastName}`}</div>
                                <div style={styles.userEmail}>{user.email}</div>
                            </div>
                            <div style={styles.dropdownDivider} />
                            <a onClick={() => handleNavigation('achievements')} style={styles.dropdownItem}><TargetIcon /> Traguardi</a>
                            {/* FIX: Changed 'competenceReport' to 'competence_report' to match the Screen type. */}
                            <a onClick={() => handleNavigation('competence_report')} style={styles.dropdownItem}><BarChartIcon /> Report Competenze</a>
                            <a onClick={() => handleNavigation('levels')} style={styles.dropdownItem}><CheckCircleIcon /> Livelli</a>
                             <a onClick={() => handleNavigation('paywall')} style={styles.dropdownItemPro}><CrownIcon /> Passa a PRO</a>
                            <div style={styles.dropdownDivider} />
                            {user.isAdmin && (
                                <a onClick={() => handleNavigation('admin')} style={styles.dropdownItem}><AdminIcon /> Admin Panel</a>
                            )}
                            <a onClick={handleLogout} style={styles.dropdownItem}><LogOutIcon /> Esci</a>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    header: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.card,
        borderBottom: `1px solid ${COLORS.divider}`,
        zIndex: 100,
        height: '64px',
        display: 'flex',
        alignItems: 'center',
    },
    container: {
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
    },
    logoText: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    userMenu: {
        position: 'relative',
    },
    menuButton: {
        backgroundColor: 'transparent',
        border: 'none',
        padding: '8px',
        borderRadius: '50%',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: COLORS.textPrimary,
    },
    dropdownMenu: {
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '8px',
        backgroundColor: COLORS.card,
        borderRadius: '8px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
        border: `1px solid ${COLORS.divider}`,
        width: '280px',
        zIndex: 101,
        animation: 'fadeIn 0.2s ease-out'
    },
    dropdownHeader: {
        padding: '16px',
    },
    userName: {
        fontWeight: 'bold',
        fontSize: '16px',
        color: COLORS.textPrimary,
    },
    userEmail: {
        fontSize: '14px',
        color: COLORS.textSecondary,
    },
    dropdownDivider: {
        height: '1px',
        backgroundColor: COLORS.divider,
        margin: '8px 0',
    },
    dropdownItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        fontSize: '15px',
        color: COLORS.textPrimary,
        cursor: 'pointer',
    },
    dropdownItemPro: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        fontSize: '15px',
        color: COLORS.textPrimary,
        cursor: 'pointer',
        backgroundColor: '#FFFBEA',
        fontWeight: 'bold',
    },
};
