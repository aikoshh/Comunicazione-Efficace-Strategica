import React, { useState, useEffect, useCallback } from 'react';
import { onAuthUserChanged, logout } from './services/authService';
import { databaseService } from './services/databaseService';
import { getUserEntitlements, purchaseProduct, restorePurchases } from './services/monetizationService';
import { updateCompetenceScores } from './services/competenceService';

// FIX: Changed to a regular import to allow importing the DifficultyLevel enum value.
import {
    AppState, UserProfile, UserProgress, Module, Exercise,
    AnalysisResult, VoiceAnalysisResult, Entitlements,
    CommunicatorProfile, Product, DifficultyLevel
} from './types';
import { MODULES, STRATEGIC_CHECKUP_EXERCISES, COLORS } from './constants';

// Screens
import { LoginScreen } from './components/LoginScreen';
import { HomeScreen } from './components/HomeScreen';
import { ModuleScreen } from './components/ModuleScreen';
import { ExerciseScreen } from './components/ExerciseScreen';
import { AnalysisReportScreen } from './components/AnalysisReportScreen';
import { VoiceAnalysisReportScreen } from './components/VoiceAnalysisReportScreen';
import { CustomSetupScreen } from './components/CustomSetupScreen';
import { StrategicCheckupScreen } from './components/StrategicCheckupScreen';
import { CommunicatorProfileScreen } from './components/CommunicatorProfileScreen';
import { PaywallScreen } from './components/PaywallScreen';
import { AdminScreen } from './components/AdminScreen';
import { StrategicChatTrainerScreen } from './components/StrategicChatTrainerScreen';
import { ApiKeyErrorScreen } from './components/ApiKeyErrorScreen';
import { CompetenceReportScreen } from './components/CompetenceReportScreen';
import { PreloadingScreen } from './components/PreloadingScreen';
import { Header } from './components/Header';
import { FullScreenLoader } from './components/Loader';

import { useToast } from './hooks/useToast';
import { gamificationService } from './services/gamificationService';

const allExercises = MODULES.flatMap(m => m.exercises).concat(STRATEGIC_CHECKUP_EXERCISES);
const dailyChallenge = STRATEGIC_CHECKUP_EXERCISES[new Date().getDate() % STRATEGIC_CHECKUP_EXERCISES.length];

