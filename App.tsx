import React, { useState, useEffect, useCallback } from 'react';
// FIX: Changed to a value import to bring in the DifficultyLevel enum and be consistent with other files.
import { type UserProfile, type UserProgress, type Entitlements, type AppState, type AnalysisResult, type Module, type Exercise, type CommunicatorProfile, type Product, type Achievement, type VoiceAnalysisResult, type AnalysisHistoryItem, DifficultyLevel } from './types';
import { onAuthUserChanged, logout } from './services/authService';
import { databaseService } from './services/databaseService';
import { getUserEntitlements, purchaseProduct, restorePurchases } from './services/monetizationService';
import { gamificationService } from './services/gamificationService';
import { updateCompetenceScores } from './services/competenceService';
import { MODULES, STRATEGIC_CHECKUP_EXERCISES } from './constants';
import { useToast } from './hooks/useToast';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { HomeScreen } from './components/HomeScreen';
import { ModuleScreen } from './components/ModuleScreen';
import { ExerciseScreen } from './components/ExerciseScreen';
import { AnalysisReportScreen } from './components/AnalysisReportScreen';
import { CustomSetupScreen } from './components/CustomSetupScreen';
import { PreloadingScreen } from './components/PreloadingScreen';
import { StrategicCheckupScreen } from './components/StrategicCheckupScreen';
import { CommunicatorProfileScreen } from './components/CommunicatorProfileScreen';
import { PaywallScreen } from './components/PaywallScreen';
import { AdminScreen } from './components/AdminScreen';
import { ApiKeyErrorScreen } from './components/ApiKeyErrorScreen';
import { VoiceAnalysisReportScreen } from './components/VoiceAnalysisReportScreen';
import { CompetenceReportScreen } from './components/CompetenceReportScreen';
import { AchievementsScreen } from './components/AchievementsScreen';
import { StrategicChatTrainerScreen } from './components/StrategicChatTrainerScreen';

const getInitialAppState = (): AppState => ({
    currentScreen: 'home',
});

