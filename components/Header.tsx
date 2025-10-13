import React, { useState } from 'react';
import type { User, Breadcrumb } from '../types';
import { COLORS } from '../constants';
import { ChevronRightIcon, HomeIcon } from './Icons';
import { useLocalization } from '../context/LocalizationContext';


interface HeaderProps {
  currentUser: User | null;
  breadcrumbs: Breadcrumb[];
  onLogout: () => void;
  onGoToPaywall: () => void;
  isPro: boolean;
}

const hoverStyle = `
  .header-link:hover {
    color: ${COLORS.secondary};
  }
  .user-menu-button:hover {
    background-color: ${COLORS.cardDark};
  }
  .logout-button:hover {
    background-color: ${COLORS.divider};
  }
  .pro-button:hover, .lang-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(88, 166, 166, 0.3);
  }
`;

export const Header: React.FC<HeaderProps> = ({ currentUser, breadcrumbs, onLogout, onGoToPaywall, isPro }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLocalization();

  const getInitials = (user: User) => {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  const toggleLanguage = () => {
    setLanguage(language === 'it' ? 'en' : 'it');
  };

  return (
    <>
      <style>{hoverStyle}</style>
      <header style={styles.header}>
        <nav style={styles.nav}>
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
                  {index === 0 && <HomeIcon style={styles.homeIcon}/>}
                  {crumb.label}
                </span>
                {index < breadcrumbs.length - 1 && (
                  <ChevronRightIcon style={styles.separator} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div style={styles.userSection}>
             <button style={styles.langButton} className="lang-button" onClick={toggleLanguage}>
                {language.toUpperCase()}
            </button>
            {!isPro && (
                <button style={styles.proButton} className="pro-button" onClick={onGoToPaywall}>
                    {t('unlockPro')}
                </button>
            )}
            {currentUser && (
              <div style={styles.userMenuContainer}>
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)} 
                    style={styles.userMenuButton} 
                    className="user-menu-button"
                    aria-haspopup="true"
                    aria-expanded={isMenuOpen}
                >
                  <div style={styles.avatar}>
                    {getInitials(currentUser)}
                  </div>
                  <span style={styles.userName}>{currentUser.firstName}</span>
                </button>
                {isMenuOpen && (
                  <div style={styles.dropdownMenu}>
                    <button onClick={onLogout} style={styles.logoutButton} className="logout-button">
                      {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>
      </header>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breadcrumbs: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
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
  homeIcon: {
      width: '18px',
      height: '18px',
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
  langButton: {
    backgroundColor: 'transparent',
    border: `1px solid ${COLORS.secondary}`,
    color: COLORS.secondary,
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
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
  },
  userMenuContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  userMenuButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: '8px',
    transition: 'background-color 0.2s ease',
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
  dropdownMenu: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    backgroundColor: COLORS.card,
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    border: `1px solid ${COLORS.divider}`,
    overflow: 'hidden',
    animation: 'fadeInUp 0.2s ease-out'
  },
  logoutButton: {
    display: 'block',
    width: '100%',
    padding: '12px 20px',
    fontSize: '15px',
    border: 'none',
    background: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    color: COLORS.error,
    transition: 'background-color 0.2s ease',
  },
};