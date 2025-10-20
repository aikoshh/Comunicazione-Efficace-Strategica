import React, { useState, useEffect } from 'react';
import { preloadResources } from '../services/preloadingService';
import { ALL_RESOURCES_TO_PRELOAD } from '../assets';
import { COLORS } from '../constants';
import { Logo } from './Logo';

interface PreloadingScreenProps {
    onComplete: () => void;
}

export const PreloadingScreen: React.FC<PreloadingScreenProps> = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        preloadResources(ALL_RESOURCES_TO_PRELOAD, (percentage) => {
            setProgress(percentage);
        }).then(() => {
            // A short delay to let the user see the 100%
            setTimeout(() => {
                onComplete();
            }, 500);
        });
    }, [onComplete]);

    return (
        <div style={styles.container}>
            <Logo style={styles.logo} />
            <h1 style={styles.title}>Il tuo allenamento sta per iniziare, manca poco !</h1>
            <p style={styles.subtitle}>Ottimizzazione dell'esperienza in corso.</p>
            <div style={styles.progressBarContainer}>
                <div style={{ ...styles.progressBarFill, width: `${progress}%` }} />
            </div>
            <p style={styles.progressText}>{progress}%</p>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: COLORS.base,
        textAlign: 'center',
        padding: '20px',
    },
    logo: {
        width: '160px',
        height: '160px',
        marginBottom: '24px',
    },
    title: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        margin: '0 0 8px 0',
    },
    subtitle: {
        fontSize: '16px',
        color: COLORS.textSecondary,
        margin: '0 0 32px 0',
    },
    progressBarContainer: {
        width: '100%',
        maxWidth: '300px',
        height: '12px',
        backgroundColor: COLORS.divider,
        borderRadius: '6px',
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: COLORS.secondary,
        borderRadius: '6px',
        transition: 'width 0.3s ease-out',
    },
    progressText: {
        marginTop: '16px',
        fontSize: '18px',
        fontWeight: 'bold',
        color: COLORS.primary,
    },
};