// App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  User, UserProgress, Module, Exercise, AnalysisResult, Entitlements,
  VoiceAnalysisResult, StorableEntitlements, Breadcrumb, CommunicatorProfile, Product
} from './types';
import { LoginScreen } from './components/LoginScreen';
import { HomeScreen } from './components/HomeScreen';
import { ModuleScreen } from './components/ModuleScreen';
import { Header } from './components/Header';
import { databaseService } from './services/databaseService';
import { userService } from './services/userService';
import { MODULES, STRATEGIC_CHECKUP_EXERCISES } from './constants';
import { ExerciseScreen } from './components/ExerciseScreen';
import { AnalysisReportScreen } from './components/AnalysisReportScreen';
import { VoiceAnalysisReportScreen } from './components/VoiceAnalysisReportScreen';
import { hasProAccess } from './services/monetizationService';
import { PaywallScreen } from './components/PaywallScreen';
import CustomSetupScreen from './components/CustomSetupScreen';
import AdminScreen from './components/AdminScreen';
import { PreloadingScreen } from './components/PreloadingScreen';
import { StrategicCheckupScreen } from './components/StrategicCheckupScreen';
import { CommunicatorProfileScreen } from './components/CommunicatorProfileScreen';
import { soundService } from './services/soundService';
import { ApiKeyErrorScreen } from './components/ApiKeyErrorScreen';
import { useToast } from './hooks/useToast';
import StrategicChatTrainerScreen from './components/StrategicChatTrainerScreen';
// FIX: Import `updateCompetenceScores` to be used when an exercise is completed.
import { updateCompetenceScores } from './services/competenceService';

