import React, { useState, useEffect, useCallback } from 'react';
import type {
  Module, Exercise, User, UserProgress, AnalysisResult, VoiceAnalysisResult,
  CommunicatorProfile, Entitlements, Product, Breadcrumb
} from './types';
// FIX: Import DifficultyLevel to use its enum values.
import { DifficultyLevel } from './types';
import { MODULES, STRATEGIC_CHECKUP_EXERCISES } from './constants';
import { databaseService } from './services/databaseService';
import { userService } from './services/userService';
import { getUserEntitlements, purchaseProduct, restorePurchases, hasProAccess } from './services/monetizationService';
import { updateCompetenceScores } from './services/competenceService';

import { PreloadingScreen } from './components/PreloadingScreen';
import { LoginScreen } from './components/LoginScreen';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { ModuleScreen } from './components/ModuleScreen';
import { ExerciseScreen } from './components/ExerciseScreen';
import { AnalysisReportScreen } from './components/AnalysisReportScreen';
import { VoiceAnalysisReportScreen } from './components/VoiceAnalysisReportScreen';
import { StrategicCheckupScreen } from './components/StrategicCheckupScreen';
import { CommunicatorProfileScreen } from './components/CommunicatorProfileScreen';
import CustomSetupScreen from './components/CustomSetupScreen';
import StrategicChatTrainerScreen from './components/StrategicChatTrainerScreen';
import { ApiKeyErrorScreen } from './components/ApiKeyErrorScreen';
import { AdminScreen } from './components/AdminScreen';
import { PaywallScreen } from './components/PaywallScreen';
import { useToast } from './hooks/useToast';
import { soundService } from './services/soundService';

// Main application state and screen management
type Screen =
  | { name: 'home' }
  | { name: 'module'; module: Module; color: string }
  | { name: 'exercise'; exercise: Exercise; moduleColor?: string, isCheckup?: boolean; checkupStep?: number; totalCheckupSteps?: number }
  | { name: 'analysisReport'; result: AnalysisResult; userResponse: string; exercise: Exercise; isReview?: boolean }
  | { name: 'voiceAnalysisReport'; result: VoiceAnalysisResult; userResponse: string; exercise: Exercise; isReview?: boolean }
  | { name: 'checkup' }
  | { name: 'profile'; profile: CommunicatorProfile }
  | { name: 'customSetup'; module: Module }
  | { name: 'chatTrainer'; module: Module }
  | { name: 'admin' }
  | { name: 'paywall' };

type AppState = 'PRELOADING' | 'LOGGED_OUT' | 'LOGGED_IN' | 'API_KEY_ERROR';

