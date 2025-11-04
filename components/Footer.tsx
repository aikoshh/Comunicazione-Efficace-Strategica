

import React from 'react';
import { COLORS } from '../constants';
import { mainLogoUrl } from '../assets';

export const Footer: React.FC = () => {
  return (
    <footer style={styles.footer}>
      <div style={styles.logoContainer}>
        <img src={mainLogoUrl} alt="CES Coach Logo" style={styles.footerLogo} />
      </div>
      <div style={styles.footerLinks}>
        <a href="https://www.centroclinicaformazionestrategica.it/CES-APP/pdf/privacy_policy.pdf" target="_blank" rel="noopener noreferrer" title="Leggi la Privacy Policy" style={styles.footerLink}>Privacy Policy</a>
        <span style={styles.footerSeparator}>|</span>
        <a href="https://www.centroclinicaformazionestrategica.it/CES-APP/pdf/terms_of_service.pdf" target="_blank" rel="noopener noreferrer" title="Leggi i Termini di Servizio" style={styles.footerLink}>Termini di Servizio</a>
      </div>
      <p style={styles.copyrightText}>
        CES Coach © Copyright 2025
      </p>
      <p style={styles.copyrightText}>
        cfs@centrocfs.it
      </p>
    </footer>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  footer: {
    width: '100%',
    padding: '24px',
    marginTop: '48px',
    textAlign: 'center',
    borderTop: `1px solid ${COLORS.divider}`,
    backgroundColor: COLORS.base,
    flexShrink: 0,
  },
  logoContainer: {
    marginBottom: '24px',
  },
  footerLogo: {
    width: '150px',
    height: 'auto',
    opacity: 0.7,
  },
  footerLinks: {
    marginBottom: '16px',
  },
  footerLink: {
    color: COLORS.textSecondary,
    textDecoration: 'none',
    fontSize: '12px',
    margin: '0 8px',
    fontWeight: 500,
  },
  footerSeparator: {
    color: COLORS.textSecondary,
    fontSize: '12px',
  },
  copyrightText: {
    margin: '4px 0 0 0',
    textAlign: 'center',
    fontSize: '12px',
    color: COLORS.textSecondary,
    lineHeight: '1.6',
  }
};