import React, { useState } from 'react';
import type { Product, Entitlements, UserProfile } from '../types';
import { PRODUCTS } from '../products';
import { COLORS } from '../constants';
import { CheckCircleIcon, BarChartIcon, VoiceIcon, LightbulbIcon, CrownIcon, InfoIcon } from './Icons';
import { soundService } from '../services/soundService';
import { Spinner } from './Loader';
import { risultatiProVideo, vantaggioRisultatiProVideo, feedbackParaverbaleVideo, librerieStrategicheVideo } from '../assets';
import { mainLogoUrl } from '../assets';
import { processAutomaticPurchase } from '../services/firebase';
import { useToast } from '../hooks/useToast';

interface PaywallScreenProps {
  user: UserProfile;
  entitlements: Entitlements;
  onRestore: () => Promise<void>;
  onBack: () => void;
}

const proFeatures = [
    {
        icon: BarChartIcon,
        title: 'Analisi Dettagliata con Rubriche PRO',
        description: 'Ricevi un\'analisi approfondita basata su 5 criteri chiave: Chiarezza, Tono, Orientamento alla Soluzione, Assertività e Struttura, con punteggi e motivazioni specifiche.',
        imageUrl: risultatiProVideo
    },
    {
        icon: VoiceIcon,
        title: 'Feedback Paraverbale e Replay Strategico',
        description: 'Migliora il tuo impatto vocale con l\'analisi AI di tono, ritmo e pause. Ascolta la versione ideale della tua risposta per capire la consegna perfetta.',
        imageUrl: feedbackParaverbaleVideo
    },
    {
        icon: LightbulbIcon,
        title: 'Librerie Strategiche e Checklist PRO',
        description: 'Accedi a decine di domande strategiche per ogni situazione e usa la checklist di preparazione per affrontare con sicurezza qualsiasi conversazione difficile.',
        imageUrl: librerieStrategicheVideo
    }
];

const MediaDisplay: React.FC<{ src: string; alt: string; style: React.CSSProperties }> = ({ src, alt, style }) => {
    const isVideo = src && src.toLowerCase().endsWith('.mp4');
    if (isVideo) {
        return (
            <video 
                src={src} 
                style={style} 
                autoPlay 
                muted 
                loop 
                playsInline 
                title={alt} 
            />
        );
    }
    return <img src={src} alt={alt} style={style} loading="lazy" />;
};


