import React, { useState, useEffect, useCallback } from 'react';

// Types
import type {
  Module,
  Exercise,
  UserProfile,
  UserProgress,
  Entitlements,
  AnalysisResult,
  VoiceAnalysisResult,
  CommunicatorProfile,
  Product,
  AnalysisHistoryEntry,
} from './types';

// Services
import { onAuthUserChanged, logout } from './services/authService';
import { databaseService } from './services/databaseService';
import { getUserEntitlements, purchaseProduct, restorePurchases } from './services/monetizationService';
import { updateCompetenceScores, EXERCISE_TO_COMPETENCE_MAP } from './services/competenceService';
import { soundService } from './services/soundService';
import { MODULES } from './constants';

// Components
import { PreloadingScreen } from './components/PreloadingScreen';
import { LoginScreen } from './components/LoginScreen';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { ModuleScreen } from './components/ModuleScreen';
import { CustomSetupScreen } from './components/CustomSetupScreen';
import { StrategicChatTrainerScreen } from './components/StrategicChatTrainerScreen';
import { ExerciseScreen } from './components/ExerciseScreen';
import { AnalysisReportScreen } from './components/AnalysisReportScreen';
import { VoiceAnalysisReportScreen } from './components/VoiceAnalysisReportScreen';
import { StrategicCheckupScreen } from './components/StrategicCheckupScreen';
import { CommunicatorProfileScreen } from './components/CommunicatorProfileScreen';
import { PaywallScreen } from './components/PaywallScreen';
import { AdminScreen } from './components/AdminScreen';
import { ApiKeyErrorScreen } from './components/ApiKeyErrorScreen';
import { FullScreenLoader } from './components/Loader';


type View =
  | 'PRELOADING'
  | 'LOGIN'
  | 'HOME'
  | 'MODULE'
  | 'CUSTOM_SETUP'
  | 'CHAT_TRAINER'
  | 'EXERCISE'
  | 'ANALYSIS_REPORT_WRITTEN'
  | 'ANALYSIS_REPORT_VERBAL'
  | 'STRATEGIC_CHECKUP'
  | 'COMMUNICATOR_PROFILE'
  | 'PAYWALL'
  | 'ADMIN'
  | 'API_KEY_ERROR';

interface AppState {
  view: View;
  selectedModule?: { module: Module; color: string };
  selectedExercise?: {
    exercise: Exercise;
    isCheckup?: boolean;
    checkupStep?: number;
    totalCheckupSteps?: number;
    moduleColor?: string;
  };
  analysisResult?: AnalysisResult | VoiceAnalysisResult | CommunicatorProfile;
  userResponse?: string;
  isReviewing?: boolean;
}

const getInitialState = (): AppState => {
  try {
    const savedState = localStorage.getItem('ces_coach_app_state');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      return {
        ...parsed,
        view: parsed.view === 'LOGIN' || parsed.view === 'PRELOADING' ? 'HOME' : parsed.view,
      };
    }
  } catch (error) {
    console.warn("Could not parse saved state:", error);
  }
  return { view: 'PRELOADING' };
};