// Local storage keys
const USER_SESSION_KEY = 'ces_coach_current_user_email';
const APP_STATE_KEY = 'ces_coach_app_state';

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>('PRELOADING');
    const [screenStack, setScreenStack] = useState<Screen[]>([{ name: 'home' }]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userProgress, setUserProgress] = useState<UserProgress | undefined>(undefined);
    const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
    const [apiKeyError, setApiKeyError] = useState<string>('');
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const { addToast } = useToast();

    const currentScreen = screenStack[screenStack.length - 1];

    const loadUserData = useCallback((user: User) => {
        const allProgress = databaseService.getAllProgress();
        const progress = allProgress[user.email];
        const userEntitlements = getUserEntitlements(user);
        
        setCurrentUser(user);
        setUserProgress(progress);
        setEntitlements(userEntitlements);

        // Try to retrieve and load the persisted screen state
        try {
            const savedStateJSON = localStorage.getItem(APP_STATE_KEY);
            if (savedStateJSON) {
                const savedState = JSON.parse(savedStateJSON);
                if (savedState.screenStack && Array.isArray(savedState.screenStack)) {
                    setScreenStack(savedState.screenStack);
                }
            }
        } catch (e) {
            console.error("Failed to load saved app state:", e);
            localStorage.removeItem(APP_STATE_KEY); // Clear corrupted state
        }

        setAppState('LOGGED_IN');
    }, []);

    useEffect(() => {
        // Subscribe to database changes to refresh user data if it changes on the server
        const unsubscribe = databaseService.subscribe(() => {
            if (currentUser) {
                const refreshedUser = userService.getUser(currentUser.email);
                if (refreshedUser) {
                    loadUserData(refreshedUser);
                } else {
                    // User might have been deleted from another session
                    handleLogout();
                }
            }
        });

        // Check for persisted session on initial load
        const persistedEmail = localStorage.getItem(USER_SESSION_KEY);
        if (persistedEmail && appState !== 'LOGGED_IN') {
            const user = userService.getUser(persistedEmail);
            if (user) {
                loadUserData(user);
            } else {
                handleLogout(); // Clear invalid session
            }
        }
        
        return () => unsubscribe();
    }, [currentUser, loadUserData, appState]);
    
     useEffect(() => {
        // Persist screen state to localStorage whenever it changes
        if (appState === 'LOGGED_IN') {
             try {
                const stateToSave = { screenStack };
                localStorage.setItem(APP_STATE_KEY, JSON.stringify(stateToSave));
            } catch (e) {
                console.error("Failed to save app state:", e);
            }
        }
    }, [screenStack, appState]);


    const navigateTo = (screen: Screen) => setScreenStack(prev => [...prev, screen]);
    const goBack = () => setScreenStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
    const goHome = () => setScreenStack([{ name: 'home' }]);

    const handleApiKeyError = (errorMsg: string) => {
        setApiKeyError(errorMsg);
        setAppState('API_KEY_ERROR');
    };

    const handleLogin = async (email: string, pass: string) => {
        const user = await userService.login(email, pass);
        localStorage.setItem(USER_SESSION_KEY, user.email);
        loadUserData(user);
    };

    const handleRegister = async (data: any) => {
        await userService.addUser(data.email, data.password, data.firstName, data.lastName);
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setUserProgress(undefined);
        setEntitlements(null);
        localStorage.removeItem(USER_SESSION_KEY);
        localStorage.removeItem(APP_STATE_KEY);
        setScreenStack([{ name: 'home' }]);
        setAppState('LOGGED_OUT');
    };

    const handleGuestAccess = () => {
        setCurrentUser(null);
        setUserProgress(undefined);
        setEntitlements(getUserEntitlements(null));
        setScreenStack([{ name: 'home' }]);
        setAppState('LOGGED_IN');
    };
    
    const updateUserProgress = useCallback(async (updates: Partial<UserProgress>) => {
        if (!currentUser) return; // Cannot update progress for guests

        const allProgress = databaseService.getAllProgress();
        const currentProgress = allProgress[currentUser.email] || { scores: [] };
        const newProgress = { ...currentProgress, ...updates };
        
        setUserProgress(newProgress); // Update state immediately for responsiveness
        
        allProgress[currentUser.email] = newProgress;
        await databaseService.saveAllProgress(allProgress);
    }, [currentUser]);


    const handleCompleteWrittenExercise = (result: AnalysisResult, userResponse: string) => {
        if (currentScreen.name !== 'exercise') return;
        const { exercise } = currentScreen;
        const exerciseId = exercise.id;
        const newScores = [...(userProgress?.scores || []), result.score];
        const newCompetenceScores = updateCompetenceScores(userProgress?.competenceScores, exerciseId, result.score);
        
        updateUserProgress({
            scores: newScores,
            completedExerciseIds: [...new Set([...(userProgress?.completedExerciseIds || []), exerciseId])],
            analysisHistory: [...(userProgress?.analysisHistory || []), { exerciseId, result, userResponse, type: 'written', timestamp: new Date().toISOString() }],
            competenceScores: newCompetenceScores,
        });

        navigateTo({ name: 'analysisReport', result, userResponse, exercise });
    };

    const handleCompleteVerbalExercise = (result: VoiceAnalysisResult, userResponse: string) => {
        if (currentScreen.name !== 'exercise') return;
        const { exercise } = currentScreen;
        const exerciseId = exercise.id;
        const averageScore = Math.round(result.scores.reduce((sum, s) => sum + s.score, 0) / result.scores.length * 10);
        const newScores = [...(userProgress?.scores || []), averageScore];
        const newCompetenceScores = updateCompetenceScores(userProgress?.competenceScores, exerciseId, averageScore);

        updateUserProgress({
            scores: newScores,
            completedExerciseIds: [...new Set([...(userProgress?.completedExerciseIds || []), exerciseId])],
            analysisHistory: [...(userProgress?.analysisHistory || []), { exerciseId, result, userResponse, type: 'verbal', timestamp: new Date().toISOString() }],
            competenceScores: newCompetenceScores,
        });
        navigateTo({ name: 'voiceAnalysisReport', result, userResponse, exercise });
    };

    const handleSkipExercise = (exerciseId: string) => {
        updateUserProgress({
            skippedExerciseIds: [...new Set([...(userProgress?.skippedExerciseIds || []), exerciseId])],
        });
        goBack();
    };

    const handleNextExercise = () => {
        if (currentScreen.name === 'analysisReport' || currentScreen.name === 'voiceAnalysisReport') {
            const previousScreen = screenStack[screenStack.length - 2];
            if (previousScreen.name === 'exercise' && previousScreen.isCheckup) {
                 goHome();
                 return;
            }
        }
        goBack(); // Back to exercise screen
        goBack(); // Back to module/home screen
    };

    const handleReviewExercise = (exerciseId: string) => {
        const historyEntry = userProgress?.analysisHistory?.find(h => h.exerciseId === exerciseId);
        if (historyEntry) {
            const exercise = MODULES.flatMap(m => m.exercises).find(e => e.id === exerciseId) || STRATEGIC_CHECKUP_EXERCISES.find(e => e.id === exerciseId);
            if (!exercise) {
                addToast("Impossibile trovare l'esercizio originale.", 'error');
                return;
            }
            if (historyEntry.type === 'written') {
                 navigateTo({ name: 'analysisReport', result: historyEntry.result as AnalysisResult, userResponse: historyEntry.userResponse, exercise, isReview: true });
            } else {
                 navigateTo({ name: 'voiceAnalysisReport', result: historyEntry.result as VoiceAnalysisResult, userResponse: historyEntry.userResponse, exercise, isReview: true });
            }
        }
    };

    const handleStartCheckup = () => {
        if (userProgress?.hasCompletedCheckup) {
             addToast('Hai già completato il check-up.', 'info');
             return;
        }
        navigateTo({ name: 'checkup' });
    };

    const handleCompleteCheckup = (profile: CommunicatorProfile) => {
        updateUserProgress({ hasCompletedCheckup: true, checkupResults: profile });
        navigateTo({ name: 'profile', profile });
    };
    
    const handlePurchase = async (product: Product) => {
        if (!currentUser) {
            addToast("Devi essere registrato per effettuare acquisti.", "error");
            return;
        }
        try {
            const newEntitlements = await purchaseProduct(currentUser, product);
            setEntitlements(newEntitlements);
            addToast(`Grazie! ${product.name} è stato attivato.`, "success");
            goBack(); // Go back from paywall
        } catch (e: any) {
            addToast(e.message, "error");
        }
    };
    
    const handleRestore = async () => {
        if (!currentUser) {
            addToast("Devi essere registrato per ripristinare gli acquisti.", "error");
            return;
        }
        try {
            const restored = await restorePurchases(currentUser);
            setEntitlements(restored);
            addToast("Acquisti ripristinati.", "success");
        } catch (e: any) {
            addToast(e.message, "error");
        }
    };

    const handleToggleSound = () => {
        soundService.toggleSound();
        setIsSoundEnabled(soundService.isEnabled);
    };
    
    // --- Render Logic ---
    if (appState === 'PRELOADING') {
        return <PreloadingScreen onComplete={() => setAppState('LOGGED_OUT')} />;
    }

    if (appState === 'API_KEY_ERROR') {
        return <ApiKeyErrorScreen error={apiKeyError} />;
    }

    if (appState === 'LOGGED_OUT' || !currentUser) {
        return <LoginScreen onLogin={handleLogin} onRegister={handleRegister} onGuestAccess={handleGuestAccess} />;
    }

    // Breadcrumbs logic
    const breadcrumbs: Breadcrumb[] = [{ label: 'Home', onClick: goHome }];
    if (currentScreen.name === 'module' || currentScreen.name === 'customSetup' || currentScreen.name === 'chatTrainer') {
        breadcrumbs.push({ label: currentScreen.module.title });
    } else if (currentScreen.name === 'exercise') {
        const module = MODULES.find(m => m.exercises.some(e => e.id === currentScreen.exercise.id));
        if (module) {
            breadcrumbs.push({ label: module.title, onClick: goBack });
            breadcrumbs.push({ label: currentScreen.exercise.title });
        } else {
             breadcrumbs.push({ label: currentScreen.exercise.title });
        }
    } else if (currentScreen.name === 'analysisReport' || currentScreen.name === 'voiceAnalysisReport') {
        breadcrumbs.push({ label: 'Report Analisi' });
    } else if (currentScreen.name === 'checkup' || currentScreen.name === 'profile') {
        breadcrumbs.push({ label: 'Check-up Strategico' });
    } else if (currentScreen.name === 'admin') {
        breadcrumbs.push({ label: 'Admin' });
    } else if (currentScreen.name === 'paywall') {
        breadcrumbs.push({ label: 'Diventa PRO' });
    }
    
    const isPro = hasProAccess(entitlements);

    const renderCurrentScreen = () => {
        switch (currentScreen.name) {
            case 'home':
                return <HomeScreen onSelectModule={(m, c) => navigateTo(m.isCustom ? { name: 'customSetup', module: m } : m.specialModuleType === 'chat_trainer' ? { name: 'chatTrainer', module: m } : { name: 'module', module: m, color: c })} onSelectExercise={(e, isCheckup, step, total, color) => navigateTo({ name: 'exercise', exercise: e, isCheckup, checkupStep: step, totalCheckupSteps: total, moduleColor: color })} onStartCheckup={handleStartCheckup} currentUser={currentUser} userProgress={userProgress} />;
            case 'module':
                return <ModuleScreen module={currentScreen.module} moduleColor={currentScreen.color} onSelectExercise={(e, color) => navigateTo({ name: 'exercise', exercise: e, moduleColor: color })} onReviewExercise={handleReviewExercise} onBack={goBack} completedExerciseIds={userProgress?.completedExerciseIds || []} entitlements={entitlements} />;
            case 'exercise':
                return <ExerciseScreen exercise={currentScreen.exercise} onCompleteWritten={handleCompleteWrittenExercise} onCompleteVerbal={handleCompleteVerbalExercise} onSkip={handleSkipExercise} onBack={goBack} onApiKeyError={handleApiKeyError} entitlements={entitlements} isCheckup={currentScreen.isCheckup} checkupStep={currentScreen.checkupStep} totalCheckupSteps={currentScreen.totalCheckupSteps} />;
            case 'analysisReport':
                return <AnalysisReportScreen result={currentScreen.result} exercise={currentScreen.exercise} onRetry={goBack} onNextExercise={handleNextExercise} nextExerciseLabel={currentScreen.isReview ? "Torna al Modulo" : "Prossimo Esercizio"} entitlements={entitlements} onNavigateToPaywall={() => navigateTo({ name: 'paywall' })} onPurchase={handlePurchase} userResponse={currentScreen.userResponse} isReview={!!currentScreen.isReview} />;
            case 'voiceAnalysisReport':
                return <VoiceAnalysisReportScreen result={currentScreen.result} exercise={currentScreen.exercise} onRetry={goBack} onNextExercise={handleNextExercise} nextExerciseLabel={currentScreen.isReview ? "Torna al Modulo" : "Prossimo Esercizio"} entitlements={entitlements} onNavigateToPaywall={() => navigateTo({ name: 'paywall' })} userResponse={currentScreen.userResponse} isReview={!!currentScreen.isReview} />;
            case 'checkup':
                return <StrategicCheckupScreen onSelectExercise={(e, isCheckup, step, total) => navigateTo({ name: 'exercise', exercise: e, isCheckup, checkupStep: step, totalCheckupSteps: total })} onCompleteCheckup={handleCompleteCheckup} onApiKeyError={handleApiKeyError} onBack={goBack} entitlements={entitlements} />;
            case 'profile':
                return <CommunicatorProfileScreen profile={currentScreen.profile} onContinue={goHome} />;
            case 'customSetup':
                // FIX: Use DifficultyLevel enum member instead of a string literal.
                return <CustomSetupScreen module={currentScreen.module} onStart={(scenario, task) => navigateTo({ name: 'exercise', exercise: { id: `custom_${Date.now()}`, title: 'Esercizio Personalizzato', scenario, task, difficulty: DifficultyLevel.INTERMEDIO, customObjective: '' } })} onBack={goBack} onApiKeyError={handleApiKeyError} />;
            case 'chatTrainer':
                return <StrategicChatTrainerScreen module={currentScreen.module} onBack={goBack} onApiKeyError={handleApiKeyError} />;
            case 'admin':
                return <AdminScreen onBack={goHome} />;
            case 'paywall':
                return <PaywallScreen entitlements={entitlements!} onPurchase={handlePurchase} onRestore={handleRestore} onBack={goBack} />;
            default:
                return <HomeScreen onSelectModule={(m, c) => navigateTo({ name: 'module', module: m, color: c })} onSelectExercise={(e) => navigateTo({ name: 'exercise', exercise: e })} onStartCheckup={handleStartCheckup} currentUser={currentUser} userProgress={userProgress} />;
        }
    };

    return (
        <div style={{ paddingTop: '64px' }}>
            <Header
                currentUser={currentUser}
                breadcrumbs={breadcrumbs}
                onLogout={handleLogout}
                onGoToPaywall={() => navigateTo({ name: 'paywall' })}
                onGoToAdmin={() => navigateTo({ name: 'admin' })}
                isPro={isPro}
                isSoundEnabled={isSoundEnabled}
                onToggleSound={handleToggleSound}
            />
            {renderCurrentScreen()}
        </div>
    );
};

export default App;