const App: React.FC = () => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [progress, setProgress] = useState<UserProgress | undefined>(undefined);
    const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
    const [appState, setAppState] = useState<AppState>({ currentScreen: 'login' });
    const [isInitializing, setIsInitializing] = useState(true);
    const [isPreloading, setIsPreloading] = useState(true);

    const { addToast } = useToast();

    // Scroll to top on screen change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [appState.currentScreen]);

    useEffect(() => {
        const savedState = localStorage.getItem('ces_coach_app_state');
        if (savedState) {
            try {
                const parsedState = JSON.parse(savedState);
                if (parsedState.currentScreen !== 'login' && parsedState.currentScreen !== 'api_key_error') {
                    setAppState(parsedState);
                }
            } catch (error) {
                console.error("Could not parse saved app state:", error);
            }
        }
    }, []);

    useEffect(() => {
        if (!isInitializing && !isPreloading) {
            localStorage.setItem('ces_coach_app_state', JSON.stringify(appState));
        }
    }, [appState, isInitializing, isPreloading]);

    useEffect(() => {
        const unsubscribe = onAuthUserChanged(async (authUser) => {
            if (authUser) {
                setUser(authUser);
                const [userProgress, userEntitlements] = await Promise.all([
                    databaseService.getUserProgress(authUser.uid),
                    getUserEntitlements(authUser)
                ]);
                setProgress(userProgress || gamificationService.getInitialProgress());
                setEntitlements(userEntitlements);
                if (appState.currentScreen === 'login') {
                    setAppState({ currentScreen: 'home' });
                }
            } else {
                setUser(null);
                setProgress(undefined);
                setEntitlements(null);
                setAppState({ currentScreen: 'login' });
                localStorage.removeItem('ces_coach_app_state');
            }
            setIsInitializing(false);
        });
        return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const saveProgress = useCallback(async (newProgress: UserProgress) => {
        setProgress(newProgress);
        if (user) {
            try {
                await databaseService.saveUserProgress(user.uid, newProgress);
            } catch (error) {
                console.error("Failed to save progress:", error);
                addToast("Impossibile salvare i progressi.", "error");
            }
        }
    }, [user, addToast]);
    
    const navigate = (newState: Partial<AppState>) => {
        setAppState(prevState => ({ ...prevState, ...newState }));
    };

    const handleBackToHome = () => navigate({ currentScreen: 'home' });

    const handleLogout = async () => {
        await logout();
        navigate({ currentScreen: 'login' });
    };

    const handleSelectModule = (module: Module) => {
        if (module.id === 'm6') navigate({ currentScreen: 'custom_setup', currentModuleId: module.id });
        else if (module.id === 'm7') navigate({ currentScreen: 'chat_trainer', currentModuleId: module.id });
        else navigate({ currentScreen: 'module', currentModuleId: module.id });
    };

    const handleSelectExercise = (exercise: Exercise, isCheckup?: boolean, checkupStep?: number, totalCheckupSteps?: number) => {
        navigate({
            currentScreen: 'exercise',
            currentExerciseId: exercise.id,
            isReviewMode: false,
        });
    };
    
    const currentModule = appState.currentModuleId ? MODULES.find(m => m.id === appState.currentModuleId) : undefined;
    const currentExercise = appState.currentExerciseId ? allExercises.find(e => e.id === appState.currentExerciseId) : undefined;

    const handleBackToModule = () => navigate({ currentScreen: 'module' });

    const handleApiKeyError = (error: string) => navigate({ currentScreen: 'api_key_error', apiKeyError: error });

    const handleCompleteExercise = async (result: AnalysisResult | VoiceAnalysisResult, userResponse: string, type: 'written' | 'verbal') => {
        if (!progress || !currentExercise) return;

        const newScore = type === 'written' ? (result as AnalysisResult).score : Math.round(((result as VoiceAnalysisResult).scores.reduce((a, b) => a + b.score, 0) / (result as VoiceAnalysisResult).scores.length) * 10);

        const updatedProgress: UserProgress = {
            ...progress,
            scores: [...progress.scores, newScore],
            completedExerciseIds: [...new Set([...progress.completedExerciseIds, currentExercise.id])],
            analysisHistory: {
                ...progress.analysisHistory,
                [currentExercise.id]: { result, userResponse, timestamp: new Date().toISOString(), type }
            },
            competenceScores: updateCompetenceScores(progress.competenceScores, currentExercise.id, newScore)
        };
        
        await saveProgress(updatedProgress);

        if (type === 'written') {
            navigate({ currentScreen: 'analysis_report', analysisResult: result as AnalysisResult, userResponse });
        } else {
            navigate({ currentScreen: 'voice_analysis_report', voiceAnalysisResult: result as VoiceAnalysisResult, userResponse });
        }
    };
    
    const handleSkipExercise = async (exerciseId: string) => {
        if (!progress) return;
        const updatedProgress = {
            ...progress,
            completedExerciseIds: [...new Set([...progress.completedExerciseIds, exerciseId])]
        };
        await saveProgress(updatedProgress);
        addToast('Esercizio saltato.', 'info');
        if (currentModule && currentModule.exercises.length > 1) {
            handleBackToModule();
        } else {
            handleBackToHome();
        }
    };

    const handleNextExercise = () => {
        if (!currentModule || !currentExercise) {
            handleBackToHome();
            return;
        }
        const currentIndex = currentModule.exercises.findIndex(e => e.id === currentExercise.id);
        if (currentIndex !== -1 && currentIndex < currentModule.exercises.length - 1) {
            const nextExercise = currentModule.exercises[currentIndex + 1];
            handleSelectExercise(nextExercise);
        } else {
            handleBackToModule();
        }
    };

    const handleRetryExercise = () => navigate({ currentScreen: 'exercise' });

    const handleReviewExercise = (exerciseId: string) => {
        const historyItem = progress?.analysisHistory?.[exerciseId];
        if (historyItem) {
            const exercise = allExercises.find(e => e.id === exerciseId);
            if (historyItem.type === 'written') {
                navigate({
                    currentScreen: 'analysis_report',
                    currentExerciseId: exerciseId,
                    isReviewMode: true,
                    analysisResult: historyItem.result as AnalysisResult,
                    userResponse: historyItem.userResponse,
                });
            } else {
                 navigate({
                    currentScreen: 'voice_analysis_report',
                    currentExerciseId: exerciseId,
                    isReviewMode: true,
                    voiceAnalysisResult: historyItem.result as VoiceAnalysisResult,
                    userResponse: historyItem.userResponse,
                });
            }
        }
    };

    const handleStartCustomExercise = (scenario: string, task: string) => {
        const customExercise: Exercise = {
            id: `custom_${Date.now()}`,
            title: 'Esercizio Personalizzato',
            scenario,
            task,
            // FIX: Use the DifficultyLevel enum instead of a string literal.
            difficulty: DifficultyLevel.BASE,
            competence: null,
            customObjective: 'Allenamento su scenario personalizzato'
        };
        allExercises.push(customExercise); // Temporarily add to list
        navigate({ currentScreen: 'exercise', currentExerciseId: customExercise.id });
    };

    const handleStartCheckup = () => navigate({ currentScreen: 'strategic_checkup' });
    
    const handleCompleteCheckup = async (profile: CommunicatorProfile) => {
        if (!progress) return;
        const updatedProgress = { ...progress, checkupProfile: profile };
        await saveProgress(updatedProgress);
        navigate({ currentScreen: 'communicator_profile', checkupProfile: profile });
    };

    const handlePurchaseFlow = async (product: Product) => {
        if (!user) return;
        try {
            const newEntitlements = await purchaseProduct(user, product);
            setEntitlements(newEntitlements);
            addToast(`Acquisto di ${product.name} completato!`, 'success');
        } catch (error: any) {
            addToast(error.message, 'error');
        }
    };

    const handleRestore = async () => {
        try {
            const restoredEntitlements = await restorePurchases(user);
            setEntitlements(restoredEntitlements);
            addToast('Acquisti ripristinati con successo.', 'success');
        } catch (error: any) {
            addToast(error.message, 'error');
        }
    };

    const renderScreen = () => {
        if (!user) return <LoginScreen />;
        
        switch (appState.currentScreen) {
            case 'home':
                return <HomeScreen 
                    user={user} 
                    progress={progress} 
                    entitlements={entitlements}
                    dailyChallenge={dailyChallenge}
                    onSelectModule={handleSelectModule}
                    onStartDailyChallenge={(ex) => handleSelectExercise(ex, true, 1, 1)}
                    onStartCheckup={handleStartCheckup}
                    onStartChatTrainer={() => navigate({ currentScreen: 'chat_trainer', currentModuleId: 'm7'})}
                    onNavigateToPaywall={() => navigate({ currentScreen: 'paywall' })}
                    onNavigateToCompetenceReport={() => navigate({ currentScreen: 'competence_report'})}
                />;
            case 'module':
                if (!currentModule) return <HomeScreen user={user} progress={progress} entitlements={entitlements} dailyChallenge={dailyChallenge} onSelectModule={handleSelectModule} onStartDailyChallenge={handleSelectExercise} onStartCheckup={handleStartCheckup} onStartChatTrainer={() => {}} onNavigateToPaywall={() => {}} onNavigateToCompetenceReport={() => {}} />;
                return <ModuleScreen 
                    module={currentModule} 
                    moduleColor={COLORS.primary}
                    onSelectExercise={(ex) => handleSelectExercise(ex)}
                    onReviewExercise={handleReviewExercise}
                    onBack={handleBackToHome}
                    completedExerciseIds={progress?.completedExerciseIds || []}
                    entitlements={entitlements}
                    analysisHistory={progress?.analysisHistory || {}}
                />;
            case 'exercise':
                if (!currentExercise) return <p>Esercizio non trovato.</p>;
                return <ExerciseScreen 
                    exercise={currentExercise}
                    onCompleteWritten={(res, uRes) => handleCompleteExercise(res, uRes, 'written')}
                    onCompleteVerbal={(res, uRes) => handleCompleteExercise(res, uRes, 'verbal')}
                    onSkip={handleSkipExercise}
                    onBack={currentModule ? handleBackToModule : handleBackToHome}
                    onApiKeyError={handleApiKeyError}
                    entitlements={entitlements}
                />;
            case 'analysis_report':
                 if (!appState.analysisResult || !currentExercise) return <p>Risultato non trovato.</p>;
                 return <AnalysisReportScreen 
                    result={appState.analysisResult} 
                    exercise={currentExercise}
                    onRetry={handleRetryExercise}
                    onNextExercise={handleNextExercise}
                    nextExerciseLabel={currentModule?.exercises.slice(-1)[0].id === currentExercise.id ? 'Torna al Modulo' : 'Prossimo Esercizio'}
                    entitlements={entitlements}
                    onNavigateToPaywall={() => navigate({ currentScreen: 'paywall' })}
                    onPurchase={handlePurchaseFlow}
                    userResponse={appState.userResponse}
                    isReview={appState.isReviewMode}
                 />;
            case 'voice_analysis_report':
                if (!appState.voiceAnalysisResult || !currentExercise) return <p>Risultato non trovato.</p>;
                return <VoiceAnalysisReportScreen 
                    result={appState.voiceAnalysisResult}
                    exercise={currentExercise}
                    onRetry={handleRetryExercise}
                    onNextExercise={handleNextExercise}
                    nextExerciseLabel={currentModule?.exercises.slice(-1)[0].id === currentExercise.id ? 'Torna al Modulo' : 'Prossimo Esercizio'}
                    entitlements={entitlements}
                    onNavigateToPaywall={() => navigate({ currentScreen: 'paywall' })}
                    userResponse={appState.userResponse}
                    isReview={appState.isReviewMode}
                />;
            case 'custom_setup':
                if (!currentModule) return null;
                return <CustomSetupScreen module={currentModule} onStart={handleStartCustomExercise} onBack={handleBackToHome} onApiKeyError={handleApiKeyError} />;
            case 'strategic_checkup':
                return <StrategicCheckupScreen onSelectExercise={(ex) => {}} onCompleteCheckup={handleCompleteCheckup} onApiKeyError={handleApiKeyError} onBack={handleBackToHome} entitlements={entitlements} />;
            case 'communicator_profile':
                return <CommunicatorProfileScreen profile={appState.checkupProfile} onContinue={handleBackToHome} />;
            case 'paywall':
                 if (!entitlements) return null;
                return <PaywallScreen entitlements={entitlements} onPurchase={handlePurchaseFlow} onRestore={handleRestore} onBack={() => navigate({ currentScreen: 'home' })} />;
            case 'admin':
                return <AdminScreen onBack={handleBackToHome} />;
            case 'chat_trainer':
                if (!currentModule) return null;
                return <StrategicChatTrainerScreen module={currentModule} onBack={handleBackToHome} onApiKeyError={handleApiKeyError} />;
            case 'api_key_error':
                return <ApiKeyErrorScreen error={appState.apiKeyError || "Errore sconosciuto."} />;
            case 'competence_report':
                if (!progress) return null;
                return <CompetenceReportScreen userProgress={progress} onBack={handleBackToHome} onSelectExercise={handleSelectExercise} />;
            default:
                return <HomeScreen user={user} progress={progress} entitlements={entitlements} dailyChallenge={dailyChallenge} onSelectModule={handleSelectModule} onStartDailyChallenge={handleSelectExercise} onStartCheckup={handleStartCheckup} onStartChatTrainer={() => {}} onNavigateToPaywall={() => {}} onNavigateToCompetenceReport={() => {}} />;
        }
    };
    
    if (isPreloading) {
        return <PreloadingScreen onComplete={() => setIsPreloading(false)} />;
    }

    if (isInitializing) {
        return <FullScreenLoader />;
    }

    return (
        <div style={{ backgroundColor: COLORS.base, minHeight: '100vh', color: COLORS.textPrimary }}>
            {appState.currentScreen !== 'login' && user && (
                <Header 
                    user={user}
                    onLogout={handleLogout}
                    onNavigateToHome={handleBackToHome}
                    onNavigateToPaywall={() => navigate({ currentScreen: 'paywall' })}
                    onNavigateToAdmin={() => navigate({ currentScreen: 'admin' })}
                    entitlements={entitlements}
                    currentModule={currentModule}
                    onNavigateToModule={currentModule ? handleBackToModule : handleBackToHome}
                />
            )}
            {renderScreen()}
        </div>
    );
};

export default App;