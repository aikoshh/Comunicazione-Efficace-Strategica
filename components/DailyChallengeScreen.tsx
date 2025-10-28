// components/DailyChallengeScreen.tsx
import React, { useEffect } from 'react';
import { FullScreenLoader } from './Loader';
import { Exercise } from '../types';
import { generateCustomExercise } from '../services/geminiService';

interface DailyChallengeScreenProps {
  onChallengeReady: (exercise: Exercise) => void;
  onApiKeyError: (error: string) => void;
}

export const DailyChallengeScreen: React.FC<DailyChallengeScreenProps> = ({ onChallengeReady, onApiKeyError }) => {
    useEffect(() => {
        const generateChallenge = async () => {
            try {
                // Generate a random, interesting challenge
                const { scenario, task } = await generateCustomExercise({
                    professione: 'Professionista Ambizioso',
                    livelloCarriera: 'Mid-level/Specialist',
                    eta: '25-50 anni',
                    contestoComunicativo: 'Una situazione lavorativa inaspettata',
                    sfidaPrincipale: 'Gestire una conversazione difficile o delicata con lucidità e strategia'
                });
                
                const dailyExercise: Exercise = {
                    id: `daily_${new Date().toISOString().split('T')[0]}`,
                    title: 'Sfida del Giorno',
                    scenario,
                    task,
                    difficulty: 'Medio',
                    competence: 'riformulazione', // generic competence
                };
                onChallengeReady(dailyExercise);

            } catch (error: any) {
                console.error("Failed to generate daily challenge:", error);
                if (error.message.includes('API key')) {
                    onApiKeyError(error.message);
                }
            }
        };

        generateChallenge();
    }, [onChallengeReady, onApiKeyError]);

    return <FullScreenLoader estimatedTime={20} />;
};

export default DailyChallengeScreen;
