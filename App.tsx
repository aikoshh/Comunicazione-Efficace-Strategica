// App.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Components
import { LoginScreen } from './components/LoginScreen';
import { HomeScreen } from './components/HomeScreen';
import { ModuleScreen } from './components/ModuleScreen';
import { ExerciseScreen } from './components/ExerciseScreen';
import { CustomSetupScreen } from './components/CustomSetupScreen';
import { StrategicChatTrainerScreen } from './components/StrategicChatTrainerScreen';
import { AnalysisReportScreen } from './components/AnalysisReportScreen';
import { VoiceAnalysisReportScreen } from './components/VoiceAnalysisReportScreen';
import { StrategicCheckupScreen } from './components/StrategicCheckupScreen';
import { CommunicatorProfileScreen } from './components/CommunicatorProfileScreen';
import { FullScreenLoader } from './components/Loader';
import { ApiKeyErrorScreen } from './components/ApiKeyErrorScreen';
import { PreloadingScreen } from './components/PreloadingScreen';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { PaywallScreen } from './components/PaywallScreen';
import { AdminScreen } from './components/AdminScreen';
import { AchievementsScreen } from './components/AchievementsScreen';
import { CompetenceReportScreen } from './components/CompetenceReportScreen';
import { LevelsScreen } from './components/LevelsScreen';

// Types
import { 
  UserProfile, UserProgress, Module, Exercise, AnalysisResult, 
  VoiceAnalysisResult, CommunicatorProfile, Entitlements, 
  AnalysisHistoryItem, Product, Achievement, ExerciseType
} from './types';

// Services
import { onAuthUserChanged, logout } from './services/authService';
import { databaseService } from './services/databaseService';
import { getUserEntitlements, purchaseProduct, restorePurchases, hasProAccess } from './services/monetizationService';
import { gamificationService } from './services/gamificationService';
import { competenceService } from './services/competenceService';
import { soundService } from './services/soundService';

// Constants & Hooks
import { MODULES, STRATEGIC_CHECKUP_EXERCISES } from './constants';
import { useToast } from './hooks/useToast';

type Screen = 'preloading' | 'login' | 'home' | 'module' | 'exercise' | 'custom_setup' | 'chat_trainer' | 'report' | 'voice_report' | 'checkup' | 'profile' | 'admin' | 'paywall' | 'achievements' | 'competence_report' | 'levels' | 'review_report' | 'review_voice_report';

