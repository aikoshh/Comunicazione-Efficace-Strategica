// App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Module,
  Exercise,
  AnalysisResult,
  VoiceAnalysisResult,
  UserProfile,
  UserProgress,
  Entitlements,
  CommunicatorProfile,
  Product,
} from './types';
import { MODULES } from './constants';
import { onAuthUserChanged, logout } from './services/authService';
import { databaseService } from './services/databaseService';
import { getUserEntitlements, purchaseProduct, restorePurchases } from './services/monetizationService';
import { competenceService } from './services/competenceService';
import { gamificationService } from './services/gamificationService';
import { useToast } from './hooks/useToast';
import { soundService } from './services/soundService';

// Import Screens
import { LoginScreen } from './components/LoginScreen';
import { PreloadingScreen } from './components/PreloadingScreen';
import { HomeScreen } from './components/HomeScreen';
import { ModuleScreen } from './components/ModuleScreen';
import { ExerciseScreen } from './components/ExerciseScreen';
import { AnalysisReportScreen } from './components/AnalysisReportScreen';
import { VoiceAnalysisReportScreen } from './components/VoiceAnalysisReportScreen';
import { StrategicCheckupScreen } from './components/StrategicCheckupScreen';
import { CommunicatorProfileScreen } from './components/CommunicatorProfileScreen';
import { CustomSetupScreen } from './components/CustomSetupScreen';
import { StrategicChatTrainerScreen } from './components/StrategicChatTrainerScreen';
import { AdminScreen } from './components/AdminScreen';
import { PaywallScreen } from './components/PaywallScreen';
import { AchievementsScreen } from './components/AchievementsScreen';
import { CompetenceReportScreen } from './components/CompetenceReportScreen';
import { LevelsScreen } from './components/LevelsScreen';
import { ApiKeyErrorScreen } from './components/ApiKeyErrorScreen';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

type Screen =
  | 'preloading'
  | 'login'
  | 'home'
  | 'module'
  | 'exercise'
  | 'analysis_report'
  | 'voice_analysis_report'
  | 'checkup'
  | 'profile'
  | 'custom_setup'
  | 'chat_trainer'
  | 'admin'
  | 'paywall'
  | 'achievements'
  | 'competence_report'
  | 'levels'
  | 'api_key_error';

interface ScreenState {
  screen: Screen;
  payload?: any;
}