// State definition
interface AppState {
  view: 'preloading' | 'login' | 'home' | 'module' | 'exercise' | 'custom-setup' | 'analysis' | 'voice-analysis' | 'paywall' | 'admin' | 'checkup' | 'profile' | 'api-key-error' | 'chat-trainer';
  currentUser: User | null;
  userProgress: UserProgress | undefined;
  entitlements: Entitlements | null;
  selectedModule: Module | null;
  selectedExercise: Exercise | null;
  lastAnalysisResult: AnalysisResult | VoiceAnalysisResult | null;
  lastUserResponse: string | null;
  breadcrumbs: Breadcrumb[];
  moduleColor: string;
  isReview: boolean;
  isCheckup: boolean;
  checkupStep: number;
  totalCheckupSteps: number;
  communicatorProfile: CommunicatorProfile | null;
  apiKeyError: string | null;
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    view: 'preloading',
    currentUser: null,
    userProgress: undefined,
    entitlements: null,
    selectedModule: null,
    selectedExercise: null,
    lastAnalysisResult: null,
    lastUserResponse: null,
    breadcrumbs: [{ label: 'Home', onClick: () => navigate('home') }],
    moduleColor: '#0E3A5D',
    isReview: false,
    isCheckup: false,
    checkupStep: 0,
    totalCheckupSteps: 0,
    communicatorProfile: null,
    apiKeyError: null,
  });

  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const { addToast } = useToast();

  const persistState = useCallback((userEmail: string, stateToPersist: Partial<AppState>) => {
    localStorage.setItem(`ces_coach_app_state_${userEmail}`, JSON.stringify(stateToPersist));
  }, []);

  const loadPersistedState = useCallback((userEmail: string): Partial<AppState> | null => {
    const persisted = localStorage.getItem(`ces_coach_app_state_${userEmail}`);
    return persisted ? JSON.parse(persisted) : null;
  }, []);

  const navigate = (view: AppState['view'], stateUpdates: Partial<AppState> = {}) => {
    setAppState(prevState => {
      const newState = { ...prevState, view, ...stateUpdates };
      if (newState.currentUser) {
        persistState(newState.currentUser.email, {
          view: newState.view,
          selectedModule: newState.selectedModule,
          selectedExercise: newState.selectedExercise,
          moduleColor: newState.moduleColor,
        });
      }
      return newState;
    });
  };
  
  const loadUserData = (user: User) => {
    const progress = databaseService.getUserProgress(user.email);
    const storableEntitlements = databaseService.getUserEntitlements(user.email);
    const entitlements: Entitlements = {
      ...storableEntitlements,
      productIDs: new Set(storableEntitlements.productIDs),
    };
    return { progress, entitlements };
  };

  const handleBackToHome = () => {
      navigate('home', {
          selectedModule: null,
          selectedExercise: null,
          breadcrumbs: [{ label: 'Home', onClick: handleBackToHome }]
      });
  };
  
  const handleLogin = async (email: string, pass: string) => {
    const user = await userService.login(email, pass);
    const { progress, entitlements } = loadUserData(user);
    
    const persistedState = loadPersistedState(user.email);
    
    const breadcrumbs = [{ label: 'Home', onClick: () => handleBackToHome() }];
    if(persistedState?.selectedModule) {
        breadcrumbs.push({ label: persistedState.selectedModule.title, onClick: () => {} });
    }

    setAppState({
      ...appState,
      view: 'home',
      currentUser: user,
      userProgress: progress,
      entitlements,
      breadcrumbs,
      ...(persistedState || {})
    });
    localStorage.setItem('ces_coach_current_user_email', user.email);
  };
  
  const handleRegister = async (data: any) => {
    await userService.register(data);
  };

  const handleGuestAccess = () => {
    const guestUser: User = {
      email: 'guest@ces.coach',
      passwordHash: '',
      firstName: 'Ospite',
      lastName: '',
      createdAt: new Date().toISOString(),
      expiryDate: null,
      isAdmin: false,
      enabled: true,
    };
    setAppState({
      ...appState,
      view: 'home',
      currentUser: guestUser,
      userProgress: { scores: [] },
      entitlements: { productIDs: new Set(), teamSeats: 0, teamActive: false },
      breadcrumbs: [{ label: 'Home', onClick: handleBackToHome }],
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('ces_coach_current_user_email');
    if (appState.currentUser) {
      localStorage.removeItem(`ces_coach_app_state_${appState.currentUser.email}`);
    }
    setAppState({
        ...appState,
        view: 'login',
        currentUser: null,
        userProgress: undefined,
        entitlements: null,
    });
  };

  const handleSelectModule = (module: Module, color: string) => {
    const newBreadcrumbs = [...appState.breadcrumbs, { label: module.title }];
    if (module.isCustom) {
      navigate('custom-setup', { selectedModule: module, moduleColor: color, breadcrumbs: newBreadcrumbs });
    } else if (module.specialModuleType === 'chat_trainer') {
      navigate('chat-trainer', { selectedModule: module, breadcrumbs: newBreadcrumbs });
    }
    else {
      navigate('module', { selectedModule: module, moduleColor: color, breadcrumbs: newBreadcrumbs });
    }
  };
  
  const handleSelectExercise = (exercise: Exercise, isCheckup: boolean = false, checkupStep: number = 0, totalCheckupSteps: number = 0, moduleColor?: string) => {
    navigate('exercise', {
      selectedExercise: exercise,
      breadcrumbs: [...appState.breadcrumbs, { label: exercise.title }],
      isCheckup,
      checkupStep,
      totalCheckupSteps,
      ...(moduleColor && { moduleColor }),
    });
  };

  const saveProgress = (updates: Partial<UserProgress>) => {
    if (appState.currentUser && appState.currentUser.email !== 'guest@ces.coach') {
      const currentProgress = appState.userProgress || { scores: [] };
      const newProgress = { ...currentProgress, ...updates };
      databaseService.saveUserProgress(appState.currentUser.email, newProgress);
      setAppState(prev => ({ ...prev, userProgress: newProgress }));
    }
  };
  
  const handleCompleteExercise = (result: AnalysisResult | VoiceAnalysisResult, userResponse: string, type: 'written' | 'verbal') => {
    const newScore = 'score' in result ? result.score : Math.round(result.scores.reduce((a, b) => a + b.score, 0) / result.scores.length * 10);
    const completedIds = [...(appState.userProgress?.completedExerciseIds || []), appState.selectedExercise!.id];
    
    // Check if module is complete
    const completedModuleIds = appState.userProgress?.completedModuleIds || [];
    if(appState.selectedModule && appState.selectedModule.exercises.length > 0 && appState.selectedModule.exercises.every(e => completedIds.includes(e.id))) {
      if(!completedModuleIds.includes(appState.selectedModule.id)) {
        completedModuleIds.push(appState.selectedModule.id);
      }
    }
    
    const competenceScores = updateCompetenceScores(appState.userProgress?.competenceScores, appState.selectedExercise!.id, newScore);

    saveProgress({
      scores: [...(appState.userProgress?.scores || []), newScore],
      completedExerciseIds: completedIds,
      completedModuleIds,
      competenceScores,
    });
    
    navigate(type === 'written' ? 'analysis' : 'voice-analysis', {
      lastAnalysisResult: result,
      lastUserResponse: userResponse,
      isReview: false,
    });
  };
  
  const handleGoToPaywall = () => navigate('paywall');
  const handlePurchase = async (product: Product) => {
      if(appState.currentUser && appState.currentUser.email !== 'guest@ces.coach') {
          const currentEntitlements = databaseService.getUserEntitlements(appState.currentUser.email);
          if (!currentEntitlements.productIDs.includes(product.id)) {
            currentEntitlements.productIDs.push(product.id);
          }
          databaseService.saveUserEntitlements(appState.currentUser.email, currentEntitlements);
          const { entitlements } = loadUserData(appState.currentUser);
          setAppState(prev => ({ ...prev, entitlements }));
          addToast("CES Coach PRO attivato! Goditi le nuove funzionalità.", "success");
      } else {
          addToast("Devi essere registrato per attivare PRO.", "error");
      }
  };
  
  const handleApiKeyError = (error: string) => {
    navigate('api-key-error', { apiKeyError: error });
  };
  
  // Auto-login effect
  useEffect(() => {
    const userEmail = localStorage.getItem('ces_coach_current_user_email');
    if (userEmail) {
      const user = databaseService.findUserByEmail(userEmail);
      if (user) {
        const { progress, entitlements } = loadUserData(user);
        const persistedState = loadPersistedState(user.email);
        const breadcrumbs = [{ label: 'Home', onClick: () => handleBackToHome() }];
        if(persistedState?.selectedModule) {
            breadcrumbs.push({ label: persistedState.selectedModule.title, onClick: () => {} });
        }
        setAppState(prev => ({
          ...prev,
          currentUser: user,
          userProgress: progress,
          entitlements,
          breadcrumbs,
          ...(persistedState || {}),
          view: persistedState?.view && persistedState.view !== 'preloading' ? persistedState.view : 'home',
        }));
      } else {
        setAppState(prev => ({ ...prev, view: 'login' }));
      }
    } else {
      setAppState(prev => ({ ...prev, view: 'login' }));
    }
  }, []);

  const renderContent = () => {
    const { view } = appState;
    switch (view) {
      case 'preloading':
        return <PreloadingScreen onComplete={() => {
            const userEmail = localStorage.getItem('ces_coach_current_user_email');
            navigate(userEmail ? 'home' : 'login');
        }} />;
      case 'login':
        return <LoginScreen onLogin={handleLogin} onRegister={handleRegister} onGuestAccess={handleGuestAccess} />;
      case 'home':
        return <HomeScreen 
            currentUser={appState.currentUser}
            userProgress={appState.userProgress}
            onSelectModule={handleSelectModule} 
            onSelectExercise={handleSelectExercise}
            onStartCheckup={() => navigate('checkup')}
            />;
      case 'module':
        return <ModuleScreen
            module={appState.selectedModule!}
            moduleColor={appState.moduleColor}
            onSelectExercise={(exercise) => handleSelectExercise(exercise, false, 0, 0, appState.moduleColor)}
            onBack={() => navigate('home', { selectedModule: null, breadcrumbs: appState.breadcrumbs.slice(0, 1) })}
            completedExerciseIds={appState.userProgress?.completedExerciseIds || []}
            entitlements={appState.entitlements}
            onReviewExercise={(id) => { /* Logic for review could be added here */ }}
            />;
      case 'exercise':
        return <ExerciseScreen
            exercise={appState.selectedExercise!}
            onCompleteWritten={(res, uRes) => handleCompleteExercise(res, uRes, 'written')}
            onCompleteVerbal={(res, uRes) => handleCompleteExercise(res, uRes, 'verbal')}
            onBack={() => navigate(appState.isCheckup ? 'checkup' : 'module', { breadcrumbs: appState.breadcrumbs.slice(0, -1) })}
            onSkip={(id) => {
              saveProgress({ skippedExerciseIds: [...(appState.userProgress?.skippedExerciseIds || []), id] });
              navigate('module', { breadcrumbs: appState.breadcrumbs.slice(0, -1) });
            }}
            entitlements={appState.entitlements}
            onApiKeyError={handleApiKeyError}
            isCheckup={appState.isCheckup}
            checkupStep={appState.checkupStep}
            totalCheckupSteps={appState.totalCheckupSteps}
            />
      case 'analysis':
        return <AnalysisReportScreen
            result={appState.lastAnalysisResult as AnalysisResult}
            exercise={appState.selectedExercise!}
            onRetry={() => navigate('exercise')}
            onNextExercise={() => navigate('module', { breadcrumbs: appState.breadcrumbs.slice(0, -2) })}
            nextExerciseLabel="Torna al Modulo"
            entitlements={appState.entitlements}
            onNavigateToPaywall={handleGoToPaywall}
            onPurchase={handlePurchase}
            userResponse={appState.lastUserResponse!}
            isReview={appState.isReview}
            />;
       case 'voice-analysis':
        return <VoiceAnalysisReportScreen
            result={appState.lastAnalysisResult as VoiceAnalysisResult}
            exercise={appState.selectedExercise!}
            onRetry={() => navigate('exercise')}
            onNextExercise={() => navigate('module', { breadcrumbs: appState.breadcrumbs.slice(0, -2) })}
            nextExerciseLabel="Torna al Modulo"
            entitlements={appState.entitlements}
            onNavigateToPaywall={handleGoToPaywall}
            userResponse={appState.lastUserResponse!}
            isReview={appState.isReview}
            />;
      case 'paywall':
          return <PaywallScreen
              entitlements={appState.entitlements!}
              onPurchase={handlePurchase}
              onRestore={async () => addToast("Funzione non implementata in questa demo.", "info")}
              onBack={handleBackToHome}
          />
      case 'custom-setup':
        return <CustomSetupScreen
            module={appState.selectedModule!}
            onStart={(scenario, task, customObjective) => {
              const customExercise: Exercise = {
                id: `custom_${Date.now()}`,
                title: 'Esercizio Personalizzato',
                difficulty: STRATEGIC_CHECKUP_EXERCISES[0].difficulty, // Or some default
                scenario, task, customObjective
              };
              handleSelectExercise(customExercise);
            }}
            onBack={() => navigate('home', { breadcrumbs: appState.breadcrumbs.slice(0, 1) })}
            onApiKeyError={handleApiKeyError}
        />
      case 'chat-trainer':
        return <StrategicChatTrainerScreen 
            module={appState.selectedModule!}
            onBack={() => navigate('home', { breadcrumbs: appState.breadcrumbs.slice(0, 1) })}
            onApiKeyError={handleApiKeyError}
            />
      case 'admin':
        return <AdminScreen onBack={handleBackToHome} />;
      case 'checkup':
        return <StrategicCheckupScreen
          onSelectExercise={(ex, isCheckup, step, total) => handleSelectExercise(ex, isCheckup, step, total)}
          onCompleteCheckup={(profile) => {
              saveProgress({ hasCompletedCheckup: true, checkupResults: profile });
              navigate('profile', { communicatorProfile: profile });
          }}
          onApiKeyError={handleApiKeyError}
          onBack={handleBackToHome}
          entitlements={appState.entitlements}
          />;
       case 'profile':
         return <CommunicatorProfileScreen
            profile={appState.communicatorProfile || appState.userProgress?.checkupResults}
            onContinue={handleBackToHome}
         />;
      case 'api-key-error':
        return <ApiKeyErrorScreen error={appState.apiKeyError!} />;
      default:
        return <div>Invalid state</div>;
    }
  };

  const showHeader = appState.view !== 'login' && appState.view !== 'preloading' && appState.view !== 'api-key-error';

  return (
    <>
      {showHeader && appState.currentUser && (
        <Header 
            currentUser={appState.currentUser} 
            breadcrumbs={appState.breadcrumbs}
            onLogout={handleLogout}
            onGoToPaywall={handleGoToPaywall}
            onGoToAdmin={() => navigate('admin')}
            isPro={hasProAccess(appState.entitlements)}
            isSoundEnabled={isSoundEnabled}
            onToggleSound={() => {
                const newState = !isSoundEnabled;
                setIsSoundEnabled(newState);
                soundService.toggleSound(newState);
            }}
        />
      )}
      <main style={{ paddingTop: showHeader ? '64px' : '0' }}>
        {renderContent()}
      </main>
    </>
  );
};

export default App;
