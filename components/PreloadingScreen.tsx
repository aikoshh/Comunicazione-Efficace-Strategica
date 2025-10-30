import React, { useState, useEffect } from 'react';
import { preloadResources } from '../services/preloadingService';
import { ALL_RESOURCES_TO_PRELOAD, mainLogoUrl } from '../assets';
import { COLORS } from '../constants';

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
            <img src={mainLogoUrl} alt="CES Coach Logo" style={styles.logo} />
            <h1 style={styles.title}>Il tuo allenamento sta per iniziare, sei pronto?</h1>
            <p style={styles.subtitle}>Manca pochissimo!</p>
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
        width: '100%',
        maxWidth: '320px',
        height: 'auto',
        marginBottom: '24px',
    },
    title: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        margin: '0 0 0.5rem 0',
    },
    subtitle: {
        fontSize: '1rem',
        color: COLORS.textSecondary,
        margin: '0 0 2rem 0',
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
        marginTop: '1rem',
        fontSize: '1.125rem',
        fontWeight: 'bold',
        color: COLORS.primary,
    },
};
