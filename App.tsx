import React, { useState, useEffect, useCallback } from 'react';
import {
  UserProfile,
  Module,
  Exercise,
  AnalysisResult,
  VoiceAnalysisResult,
  Entitlements,
  Breadcrumb,
  CommunicatorProfile,
  Product,
  AnalysisHistoryEntry,
  UserProgress,
  DifficultyLevel,
} from './types';
import { LoginScreen } from './components/LoginScreen';
import { HomeScreen } from './components/HomeScreen';
import { ModuleScreen } from './components/ModuleScreen';
import { Header } from './components/Header';
import { useToast } from './hooks/useToast';
import { soundService } from './services/soundService';
import { databaseService } from './services/databaseService';
import { hasProAccess, getUserEntitlements, purchaseProduct, restorePurchases } from './services/monetizationService';
import { onAuthUserChanged, logout } from './services/authService';
import { ExerciseScreen } from './components/ExerciseScreen';
import { AnalysisReportScreen } from './components/AnalysisReportScreen';
import { VoiceAnalysisReportScreen } from './components/VoiceAnalysisReportScreen';
import { PreloadingScreen } from './components/PreloadingScreen';
import { PaywallScreen } from './components/PaywallScreen';
import { StrategicCheckupScreen } from './components/StrategicCheckupScreen';
import { CommunicatorProfileScreen } from './components/CommunicatorProfileScreen';
import { updateCompetenceScores } from './services/competenceService';
import CustomSetupScreen from './components/CustomSetupScreen';
import { ApiKeyErrorScreen } from './components/ApiKeyErrorScreen';
import StrategicChatTrainerScreen from './components/StrategicChatTrainerScreen';

type Screen = 'preloading' | 'login' | 'home' | 'module' | 'exercise' | 'analysis' | 'voice_analysis' | 'paywall' | 'checkup' | 'profile' | 'custom_setup' | 'api_key_error' | 'chat_trainer';

