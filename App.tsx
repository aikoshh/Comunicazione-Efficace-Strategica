import React, { useState, useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { ModuleScreen } from './components/ModuleScreen';
import { ExerciseScreen } from './components/ExerciseScreen';
import { AnalysisReportScreen } from './components/AnalysisReportScreen';
import { VoiceAnalysisReportScreen } from './components/VoiceAnalysisReportScreen';
import { ApiKeyErrorScreen } from './components/ApiKeyErrorScreen';
import CustomSetupScreen from './components/CustomSetupScreen';
import { LoginScreen } from './components/LoginScreen';
import { StrategicCheckupScreen } from './components/StrategicCheckupScreen';
import { CommunicatorProfileScreen } from './components/CommunicatorProfileScreen';
import { Header } from './components/Header';
import { PaywallScreen } from './components/PaywallScreen';
import { AdminScreen } from './components/AdminScreen';
import type { Module, Exercise, AnalysisResult, VoiceAnalysisResult, DifficultyLevel, User, UserProgress, CommunicatorProfile, Breadcrumb, Entitlements, Product, AnalysisHistoryEntry } from './types';
import { MODULES, COLORS, STRATEGIC_CHECKUP_EXERCISES, MODULE_PALETTE } from './constants';
import { soundService } from './services/soundService';
import { getUserEntitlements, purchaseProduct, restorePurchases, hasProAccess } from './services/monetizationService';
import { useToast } from './hooks/useToast';
import { updateCompetenceScores } from './services/competenceService';
import { userService } from './services/userService';
import { analyzeResponse } from './services/geminiService';
import { FullScreenLoader } from './components/Loader';
import { databaseService } from './services/databaseService';

type AppState =
  | { screen: 'home' }
  | { screen: 'module'; module: Module; moduleColor: string }
  | { screen: 'custom_setup'; module: Module }
  | { screen: 'exercise'; exercise: Exercise; isCheckup?: boolean; checkupStep?: number; totalCheckupSteps?: number; moduleColor?: string }
  | { screen: 'report'; result: AnalysisResult; exercise: Exercise; nextExercise?: Exercise; currentModule?: Module; userResponse?: string; isReview?: boolean }
  | { screen: 'voice_report'; result: VoiceAnalysisResult; exercise: Exercise; nextExercise?: Exercise; currentModule?: Module; userResponse?: string; isReview?: boolean }
  | { screen: 'api_key_error'; error: string }
  | { screen: 'strategic_checkup' }
  | { screen: 'communicator_profile' }
  | { screen: 'paywall' }
  | { screen: 'admin' };

const CURRENT_USER_EMAIL_KEY = 'ces_coach_current_user_email';
const APP_STATE_KEY = 'ces_coach_app_state';

const findNextExerciseInModule = (currentExerciseId: string): { currentModule?: Module; nextExercise?: Exercise } => {
    let currentModule: Module | undefined;
    let nextExercise: Exercise | undefined;

    for (const mod of MODULES) {
        if (mod.isCustom) continue;
        const exerciseIndex = mod.exercises.findIndex(e => e.id === currentExerciseId);
        if (exerciseIndex !== -1) {
            currentModule = mod;
            if (exerciseIndex + 1 < mod.exercises.length) {
                nextExercise = mod.exercises[exerciseIndex + 1];
            }
            break;
        }
    }
    return { currentModule, nextExercise };
};

const findExerciseById = (exerciseId: string): Exercise | undefined => {
    for (const mod of MODULES) {
        const ex = mod.exercises.find(e => e.id === exerciseId);
        if (ex) return ex;
    }
    return STRATEGIC_CHECKUP_EXERCISES.find(e => e.id === exerciseId);
};


const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const { addToast } = useToast();
  
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>(() => {
    return databaseService.getAllUserProgress();
  });

  const [appState, setAppState] = useState<AppState>({ screen: 'home' });
  const [returnToState, setReturnToState] = useState<AppState | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    soundService.toggleSound(isSoundEnabled);
  }, [isSoundEnabled]);

  const handleToggleSound = () => {
    setIsSoundEnabled(prev => !prev);
  };

  useEffect(() => {
      // Session Persistence: Restore session on initial load
      const savedUserEmail = localStorage.getItem(CURRENT_USER_EMAIL_KEY);
      if (savedUserEmail) {
          const user = userService.getUser(savedUserEmail);
          if (user) {
              setCurrentUser(user);
              setIsAuthenticated(true);
              const savedStateItem = localStorage.getItem(APP_STATE_KEY);
              const savedState = savedStateItem ? JSON.parse(savedStateItem) : null;
              // Prevent being stuck on admin page if not an admin anymore
              if (savedState?.screen === 'admin' && !user.isAdmin) {
                  setAppState({ screen: 'home' });
              } else if (savedState) {
                  setAppState(savedState);
              }
          } else {
              // Clear invalid session data if user not found
              localStorage.removeItem(CURRENT_USER_EMAIL_KEY);
              localStorage.removeItem(APP_STATE_KEY);
          }
      }
  }, []);

  // Subscribe to database changes to keep global state in sync
  useEffect(() => {
    const unsubscribe = databaseService.subscribe(() => {
        // When the database changes (e.g., after an import in AdminScreen),
        // re-sync the app-level state that depends on it.
        setUserProgress(databaseService.getAllUserProgress());
        if (currentUser) {
            getUserEntitlements(currentUser).then(setEntitlements);
        }
    });

    return () => unsubscribe();
  }, [currentUser]);


  useEffect(() => {
      // Session Persistence: Save state on change
      if (isAuthenticated && currentUser) {
          localStorage.setItem(CURRENT_USER_EMAIL_KEY, currentUser.email);
          localStorage.setItem(APP_STATE_KEY, JSON.stringify(appState));
      }
  }, [appState, isAuthenticated, currentUser]);

  useEffect(() => {
      window.scrollTo(0, 0);
  }, [appState.screen]);
  
  useEffect(() => {
      const loadEntitlements = async () => {
          if(isAuthenticated) {
              const userEntitlements = await getUserEntitlements(currentUser);
              setEntitlements(userEntitlements);
          } else {
              setEntitlements(null);
          }
      };
      loadEntitlements();
  }, [isAuthenticated, currentUser]);

  const updateUserProgress = (email: string, updates: Partial<UserProgress>) => {
      const allProgress = databaseService.getAllUserProgress();
      const currentProgress = allProgress[email] || { 
          scores: [], 
          completedExerciseIds: [], 
          skippedExerciseIds: [],
          completedModuleIds: [],
          analysisHistory: [],
          competenceScores: { ascolto: 0, riformulazione: 0, assertivita: 0, gestione_conflitto: 0 } 
      };
      allProgress[email] = { ...currentProgress, ...updates };
      databaseService.saveAllUserProgress(allProgress);
      // The subscription will handle the `setUserProgress` state update.
  };

  const navigateToPaywall = () => {
    if (appState.screen !== 'paywall') {
        setReturnToState(appState);
    }
    setAppState({ screen: 'paywall' });
  };
  
  const handlePurchase = async (product: Product) => {
    try {
        const newEntitlements = await purchaseProduct(currentUser, product);
        setEntitlements(newEntitlements);
        soundService.playScoreSound(100); // Play triumph sound for purchase
        addToast(`${product.name} sbloccato con successo!`, 'success');
        if (returnToState) {
            setTimeout(() => {
                setAppState(returnToState);
                setReturnToState(null);
            }, 1000);
        }
    } catch (error: any) {
        addToast(error.message || "Errore durante l'acquisto.", 'error');
    }
  };
  
  const handleRestore = async () => {
      try {
          const restoredEntitlements = await restorePurchases(currentUser);
          setEntitlements(restoredEntitlements);
          addToast("Acquisti ripristinati con successo.", 'success');
      } catch(error: any) {
          addToast(error.message || "Errore durante il ripristino.", 'error');
      }
  };

  const handleLogin = async (email: string, pass: string, key: string) => {
    const { user, expired } = await userService.authenticate(email, pass);
    if (user) {
      if (key) setApiKey(key);
      setCurrentUser(user);
      setIsAuthenticated(true);
      setAppState({ screen: 'home' });
    } else if (expired) {
      throw new Error("Il tuo periodo di prova è terminato oppure l'account è sospeso.");
    } else {
      throw new Error("Credenziali non valide.");
    }
  };
  
  const handleRegister = async (newUser: { firstName: string; lastName: string; email: string; password: string }) => {
    await userService.addUser(newUser.email, newUser.password, newUser.firstName, newUser.lastName);
  };
  
  const handleGuestAccess = (key: string) => {
    if (key) setApiKey(key);
    setCurrentUser(null);
    setIsAuthenticated(true);
    setAppState({ screen: 'home' });
  };

  const handleLogout = () => {
    soundService.playClick();
    localStorage.removeItem(CURRENT_USER_EMAIL_KEY);
    localStorage.removeItem(APP_STATE_KEY);
    setIsAuthenticated(false);
    setCurrentUser(null);
    setApiKey(null);
    setAppState({ screen: 'home' });
  };
  
  const handleStartCheckup = () => {
      soundService.playClick();
      setAppState({ screen: 'strategic_checkup' });
  };
  
  const handleCompleteCheckup = (profile: CommunicatorProfile) => {
      if (currentUser) {
          updateUserProgress(currentUser.email, {
              hasCompletedCheckup: true,
              checkupResults: profile,
          });
      }
      setAppState({ screen: 'communicator_profile' });
  };

  const handleFinishProfileReview = () => {
      setAppState({ screen: 'home' });
  };

  const handleSelectModule = (module: Module, color: string) => {
    if (module.isCustom) {
      setAppState({ screen: 'custom_setup', module });
    } else {
      setAppState({ screen: 'module', module, moduleColor: color });
    }
  };

  const handleSelectExercise = (exercise: Exercise, isCheckup: boolean = false, checkupStep: number = 0, totalCheckupSteps: number = 0, moduleColor?: string) => {
    setAppState({ screen: 'exercise', exercise, isCheckup, checkupStep, totalCheckupSteps, moduleColor });
  };

  const handleReviewExercise = async (exerciseId: string) => {
    if (!currentUser) return;
    const progress = userProgress[currentUser.email];
    if (!progress?.analysisHistory) return;

    let entryIndex = -1;
    for (let i = progress.analysisHistory.length - 1; i >= 0; i--) {
        if (progress.analysisHistory[i].exerciseId === exerciseId) {
            entryIndex = i;
            break;
        }
    }

    if (entryIndex === -1) {
        addToast("Nessun risultato precedente trovato per questo esercizio.", 'info');
        return;
    }
    
    const historyEntry = progress.analysisHistory[entryIndex];
    
    const exercise = findExerciseById(exerciseId);
    if (!exercise) {
        addToast("Dettagli dell'esercizio non trovati.", 'error');
        return;
    }

    const isPro = hasProAccess(entitlements);

    // Check if the analysis needs to be upgraded to PRO version
    if (isPro && historyEntry.type === 'written' && !(historyEntry.result as AnalysisResult).detailedRubric) {
        addToast("Aggiornamento dell'analisi alla versione PRO...", 'info');
        setIsLoading(true);
        try {
            const newResult = await analyzeResponse(
                historyEntry.userResponse,
                exercise.scenario,
                exercise.task,
                entitlements, // Current PRO entitlements
                false, // isVerbal
                exercise.customObjective,
                apiKey
            );

            // Update the history entry with the new PRO result to cache it
            const newAnalysisHistory = [...progress.analysisHistory];
            newAnalysisHistory[entryIndex] = { ...historyEntry, result: newResult };
            
            updateUserProgress(currentUser.email, {
                analysisHistory: newAnalysisHistory,
            });

            // Navigate to the report screen with the new, upgraded result
            const { currentModule } = findNextExerciseInModule(exerciseId);
            setAppState({ 
                screen: 'report', 
                result: newResult, 
                exercise: exercise,
                userResponse: historyEntry.userResponse,
                isReview: true,
                currentModule: currentModule 
            });

        } catch (e: any) {
            console.error("Failed to upgrade analysis to PRO:", e);
            if (e.message.includes('API key') || e.message.includes('API_KEY')) {
              handleApiKeyError(e.message);
            } else {
              addToast(e.message || "Impossibile aggiornare l'analisi.", 'error');
            }
        } finally {
            setIsLoading(false);
        }
        return;
    }

    // Original logic for viewing reports that don't need an upgrade
    const { currentModule } = findNextExerciseInModule(exerciseId);

    if (historyEntry.type === 'written') {
        setAppState({ 
            screen: 'report', 
            result: historyEntry.result as AnalysisResult, 
            exercise: exercise,
            userResponse: historyEntry.userResponse,
            isReview: true,
            currentModule: currentModule 
        });
    } else {
         setAppState({ 
            screen: 'voice_report', 
            result: historyEntry.result as VoiceAnalysisResult, 
            exercise: exercise,
            userResponse: historyEntry.userResponse,
            isReview: true,
            currentModule: currentModule 
        });
    }
  };

  const handleStartCustomExercise = (scenario: string, task: string, customObjective?: string) => {
    const customExercise: Exercise = {
        id: 'custom-' + Date.now(),
        title: 'Esercizio Personalizzato',
        scenario: scenario,
        task: task,
        difficulty: 'Base' as DifficultyLevel,
        customObjective: customObjective,
    };
    setAppState({ screen: 'exercise', exercise: customExercise });
  };

  const processExerciseCompletion = (exerciseId: string, result: AnalysisResult, userResponse: string) => {
      if (!currentUser) return;
      
      const { score } = result;
      const userEmail = currentUser.email;
      const currentProgress = userProgress[userEmail] || { 
          scores: [], 
          completedExerciseIds: [], 
          skippedExerciseIds: [],
          completedModuleIds: [], 
          analysisHistory: [],
          competenceScores: { ascolto: 0, riformulazione: 0, assertivita: 0, gestione_conflitto: 0 } 
      };
      
      const newScores = [...currentProgress.scores, score];
      const newCompletedIds = [...new Set([...(currentProgress.completedExerciseIds || []), exerciseId])];
      const newAnalysisHistory: AnalysisHistoryEntry[] = [...(currentProgress.analysisHistory || []), { 
          exerciseId, 
          userResponse,
          result,
          type: 'written',
          timestamp: new Date().toISOString()
      }];
      
      const newCompetenceScores = updateCompetenceScores(
        currentProgress.competenceScores,
        exerciseId,
        score
      );

      const newCompletedModuleIds = [...(currentProgress.completedModuleIds || [])];
      for (const module of MODULES.filter(m => !m.isCustom)) {
          if (!newCompletedModuleIds.includes(module.id)) {
              const allExercisesInModuleCompleted = module.exercises.every(ex => newCompletedIds.includes(ex.id));
              if (allExercisesInModuleCompleted) {
                  newCompletedModuleIds.push(module.id);
                  soundService.playSuccess();
              }
          }
      }

      updateUserProgress(userEmail, {
          scores: newScores,
          completedExerciseIds: newCompletedIds,
          completedModuleIds: newCompletedModuleIds,
          analysisHistory: newAnalysisHistory,
          competenceScores: newCompetenceScores,
      });
  };
  
  const handleCompleteWrittenExercise = (result: AnalysisResult, userResponse: string) => {
    if (appState.screen === 'exercise') {
      if (!appState.isCheckup) {
        processExerciseCompletion(appState.exercise.id, result, userResponse);
        const { currentModule, nextExercise } = findNextExerciseInModule(appState.exercise.id);
        setAppState({ screen: 'report', result, exercise: appState.exercise, nextExercise, currentModule, userResponse });
      }
    }
  };

  const handleCompleteVerbalExercise = (result: VoiceAnalysisResult, userResponse: string) => {
      if (appState.screen === 'exercise') {
          const averageScore = Math.round(result.scores.reduce((acc, s) => acc + s.score, 0) / result.scores.length * 10);
          if (!appState.isCheckup && currentUser) {
                const userEmail = currentUser.email;
                const currentProgress = userProgress[userEmail] || { scores: [], completedExerciseIds: [], skippedExerciseIds: [], completedModuleIds: [], analysisHistory: [] };
                const newScores = [...currentProgress.scores, averageScore];
                const newCompletedIds = [...new Set([...(currentProgress.completedExerciseIds || []), appState.exercise.id])];
                const newAnalysisHistory: AnalysisHistoryEntry[] = [...(currentProgress.analysisHistory || []), {
                    exerciseId: appState.exercise.id,
                    userResponse,
                    result,
                    type: 'verbal',
                    timestamp: new Date().toISOString()
                }];
                
                const newCompetenceScores = updateCompetenceScores(
                    currentProgress.competenceScores,
                    appState.exercise.id,
                    averageScore
                );

                updateUserProgress(userEmail, {
                    scores: newScores,
                    completedExerciseIds: newCompletedIds,
                    analysisHistory: newAnalysisHistory,
                    competenceScores: newCompetenceScores,
                });
          }
          const { currentModule, nextExercise } = findNextExerciseInModule(appState.exercise.id);
          setAppState({ screen: 'voice_report', result, exercise: appState.exercise, nextExercise, currentModule, userResponse });
      }
  };

  const handleSkipExercise = (exerciseId: string) => {
      soundService.playClick();
      if (currentUser) {
          updateUserProgress(currentUser.email, {
              skippedExerciseIds: [...new Set([...(userProgress[currentUser.email]?.skippedExerciseIds || []), exerciseId])]
          });
      }

      if (appState.screen === 'exercise') {
          const { nextExercise, currentModule } = findNextExerciseInModule(appState.exercise.id);
          if (nextExercise) {
              handleSelectExercise(nextExercise, false, 0, 0, appState.moduleColor);
          } else if (currentModule) {
              const moduleIndex = MODULES.findIndex(m => m.id === currentModule.id);
              handleSelectModule(currentModule, MODULE_PALETTE[moduleIndex % MODULE_PALETTE.length]);
          } else {
              setAppState({ screen: 'home' });
          }
      }
  };

  const handleRetryExercise = () => {
      if (appState.screen === 'report' || appState.screen === 'voice_report') {
          const moduleForExercise = MODULES.find(m => m.exercises.some(e => e.id === appState.exercise.id));
          let moduleColor: string | undefined = undefined;
          if(moduleForExercise) {
              const moduleIndex = MODULES.findIndex(m => m.id === moduleForExercise.id);
              if(moduleIndex !== -1) {
                  moduleColor = MODULE_PALETTE[moduleIndex % MODULE_PALETTE.length];
              }
          }
          setAppState({ screen: 'exercise', exercise: appState.exercise, moduleColor });
      }
  };
  
  const handleBack = () => {
    soundService.playClick();
    if (appState.screen === 'paywall') {
        if (returnToState) {
            setAppState(returnToState);
            setReturnToState(null);
        } else {
            setAppState({ screen: 'home' });
        }
        return;
    }
    if (appState.screen === 'module' || appState.screen === 'custom_setup' || appState.screen === 'communicator_profile' || appState.screen === 'strategic_checkup' || appState.screen === 'admin') {
      setAppState({ screen: 'home' });
    }
    if (appState.screen === 'exercise') {
        const isCustom = appState.exercise.id.startsWith('custom-');
        if (isCustom) {
            const customModule = MODULES.find(m => m.isCustom);
            if (customModule) setAppState({ screen: 'custom_setup', module: customModule });
            else setAppState({ screen: 'home' });
        } else if (appState.isCheckup) {
            setAppState({ screen: 'strategic_checkup' });
        } else {
            const moduleForExercise = MODULES.find(m => m.exercises.some(e => e.id === appState.exercise.id));
            if (moduleForExercise && appState.moduleColor) {
                setAppState({ screen: 'module', module: moduleForExercise, moduleColor: appState.moduleColor });
            } else if (moduleForExercise) {
                // Fallback to find color if it's missing in state (e.g., from older session)
                const moduleIndex = MODULES.findIndex(m => m.id === moduleForExercise.id);
                const color = MODULE_PALETTE[moduleIndex % MODULE_PALETTE.length] || MODULE_PALETTE[0];
                setAppState({ screen: 'module', module: moduleForExercise, moduleColor: color });
            } else {
                setAppState({ screen: 'home' });
            }
        }
    }
  };

  const handleApiKeyError = (error: string) => {
      setAppState({ screen: 'api_key_error', error });
  };
  
  const generateBreadcrumbs = (): Breadcrumb[] => {
    const homeCrumb: Breadcrumb = { label: "Home", onClick: () => setAppState({ screen: 'home' }) };
    
    switch (appState.screen) {
        case 'module':
            return [homeCrumb, { label: appState.module.title }];
        case 'custom_setup':
            return [homeCrumb, { label: appState.module.title }];
        case 'exercise':
            const module = MODULES.find(m => m.exercises.some(e => e.id === appState.exercise.id));
            if (module && appState.moduleColor) {
                return [homeCrumb, { label: module.title, onClick: () => setAppState({ screen: 'module', module, moduleColor: appState.moduleColor }) }, { label: "Esercizio" }];
            }
            return [homeCrumb, { label: "Esercizio" }];
        case 'report':
        case 'voice_report':
             if (appState.currentModule) {
                 const moduleIndex = MODULES.findIndex(m => m.id === appState.currentModule!.id);
                 const color = MODULE_PALETTE[moduleIndex % MODULE_PALETTE.length] || MODULE_PALETTE[0];
                return [homeCrumb, { label: appState.currentModule.title, onClick: () => setAppState({ screen: 'module', module: appState.currentModule!, moduleColor: color }) }, { label: "Report" }];
             }
             return [homeCrumb, { label: "Report" }];
        case 'strategic_checkup':
            return [homeCrumb, { label: 'Check-up Strategico' }];
        case 'communicator_profile':
            return [homeCrumb, { label: 'Profilo Comunicatore' }];
        case 'paywall':
            return [homeCrumb, { label: 'Sblocca PRO' }];
        case 'admin':
            return [homeCrumb, { label: 'Pannello Admin' }];
        default:
            return [homeCrumb];
    }
  };

  if (isLoading) {
    return <FullScreenLoader estimatedTime={20} />;
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} onRegister={handleRegister} onGuestAccess={handleGuestAccess} />;
  }
  
  const completedExerciseIds = (currentUser && userProgress[currentUser.email]?.completedExerciseIds) || [];
  const isPro = hasProAccess(entitlements);
  let screenContent;
  let screenKey = 'home';
  const showHeader = appState.screen !== 'api_key_error';

  switch (appState.screen) {
    case 'home':
      screenKey = 'home';
      screenContent = <HomeScreen 
                onSelectModule={handleSelectModule} 
                onSelectExercise={handleSelectExercise}
                currentUser={currentUser}
                userProgress={currentUser ? userProgress[currentUser.email] : undefined}
                onStartCheckup={handleStartCheckup}
             />;
      break;
    case 'module':
      screenKey = appState.module.id;
      screenContent = <ModuleScreen 
                        module={appState.module} 
                        moduleColor={appState.moduleColor}
                        // FIX: Pass an inline function to adapt the call to handleSelectExercise,
                        // which expects additional optional arguments not provided by ModuleScreen.
                        onSelectExercise={(exercise, moduleColor) => handleSelectExercise(exercise, false, 0, 0, moduleColor)} 
                        onReviewExercise={handleReviewExercise}
                        onBack={handleBack} 
                        completedExerciseIds={completedExerciseIds} 
                        entitlements={entitlements}
                      />;
      break;
    case 'custom_setup':
      screenKey = 'custom_setup';
      screenContent = <CustomSetupScreen 
                        module={appState.module} 
                        onStart={handleStartCustomExercise} 
                        onBack={handleBack} 
                        apiKey={apiKey}
                        onApiKeyError={handleApiKeyError}
                      />;
      break;
    case 'exercise':
        screenKey = appState.exercise.id;
        screenContent = <ExerciseScreen 
                    exercise={appState.exercise} 
                    onCompleteWritten={handleCompleteWrittenExercise} 
                    onCompleteVerbal={handleCompleteVerbalExercise}
                    onSkip={handleSkipExercise}
                    onBack={handleBack} 
                    onApiKeyError={handleApiKeyError}
                    entitlements={entitlements}
                    apiKey={apiKey}
                    isCheckup={appState.isCheckup}
                    checkupStep={appState.checkupStep}
                    totalCheckupSteps={appState.totalCheckupSteps}
                    />;
        break;
    case 'report':
    case 'voice_report':
        const { nextExercise, currentModule, isReview, userResponse } = appState;
        const onNextExercise = () => {
            if (isReview && currentModule) {
                 const moduleIndex = MODULES.findIndex(m => m.id === currentModule.id);
                 handleSelectModule(currentModule, MODULE_PALETTE[moduleIndex % MODULE_PALETTE.length]);
            } else if (nextExercise) {
                const nextModule = MODULES.find(m => m.exercises.some(e => e.id === nextExercise.id));
                let nextColor = MODULE_PALETTE[0];
                if(nextModule){
                    const moduleIndex = MODULES.findIndex(m => m.id === nextModule.id);
                    nextColor = MODULE_PALETTE[moduleIndex % MODULE_PALETTE.length];
                }
                handleSelectExercise(nextExercise, false, 0, 0, nextColor);
            } else if (currentModule) {
                const moduleIndex = MODULES.findIndex(m => m.id === currentModule.id);
                handleSelectModule(currentModule, MODULE_PALETTE[moduleIndex % MODULE_PALETTE.length]);
            } else {
                setAppState({ screen: 'home' });
            }
        };
        const nextExerciseLabel = isReview ? 'Torna al Modulo' : (nextExercise ? 'Prossimo Esercizio' : 'Torna al Modulo');
        
        if (appState.screen === 'report') {
            screenKey = `report-${appState.exercise.id}`;
            screenContent = <AnalysisReportScreen 
                result={appState.result} 
                exercise={appState.exercise} 
                onRetry={handleRetryExercise} 
                onNextExercise={onNextExercise} 
                nextExerciseLabel={nextExerciseLabel} 
                entitlements={entitlements} 
                onNavigateToPaywall={navigateToPaywall} 
                onPurchase={handlePurchase}
                userResponse={userResponse}
                isReview={isReview}
            />;
        } else {
            screenKey = `voice-report-${appState.exercise.id}`;
            screenContent = <VoiceAnalysisReportScreen 
                result={appState.result} 
                exercise={appState.exercise} 
                onRetry={handleRetryExercise} 
                onNextExercise={onNextExercise} 
                nextExerciseLabel={nextExerciseLabel} 
                entitlements={entitlements} 
                onNavigateToPaywall={navigateToPaywall}
                userResponse={userResponse}
                isReview={isReview}
            />;
        }
        break;
    case 'api_key_error':
        screenKey = 'api_key_error';
        screenContent = <ApiKeyErrorScreen error={appState.error} />;
        break;
    case 'strategic_checkup':
        screenKey = 'strategic_checkup';
        screenContent = <StrategicCheckupScreen onSelectExercise={handleSelectExercise} onCompleteCheckup={handleCompleteCheckup} onApiKeyError={handleApiKeyError} onBack={handleBack} entitlements={entitlements} apiKey={apiKey} />;
        break;
    case 'communicator_profile':
        screenKey = 'communicator_profile';
        const profile = currentUser ? userProgress[currentUser.email]?.checkupResults : undefined;
        screenContent = <CommunicatorProfileScreen profile={profile} onContinue={handleFinishProfileReview} />;
        break;
    case 'paywall':
        screenKey = 'paywall';
        screenContent = <PaywallScreen entitlements={entitlements!} onPurchase={handlePurchase} onRestore={handleRestore} onBack={handleBack} />;
        break;
    case 'admin':
        screenKey = 'admin';
        screenContent = <AdminScreen onBack={handleBack} />;
        break;
    default:
        screenContent = <HomeScreen 
                 onSelectModule={handleSelectModule} 
                 onSelectExercise={handleSelectExercise}
                 currentUser={currentUser}
                 userProgress={currentUser ? userProgress[currentUser.email] : undefined}
                 onStartCheckup={handleStartCheckup}
               />;
  }

  return (
    <div>
        {showHeader && <Header 
            currentUser={currentUser} 
            breadcrumbs={generateBreadcrumbs()} 
            onLogout={handleLogout} 
            onGoToPaywall={navigateToPaywall}
            onGoToAdmin={() => setAppState({ screen: 'admin' })}
            isPro={isPro}
            isSoundEnabled={isSoundEnabled}
            onToggleSound={handleToggleSound}
        />}
        <main style={showHeader ? styles.mainContent : {}}>
            <div key={screenKey} style={{ animation: 'fadeInUp 0.5s ease-out' }}>
                {screenContent}
            </div>
        </main>
        {appState.screen !== 'api_key_error' && (
            <footer style={styles.footer}>
                 <div style={styles.footerLinks}>
                    <a href="https://www.centroclinicaformazionestrategica.it/CES-APP/pdf/privacy_policy.pdf" target="_blank" rel="noopener noreferrer" title="Leggi la Privacy Policy" style={styles.footerLink}>Privacy Policy</a>
                    <span style={styles.footerSeparator}>|</span>
                    <a href="https://www.centroclinicaformazionestrategica.it/CES-APP/pdf/terms_of_service.pdf" target="_blank" rel="noopener noreferrer" title="Leggi i Termini di Servizio" style={styles.footerLink}>Termini di Servizio</a>
                </div>
                <div style={styles.copyrightContainer}>
                    <p style={styles.copyrightText}>
                        CES Coach © Copyright 2025
                    </p>
                    <p style={styles.copyrightText}>
                        cfs@centrocfs.it
                    </p>
                </div>
            </footer>
        )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    mainContent: {
        paddingTop: '64px', // Height of the fixed header
    },
    footer: {
        textAlign: 'center',
        padding: '32px 20px',
        backgroundColor: COLORS.base,
    },
    footerLinks: {
        marginBottom: '16px',
    },
    footerLink: {
        color: COLORS.textSecondary,
        textDecoration: 'none',
        fontSize: '12px',
        margin: '0 8px'
    },
    footerSeparator: {
        color: COLORS.textSecondary,
        fontSize: '12px',
    },
    copyrightContainer: {
        marginTop: '24px',
    },
    copyrightText: {
        margin: 0,
        fontSize: '12px',
        color: COLORS.textSecondary,
        lineHeight: '1.4',
    }
};


export default App;
