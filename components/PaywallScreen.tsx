import React, { useState } from 'react';
import type { Product, Entitlements } from '../types';
import { PRODUCTS } from '../products';
import { COLORS } from '../constants';
import { CheckCircleIcon } from './Icons';
import { soundService } from '../services/soundService';
import { Spinner } from './Loader';

interface PaywallScreenProps {
  entitlements: Entitlements;
  onPurchase: (product: Product) => Promise<void>;
  onRestore: () => Promise<void>;
  onBack: () => void;
}

export const PaywallScreen: React.FC<PaywallScreenProps> = ({ entitlements, onPurchase, onRestore, onBack }) => {
    const [isLoading, setIsLoading] = useState<string | null>(null); // Stores product ID being purchased

    const handlePurchase = async (product: Product) => {
        soundService.playClick();
        setIsLoading(product.id);
        await onPurchase(product);
        setIsLoading(null);
    };
    
    const handleRestore = async () => {
        soundService.playClick();
        setIsLoading('restore');
        await onRestore();
        setIsLoading(null);
    };

    const renderProductRow = (product: Product) => {
        const isPurchased = entitlements.productIDs.has(product.id);
        
        let cardStyle = { ...styles.productCard };
        if (isPurchased) {
            cardStyle = {
                ...cardStyle,
                ...styles.productCardPurchased,
            };
        }
        
        return (
            <div key={product.id} style={cardStyle}>
                <div style={styles.productInfo}>
                    <h3 style={styles.productName}>{product.name}</h3>
                    <p style={styles.productDescription}>{product.description}</p>
                    <ul style={styles.benefitsList}>
                        {product.benefits.map((benefit, i) => <li key={i}>{benefit}</li>)}
                    </ul>
                </div>
                <div style={styles.productActions}>
                    <span style={styles.price}>{product.price}</span>
                    {isPurchased ? (
                        <div style={styles.purchasedBadge}>
                            <CheckCircleIcon />
                            <span>ATTIVO</span>
                        </div>
                    ) : (
                        <button 
                            style={styles.buyButton} 
                            onClick={() => handlePurchase(product)}
                            disabled={!!isLoading}
                        >
                            {isLoading === product.id ? <Spinner size={20} color="white"/> : 'Sblocca Ora'}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>Porta la tua CES al Livello PRO</h1>
                <p style={styles.subtitle}>Sblocca le funzionalità avanzate per accelerare la tua crescita e padroneggiare ogni conversazione.</p>
            </header>

            <main>
                <section style={styles.section}>
                    <div style={styles.productList}>
                        {PRODUCTS.map(renderProductRow)}
                    </div>
                </section>
                
                <footer style={styles.footer}>
                     <button onClick={handleRestore} style={styles.restoreButton} disabled={!!isLoading}>
                         {isLoading === 'restore' ? <Spinner size={20} /> : 'Ripristina Acquisti'}
                    </button>
                    <p style={styles.disclosure}>
                        Questo è un ambiente di simulazione. Gli acquisti non comportano addebiti reali. Gli abbonamenti si rinnovano automaticamente salvo annullamento. Puoi annullare in qualsiasi momento.
                    </p>
                </footer>
            </main>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '900px', margin: '0 auto', padding: '40px 20px', minHeight: 'calc(100vh - 64px)' },
    header: { textAlign: 'center', marginBottom: '48px' },
    title: { fontSize: '32px', fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: '12px' },
    subtitle: { fontSize: '18px', color: COLORS.textSecondary, lineHeight: 1.6, maxWidth: '600px', margin: '0 auto' },
    section: { marginBottom: '40px' },
    sectionTitle: { fontSize: '24px', fontWeight: 600, color: COLORS.primary, marginBottom: '24px', borderBottom: `2px solid ${COLORS.secondary}`, paddingBottom: '8px' },
    productList: { display: 'flex', flexDirection: 'column', gap: '20px' },
    productCard: { backgroundColor: COLORS.card, borderRadius: '12px', padding: '24px', border: `1px solid ${COLORS.divider}`, borderLeft: `5px solid ${COLORS.secondary}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'all 0.3s ease' },
    productCardPurchased: {
        borderColor: '#FFD700', // Gold color for purchased items
        backgroundColor: '#FFFDF5',
    },
    productInfo: { flex: '1 1 300px' },
    productName: { fontSize: '20px', fontWeight: 600, color: COLORS.textPrimary, margin: '0 0 8px 0' },
    productDescription: { fontSize: '15px', color: COLORS.textSecondary, margin: '0 0 16px 0', lineHeight: 1.5 },
    benefitsList: { margin: 0, paddingLeft: '20px', color: COLORS.textSecondary, fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '6px' },
    productActions: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', flexShrink: 0 },
    price: { fontSize: '22px', fontWeight: 'bold', color: COLORS.textPrimary },
    buyButton: { padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', color: 'white', background: COLORS.primaryGradient, border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease', minWidth: '130px', minHeight: '48px' },
    purchasedBadge: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', color: '#B8860B', backgroundColor: 'rgba(255, 215, 0, 0.15)', borderRadius: '8px' },
    footer: { textAlign: 'center', marginTop: '48px', borderTop: `1px solid ${COLORS.divider}`, paddingTop: '32px' },
    restoreButton: { padding: '12px 24px', fontSize: '16px', border: `1px solid ${COLORS.secondary}`, backgroundColor: 'transparent', color: COLORS.secondary, borderRadius: '8px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s ease', minHeight: '48px' },
    disclosure: { fontSize: '12px', color: COLORS.textSecondary, marginTop: '24px', lineHeight: 1.6, maxWidth: '500px', margin: '24px auto 0' },
};