const App: React.FC = () => {
    const [screenState, setScreenState] = useState<ScreenState>({ screen: 'preloading' });
    const [user, setUser] = useState<UserProfile | null>(null);
    const [userProgress, setUserProgress] = useState<UserProgress>(gamificationService.getInitialProgress());
    const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
    const { addToast } = useToast();

    // Sound effect on screen change
    useEffect(() => {
        if (screenState.screen !== 'preloading' && screenState.screen !== 'login') {
            soundService.playClick();
        }
    }, [screenState.screen]);
    
    // Auth and data loading
    useEffect(() => {
        const unsubscribe = onAuthUserChanged(async (authUser) => {
            if (authUser) {
                setUser(authUser);
                const [progress, userEntitlements] = await Promise.all([
                    databaseService.getUserProgress(authUser.uid),
                    getUserEntitlements(authUser),
                ]);
                setUserProgress(progress || gamificationService.getInitialProgress());
                setEntitlements(userEntitlements);
                setScreenState({ screen: 'home' });
            } else {
                setUser(null);
                setUserProgress(gamificationService.getInitialProgress());
                setEntitlements(null);
                setScreenState({ screen: 'login' });
            }
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = useCallback(async () => {
        await logout();
    }, []);

    const handleNavigate = useCallback((screen: Screen, payload?: any) => {
        setScreenState({ screen, payload });
    }, []);
    
    const handleApiKeyError = useCallback((error: string) => {
        handleNavigate('api_key_error', { error });
    }, [handleNavigate]);

    const handleSelectModule = useCallback((module: Module) => {
        if (module.isCustom) {
            if (module.id === 'm6') { // Allenamento Personalizzato
                handleNavigate('custom_setup', { module });
            } else if (module.id === 'm7') { // Chat Trainer
                handleNavigate('chat_trainer', { module });
            }
        } else {
            handleNavigate('module', { module });
        }
    }, [handleNavigate]);

    const handleStartDailyChallenge = useCallback(() => {
        const firstModule = MODULES.find(m => !m.isCustom && m.exercises.length > 0);
        if (firstModule && firstModule.exercises.length > 0) {
            const firstExercise = firstModule.exercises[0];
            handleNavigate('exercise', { exercise: firstExercise, module: firstModule });
        }
    }, [handleNavigate]);

    const handleExerciseComplete = useCallback(async (
        result: AnalysisResult | VoiceAnalysisResult,
        response: string,
        exerciseId: string,
        type: 'written' | 'verbal'
    ) => {
        const isRetake = userProgress.completedExerciseIds.includes(exerciseId);
        const score = 'score' in result ? result.score : Math.round(result.scores.reduce((acc, s) => acc + s.score, 0) / result.scores.length * 10);
        
        const { updatedProgress, newBadges } = gamificationService.processCompletion(userProgress, exerciseId, score, isRetake, '');
        
        const newCompetenceScores = competenceService.updateCompetenceScores(updatedProgress.competenceScores, exerciseId, score);
        
        const finalProgress: UserProgress = {
            ...updatedProgress,
            competenceScores: newCompetenceScores,
            analysisHistory: {
                ...updatedProgress.analysisHistory,
                [exerciseId]: {
                    id: new Date().toISOString(),
                    timestamp: new Date().toISOString(),
                    type,
                    userResponse: response,
                    result,
                }
            }
        };

        setUserProgress(finalProgress);
        await databaseService.saveUserProgress(user!.uid, finalProgress);

        newBadges.forEach(badge => addToast(`Traguardo sbloccato: ${badge.title}`, 'badge', { title: badge.title, icon: badge.icon }));

        const nextScreen = type === 'verbal' ? 'voice_analysis_report' : 'analysis_report';
        handleNavigate(nextScreen, { result, userResponse: response, exercise: screenState.payload.exercise });

    }, [user, userProgress, addToast, handleNavigate, screenState.payload]);
    
    const handleCheckupComplete = useCallback(async (profile: CommunicatorProfile) => {
        const { newBadges } = gamificationService.processCheckupCompletion(userProgress);
        const updatedProgress = { ...userProgress, checkupProfile: profile };
        
        setUserProgress(updatedProgress);
        await databaseService.saveUserProgress(user!.uid, updatedProgress);
        
        newBadges.forEach(badge => addToast(`Traguardo sbloccato: ${badge.title}`, 'badge', { title: badge.title, icon: badge.icon }));
        
        handleNavigate('profile', { profile });
    }, [user, userProgress, addToast, handleNavigate]);

    const handlePurchase = async (product: Product) => {
        if (!user) return;
        try {
            const newEntitlements = await purchaseProduct(user, product);
            setEntitlements(newEntitlements);
            addToast(`Acquisto completato! Benvenuto in PRO!`, 'success');
            soundService.playTriumphSound();
        } catch (e: any) {
            addToast(e.message, 'error');
        }
    };
    
    const renderScreen = () => {
        const { screen, payload } = screenState;

        switch (screen) {
            case 'preloading':
                return <PreloadingScreen onComplete={() => setScreenState({ screen: 'login' })} />;
            case 'login':
                return <LoginScreen />;
            case 'api_key_error':
                return <ApiKeyErrorScreen error={payload.error} />;
            default:
                if (!user) return <LoginScreen />; // Should not happen if logic is correct, but a good safeguard.
                
                const mainContent = () => {
                    switch(screen) {
                        case 'home':
                            return <HomeScreen user={user} progress={userProgress} onSelectModule={handleSelectModule} onStartCheckup={() => handleNavigate('checkup')} onStartDailyChallenge={handleStartDailyChallenge} />;
                        case 'module':
                            return <ModuleScreen module={payload.module} moduleColor={payload.module.color} onSelectExercise={(exercise) => handleNavigate('exercise', { exercise, module: payload.module })} onReviewExercise={(exerciseId) => { const item = userProgress.analysisHistory[exerciseId]; const ex = MODULES.flatMap(m => m.exercises).find(e => e.id === exerciseId); if (item && ex) { const nextScreen = item.type === 'verbal' ? 'voice_analysis_report' : 'analysis_report'; handleNavigate(nextScreen, { result: item.result, userResponse: item.userResponse, exercise: ex, isReview: true }); } }} onBack={() => handleNavigate('home')} completedExerciseIds={userProgress.completedExerciseIds} entitlements={entitlements} analysisHistory={userProgress.analysisHistory} />;
                        case 'exercise':
                            return <ExerciseScreen exercise={payload.exercise} moduleColor={payload.module.color} onComplete={handleExerciseComplete} onBack={() => handleNavigate('module', { module: payload.module })} entitlements={entitlements} analysisHistory={userProgress.analysisHistory} onApiKeyError={handleApiKeyError} />;
                        case 'analysis_report':
                            // FIX: Corrected typo 'entitleaments' to 'entitlements'.
                            return <AnalysisReportScreen result={payload.result} exercise={payload.exercise} userResponse={payload.userResponse} onRetry={() => handleNavigate('exercise', { exercise: payload.exercise, module: MODULES.find(m => m.exercises.some(e => e.id === payload.exercise.id)) })} onNextExercise={() => handleNavigate('home')} nextExerciseLabel="Torna alla Home" entitlements={entitlements} onNavigateToPaywall={() => handleNavigate('paywall')} onPurchase={handlePurchase} isReview={payload.isReview} />;
                        case 'voice_analysis_report':
                            return <VoiceAnalysisReportScreen result={payload.result} exercise={payload.exercise} userResponse={payload.userResponse} onRetry={() => handleNavigate('exercise', { exercise: payload.exercise, module: MODULES.find(m => m.exercises.some(e => e.id === payload.exercise.id)) })} onNextExercise={() => handleNavigate('home')} nextExerciseLabel="Torna alla Home" entitlements={entitlements} onNavigateToPaywall={() => handleNavigate('paywall')} isReview={payload.isReview} />;
                        case 'checkup':
                            return <StrategicCheckupScreen onComplete={handleCheckupComplete} onBack={() => handleNavigate('home')} entitlements={entitlements} onApiKeyError={handleApiKeyError} />;
                        case 'profile':
                            return <CommunicatorProfileScreen profile={payload.profile} onContinue={() => handleNavigate('home')} />;
                        case 'custom_setup':
                             return <CustomSetupScreen module={payload.module} onStart={(scenario, task) => { const customExercise: Exercise = { id: `custom_${Date.now()}`, title: 'Esercizio Personalizzato', difficulty: 'Medio', competence: 'riformulazione', scenario, task, }; handleNavigate('exercise', { exercise: customExercise, module: payload.module }); }} onBack={() => handleNavigate('home')} onApiKeyError={handleApiKeyError} />;
                        case 'chat_trainer':
                            return <StrategicChatTrainerScreen user={user} onBack={() => handleNavigate('home')} isPro={!!entitlements?.productIDs.has('ces.pro.monthly')} onApiKeyError={handleApiKeyError} />;
                        case 'admin':
                            return <AdminScreen onBack={() => handleNavigate('home')} />;
                        case 'paywall':
                            return <PaywallScreen entitlements={entitlements!} onPurchase={handlePurchase} onRestore={async () => { const newEnts = await restorePurchases(user); setEntitlements(newEnts); addToast('Acquisti ripristinati', 'success'); }} onBack={() => handleNavigate('home')} />;
                        case 'achievements':
                            return <AchievementsScreen progress={userProgress} onBack={() => handleNavigate('home')} />;
                        case 'competence_report':
                            return <CompetenceReportScreen userProgress={userProgress} onBack={() => handleNavigate('home')} onSelectExercise={(ex) => handleNavigate('exercise', { exercise: ex, module: MODULES.find(m => m.exercises.some(e => e.id === ex.id)) })} />;
                        case 'levels':
                            return <LevelsScreen onBack={() => handleNavigate('home')} />;
                        default:
                            return <HomeScreen user={user} progress={userProgress} onSelectModule={handleSelectModule} onStartCheckup={() => handleNavigate('checkup')} onStartDailyChallenge={handleStartDailyChallenge} />;
                    }
                }

                return (
                    <div style={{ paddingTop: '64px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                        <Header user={user} onLogout={handleLogout} onNavigate={(s) => handleNavigate(s)} />
                        <main style={{ flex: 1 }}>
                            {mainContent()}
                        </main>
                        {screen === 'home' && <Footer />}
                    </div>
                );
        }
    };

    return renderScreen();
};

export default App;
