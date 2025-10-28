
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { onAuthUserChanged, logout } from './services/authService';
import { databaseService } from './services/databaseService';
import { competenceService } from './services/competenceService';
import { gamificationService } from './services/gamificationService';
import { getUserEntitlements, purchaseProduct, restorePurchases } from './services/monetizationService';
import { MODULES, STRATEGIC_CHECKUP_EXERCISES } from './constants';
import { soundService } from './services/soundService';
import { useToast } from './hooks/useToast';
import { 
    UserProfile, UserProgress, Module, Exercise, AnalysisResult, VoiceAnalysisResult, Entitlements,
    CommunicatorProfile, Product, AnalysisHistoryItem, ExerciseType, Achievement 
} from './types';
import { LoginScreen } from './components/LoginScreen';
import { PreloadingScreen } from './components/PreloadingScreen';
import { HomeScreen } from './components/HomeScreen';
import { Header } from './components/Header';
import { ModuleScreen } from './components/ModuleScreen';
import { ExerciseScreen } from './components/ExerciseScreen';
import { AnalysisReportScreen } from './components/AnalysisReportScreen';
import { VoiceAnalysisReportScreen } from './components/VoiceAnalysisReportScreen';
import { StrategicCheckupScreen } from './components/StrategicCheckupScreen';
import { CommunicatorProfileScreen } from './components/CommunicatorProfileScreen';
import { CustomSetupScreen } from './components/CustomSetupScreen';
import { StrategicChatTrainerScreen } from './components/StrategicChatTrainerScreen';
import { ApiKeyErrorScreen } from './components/ApiKeyErrorScreen';
import { PaywallScreen } from './components/PaywallScreen';
import { AdminScreen } from './components/AdminScreen';
import { AchievementsScreen } from './components/AchievementsScreen';
import { CompetenceReportScreen } from './components/CompetenceReportScreen';
import { LevelsScreen } from './components/LevelsScreen';
import { Footer } from './components/Footer';
import { hasProAccess } from './services/monetizationService';
import { FullScreenLoader } from './components/Loader';

type Screen = 'preloading' | 'login' | 'home' | 'module' | 'exercise' | 'analysisReport' | 'strategicCheckup' | 'communicatorProfile' | 'customSetup' | 'chatTrainer' | 'apiKeyError' | 'paywall' | 'admin' | 'achievements' | 'competence_report' | 'levels';