const App: React.FC = () => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [progress, setProgress] = useState<UserProgress | undefined>(undefined);
    const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
    const [appState, setAppState] = useState<AppState>(getInitialAppState);
    const [isAppLoading, setIsAppLoading] = useState(true);
    const [dailyChallenge, setDailyChallenge] = useState<Exercise | null>(null);

    const { addToast } = useToast();

    // === Effects ===

    // Auth listener
    useEffect(() => {
        const unsubscribe = onAuthUserChanged(setUser);
        return () => unsubscribe();
    }, []);

    // Fetch user data on login
    useEffect(() => {
        const fetchData = async () => {
            if (user) {
                const [userProgress, userEntitlements] = await Promise.all([
                    databaseService.getUserProgress(user.uid),
                    getUserEntitlements(user),
                ]);
                setProgress(userProgress || gamificationService.getInitialProgress());
                setEntitlements(userEntitlements);
                setIsAppLoading(false);
            } else {
                setIsAppLoading(false);
            }
        };
        fetchData();
    }, [user]);

    // App state persistence
    useEffect(() => {
        if (user) {
            const savedState = localStorage.getItem(`ces_coach_app_state_${user.email}`);
            if (savedState) {
                try {
                    setAppState(JSON.parse(savedState));
                } catch (e) {
                    setAppState(getInitialAppState());
                }
            }
        } else {
            // Clear state on logout
            setAppState(getInitialAppState());
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            localStorage.setItem(`ces_coach_app_state_${user.email}`, JSON.stringify(appState));
        }
    }, [appState, user]);

    // Daily challenge selection
    useEffect(() => {
        const allExercises = MODULES.flatMap(m => m.exercises).filter(e => e.id.startsWith('e'));
        if (allExercises.length > 0) {
            const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
            setDailyChallenge(allExercises[dayOfYear % allExercises.length]);
        }
    }, []);

    // === Callbacks & Handlers ===

    const handleApiKeyError = useCallback((error: string) => {
        setAppState(prev => ({ ...prev, currentScreen: 'api_key_error', apiKeyError: error }));
    }, []);
    
    const saveProgress = useCallback(async (newProgress: UserProgress) => {
        if (user) {
            setProgress(newProgress);
            await databaseService.saveUserProgress(user.uid, newProgress);
        }
    }, [user]);

    const showNewAchievementToast = useCallback((achievement: Achievement) => {
        addToast(`Traguardo Sbloccato!`, 'badge', {
            title: achievement.title,
            icon: achievement.icon,
        });
    }, [addToast]);
    
    const handleLogout = async () => {
        await logout();
        setUser(null);
        setProgress(undefined);
        setEntitlements(null);
        localStorage.removeItem(`ces_coach_app_state_${user?.email}`);
        setAppState(getInitialAppState());
    };

    const handleNavigateToHome = () => setAppState(getInitialAppState());

    const handleSelectModule = (module: Module) => {
        if (module.isCustom) {
            if (module.id === 'm6') { // Custom Training
                setAppState(prev => ({ ...prev, currentScreen: 'custom_setup', currentModuleId: module.id }));
            } else if (module.id === 'm7') { // Chat Trainer
                setAppState(prev => ({ ...prev, currentScreen: 'chat_trainer', currentModuleId: module.id }));
            }
        } else {
            setAppState(prev => ({ ...prev, currentScreen: 'module', currentModuleId: module.id }));
        }
    };
    
    const handleSelectExercise = (exercise: Exercise) => {
        setAppState(prev => ({ ...prev, currentScreen: 'exercise', currentExerciseId: exercise.id }));
    };

    const handleExerciseComplete = async (
        result: AnalysisResult | VoiceAnalysisResult,
        userResponse: string,
        exerciseId: string,
        type: 'written' | 'verbal'
    ) => {
        if (!progress || !dailyChallenge) return;
        const oldProgress = { ...progress };
        const isRetake = oldProgress.completedExerciseIds.includes(exerciseId);
        
        const newScore = 'score' in result ? result.score : Math.round(result.scores.reduce((sum, s) => sum + s.score, 0) / result.scores.length * 10);

        // 1. Update analysis history
        const historyItem: AnalysisHistoryItem = { result, userResponse, timestamp: new Date().toISOString(), type };
        const updatedHistory = { ...oldProgress.analysisHistory, [exerciseId]: historyItem };
        
        // 2. Update competence scores
        const updatedCompetenceScores = updateCompetenceScores(oldProgress.competenceScores, exerciseId, newScore);

        // 3. Process gamification
        const { updatedProgress, levelUp, newBadges } = gamificationService.processCompletion(
            { ...oldProgress, analysisHistory: updatedHistory, competenceScores: updatedCompetenceScores },
            exerciseId,
            newScore,
            isRetake,
            dailyChallenge.id
        );
        
        // 4. Save everything
        await saveProgress(updatedProgress);
        
        // 5. Show toasts
        newBadges.forEach(showNewAchievementToast);
        if (levelUp) {
            addToast(`Level Up! Sei ora un ${levelUp.label}.`, 'success');
        }

        // 6. Navigate to report
        setAppState(prev => ({
            ...prev,
            currentScreen: type === 'verbal' ? 'voice_analysis_report' : 'analysis_report',
            analysisResult: type === 'written' ? result as AnalysisResult : undefined,
            voiceAnalysisResult: type === 'verbal' ? result as VoiceAnalysisResult : undefined,
            userResponse: userResponse,
            isReviewMode: false
        }));
    };

    const handleReviewExercise = (exerciseId: string) => {
        const historyItem = progress?.analysisHistory[exerciseId];
        if (historyItem) {
            setAppState(prev => ({
                ...prev,
                currentScreen: historyItem.type === 'verbal' ? 'voice_analysis_report' : 'analysis_report',
                currentExerciseId: exerciseId,
                analysisResult: historyItem.type === 'written' ? historyItem.result as AnalysisResult : undefined,
                voiceAnalysisResult: historyItem.type === 'verbal' ? historyItem.result as VoiceAnalysisResult : undefined,
                userResponse: historyItem.userResponse,
                isReviewMode: true,
            }));
        }
    };

    const handleStartCustomExercise = (scenario: string, task: string) => {
        const customExercise: Exercise = {
            id: `custom_${Date.now()}`,
            title: 'Esercizio Personalizzato',
            scenario,
            task,
            // FIX: Use enum member instead of string literal for type safety.
            difficulty: DifficultyLevel.BASE,
            competence: null,
        };
        handleSelectExercise(customExercise);
    };

    const handleStartCheckup = () => setAppState(prev => ({ ...prev, currentScreen: 'strategic_checkup' }));

    const handleCheckupComplete = async (profile: CommunicatorProfile) => {
        if (!progress) return;
        const { newBadges } = gamificationService.processCheckupCompletion(progress);
        
        const updatedProgress = { ...progress, checkupProfile: profile };
        await saveProgress(updatedProgress);

        newBadges.forEach(showNewAchievementToast);

        setAppState(prev => ({
            ...prev,
            currentScreen: 'communicator_profile',
            checkupProfile: profile,
        }));
    };

    const handleNavigateToPaywall = () => setAppState(prev => ({ ...prev, currentScreen: 'paywall' }));
    
    const handlePurchase = async (product: Product) => {
        try {
            const newEntitlements = await purchaseProduct(user, product);
            setEntitlements(newEntitlements);
            addToast(`Acquisto di ${product.name} completato!`, 'success');
            handleNavigateToHome();
        } catch (e: any) {
            addToast(e.message, 'error');
        }
    };
    
    const handleRestorePurchases = async () => {
        try {
            const restoredEntitlements = await restorePurchases(user);
            setEntitlements(restoredEntitlements);
            addToast('Acquisti ripristinati con successo.', 'info');
        } catch (e: any) {
            addToast(e.message, 'error');
        }
    };

    const currentModule = MODULES.find(m => m.id === appState.currentModuleId);
    const currentExercise = appState.currentExerciseId?.startsWith('custom_')
        // FIX: Use enum member instead of string literal for type safety.
        ? { id: appState.currentExerciseId, title: 'Esercizio Personalizzato', scenario: '', task: '', difficulty: DifficultyLevel.BASE, competence: null } // Placeholder for custom
        : MODULES.flatMap(m => m.exercises).find(e => e.id === appState.currentExerciseId)
        || STRATEGIC_CHECKUP_EXERCISES.find(e => e.id === appState.currentExerciseId)
        || dailyChallenge;

    // === Render Logic ===

    if (isAppLoading) {
        return <PreloadingScreen onComplete={() => {}} />;
    }

    if (!user) {
        return <LoginScreen />;
    }

    const renderContent = () => {
        switch (appState.currentScreen) {
            case 'home':
                return dailyChallenge && <HomeScreen user={user} progress={progress} entitlements={entitlements} dailyChallenge={dailyChallenge} onSelectModule={handleSelectModule} onStartDailyChallenge={handleSelectExercise} onStartCheckup={handleStartCheckup} onStartChatTrainer={() => handleSelectModule({id: 'm7', isCustom: true} as Module)} onNavigateToPaywall={handleNavigateToPaywall} onNavigateToCompetenceReport={() => setAppState(prev => ({...prev, currentScreen: 'competence_report'}))} />;
            case 'module':
                return currentModule && <ModuleScreen module={currentModule} moduleColor="#1C3E5E" onSelectExercise={handleSelectExercise} onReviewExercise={handleReviewExercise} onBack={handleNavigateToHome} completedExerciseIds={progress?.completedExerciseIds || []} entitlements={entitlements} analysisHistory={progress?.analysisHistory || {}} />;
            case 'exercise':
                // FIX: Corrected typo in entitlements prop.
                return currentExercise && <ExerciseScreen exercise={currentExercise} moduleColor="#1C3E5E" onComplete={handleExerciseComplete} onBack={() => setAppState(prev => ({ ...prev, currentScreen: 'module' }))} entitlements={entitlements} analysisHistory={progress?.analysisHistory || {}} onApiKeyError={handleApiKeyError} />;
            case 'analysis_report':
                return appState.analysisResult && currentExercise && <AnalysisReportScreen result={appState.analysisResult} exercise={currentExercise} onRetry={() => setAppState(prev => ({...prev, currentScreen: 'exercise'}))} onNextExercise={handleNavigateToHome} nextExerciseLabel="Torna alla Home" entitlements={entitlements} onNavigateToPaywall={handleNavigateToPaywall} onPurchase={handlePurchase} userResponse={appState.userResponse} isReview={appState.isReviewMode} />;
            case 'voice_analysis_report':
                return appState.voiceAnalysisResult && currentExercise && <VoiceAnalysisReportScreen result={appState.voiceAnalysisResult} exercise={currentExercise} onRetry={() => setAppState(prev => ({...prev, currentScreen: 'exercise'}))} onNextExercise={handleNavigateToHome} nextExerciseLabel="Torna alla Home" entitlements={entitlements} onNavigateToPaywall={handleNavigateToPaywall} userResponse={appState.userResponse} isReview={appState.isReviewMode} />;
            case 'custom_setup':
                return currentModule && <CustomSetupScreen module={currentModule} onStart={handleStartCustomExercise} onBack={() => setAppState(prev => ({ ...prev, currentScreen: 'module' }))} onApiKeyError={handleApiKeyError} />;
            case 'strategic_checkup':
                return <StrategicCheckupScreen onComplete={handleCheckupComplete} onBack={handleNavigateToHome} entitlements={entitlements} onApiKeyError={handleApiKeyError} />;
            case 'communicator_profile':
                return appState.checkupProfile && <CommunicatorProfileScreen profile={appState.checkupProfile} onContinue={handleNavigateToHome} />;
            case 'paywall':
                return entitlements && <PaywallScreen entitlements={entitlements} onPurchase={handlePurchase} onRestore={handleRestorePurchases} onBack={handleNavigateToHome} />;
            case 'admin':
                return <AdminScreen onBack={handleNavigateToHome} />;
            case 'chat_trainer':
                return currentModule && <StrategicChatTrainerScreen module={currentModule} onBack={handleNavigateToHome} onApiKeyError={handleApiKeyError} />;
            case 'api_key_error':
                return <ApiKeyErrorScreen error={appState.apiKeyError || 'Errore sconosciuto'} />;
            case 'competence_report':
                return progress && <CompetenceReportScreen userProgress={progress} onBack={handleNavigateToHome} onSelectExercise={handleSelectExercise} />;
            case 'achievements':
                return progress && <AchievementsScreen progress={progress} onBack={handleNavigateToHome} />;
            default:
                return <div>Schermata non trovata</div>;
        }
    };

    return (
        <>
            <Header user={user} onLogout={handleLogout} onNavigateToHome={handleNavigateToHome} onNavigateToPaywall={handleNavigateToPaywall} onNavigateToAdmin={() => setAppState(prev => ({...prev, currentScreen: 'admin'}))} entitlements={entitlements} currentModule={currentModule} onNavigateToModule={() => setAppState(prev => ({...prev, currentScreen: 'module'}))} />
            <main>{renderContent()}</main>
        </>
    );
};

export default App;
