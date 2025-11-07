import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, Module, Entitlements } from '../types';
import { COLORS } from '../constants';
import { LogOutIcon, AdminIcon, TargetIcon, BarChartIcon, CheckCircleIcon, SettingsIcon, CrownIcon, BackIcon, HomeIcon, WarningIcon, HistoryIcon } from './Icons';
import { Logo } from './Logo';
import { soundService } from '../services/soundService';
import { subscribeToUnreadReportsCount } from '../services/firebase';
import { hasProAccess } from '../services/monetizationService';

type Screen = 'home' | 'paywall' | 'admin' | 'achievements' | 'competence_report' | 'levels' | 'history';

interface HeaderProps {
    user: UserProfile;
    onLogout: () => void;
    onNavigate: (screen: Screen | 'module') => void;
    showBack: boolean;
    onBack: () => void;
    currentModule: Module | null;
    onReportProblem: () => void;
    entitlements: Entitlements | null;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, onNavigate, showBack, onBack, currentModule, onReportProblem, entitlements }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [unreadReportsCount, setUnreadReportsCount] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const isPro = hasProAccess(entitlements);

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
        
        let unsubscribe: (() => void) | undefined;
        if (user.isAdmin) {
            unsubscribe = subscribeToUnreadReportsCount(setUnreadReportsCount);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [user.isAdmin]);

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
    
    const handleModuleNav = () => {
        soundService.playClick();
        onNavigate('module');
        setIsMenuOpen(false);
    }

    const handleReportProblem = () => {
        soundService.playClick();
        onReportProblem();
        setIsMenuOpen(false);
    }

    return (
        <header style={styles.header} className="responsive-header">
            <div style={styles.container}>
                <div style={styles.leftSection}>
                    <Logo style={{ height: '40px', width: 'auto', cursor: 'pointer' }} onClick={() => onNavigate('home')} />
                    {showBack ? (
                        <button onClick={onBack} style={styles.navButton}>
                            <BackIcon />
                            <span>Indietro</span>
                        </button>
                    ) : (
                        <button onClick={() => onNavigate('home')} style={{...styles.navButton, color: COLORS.secondary}}>
                            <HomeIcon />
                        </button>
                    )}
                </div>
                
                {showBack && currentModule && (
                    <div style={styles.breadcrumbs} onClick={handleModuleNav}>
                        {currentModule.title}
                    </div>
                )}

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
                            <a onClick={() => handleNavigation('history')} style={styles.dropdownItem}><HistoryIcon /> Storico Analisi</a>
                            <a onClick={() => handleNavigation('achievements')} style={styles.dropdownItem}><TargetIcon /> Traguardi</a>
                            <a onClick={() => handleNavigation('competence_report')} style={styles.dropdownItem}><BarChartIcon /> Report Competenze</a>
                            <a onClick={() => handleNavigation('levels')} style={styles.dropdownItem}><CheckCircleIcon /> Livelli</a>
                             {isPro ? (
                                <div style={styles.dropdownItemActive}>
                                    <CheckCircleIcon style={{ color: COLORS.success }} />
                                    <span>Versione PRO Attiva</span>
                                </div>
                            ) : (
                                <a onClick={() => handleNavigation('paywall')} style={styles.dropdownItemPro}>
                                    <CrownIcon /> Passa a PRO
                                </a>
                            )}
                            {user.isAdmin && (
                                <>
                                    <div style={styles.dropdownDivider} />
                                    <a onClick={() => handleNavigation('admin')} style={styles.dropdownItem}>
                                        <AdminIcon /> 
                                        <span>Pannello Admin</span>
                                        {unreadReportsCount > 0 && <span style={styles.notificationBadge}>{unreadReportsCount}</span>}
                                    </a>
                                </>
                            )}
                            <div style={styles.dropdownDivider} />
                            <a onClick={handleReportProblem} style={styles.dropdownItem}><WarningIcon /> Segnala un problema</a>
                            <div style={styles.dropdownDivider} />
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
    leftSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
    },
    navButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 500,
        color: COLORS.textSecondary,
        padding: '8px',
    },
    breadcrumbs: {
        color: COLORS.textPrimary,
        fontWeight: 600,
        fontSize: '18px',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '300px',
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
    dropdownItemActive: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        fontSize: '15px',
        color: COLORS.success,
        fontWeight: 'bold',
        backgroundColor: '#E8F5E9',
    },
    notificationBadge: {
        backgroundColor: COLORS.error,
        color: 'white',
        borderRadius: '50%',
        width: '20px',
        height: '20px',
        fontSize: '12px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 'auto'
    },
};