const App: React.FC = () => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [progress, setProgress] = useState<UserProgress | undefined>(undefined);
    const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [screen, setScreen] = useState<Screen>('preloading');
    const [currentModule, setCurrentModule] = useState<Module | null>(null);
    const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | VoiceAnalysisResult | null>(null);
    const [userResponseForReport, setUserResponseForReport] = useState('');
    const [apiKeyError, setApiKeyError] = useState<string | null>(null);
    const { addToast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthUserChanged(async (authUser) => {
            setUser(authUser);
            if (authUser) {
                try {
                    const [userProgress, userEntitlements] = await Promise.all([
                        databaseService.getUserProgress(authUser.uid),
                        getUserEntitlements(authUser),
                    ]);
                    setProgress(userProgress || gamificationService.getInitialProgress());
                    setEntitlements(userEntitlements);
                    setScreen('home');
                } catch (error) {
                    console.error("Failed to load user data:", error);
                    addToast("Impossibile caricare i dati del profilo.", 'error');
                    await logout(); // Log out the user if data loading fails
                    setScreen('login');
                }
            } else {
                setScreen('login');
            }
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, [addToast]);

    const updateProgress = useCallback(async (newProgress: UserProgress) => {
        if (user) {
            setProgress(newProgress);
            await databaseService.saveUserProgress(user.uid, newProgress);
        }
    }, [user]);
    
    const handleBack = () => {
        soundService.playClick();
        switch(screen) {
            case 'module':
            case 'strategicCheckup':
            case 'customSetup':
            case 'chatTrainer':
            case 'paywall':
            case 'admin':
            case 'achievements':
            case 'competence_report':
            case 'levels':
            case 'communicatorProfile':
                handleNavigate('home');
                break;
            case 'exercise':
            case 'analysisReport':
                if (currentModule) {
                    handleNavigate('module');
                } else {
                    handleNavigate('home');
                }
                break;
            default:
                handleNavigate('home');
                break;
        }
    };

    const handleApiKeyError = (error: string) => {
        setApiKeyError(error);
        setScreen('apiKeyError');
    };

    const handleLogout = async () => {
        await logout();
        setUser(null);
        setProgress(undefined);
        setEntitlements(null);
        setScreen('login');
    };
    
    const handleNavigate = (newScreen: Screen) => {
        setScreen(newScreen);
        window.scrollTo(0, 0);
    };

    const handleSelectModule = (module: Module) => {
        if (module.id === 'm6') {
             handleNavigate('customSetup');
        } else if (module.id === 'm7') {
             handleNavigate('chatTrainer');
        } else {
            setCurrentModule(module);
            handleNavigate('module');
        }
    };
    
    const handleSelectExercise = (exercise: Exercise) => {
        setCurrentExercise(exercise);
        handleNavigate('exercise');
    };

    const handleExerciseComplete = useCallback(async (
        result: AnalysisResult | VoiceAnalysisResult,
        userResponse: string,
        exerciseId: string,
        type: 'written' | 'verbal'
    ) => {
        if (!user || !progress) return;

        const isRetake = progress.analysisHistory.hasOwnProperty(exerciseId);
        const score = 'score' in result ? result.score : (result.scores.reduce((sum, s) => sum + s.score, 0) / result.scores.length * 10);
        
        const { updatedProgress: progressAfterGamification, newBadges } = gamificationService.processCompletion(progress, exerciseId, score, isRetake, '');
        
        const updatedCompetenceScores = competenceService.updateCompetenceScores(progressAfterGamification.competenceScores, exerciseId, score);

        const newHistoryItem: AnalysisHistoryItem = { result, userResponse, timestamp: new Date().toISOString(), type };

        const finalProgress: UserProgress = {
            ...progressAfterGamification,
            competenceScores: updatedCompetenceScores,
            analysisHistory: {
                ...progressAfterGamification.analysisHistory,
                [exerciseId]: newHistoryItem
            }
        };

        await updateProgress(finalProgress);

        newBadges.forEach(badge => {
            addToast(`Traguardo Sbloccato!`, 'badge', badge);
        });

        setUserResponseForReport(userResponse);
        setAnalysisResult(result);
        handleNavigate('analysisReport');

    }, [user, progress, addToast, updateProgress]);

    const handleCheckupComplete = useCallback(async (profile: CommunicatorProfile) => {
        if (!user || !progress) return;
        
        const { newBadges } = gamificationService.processCheckupCompletion(progress);

        const updatedProgress: UserProgress = {
            ...progress,
            checkupProfile: profile,
        };

        await updateProgress(updatedProgress);
        
        newBadges.forEach(badge => {
            addToast(`Traguardo Sbloccato!`, 'badge', badge);
        });

        handleNavigate('communicatorProfile');
    }, [user, progress, addToast, updateProgress]);

    const handleStartCustomExercise = (scenario: string, task: string) => {
        const customExercise: Exercise = {
            id: `custom_${Date.now()}`,
            title: 'Esercizio Personalizzato',
            scenario,
            task,
            difficulty: 'Medio',
            competence: 'riformulazione',
        };
        setCurrentExercise(customExercise);
        handleNavigate('exercise');
    };

    const handleStartDailyChallenge = () => {
        soundService.playClick();
        const firstModule = MODULES.find(m => m.exercises.length > 0 && !m.isCustom);
        if (firstModule?.exercises[0]) {
            setCurrentModule(firstModule);
            setCurrentExercise(firstModule.exercises[0]);
            handleNavigate('exercise');
        } else {
            addToast("Nessuna sfida del giorno disponibile al momento.", "info");
        }
    };

    const handleReviewExercise = (exerciseId: string) => {
        if (!progress) return;
        const historyItem = progress.analysisHistory[exerciseId];
        const exercise = MODULES.flatMap(m => m.exercises).find(e => e.id === exerciseId) || STRATEGIC_CHECKUP_EXERCISES.find(e => e.id === exerciseId);
        if (historyItem && exercise) {
            setCurrentExercise(exercise);
            setAnalysisResult(historyItem.result);
            setUserResponseForReport(historyItem.userResponse);
            handleNavigate('analysisReport');
        }
    };
    
    const handlePurchase = async (product: Product) => {
        if (!user) {
            addToast('Devi essere autenticato per acquistare.', 'error');
            return;
        }
        try {
            const newEntitlements = await purchaseProduct(user, product);
            setEntitlements(newEntitlements);
            addToast('Acquisto completato! Funzionalità PRO sbloccate.', 'success');
            handleNavigate('home');
        } catch (error: any) {
            addToast(error.message || 'Errore durante l\'acquisto.', 'error');
        }
    };
    
    const handleRestore = async () => {
         if (!user) {
            addToast('Devi essere autenticato per ripristinare.', 'error');
            return;
        }
        try {
            const restoredEntitlements = await restorePurchases(user);
            setEntitlements(restoredEntitlements);
            addToast('Acquisti ripristinati.', 'success');
        } catch(error: any) {
            addToast(error.message || 'Errore durante il ripristino.', 'error');
        }
    }
    
    const renderContent = () => {
        if (authLoading) return <PreloadingScreen onComplete={() => {}} />;
        if (apiKeyError) return <ApiKeyErrorScreen error={apiKeyError} />;
        if (!user) return <LoginScreen />;

        const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
            <>
                <Header 
                    user={user} 
                    onLogout={handleLogout} 
                    onNavigate={handleNavigate} 
                    showBack={screen !== 'home'}
                    onBack={handleBack}
                    currentModule={currentModule}
                />
                <div style={{ paddingTop: '64px', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                  <div style={{ flex: 1 }}>{children}</div>
                  <Footer />
                </div>
            </>
        );

        switch(screen) {
            case 'preloading':
                return <PreloadingScreen onComplete={() => setScreen(user ? 'home' : 'login')} />;
            case 'login':
                return <LoginScreen />;
            case 'home':
                return <Layout><HomeScreen user={user} progress={progress} onSelectModule={handleSelectModule} onStartCheckup={() => handleNavigate('strategicCheckup')} onNavigateToReport={() => handleNavigate('competence_report')} onStartDailyChallenge={handleStartDailyChallenge} entitlements={entitlements} onNavigate={handleNavigate} /></Layout>;
            case 'module':
                if (!currentModule) return <Layout><div>Modulo non trovato.</div></Layout>;
                return <Layout><ModuleScreen module={currentModule} moduleColor={currentModule.color} onSelectExercise={handleSelectExercise} completedExerciseIds={progress?.completedExerciseIds || []} entitlements={entitlements} analysisHistory={progress?.analysisHistory || {}} onReviewExercise={handleReviewExercise} /></Layout>;
            case 'exercise':
                if (!currentExercise) return <Layout><div>Esercizio non trovato.</div></Layout>;
                return <Layout><ExerciseScreen exercise={currentExercise} moduleColor={currentModule?.color || '#333'} onComplete={handleExerciseComplete} entitlements={entitlements} analysisHistory={progress?.analysisHistory || {}} onApiKeyError={handleApiKeyError} /></Layout>;
            case 'analysisReport':
                if (!analysisResult || !currentExercise) return <Layout><div>Report non disponibile.</div></Layout>;
                const nextExercise = MODULES.flatMap(m => m.exercises).find(e => e.id > currentExercise.id && !progress?.completedExerciseIds.includes(e.id));
                const isReview = progress?.analysisHistory.hasOwnProperty(currentExercise.id);
                
                if ('scores' in analysisResult) { // It's a VoiceAnalysisResult
                    return <Layout><VoiceAnalysisReportScreen result={analysisResult} exercise={currentExercise} onRetry={() => handleSelectExercise(currentExercise)} onNextExercise={() => nextExercise ? handleSelectExercise(nextExercise) : handleNavigate('home')} nextExerciseLabel={nextExercise ? 'Prossimo Esercizio' : 'Torna alla Home'} entitlements={entitlements} onNavigateToPaywall={() => handleNavigate('paywall')} userResponse={userResponseForReport} isReview={isReview} /></Layout>
                }
                return <Layout><AnalysisReportScreen result={analysisResult} exercise={currentExercise} onRetry={() => handleSelectExercise(currentExercise)} onNextExercise={() => nextExercise ? handleSelectExercise(nextExercise) : handleNavigate('home')} nextExerciseLabel={nextExercise ? 'Prossimo Esercizio' : 'Torna alla Home'} entitlements={entitlements} onNavigateToPaywall={() => handleNavigate('paywall')} onPurchase={handlePurchase} userResponse={userResponseForReport} isReview={isReview} /></Layout>;
            case 'strategicCheckup':
                return <Layout><StrategicCheckupScreen onComplete={handleCheckupComplete} entitlements={entitlements} onApiKeyError={handleApiKeyError} /></Layout>;
            case 'communicatorProfile':
                return <Layout><CommunicatorProfileScreen profile={progress?.checkupProfile} onContinue={() => handleNavigate('home')} /></Layout>;
            case 'customSetup':
                const customModule = MODULES.find(m => m.id === 'm6');
                if (!customModule) return <Layout><div>Modulo non trovato.</div></Layout>;
// FIX: Added missing 'onBack' prop to satisfy the CustomSetupScreenProps interface.
                return <Layout><CustomSetupScreen module={customModule} onStart={handleStartCustomExercise} onApiKeyError={handleApiKeyError} onBack={handleBack} /></Layout>;
            case 'chatTrainer':
                return <Layout><StrategicChatTrainerScreen user={user} isPro={hasProAccess(entitlements)} onApiKeyError={handleApiKeyError} /></Layout>;
            case 'paywall':
                if (!entitlements) return <FullScreenLoader />;
// FIX: Added missing 'onBack' prop to satisfy the PaywallScreenProps interface.
                return <Layout><PaywallScreen entitlements={entitlements} onPurchase={handlePurchase} onRestore={handleRestore} onBack={handleBack} /></Layout>;
            case 'admin':
                return user.isAdmin ? <Layout><AdminScreen /></Layout> : <Layout><div>Accesso non autorizzato.</div></Layout>;
            case 'achievements':
                return <Layout><AchievementsScreen progress={progress!} /></Layout>;
            case 'competence_report':
// FIX: Added missing 'onBack' prop to satisfy the CompetenceReportScreenProps interface.
                return <Layout><CompetenceReportScreen userProgress={progress!} onSelectExercise={handleSelectExercise} onBack={handleBack} /></Layout>;
            case 'levels':
                 return <Layout><LevelsScreen /></Layout>;
            default:
                return <LoginScreen />;
        }
    };

    return <div className="App">{renderContent()}</div>;
};

export default App;