function App() {
  const [appState, setAppState] = useState<AppState>(getInitialState());
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | undefined>(undefined);
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  // --- State and Auth Management ---
  useEffect(() => {
    if (appState.view !== 'PRELOADING') {
      try {
        const stateToSave = { ...appState };
        if (stateToSave.selectedModule) {
          const { module, ...rest } = stateToSave.selectedModule;
          // @ts-ignore
          stateToSave.selectedModule = { moduleId: module.id, ...rest };
        }
        localStorage.setItem('ces_coach_app_state', JSON.stringify(stateToSave));
      } catch (error) {
        console.warn("Error saving app state:", error);
      }
    }
  }, [appState]);


  const loadUserData = useCallback(async (user: UserProfile) => {
    setIsAuthLoading(true);
    const [progress, userEntitlements] = await Promise.all([
      databaseService.getUserProgress(user.uid),
      getUserEntitlements(user),
    ]);
    setUserProgress(progress || { scores: [] });
    setEntitlements(userEntitlements);
    setCurrentUser(user);

    const savedState = getInitialState();
    if (savedState && savedState.view !== 'PRELOADING' && savedState.view !== 'LOGIN') {
      if (savedState.selectedModule && (savedState.selectedModule as any).moduleId) {
        const module = MODULES.find(m => m.id === (savedState.selectedModule as any).moduleId);
        if (module) {
          (savedState.selectedModule as any).module = module;
        }
      }
      setAppState(savedState);
    } else {
      setAppState({ view: 'HOME' });
    }
    setIsAuthLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthUserChanged((user) => {
      if (user) {
        localStorage.setItem('ces_coach_current_user_email', user.email);
        loadUserData(user);
      } else {
        localStorage.removeItem('ces_coach_current_user_email');
        setCurrentUser(null);
        setUserProgress(undefined);
        setEntitlements(null);
        if (appState.view !== 'PRELOADING') {
            setAppState({ view: 'LOGIN' });
        }
        setIsAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, [loadUserData, appState.view]);

  const updateProgress = useCallback(async (updates: Partial<UserProgress>) => {
    if (!currentUser) return;
    const newProgress: UserProgress = {
      ...(userProgress || { scores: [] }),
      ...updates,
    };
    setUserProgress(newProgress);
    await databaseService.saveUserProgress(currentUser.uid, newProgress);
  }, [currentUser, userProgress]);

  // --- Navigation and Action Handlers ---

  const handleLogout = async () => {
    await logout();
    setAppState({ view: 'LOGIN' });
  };

  const navigate = (view: View, stateUpdate: Partial<AppState> = {}) => {
    soundService.playClick();
    setAppState(prev => ({ ...prev, ...stateUpdate, view }));
  };
  
  const handlePreloadingComplete = () => {
    setAppState(prevState => {
      if (prevState.view === 'PRELOADING') {
        // If auth hasn't set the view yet, move to LOGIN as the default.
        // The auth listener will then redirect to HOME if a user is logged in.
        return { ...prevState, view: 'LOGIN' };
      }
      // If auth listener already set the view to HOME, don't override it.
      return prevState;
    });
  };

  const handleSelectModule = (module: Module, color: string) => {
    if (module.isCustom) {
      navigate('CUSTOM_SETUP', { selectedModule: { module, color } });
    } else if (module.specialModuleType === 'chat_trainer') {
      navigate('CHAT_TRAINER', { selectedModule: { module, color } });
    } else {
      navigate('MODULE', { selectedModule: { module, color } });
    }
  };

  const handleSelectExercise = (
    exercise: Exercise,
    isCheckup = false,
    checkupStep = 0,
    totalCheckupSteps = 0,
    moduleColor = appState.selectedModule?.color,
  ) => {
    navigate('EXERCISE', {
      selectedExercise: { exercise, isCheckup, checkupStep, totalCheckupSteps, moduleColor },
      isReviewing: false,
      userResponse: undefined,
      analysisResult: undefined,
    });
  };

  const handleBackToHome = () => navigate('HOME', { selectedModule: undefined, selectedExercise: undefined });

  const handleBackToModule = () => {
    if (appState.selectedModule) {
      navigate('MODULE', { selectedExercise: undefined });
    } else {
      handleBackToHome();
    }
  };

  const findNextExercise = () => {
    if (!appState.selectedModule || !appState.selectedExercise) return null;
    const { module } = appState.selectedModule;
    if (!module.exercises) return null;
    const { exercise } = appState.selectedExercise;
    const currentIndex = module.exercises.findIndex(e => e.id === exercise.id);
    if (currentIndex > -1 && currentIndex < module.exercises.length - 1) {
      return module.exercises[currentIndex + 1];
    }
    return null;
  };

  const handleNextExercise = () => {
    const nextExercise = findNextExercise();
    if (nextExercise) {
      handleSelectExercise(nextExercise);
    } else {
      if (appState.selectedModule) {
        const completedIds = userProgress?.completedModuleIds || [];
        if (!completedIds.includes(appState.selectedModule.module.id)) {
          updateProgress({ completedModuleIds: [...completedIds, appState.selectedModule.module.id] });
        }
      }
      handleBackToHome();
    }
  };

  const handleCompleteExercise = (
    result: AnalysisResult | VoiceAnalysisResult,
    userResponse: string,
    isVerbal: boolean
  ) => {
    const { exercise } = appState.selectedExercise!;
    const score = 'score' in result ? result.score : (result.scores.reduce((a, b) => a + b.score, 0) / result.scores.length) * 10;

    const newScores = [...(userProgress?.scores || []), score];
    const completedIds = [...new Set([...(userProgress?.completedExerciseIds || []), exercise.id])];
    const historyEntry: AnalysisHistoryEntry = {
      exerciseId: exercise.id, userResponse, result,
      type: isVerbal ? 'verbal' : 'written',
      timestamp: new Date().toISOString()
    };
    const newHistory = [...(userProgress?.analysisHistory || []), historyEntry];

    const competenceKey = EXERCISE_TO_COMPETENCE_MAP[exercise.id];
    const newCompetenceScores = competenceKey ? updateCompetenceScores(userProgress?.competenceScores, exercise.id, score) : userProgress?.competenceScores;

    updateProgress({
      scores: newScores,
      completedExerciseIds: completedIds,
      analysisHistory: newHistory,
      competenceScores: newCompetenceScores
    });

    navigate(
      isVerbal ? 'ANALYSIS_REPORT_VERBAL' : 'ANALYSIS_REPORT_WRITTEN',
      { analysisResult: result, userResponse }
    );
  };

  const handleCompleteWritten = (result: AnalysisResult, userResponse: string) => {
    handleCompleteExercise(result, userResponse, false);
  };

  const handleCompleteVerbal = (result: VoiceAnalysisResult, userResponse: string) => {
    handleCompleteExercise(result, userResponse, true);
  };

  const handleSkipExercise = (exerciseId: string) => {
    updateProgress({ skippedExerciseIds: [...new Set([...(userProgress?.skippedExerciseIds || []), exerciseId])] });
    handleNextExercise();
  };

  const handleCompleteCheckup = (profile: CommunicatorProfile) => {
    updateProgress({ hasCompletedCheckup: true, checkupResults: profile });
    navigate('COMMUNICATOR_PROFILE', { analysisResult: profile });
  };

  const handleCustomExerciseStart = (scenario: string, task: string, customObjective?: string) => {
    const customExercise: Exercise = {
      id: `custom-${Date.now()}`,
      title: 'Esercizio Personalizzato',
      difficulty: 'Intermedio' as any,
      scenario,
      task,
      customObjective,
    };
    handleSelectExercise(customExercise);
  };

  const handleApiKeyError = (error: string) => {
    setApiKeyError(error);
    navigate('API_KEY_ERROR');
  };

  const handlePurchase = async (product: Product) => {
    if (!currentUser) return;
    const newEntitlements = await purchaseProduct(currentUser, product);
    setEntitlements(newEntitlements);
  };

  const handleRestore = async () => {
    if (!currentUser) return;
    const restoredEntitlements = await restorePurchases(currentUser);
    setEntitlements(restoredEntitlements);
  };

  // --- Render Logic ---

  const renderContent = () => {
    if (appState.view !== 'PRELOADING' && isAuthLoading) {
        return <FullScreenLoader />;
    }

    if (apiKeyError) {
      return <ApiKeyErrorScreen error={apiKeyError} />;
    }

    switch (appState.view) {
      case 'PRELOADING':
        return <PreloadingScreen onComplete={handlePreloadingComplete} />;
      case 'LOGIN':
        return <LoginScreen />;
      case 'HOME':
        return <HomeScreen
          currentUser={currentUser}
          userProgress={userProgress}
          onSelectModule={handleSelectModule}
          onSelectExercise={handleSelectExercise}
          onStartCheckup={() => navigate('STRATEGIC_CHECKUP')}
        />;
      case 'MODULE':
        return <ModuleScreen
          module={appState.selectedModule!.module}
          moduleColor={appState.selectedModule!.color}
          onSelectExercise={(exercise) => handleSelectExercise(exercise)}
          onReviewExercise={() => { /* TODO */ }}
          onBack={handleBackToHome}
          completedExerciseIds={userProgress?.completedExerciseIds || []}
          entitlements={entitlements}
        />;
      case 'CUSTOM_SETUP':
        return <CustomSetupScreen
          module={appState.selectedModule!.module}
          onStart={handleCustomExerciseStart}
          onBack={handleBackToHome}
          onApiKeyError={handleApiKeyError}
        />
      case 'CHAT_TRAINER':
        return <StrategicChatTrainerScreen
          module={appState.selectedModule!.module}
          onBack={handleBackToHome}
          onApiKeyError={handleApiKeyError}
        />
      case 'EXERCISE':
        return <ExerciseScreen
          exercise={appState.selectedExercise!.exercise}
          isCheckup={appState.selectedExercise!.isCheckup}
          checkupStep={appState.selectedExercise!.checkupStep}
          totalCheckupSteps={appState.selectedExercise!.totalCheckupSteps}
          entitlements={entitlements}
          onCompleteWritten={handleCompleteWritten}
          onCompleteVerbal={handleCompleteVerbal}
          onSkip={handleSkipExercise}
          onBack={handleBackToModule}
          onApiKeyError={handleApiKeyError}
        />;
      case 'ANALYSIS_REPORT_WRITTEN':
        return <AnalysisReportScreen
          result={appState.analysisResult as AnalysisResult}
          exercise={appState.selectedExercise!.exercise}
          userResponse={appState.userResponse}
          isReview={appState.isReviewing}
          onRetry={() => navigate('EXERCISE')}
          onNextExercise={handleNextExercise}
          nextExerciseLabel={findNextExercise() ? 'Prossimo Esercizio' : 'Torna alla Home'}
          entitlements={entitlements}
          onNavigateToPaywall={() => navigate('PAYWALL')}
          onPurchase={handlePurchase}
        />;
      case 'ANALYSIS_REPORT_VERBAL':
        return <VoiceAnalysisReportScreen
          result={appState.analysisResult as VoiceAnalysisResult}
          exercise={appState.selectedExercise!.exercise}
          userResponse={appState.userResponse}
          isReview={appState.isReviewing}
          onRetry={() => navigate('EXERCISE')}
          onNextExercise={handleNextExercise}
          nextExerciseLabel={findNextExercise() ? 'Prossimo Esercizio' : 'Torna alla Home'}
          entitlements={entitlements}
          onNavigateToPaywall={() => navigate('PAYWALL')}
        />;
      case 'STRATEGIC_CHECKUP':
        return <StrategicCheckupScreen
          onCompleteCheckup={handleCompleteCheckup}
          onApiKeyError={handleApiKeyError}
          onBack={handleBackToHome}
          entitlements={entitlements}
          onSelectExercise={handleSelectExercise}
        />;
      case 'COMMUNICATOR_PROFILE':
        return <CommunicatorProfileScreen
          profile={appState.analysisResult as CommunicatorProfile}
          onContinue={handleBackToHome}
        />;
      case 'PAYWALL':
        return <PaywallScreen
          entitlements={entitlements!}
          onPurchase={handlePurchase}
          onRestore={handleRestore}
          onBack={handleBackToHome}
        />;
      case 'ADMIN':
        return <AdminScreen onBack={handleBackToHome} />;
      default:
        return <LoginScreen />;
    }
  };

  const showHeader = appState.view !== 'PRELOADING' && appState.view !== 'LOGIN' && appState.view !== 'API_KEY_ERROR';

  return (
    <div>
      {showHeader && currentUser && (
        <Header
          currentUser={currentUser}
          entitlements={entitlements}
          onLogout={handleLogout}
          onNavigateToAdmin={() => navigate('ADMIN')}
          onNavigateToPaywall={() => navigate('PAYWALL')}
          onNavigateToHome={handleBackToHome}
        />
      )}
      <main>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;