export const PaywallScreen: React.FC<PaywallScreenProps> = ({ user, entitlements, onRestore, onBack }) => {
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const { addToast } = useToast();

    const handlePurchase = async (product: Product & { paymentLink?: string }) => {
        soundService.playClick();
    
        if (!product.paymentLink || product.paymentLink.includes('INSERISCI_QUI_IL_TUO_LINK_REALE')) {
            alert("Errore di Configurazione Pagamento: link non impostato.");
            return;
        }
        
        // Open Stripe checkout in a new tab
        window.open(product.paymentLink, '_blank');

        setIsLoading(product.id);
        addToast("Processando il tuo acquisto... L'app si aggiornerà automaticamente al completamento.", 'info');

        try {
            // Simulate the backend webhook process
            await processAutomaticPurchase(user.uid, product.id);
            // The real-time listener in App.tsx will handle the UI update.
            addToast("Acquisto completato! Funzionalità PRO sbloccate.", 'success');
        } catch (error) {
            addToast("Si è verificato un errore durante l'attivazione. Riprova o contatta il supporto.", 'error');
        } finally {
            setIsLoading(null);
        }
    };
    
    const handleRestore = async () => {
        soundService.playClick();
        setIsLoading('restore');
        await onRestore();
        setIsLoading(null);
    };
    
    const product = PRODUCTS[0];
    const isPurchased = entitlements.productIDs.has(product.id);

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}><CrownIcon style={{ width: 32, height: 32, marginRight: 8 }} /> Porta la tua CES al Livello PRO</h1>
                <p style={styles.permanentActivationText}>Validità 365 giorni</p>
                <p style={styles.subtitle}>Sblocca le funzionalità avanzate per accelerare la tua crescita e padroneggiare ogni conversazione.</p>
            </header>

            <main>
                <section style={styles.featuresSection}>
                    {proFeatures.map((feature, index) => {
                        const FeatureIcon = feature.icon;
                        return (
                             <div key={index} style={styles.featureCard}>
                                <MediaDisplay src={feature.imageUrl} alt={feature.title} style={styles.featureImage} />
                                <div style={styles.featureContent}>
                                    <div style={styles.featureHeader}>
                                        <FeatureIcon style={styles.featureIcon} />
                                        <h3 style={styles.featureTitle}>
                                            {feature.title}
                                            <CrownIcon style={{ width: 24, height: 24, marginLeft: 8 }} />
                                        </h3>
                                    </div>
                                    <p style={styles.featureDescription}>{feature.description}</p>
                                </div>
                            </div>
                        )
                    })}
                </section>
                
                <section style={styles.purchaseSection}>
                    <div style={styles.purchaseBox}>
                        <MediaDisplay src={vantaggioRisultatiProVideo} alt="Riepilogo Vantaggi PRO" style={styles.purchaseBoxImage} />
                        <h3 style={styles.productName}>
                            Riepilogo Vantaggi
                             <CrownIcon style={{ width: 28, height: 28, marginLeft: 10 }} />
                        </h3>
                         <ul style={styles.benefitsList}>
                            {product.benefits.map((benefit, i) => (
                                <li key={i} style={styles.benefitItem}>
                                    <CheckCircleIcon style={styles.benefitIcon}/>
                                    <span>{benefit}</span>
                                </li>
                            ))}
                        </ul>
                        <div style={styles.purchaseActions}>
                            <span style={styles.price}>{product.price}</span>
                            {isPurchased ? (
                                <div style={styles.purchasedBadge}>
                                    <CheckCircleIcon />
                                    <span>ABBONAMENTO ATTIVO</span>
                                </div>
                            ) : (
                                <button 
                                    style={styles.buyButton} 
                                    onClick={() => handlePurchase(product)}
                                    disabled={!!isLoading}
                                >
                                    {isLoading === product.id ? <Spinner size={20} color="white"/> : (
                                        <>
                                            <CrownIcon width={22} height={22} />
                                            Sblocca Tutti i Vantaggi
                                        </>
                                    )}
                                </button>
                            )}
                            <p style={styles.oneTimePaymentText}>Valido per 365 giorni!</p>
                        </div>
                    </div>
                </section>
                
                <footer style={styles.footer}>
                     <button onClick={handleRestore} style={styles.restoreButton} disabled={!!isLoading}>
                         {isLoading === 'restore' ? <Spinner size={20} /> : 'Ripristina Acquisti'}
                    </button>
                    <p style={styles.disclosure}>
                        L'attivazione PRO è un acquisto una tantum con validità di 365 giorni. L'accesso alle funzionalità base dell'app è gratuito.
                    </p>
                </footer>
            </main>
            <div style={styles.logoContainer}>
                <img src={mainLogoUrl} alt="CES Coach Logo" style={styles.footerLogo} />
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '900px', margin: '0 auto', padding: '40px 20px', minHeight: 'calc(100vh - 64px)' },
    header: { textAlign: 'center', marginBottom: '48px' },
    title: { fontSize: '32px', fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    permanentActivationText: {
        fontSize: '18px',
        color: COLORS.error,
        fontWeight: 'bold',
        margin: '0 auto 12px'
    },
    subtitle: { fontSize: '18px', color: COLORS.textSecondary, lineHeight: 1.6, maxWidth: '600px', margin: '0 auto' },
    postPurchaseMessage: {
        backgroundColor: '#E3F2FD',
        border: `1px solid ${COLORS.primary}`,
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '40px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
    },
    postPurchaseTitle: {
        margin: '0 0 8px 0',
        color: COLORS.primary,
        fontSize: '18px'
    },
    postPurchaseText: {
        margin: 0,
        color: COLORS.textSecondary,
        lineHeight: 1.6
    },
    featuresSection: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '32px',
        marginBottom: '48px',
    },
    featureCard: {
        backgroundColor: COLORS.card,
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeInUp 0.5s ease-out both',
    },
    featureImage: {
        width: '100%',
        height: '220px',
        objectFit: 'cover',
    },
    featureContent: {
        padding: '24px',
    },
    featureHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px',
    },
    featureIcon: {
        width: '28px',
        height: '28px',
        color: COLORS.primary,
    },
    featureTitle: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        margin: 0,
        display: 'flex',
        alignItems: 'center',
    },
    featureDescription: {
        fontSize: '15px',
        color: COLORS.textSecondary,
        lineHeight: 1.6,
        margin: 0,
    },
    purchaseSection: {
        backgroundColor: COLORS.cardDark,
        borderRadius: '16px',
        padding: '32px',
        border: `1px solid ${COLORS.divider}`
    },
    purchaseBox: {
        maxWidth: '600px',
        margin: '0 auto',
        textAlign: 'center',
    },
    purchaseBoxImage: {
        width: '100%',
        borderRadius: '8px',
        marginBottom: '24px',
        objectFit: 'cover',
        height: 'auto',
    },
    productName: { 
        fontSize: '22px', 
        fontWeight: 'bold', 
        color: COLORS.textPrimary, 
        margin: '0 0 24px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    benefitsList: {
        margin: '0 0 24px 0',
        padding: 0,
        listStyle: 'none',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    benefitItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '15px',
        color: COLORS.textSecondary,
    },
    benefitIcon: {
        color: COLORS.secondary,
        width: '20px',
        height: '20px',
        flexShrink: 0,
    },
    purchaseActions: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        marginTop: '24px',
        paddingTop: '24px',
        borderTop: `1px solid ${COLORS.divider}`
    },
    oneTimePaymentText: {
        fontSize: '16px',
        color: COLORS.error,
        fontWeight: 'bold',
        margin: '8px 0 0 0'
    },
    price: { fontSize: '28px', fontWeight: 'bold', color: COLORS.textPrimary },
    buyButton: {
        padding: '14px 28px',
        fontSize: '18px',
        fontWeight: 'bold',
        color: 'white',
        background: COLORS.primaryGradient,
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        minWidth: '280px',
        minHeight: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px'
    },
    purchasedBadge: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px 28px', fontSize: '18px', fontWeight: 'bold', color: '#B8860B', backgroundColor: 'rgba(255, 215, 0, 0.2)', borderRadius: '8px', width: '100%', maxWidth: '280px' },
    footer: { textAlign: 'center', marginTop: '48px', borderTop: `1px solid ${COLORS.divider}`, paddingTop: '32px' },
    restoreButton: { padding: '12px 24px', fontSize: '16px', border: `1px solid ${COLORS.secondary}`, backgroundColor: 'transparent', color: COLORS.secondary, borderRadius: '8px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s ease', minHeight: '48px' },
    disclosure: { fontSize: '12px', color: COLORS.textSecondary, marginTop: '24px', lineHeight: 1.6, maxWidth: '500px', margin: '24px auto 0' },
    logoContainer: {
        textAlign: 'center',
        paddingTop: '40px',
    },
    footerLogo: {
        width: '150px',
        height: 'auto',
        opacity: 0.7
    }
};
