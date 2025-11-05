// components/CoachingUpsellCard.tsx
import React from 'react';
import { Product } from '../types';
import { COLORS } from '../constants';
import { useToast } from '../hooks/useToast';
import { soundService } from '../services/soundService';
import { ivanoCincinnatoImage } from '../assets';
import { CrownIcon } from './Icons';

interface CoachingUpsellCardProps {
    product: Product;
}

export const CoachingUpsellCard: React.FC<CoachingUpsellCardProps> = ({ product }) => {
    const { addToast } = useToast();

    const handlePurchaseClick = () => {
        soundService.playClick();
        if (!product.paymentLink || product.paymentLink.includes('INSERISCI_QUI')) {
            alert("Configurazione in corso: il link di pagamento per questa sessione non è ancora attivo.");
            return;
        }

        window.open(product.paymentLink, '_blank');
        addToast("Dopo il pagamento, verrai contattato via email per pianificare la tua sessione.", 'info');
    };
    
    const hoverStyle = `
      .cta-button-coaching:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(255, 193, 7, 0.4);
      }
      .cta-button-coaching:active {
        transform: translateY(0) scale(0.98);
        box-shadow: 0 2px 10px rgba(255, 193, 7, 0.3);
      }
    `;

    return (
        <div style={styles.container}>
            <style>{hoverStyle}</style>
            <div style={styles.imageContainer}>
                <img src={ivanoCincinnatoImage} alt="Prof. Ivano Cincinnato" style={styles.coachImage} />
            </div>
            <div style={styles.content}>
                <h2 style={styles.title}><CrownIcon /> Sessione di Coaching Individuale</h2>
                <p style={styles.description}>
                    Porta il tuo allenamento al livello successivo. Una sessione live di 30 minuti con il <strong>Prof. Ivano Cincinnato</strong> per risolvere la tua sfida comunicativa più grande.
                </p>
                <div style={styles.priceContainer}>
                    <span style={styles.currentPrice}>{product.price}</span>
                    <span style={styles.originalPrice}>{product.discountedFrom}</span>
                </div>
                <button style={styles.ctaButton} className="cta-button-coaching" onClick={handlePurchaseClick}>
                    Prenota la Tua Sessione
                </button>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        backgroundColor: COLORS.primary,
        color: 'white',
        borderRadius: '16px',
        padding: '32px',
        margin: '32px 0',
        display: 'flex',
        gap: '32px',
        alignItems: 'center',
        boxShadow: `0 8px 30px rgba(28, 62, 94, 0.4)`,
        border: `2px solid ${COLORS.warning}`,
    },
    imageContainer: {
        flexShrink: 0,
        textAlign: 'center',
        flexBasis: '120px'
    },
    coachImage: {
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: `3px solid ${COLORS.warning}`,
    },
    content: {
        flex: 1,
        minWidth: '250px'
    },
    title: {
        fontSize: '22px',
        fontWeight: 'bold',
        margin: '0 0 8px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: COLORS.warning
    },
    description: {
        fontSize: '15px',
        lineHeight: 1.6,
        margin: '0 0 20px 0',
        opacity: 0.9,
    },
    priceContainer: {
        display: 'flex',
        alignItems: 'baseline',
        gap: '12px',
        marginBottom: '20px',
    },
    currentPrice: {
        fontSize: '32px',
        fontWeight: 'bold',
        color: 'white',
    },
    originalPrice: {
        fontSize: '20px',
        color: 'white',
        opacity: 0.7,
        textDecoration: 'line-through',
    },
    ctaButton: {
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: 'bold',
        color: COLORS.primary,
        backgroundColor: COLORS.warning,
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 15px rgba(255, 193, 7, 0.3)',
    },
};
