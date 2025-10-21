import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
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
import { userService } from './services/userService';
import { useToast } from './hooks/useToast';
import { soundService } from './services/soundService';
import { databaseService } from './services/databaseService';
import { hasProAccess, getUserEntitlements, purchaseProduct, restorePurchases } from './services/monetizationService';
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
import { AdminScreen } from './components/AdminScreen';
import StrategicChatTrainerScreen from './components/StrategicChatTrainerScreen';

type Screen = 'preloading' | 'login' | 'home' | 'module' | 'exercise' | 'analysis' | 'voice_analysis' | 'paywall' | 'checkup' | 'profile' | 'custom_setup' | 'api_key_error' | 'admin' | 'chat_trainer';

const App: React.FC = () => {
    const [screen, setScreen] = useState<Screen>('preloading');
    const [screenProps, setScreenProps] = useState<any>({});
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userProgress, setUserProgress] = useState<UserProgress | undefined>(undefined);
    const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
    const [isDataLoaded, setIsDataLoaded] = useState(false); // Nuovo stato per il caricamento iniziale
    const { addToast } = useToast();

    const navigate = useCallback((newScreen: Screen, props: any = {}) => {
        setScreenProps(props);
        setScreen(newScreen);
    }, []);

    const goHome = useCallback(() => navigate('home'), [navigate]);

    const loadUserData = useCallback((user: User | null) => {
        if (!user) {
            setUserProgress(undefined);
            setEntitlements(null);
            return;
        }
        const progress = databaseService.getAllProgress()[user.email] || { scores: [], competenceScores: { ascolto: 0, riformulazione: 0, assertivita: 0, gestione_conflitto: 0 }};
        const userEntitlements = getUserEntitlements(user);
        setUserProgress(progress);
        setEntitlements(userEntitlements);
    }, []);

    const persistSession = useCallback((userEmail: string | null) => {
        if (userEmail) {
            localStorage.setItem('ces_coach_current_user_email', userEmail);
        } else {
            localStorage.removeItem('ces_coach_current_user_email');
        }
    }, []);

    useEffect(() => {
        const handleDbUpdate = () => {
             // Quando il DB cambia, ricarica i dati dell'utente corrente
            loadUserData(currentUser);
            // Se siamo nel pannello admin, i dati si aggiorneranno da soli
        };

        const unsubscribe = databaseService.subscribe(handleDbUpdate);
        return () => unsubscribe();
    }, [currentUser, loadUserData]);

    useEffect(() => {
        const checkPersistedSession = async () => {
            const savedEmail = localStorage.getItem('ces_coach_current_user_email');
            if (savedEmail) {
                const user = userService.getUser(savedEmail);
                if (user && user.enabled) {
                    setCurrentUser(user);
                    loadUserData(user); // Carica i dati
                    navigate('home');
                } else {
                    persistSession(null);
                    navigate('login');
                }
            } else {
                navigate('login');
            }
            setIsDataLoaded(true); // Segna il caricamento iniziale come completo
        };
        
        // Aspettiamo che il DB si iscriva prima di controllare la sessione
        const unsubscribe = databaseService.subscribe(() => {
            if (!isDataLoaded) { // Esegui solo una volta
                checkPersistedSession();
                unsubscribe(); // Disiscriviti dopo il primo caricamento
            }
        });

        // Cleanup in caso di unmount
        return () => unsubscribe();

    }, [navigate, loadUserData, persistSession, isDataLoaded]);

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
            case 'admin':
                setBreadcrumbs([homeCrumb, { label: 'Admin Panel'}]);
                break;
            default:
                setBreadcrumbs([homeCrumb]);
        }
    }, [screen, screenProps, currentUser, goHome, navigate]);

    const handleLogin = async (email: string, pass: string) => {
        const { user, expired } = await userService.authenticate(email, pass);
        if (user) {
            addToast(`Bentornato, ${user.firstName}!`, 'success');
            setCurrentUser(user);
            loadUserData(user);
            persistSession(user.email);
            navigate('home');
        } else {
            throw new Error(expired ? 'Il tuo accesso è scaduto.' : 'Credenziali non valide.');
        }
    };
    
    const handleGuestAccess = () => {
        setCurrentUser(null);
        setUserProgress(undefined);
        setEntitlements(null);
        addToast("Accesso come ospite. I progressi non saranno salvati.", 'info');
        navigate('home');
    }

    const handleRegister = async (data: any) => {
        await userService.addUser(data.email, data.password, data.firstName, data.lastName);
    };

    const handleLogout = () => {
        addToast("Logout effettuato.", 'info');
        setCurrentUser(null);
        setUserProgress(undefined);
        setEntitlements(null);
        persistSession(null);
        navigate('login');
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
    
    const handleCompleteExercise = async (result: AnalysisResult | VoiceAnalysisResult, userResponse: string, exercise: Exercise, type: 'written' | 'verbal') => {
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
            
            const allProgress = databaseService.getAllProgress();
            await databaseService.saveAllProgress({ ...allProgress, [currentUser.email]: updatedProgress });
            loadUserData(currentUser); // Ricarica i dati per essere sicuro
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
    const handleCompleteCheckup = async (profile: CommunicatorProfile) => {
        if(currentUser && userProgress) {
            const updatedProgress = { ...userProgress, hasCompletedCheckup: true, checkupResults: profile };
            const allProgress = databaseService.getAllProgress();
            await databaseService.saveAllProgress({ ...allProgress, [currentUser.email]: updatedProgress });
            loadUserData(currentUser);
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

    const renderScreen = () => {
        if (screen === 'preloading' || !isDataLoaded) {
            return <PreloadingScreen onComplete={() => { /* La logica di navigazione è gestita dall'effetto */ }} />;
        }
        switch (screen) {
            case 'login':
                return <LoginScreen onLogin={handleLogin} onRegister={handleRegister} onGuestAccess={handleGuestAccess} />;
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
            case 'admin':
                return <AdminScreen onBack={goHome} />;
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
                    onGoToAdmin={() => navigate('admin')}
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
