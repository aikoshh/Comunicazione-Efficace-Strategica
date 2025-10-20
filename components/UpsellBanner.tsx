import React, { useState } from 'react';
import type { Product } from '../types';
import { COLORS } from '../constants';
import { soundService } from '../services/soundService';
import { Spinner } from './Loader';

interface UpsellBannerProps {
  product: Product;
  score: number;
  onUnlock: (product: Product) => Promise<void>;
  onDetails: (product: Product) => void;
}

export const UpsellBanner: React.FC<UpsellBannerProps> = ({ product, score, onUnlock, onDetails }) => {
    const [isUnlocking, setIsUnlocking] = useState(false);

    const handleUnlock = async () => {
        soundService.playClick();
        setIsUnlocking(true);
        try {
            await onUnlock(product);
        } finally {
            setIsUnlocking(false);
        }
    };

    const handleDetails = () => {
        soundService.playClick();
        onDetails(product);
    };

    const hoverStyle = `
      .upsell-button-primary:hover:not(:disabled), .upsell-button-secondary:hover:not(:disabled) {
        transform: translateY(-2px);
      }
      .upsell-button-primary:active:not(:disabled), .upsell-button-secondary:active:not(:disabled) {
        transform: translateY(0) scale(0.98);
      }
    `;

    return (
        <div style={styles.container}>
            <style>{hoverStyle}</style>
            <div style={styles.content}>
                <h3 style={styles.title}>
                    <span style={styles.emoji}>🎯</span> Ottimo! Sei a {score}/100. Porta la tua CES al livello PRO.
                </h3>
                <p style={styles.description}>
                    Con <strong>{product.name}</strong> ottieni: {product.benefits.slice(0, 2).join(', ')} e molto altro.
                </p>
            </div>
            <div style={styles.actions}>
                <button onClick={handleDetails} style={styles.secondaryButton} className="upsell-button-secondary" disabled={isUnlocking}>Dettagli</button>
                <button 
                    onClick={handleUnlock} 
                    style={{...styles.primaryButton, ...(isUnlocking ? styles.buttonDisabled : {})}} 
                    className="upsell-button-primary" 
                    disabled={isUnlocking}
                >
                    {isUnlocking ? <Spinner size={20} color="white"/> : `Sblocca (1 Anno) - ${product.price}`}
                </button>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: COLORS.cardDark,
    padding: '20px',
    borderRadius: '12px',
    marginTop: '32px',
    border: `1px solid ${COLORS.divider}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
    animation: 'fadeInUp 0.5s 0.8s ease-out both'
  },
  content: {
    flex: '1 1 300px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: COLORS.textPrimary,
    margin: '0 0 8px 0',
  },
  emoji: {
      marginRight: '8px',
  },
  description: {
    fontSize: '15px',
    color: COLORS.textSecondary,
    margin: 0,
    lineHeight: 1.6,
  },
  actions: {
    display: 'flex',
    gap: '12px',
    flexShrink: 0,
  },
  primaryButton: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '10px 18px',
    fontSize: '15px',
    fontWeight: 'bold',
    border: 'none',
    backgroundColor: '#FF6B6B',
    color: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '220px',
    minHeight: '41px',
  },
  secondaryButton: {
    padding: '10px 18px',
    fontSize: '15px',
    border: `1px solid ${COLORS.secondary}`,
    backgroundColor: 'transparent',
    color: COLORS.secondary,
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  buttonDisabled: {
      opacity: 0.7,
      cursor: 'not-allowed',
  }
};