const App: React.FC = () => {
    const [screen, setScreen] = useState<Screen>('preloading');
    const [screenProps, setScreenProps] = useState<any>({});
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [userProgress, setUserProgress] = useState<UserProgress | undefined>(undefined);
    const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
    const { addToast } = useToast();
    const [authInitialized, setAuthInitialized] = useState(false);

    // === State & Navigation Management ===
    const navigate = useCallback((newScreen: Screen, props: any = {}) => {
        setScreenProps(props);
        setScreen(newScreen);
    }, []);

    const goHome = useCallback(() => navigate('home'), [navigate]);

    // === User & Data Management ===
    const loadUserData = useCallback(async (user: UserProfile) => {
        const progress = await databaseService.getUserProgress(user.uid) || { scores: [], competenceScores: { ascolto: 0, riformulazione: 0, assertivita: 0, gestione_conflitto: 0 }};
        const userEntitlements = await getUserEntitlements(user);
        setUserProgress(progress);
        setEntitlements(userEntitlements);
    }, []);

    // === Effects ===
    useEffect(() => {
        const unsubscribe = onAuthUserChanged(async (user) => {
            if (user) {
                setCurrentUser(user);
                await loadUserData(user);
                if (screen === 'login' || screen === 'preloading' || !authInitialized) {
                    navigate('home');
                }
            } else {
                setCurrentUser(null);
                setUserProgress(undefined);
                setEntitlements(null);
                if (authInitialized && screen !== 'login') {
                     navigate('login');
                }
            }
            if (!authInitialized) {
                setAuthInitialized(true);
            }
        });
        return () => unsubscribe();
    }, [screen, authInitialized, loadUserData, navigate]);

    useEffect(() => {
        soundService.toggleSound(isSoundEnabled);
    }, [isSoundEnabled]);

    useEffect(() => {
        const homeCrumb = { label: 'Home', onClick: currentUser ? goHome : undefined };
        switch (screen) {
            case 'home':
                setBreadcrumbs([homeCrumb]);
                break;
            case 'module':
            case 'custom_setup':
            case 'chat_trainer':
                setBreadcrumbs([homeCrumb, { label: screenProps.module.title }]);
                break;
            case 'exercise':
                setBreadcrumbs([homeCrumb, { label: screenProps.module.title, onClick: () => navigate('module', { module: screenProps.module, moduleColor: screenProps.moduleColor }) }, { label: screenProps.exercise.title }]);
                break;
            case 'paywall':
                setBreadcrumbs([homeCrumb, { label: 'Diventa PRO' }]);
                break;
            default:
                setBreadcrumbs([homeCrumb]);
        }
    }, [screen, screenProps, currentUser, goHome, navigate]);

    // === Handlers ===
    const handleGuestAccess = () => {
        setCurrentUser(null);
        setUserProgress(undefined);
        setEntitlements(null);
        addToast("Accesso come ospite. I progressi non saranno salvati.", 'info');
        navigate('home');
    }

    const handleLogout = () => {
        addToast("Logout effettuato.", 'info');
        logout(); // This will trigger the onAuthUserChanged listener
    };

    const handleSelectModule = (module: Module, color: string) => {
        if (module.isCustom) {
            navigate('custom_setup', { module, moduleColor: color });
        } else if (module.specialModuleType === 'chat_trainer') {
            navigate('chat_trainer', { module, moduleColor: color });
        } else {
            navigate('module', { module, moduleColor: color });
        }
    };

    const handleSelectExercise = (exercise: Exercise, isCheckup: boolean = false, checkupStep: number = 0, totalCheckupSteps: number = 0, moduleColor: string = '#888') => {
        const module = screenProps.module || { exercises: [exercise] }; // Handle daily challenge case
        navigate('exercise', { exercise, module, moduleColor, isCheckup, checkupStep, totalCheckupSteps });
    };
    
    const handleCompleteExercise = (result: AnalysisResult | VoiceAnalysisResult, userResponse: string, exercise: Exercise, type: 'written' | 'verbal') => {
        if (currentUser && userProgress) {
            const newHistoryEntry: AnalysisHistoryEntry = {
                exerciseId: exercise.id,
                userResponse,
                result,
                type,
                timestamp: new Date().toISOString(),
            };

            const newScores = [...userProgress.scores, (result as AnalysisResult).score || 0];
            const newCompletedIds = [...(userProgress.completedExerciseIds || []), exercise.id];
            const newCompetenceScores = type === 'written' ? updateCompetenceScores(userProgress.competenceScores, exercise.id, (result as AnalysisResult).score) : userProgress.competenceScores;

            const updatedProgress: UserProgress = {
                ...userProgress,
                scores: newScores,
                completedExerciseIds: Array.from(new Set(newCompletedIds)),
                analysisHistory: [...(userProgress.analysisHistory || []), newHistoryEntry],
                competenceScores: newCompetenceScores,
            };
            setUserProgress(updatedProgress);
            databaseService.saveUserProgress(currentUser.uid, updatedProgress);
        }

        const nextExerciseIndex = screenProps.module.exercises.findIndex((e: Exercise) => e.id === exercise.id) + 1;
        const nextExercise = screenProps.module.exercises[nextExerciseIndex];
        
        const props = {
            result,
            exercise,
            userResponse,
            onRetry: () => navigate('exercise', screenProps),
            onNextExercise: nextExercise ? () => handleSelectExercise(nextExercise) : goHome,
            nextExerciseLabel: nextExercise ? 'Prossimo Esercizio' : 'Torna alla Home',
        };
        
        if(type === 'verbal') {
            navigate('voice_analysis', props);
        } else {
            navigate('analysis', props);
        }
    };

    const handleStartCheckup = () => navigate('checkup');
    const handleCompleteCheckup = (profile: CommunicatorProfile) => {
        if(currentUser && userProgress) {
            const updatedProgress = { ...userProgress, hasCompletedCheckup: true, checkupResults: profile };
            setUserProgress(updatedProgress);
            databaseService.saveUserProgress(currentUser.uid, updatedProgress);
        }
        navigate('profile', { profile });
    }
    
    const handlePurchase = async (product: Product) => {
        const newEntitlements = await purchaseProduct(currentUser, product);
        setEntitlements(newEntitlements);
        addToast(`Grazie! ${product.name} è ora attivo.`, 'success');
    };

    const handleRestore = async () => {
        const restoredEntitlements = await restorePurchases(currentUser);
        setEntitlements(restoredEntitlements);
        addToast('Acquisti ripristinati.', 'info');
    };
    
    const handleApiKeyError = (error: string) => {
        navigate('api_key_error', { error });
    };

    // === Render Logic ===
    const renderScreen = () => {
        if (!authInitialized && screen !== 'preloading') {
            return <PreloadingScreen onComplete={() => { /* Auth listener handles next step */}} />;
        }

        switch (screen) {
            case 'preloading':
                return <PreloadingScreen onComplete={() => navigate('login')} />;
            case 'login':
                return <LoginScreen onGuestAccess={handleGuestAccess} />;
            case 'home':
                return <HomeScreen 
                            onSelectModule={handleSelectModule} 
                            onSelectExercise={handleSelectExercise} 
                            onStartCheckup={handleStartCheckup}
                            currentUser={currentUser} 
                            userProgress={userProgress} 
                        />;
            case 'module':
                return <ModuleScreen 
                            {...screenProps} 
                            onSelectExercise={(exercise) => handleSelectExercise(exercise, false, 0, 0, screenProps.moduleColor)}
                            onReviewExercise={(exerciseId) => { /* TODO: Implement review */ }}
                            onBack={goHome} 
                            completedExerciseIds={userProgress?.completedExerciseIds || []} 
                            entitlements={entitlements}
                        />;
             case 'custom_setup':
                return <CustomSetupScreen
                            {...screenProps}
                            onStart={(scenario, task) => handleSelectExercise({ id: 'custom', title: 'Esercizio Personalizzato', difficulty: DifficultyLevel.BASE, scenario, task })}
                            onBack={() => navigate('module', screenProps)}
                            onApiKeyError={handleApiKeyError}
                        />;
            case 'chat_trainer':
                return <StrategicChatTrainerScreen 
                            {...screenProps}
                            onBack={goHome}
                            onApiKeyError={handleApiKeyError}
                        />;
            case 'exercise':
                return <ExerciseScreen 
                            {...screenProps}
                            onCompleteWritten={(result, userResponse) => handleCompleteExercise(result, userResponse, screenProps.exercise, 'written')} 
                            onCompleteVerbal={(result, userResponse) => handleCompleteExercise(result, userResponse, screenProps.exercise, 'verbal')}
                            onSkip={() => { /* TODO: Implement skip logic */ goHome(); }}
                            onBack={() => navigate('module', { module: screenProps.module, moduleColor: screenProps.moduleColor })}
                            onApiKeyError={handleApiKeyError}
                            entitlements={entitlements}
                       />;
            case 'analysis':
                return <AnalysisReportScreen {...screenProps} entitlements={entitlements} onNavigateToPaywall={() => navigate('paywall')} onPurchase={handlePurchase} />;
            case 'voice_analysis':
                return <VoiceAnalysisReportScreen {...screenProps} entitlements={entitlements} onNavigateToPaywall={() => navigate('paywall')} />;
            case 'paywall':
                return <PaywallScreen entitlements={entitlements!} onPurchase={handlePurchase} onRestore={handleRestore} onBack={goHome} />;
            case 'checkup':
                return <StrategicCheckupScreen onSelectExercise={handleSelectExercise} onCompleteCheckup={handleCompleteCheckup} onApiKeyError={handleApiKeyError} onBack={goHome} entitlements={entitlements} />;
            case 'profile':
                return <CommunicatorProfileScreen {...screenProps} onContinue={goHome} />;
            case 'api_key_error':
                return <ApiKeyErrorScreen {...screenProps} />;
            default:
                return <div>Schermata non trovata</div>;
        }
    };

    return (
        <div style={{ paddingTop: screen !== 'login' && screen !== 'preloading' && screen !== 'api_key_error' ? '64px' : '0' }}>
            {screen !== 'login' && screen !== 'preloading' && screen !== 'api_key_error' && (
                <Header 
                    currentUser={currentUser}
                    breadcrumbs={breadcrumbs}
                    onLogout={handleLogout}
                    onGoToPaywall={() => navigate('paywall')}
                    isPro={hasProAccess(entitlements)}
                    isSoundEnabled={isSoundEnabled}
                    onToggleSound={() => setIsSoundEnabled(!isSoundEnabled)}
                />
            )}
            {renderScreen()}
        </div>
    );
};

export default App;