const App: React.FC = () => {
    // Auth State
    const [user, setUser] = useState<UserProfile | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    // App State
    const [currentScreen, setCurrentScreen] = useState<Screen>('preloading');
    const [userProgress, setUserProgress] = useState<UserProgress | undefined>(undefined);
    const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
    
    // Navigation State
    const [selectedModule, setSelectedModule] = useState<Module | null>(null);
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    
    // Result State
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | VoiceAnalysisResult | null>(null);
    const [userResponse, setUserResponse] = useState('');
    const [communicatorProfile, setCommunicatorProfile] = useState<CommunicatorProfile | null>(null);
    
    // Error State
    const [apiKeyError, setApiKeyError] = useState<string | null>(null);
    
    // Loading State
    const [isDataLoading, setIsDataLoading] = useState(true);

    const { addToast } = useToast();

    // Memoize all exercises for daily challenge
    const allExercises = useMemo(() => MODULES.flatMap(m => m.exercises), []);

    // Auth effect
    useEffect(() => {
        const unsubscribe = onAuthUserChanged(setUser);
        return () => unsubscribe();
    }, []);

    // Data fetching effect
    useEffect(() => {
        const fetchData = async () => {
            if (user) {
                setIsDataLoading(true);
                try {
                    const [progress, entitlementsData] = await Promise.all([
                        databaseService.getUserProgress(user.uid),
                        getUserEntitlements(user)
                    ]);
                    setUserProgress(progress || gamificationService.getInitialProgress());
                    setEntitlements(entitlementsData);
                    setCurrentScreen('home');
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    addToast("Errore nel caricamento dei dati utente.", "error");
                    // Logout user if data fetch fails to avoid being stuck
                    await logout();
                } finally {
                    setIsDataLoading(false);
                }
            } else {
                setUserProgress(undefined);
                setEntitlements(null);
                setCurrentScreen('login');
            }
        };

        // This effect triggers once preloading is done (authLoading is set to false)
        // It then determines whether to show the login screen or fetch user data and show the home screen.
        if (!authLoading) {
            fetchData();
        }
    }, [user, authLoading, addToast]);


    // Handlers
    const handleLogout = useCallback(async () => {
        await logout();
        setUser(null);
        setCurrentScreen('login');
    }, []);

    const handleApiKeyError = useCallback((error: string) => {
        setApiKeyError(error);
    }, []);

    const handleBackToHome = useCallback(() => {
        setSelectedModule(null);
        setSelectedExercise(null);
        setCurrentScreen('home');
    }, []);

    const handleNavigate = useCallback((screen: Screen) => {
        setCurrentScreen(screen);
    }, []);

    const handleSelectModule = useCallback((module: Module) => {
        if (module.id === 'm6') {
            setCurrentScreen('custom_setup');
        } else if (module.id === 'm7') {
            setCurrentScreen('chat_trainer');
        } else {
            setSelectedModule(module);
            setCurrentScreen('module');
        }
    }, []);
    
    const handleSelectExercise = useCallback((exercise: Exercise) => {
        setSelectedExercise(exercise);
        setCurrentScreen('exercise');
    }, []);

    const handleStartCustomExercise = useCallback((scenario: string, task: string) => {
        const customExercise: Exercise = {
            id: `custom_${Date.now()}`,
            title: 'Esercizio Personalizzato',
            scenario,
            task,
            difficulty: 'Medio',
            competence: 'riformulazione',
        };
        setSelectedExercise(customExercise);
        setCurrentScreen('exercise');
    }, []);

    const handlePurchase = useCallback(async (product: Product) => {
        if (!user) return;
        try {
            const newEntitlements = await purchaseProduct(user, product);
            setEntitlements(newEntitlements);
            addToast(`Acquisto di ${product.name} completato!`, 'success');
            soundService.playTriumphSound();
        } catch (error: any) {
            addToast(error.message, 'error');
        }
    }, [user, addToast]);
    
    const handleRestore = useCallback(async () => {
        if (!user) return;
        try {
            const restoredEntitlements = await restorePurchases(user);
            setEntitlements(restoredEntitlements);
            addToast('Acquisti ripristinati con successo.', 'success');
        } catch (error: any) {
            addToast(error.message, 'error');
        }
    }, [user, addToast]);

    const handleExerciseComplete = useCallback(async (
        result: AnalysisResult | VoiceAnalysisResult,
        response: string,
        exerciseId: string,
        type: 'written' | 'verbal'
    ) => {
        if (!user || !userProgress) return;

        const isRetake = userProgress.analysisHistory[exerciseId] !== undefined;
        const newScore = 'score' in result ? result.score : Math.round(result.scores.reduce((acc, s) => acc + s.score, 0) / result.scores.length * 10);
        
        const { updatedProgress, newBadges, levelUp } = gamificationService.processCompletion(userProgress, exerciseId, newScore, isRetake, '');
        
        updatedProgress.competenceScores = competenceService.updateCompetenceScores(updatedProgress.competenceScores, exerciseId, newScore);
        
        const newHistoryItem: AnalysisHistoryItem = {
            id: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            type,
            userResponse: response,
            result,
        };
        updatedProgress.analysisHistory = { ...updatedProgress.analysisHistory, [exerciseId]: newHistoryItem };

        await databaseService.saveUserProgress(user.uid, updatedProgress);
        setUserProgress(updatedProgress);
        setAnalysisResult(result);
        setUserResponse(response);

        newBadges.forEach((badge: Achievement) => {
            addToast(badge.description, 'badge', { title: `Traguardo Sbloccato: ${badge.title}`, icon: badge.icon });
        });
        if (levelUp) {
            addToast(`Congratulazioni! Sei salito al livello: ${levelUp.label}`, 'success');
        }
        
        setCurrentScreen(type === 'verbal' ? 'voice_report' : 'report');

    }, [user, userProgress, addToast]);
    
    const handleCheckupComplete = useCallback(async (profile: CommunicatorProfile) => {
        if (!user || !userProgress) return;
        
        const { newBadges } = gamificationService.processCheckupCompletion(userProgress);
        
        const updatedProgress = { ...userProgress, checkupProfile: profile };
        
        await databaseService.saveUserProgress(user.uid, updatedProgress);
        setUserProgress(updatedProgress);
        setCommunicatorProfile(profile);
        setCurrentScreen('profile');

        newBadges.forEach((badge: Achievement) => {
            addToast(badge.description, 'badge', { title: `Traguardo Sbloccato: ${badge.title}`, icon: badge.icon });
        });
    }, [user, userProgress, addToast]);

    const handleStartCheckup = useCallback(() => {
        setCurrentScreen('checkup');
    }, []);
    
    const handleStartDailyChallenge = useCallback(() => {
        const nonVerbalExercises = allExercises.filter(ex => ex.exerciseType !== ExerciseType.VERBAL && !STRATEGIC_CHECKUP_EXERCISES.some(ce => ce.id === ex.id));
        const challenge = nonVerbalExercises[Math.floor(Math.random() * nonVerbalExercises.length)];
        setSelectedExercise(challenge);
        setCurrentScreen('exercise');
    }, [allExercises]);

    const handleReviewExercise = useCallback((exerciseId: string) => {
        if (!userProgress) return;

        const historyItem = userProgress.analysisHistory[exerciseId];
        const exercise = allExercises.find(ex => ex.id === exerciseId);
        
        if (historyItem && exercise) {
            setSelectedExercise(exercise);
            setAnalysisResult(historyItem.result);
            setUserResponse(historyItem.userResponse);
            setCurrentScreen(historyItem.type === 'verbal' ? 'review_voice_report' : 'review_report');
        }
    }, [userProgress, allExercises]);


    const renderContent = () => {
        const isPro = hasProAccess(entitlements);

        switch (currentScreen) {
            case 'home':
                return <HomeScreen user={user!} progress={userProgress} onSelectModule={handleSelectModule} onStartCheckup={handleStartCheckup} onStartDailyChallenge={handleStartDailyChallenge} />;
            case 'module':
                return <ModuleScreen module={selectedModule!} moduleColor={selectedModule!.color} onSelectExercise={handleSelectExercise} onReviewExercise={handleReviewExercise} onBack={handleBackToHome} completedExerciseIds={userProgress?.completedExerciseIds || []} entitlements={entitlements} analysisHistory={userProgress?.analysisHistory || {}} />;
            case 'exercise':
                return <ExerciseScreen exercise={selectedExercise!} moduleColor={selectedModule?.color || '#1C3E5E'} onComplete={handleExerciseComplete} onBack={() => setCurrentScreen(selectedModule ? 'module' : 'home')} entitlements={entitlements} analysisHistory={userProgress?.analysisHistory || {}} onApiKeyError={handleApiKeyError} />;
            case 'custom_setup':
                 return <CustomSetupScreen module={MODULES.find(m => m.id === 'm6')!} onStart={handleStartCustomExercise} onBack={handleBackToHome} onApiKeyError={handleApiKeyError} />;
            case 'chat_trainer':
                return <StrategicChatTrainerScreen user={user!} onBack={handleBackToHome} isPro={isPro} onApiKeyError={handleApiKeyError} />;
            case 'report':
            case 'review_report':
                 return <AnalysisReportScreen result={analysisResult as AnalysisResult} exercise={selectedExercise!} onRetry={() => handleSelectExercise(selectedExercise!)} onNextExercise={handleBackToHome} nextExerciseLabel={currentScreen === 'review_report' ? 'Torna alla Home' : 'Torna alla Home'} entitlements={entitlements} onNavigateToPaywall={() => handleNavigate('paywall')} onPurchase={handlePurchase} userResponse={userResponse} isReview={currentScreen === 'review_report'} />;
            case 'voice_report':
            case 'review_voice_report':
                return <VoiceAnalysisReportScreen result={analysisResult as VoiceAnalysisResult} exercise={selectedExercise!} onRetry={() => handleSelectExercise(selectedExercise!)} onNextExercise={handleBackToHome} nextExerciseLabel={currentScreen === 'review_voice_report' ? 'Torna alla Home' : 'Prossimo Esercizio'} entitlements={entitlements} onNavigateToPaywall={() => handleNavigate('paywall')} userResponse={userResponse} isReview={currentScreen === 'review_voice_report'} />;
            case 'checkup':
                return <StrategicCheckupScreen onComplete={handleCheckupComplete} onBack={handleBackToHome} entitlements={entitlements} onApiKeyError={handleApiKeyError} />;
            case 'profile':
                return <CommunicatorProfileScreen profile={communicatorProfile!} onContinue={handleBackToHome} />;
            case 'paywall':
                return <PaywallScreen entitlements={entitlements!} onPurchase={handlePurchase} onRestore={handleRestore} onBack={handleBackToHome} />;
            case 'admin':
                return <AdminScreen onBack={handleBackToHome} />;
            case 'achievements':
                return <AchievementsScreen progress={userProgress!} onBack={handleBackToHome} />;
            case 'competence_report':
                return <CompetenceReportScreen userProgress={userProgress!} onBack={handleBackToHome} onSelectExercise={handleSelectExercise} />;
            case 'levels':
                return <LevelsScreen onBack={handleBackToHome} />;
            default:
                return <HomeScreen user={user!} progress={userProgress} onSelectModule={handleSelectModule} onStartCheckup={handleStartCheckup} onStartDailyChallenge={handleStartDailyChallenge} />;
        }
    };

    if (apiKeyError) {
        return <ApiKeyErrorScreen error={apiKeyError} />;
    }

    if (currentScreen === 'preloading') {
        return <PreloadingScreen onComplete={() => setAuthLoading(false)} />;
    }

    if (authLoading || (user && isDataLoading)) {
        return <FullScreenLoader estimatedTime={20} />;
    }
    
    if (!user) {
        return <LoginScreen />;
    }
    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingTop: '64px' }}>
            <Header user={user} onLogout={handleLogout} onNavigate={handleNavigate} />
            <main style={{ flex: 1 }}>
                {renderContent()}
            </main>
            {currentScreen !== 'exercise' && currentScreen !== 'checkup' && <Footer />}
        </div>
    );
};

export default App;