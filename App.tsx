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
import { ReviewScreen } from './components/ReviewScreen';
import type { Module, Exercise, AnalysisResult, VoiceAnalysisResult, DifficultyLevel, User, UserProgress, CommunicatorProfile, Breadcrumb, Entitlements, Product, AnalysisHistoryItem, SaveState } from './types';
import { initialUserDatabase } from './database';
import { soundService } from './services/soundService';
import { getUserEntitlements, purchaseProduct, restorePurchases, hasProAccess } from './services/monetizationService';
import { useToast } from './hooks/useToast';
import { updateCompetenceScores } from './services/competenceService';
import { useLocalization } from './context/LocalizationContext';
import { getContent } from './locales/content';
import { COLORS } from './constants';

type AppState =
  | { screen: 'home' }
  | { screen: 'module'; module: Module }
  | { screen: 'custom_setup'; module: Module }
  | { screen: 'exercise'; exercise: Exercise; isCheckup?: boolean; checkupStep?: number; totalCheckupSteps?: number }
  | { screen: 'report'; result: AnalysisResult; exercise: Exercise; nextExercise?: Exercise; currentModule?: Module }
  | { screen: 'voice_report'; result: VoiceAnalysisResult; exercise: Exercise; nextExercise?: Exercise; currentModule?: Module }
  | { screen: 'api_key_error'; error: string }
  | { screen: 'strategic_checkup' }
  | { screen: 'communicator_profile' }
  | { screen: 'paywall' }
  | { screen: 'review'; historyItem: AnalysisHistoryItem; module: Module };

const USERS_STORAGE_KEY = 'ces_coach_users';
const PROGRESS_STORAGE_KEY = 'ces_coach_progress';
const CURRENT_USER_EMAIL_KEY = 'ces_coach_current_user_email';
const APP_STATE_KEY = 'ces_coach_app_state';

const parseDatabase = (dbString: string): User[] => {
    if (!dbString.trim()) return [];
    return dbString.split('\n').map(line => {
        const [email, password, firstName, lastName] = line.split(',');
        return { email, password, firstName, lastName };
    });
};

const saveToStorage = <T,>(key: string, value: T) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error("Failed to save to storage:", error);
    }
};

const loadFromStorage = <T,>(key: string): T | null => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error("Failed to load from storage:", error);
        return null;
    }
};

const App: React.FC = () => {
  const { lang, t } = useLocalization();
  const { addToast } = useToast();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  
  const [users, setUsers] = useState<User[]>(() => {
    const storedUsers = loadFromStorage<User[]>(USERS_STORAGE_KEY);
    if (storedUsers && storedUsers.length > 0) return storedUsers;
    const initialUsers = parseDatabase(initialUserDatabase);
    saveToStorage(USERS_STORAGE_KEY, initialUsers);
    return initialUsers;
  });

  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>(() => {
    return loadFromStorage<Record<string, UserProgress>>(PROGRESS_STORAGE_KEY) || {};
  });

  const [appState, setAppState] = useState<AppState>({ screen: 'home' });
  const [returnToState, setReturnToState] = useState<AppState | null>(null);
  
  const MODULES = getContent(lang).MODULES;

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

  useEffect(() => {
      const savedUserEmail = loadFromStorage<string>(CURRENT_USER_EMAIL_KEY);
      if (savedUserEmail) {
          const user = users.find(u => u.email === savedUserEmail);
          if (user) {
              setCurrentUser(user);
              setIsAuthenticated(true);
              const savedState = loadFromStorage<AppState>(APP_STATE_KEY);
              if (savedState) setAppState(savedState);
          } else {
              localStorage.removeItem(CURRENT_USER_EMAIL_KEY);
              localStorage.removeItem(APP_STATE_KEY);
          }
      }
  }, [users]);

  useEffect(() => { saveToStorage(USERS_STORAGE_KEY, users); }, [users]);
  useEffect(() => { saveToStorage(PROGRESS_STORAGE_KEY, userProgress); }, [userProgress]);

  useEffect(() => {
      if (isAuthenticated && currentUser) {
          saveToStorage(CURRENT_USER_EMAIL_KEY, currentUser.email);
          saveToStorage(APP_STATE_KEY, appState);
      }
  }, [appState, isAuthenticated, currentUser]);

  useEffect(() => { window.scrollTo(0, 0); }, [appState.screen]);
  
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
      setUserProgress(prev => {
          const currentProgress = prev[email] || { 
              scores: [], 
              completedExerciseIds: [], 
              skippedExerciseIds: [],
              completedModuleIds: [],
              analysisHistory: [],
              competenceScores: { ascolto: 0, riformulazione: 0, assertivita: 0, gestione_conflitto: 0 } 
          };
          return { ...prev, [email]: { ...currentProgress, ...updates } };
      });
  };

  const navigateToPaywall = () => {
    if (appState.screen !== 'paywall') setReturnToState(appState);
    setAppState({ screen: 'paywall' });
  };
  
  const handlePurchase = async (product: Product) => {
    try {
        const newEntitlements = await purchaseProduct(currentUser, product);
        setEntitlements(newEntitlements);
        soundService.playScoreSound(100);
        addToast(t('unlockSuccess').replace('{productName}', product.name), 'success');
        if (returnToState) {
            setTimeout(() => {
                setAppState(returnToState);
                setReturnToState(null);
            }, 1000);
        }
    } catch (error: any) {
        addToast(error.message || t('purchaseError'), 'error');
    }
  };
  
  const handleRestore = async () => {
      try {
          const restoredEntitlements = await restorePurchases(currentUser);
          setEntitlements(restoredEntitlements);
          addToast(t('restoreSuccess'), 'success');
      } catch(error: any) {
          addToast(error.message || t('restoreError'), 'error');
      }
  };

  const handleLogin = (email: string, pass: string) => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user && user.password === pass) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      setAppState({ screen: 'home' });
    } else {
      throw new Error(t('invalidCredentials'));
    }
  };
  
  const handleRegister = (newUser: Omit<User, 'password'> & { password: string }) => {
    const userExists = users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase());
    if (userExists) throw new Error(t('userExistsError'));
    setUsers(prevUsers => [...prevUsers, { ...newUser }]);
  };
  
  const handleGuestAccess = () => {
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
    setAppState({ screen: 'home' });
  };
  
  const handleStartCheckup = () => {
      soundService.playClick();
      setAppState({ screen: 'strategic_checkup' });
  };
  
  const handleCompleteCheckup = (profile: CommunicatorProfile) => {
      if (currentUser) {
          updateUserProgress(currentUser.email, { hasCompletedCheckup: true, checkupResults: profile });
      }
      setAppState({ screen: 'communicator_profile' });
  };

  const handleFinishProfileReview = () => setAppState({ screen: 'home' });

  const handleSelectModule = (module: Module) => {
    setAppState(module.isCustom ? { screen: 'custom_setup', module } : { screen: 'module', module });
  };

  const handleSelectExercise = (exercise: Exercise, isCheckup = false, checkupStep = 0, totalCheckupSteps = 0) => {
    setAppState({ screen: 'exercise', exercise, isCheckup, checkupStep, totalCheckupSteps });
  };

  const handleReviewExercise = (exerciseId: string) => {
      if (!currentUser) return;
      const progress = userProgress[currentUser.email];
      const historyItem = progress?.analysisHistory?.slice().reverse().find(item => item.exerciseId === exerciseId);
      const module = MODULES.find(m => m.exercises.some(e => e.id === exerciseId));
      if (historyItem && module) {
          setAppState({ screen: 'review', historyItem, module });
      }
  };

  const handleStartCustomExercise = (scenario: string, task: string, customObjective?: string) => {
    const customExercise: Exercise = {
        id: 'custom-' + Date.now(),
        title: t('customExerciseTitle'),
        scenario, task,
        difficulty: 'Base' as DifficultyLevel,
        customObjective,
    };
    setAppState({ screen: 'exercise', exercise: customExercise });
  };

  const processExerciseCompletion = (exerciseId: string, userResponse: string, result: AnalysisResult) => {
      if (!currentUser) return;
      const { score } = result;
      const userEmail = currentUser.email;
      const currentProgress = userProgress[userEmail] || { scores: [], completedExerciseIds: [], analysisHistory: [], competenceScores: { ascolto: 0, riformulazione: 0, assertivita: 0, gestione_conflitto: 0 } };
      
      const newHistoryItem: AnalysisHistoryItem = { exerciseId, userResponse, analysis: result, timestamp: Date.now() };
      const newAnalysisHistory = [...(currentProgress.analysisHistory || []), newHistoryItem];
      const newScores = [...currentProgress.scores, score];
      const newCompletedIds = [...new Set([...(currentProgress.completedExerciseIds || []), exerciseId])];
      const newCompetenceScores = updateCompetenceScores(currentProgress.competenceScores, exerciseId, score);

      const newCompletedModuleIds = [...(currentProgress.completedModuleIds || [])];
      for (const module of MODULES.filter(m => !m.isCustom)) {
          if (!newCompletedModuleIds.includes(module.id)) {
              if (module.exercises.every(ex => newCompletedIds.includes(ex.id))) {
                  newCompletedModuleIds.push(module.id);
                  soundService.playSuccess();
              }
          }
      }

      updateUserProgress(userEmail, { scores: newScores, completedExerciseIds: newCompletedIds, completedModuleIds: newCompletedModuleIds, analysisHistory: newAnalysisHistory, competenceScores: newCompetenceScores });
  };
  
  const handleCompleteWrittenExercise = (exercise: Exercise, userResponse: string, result: AnalysisResult) => {
    if (!exercise.id.startsWith('custom-')) {
        processExerciseCompletion(exercise.id, userResponse, result);
    }
    const { currentModule, nextExercise } = findNextExerciseInModule(exercise.id);
    setAppState({ screen: 'report', result, exercise, nextExercise, currentModule });
  };

  const handleCompleteVerbalExercise = (exercise: Exercise, userResponse: string, result: VoiceAnalysisResult) => {
    if (currentUser) {
        const averageScore = Math.round(result.scores.reduce((acc, s) => acc + s.score, 0) / result.scores.length * 10);
        const userEmail = currentUser.email;
        const currentProgress = userProgress[userEmail] || { scores: [], completedExerciseIds: [], analysisHistory: [], competenceScores: { ascolto: 0, riformulazione: 0, assertivita: 0, gestione_conflitto: 0 } };
        
        const newHistoryItem: AnalysisHistoryItem = { exerciseId: exercise.id, userResponse, analysis: result, timestamp: Date.now() };
        const newAnalysisHistory = [...(currentProgress.analysisHistory || []), newHistoryItem];
        const newScores = [...currentProgress.scores, averageScore];
        const newCompletedIds = [...new Set([...(currentProgress.completedExerciseIds || []), exercise.id])];
        const newCompetenceScores = updateCompetenceScores(currentProgress.competenceScores, exercise.id, averageScore);

        updateUserProgress(userEmail, { scores: newScores, completedExerciseIds: newCompletedIds, analysisHistory: newAnalysisHistory, competenceScores: newCompetenceScores });
    }
    const { currentModule, nextExercise } = findNextExerciseInModule(exercise.id);
    setAppState({ screen: 'voice_report', result, exercise, nextExercise, currentModule });
  };

  const handleSkipExercise = (exerciseId: string) => {
      soundService.playClick();
      if (currentUser) updateUserProgress(currentUser.email, { skippedExerciseIds: [...new Set([...(userProgress[currentUser.email]?.skippedExerciseIds || []), exerciseId])] });
      const { nextExercise, currentModule } = findNextExerciseInModule(exerciseId);
      if (nextExercise) handleSelectExercise(nextExercise);
      else if (currentModule) handleSelectModule(currentModule);
      else setAppState({ screen: 'home' });
  };

  const handleRetryExercise = (exercise: Exercise) => {
    setAppState({ screen: 'exercise', exercise });
  };
  
  const handleBack = () => {
    if (appState.screen === 'paywall') {
        setAppState(returnToState || { screen: 'home' });
        setReturnToState(null);
        return;
    }
    if (['module', 'custom_setup', 'communicator_profile', 'strategic_checkup'].includes(appState.screen)) {
      setAppState({ screen: 'home' });
    }
    if (appState.screen === 'exercise' || appState.screen === 'review') {
        const exerciseId = appState.screen === 'exercise' ? appState.exercise.id : appState.historyItem.exerciseId;
        const isCustom = exerciseId.startsWith('custom-');
        if (isCustom) {
            const customModule = MODULES.find(m => m.isCustom);
            if (customModule) setAppState({ screen: 'custom_setup', module: customModule });
            else setAppState({ screen: 'home' });
        } else if (appState.screen === 'exercise' && appState.isCheckup) {
            setAppState({ screen: 'strategic_checkup' });
        } else {
            const moduleForExercise = MODULES.find(m => m.exercises.some(e => e.id === exerciseId));
            if (moduleForExercise) setAppState({ screen: 'module', module: moduleForExercise });
            else setAppState({ screen: 'home' });
        }
    }
  };

  const handleApiKeyError = (error: string) => setAppState({ screen: 'api_key_error', error });

  const handleManualSave = () => {
      if (!currentUser) return;
      setSaveState('saving');
      saveToStorage(PROGRESS_STORAGE_KEY, userProgress);
      setTimeout(() => {
          soundService.playSuccess();
          addToast(t('progressSaved'), 'success');
          setSaveState('saved');
          setTimeout(() => setSaveState('idle'), 2000);
      }, 500);
  };
  
  const generateBreadcrumbs = (): Breadcrumb[] => {
    const homeCrumb: Breadcrumb = { label: t('home'), onClick: () => setAppState({ screen: 'home' }) };
    
    switch (appState.screen) {
        case 'module': return [homeCrumb, { label: appState.module.title }];
        case 'custom_setup': return [homeCrumb, { label: appState.module.title }];
        case 'exercise':
            const module = MODULES.find(m => m.exercises.some(e => e.id === appState.exercise.id));
            if (module) return [homeCrumb, { label: module.title, onClick: () => setAppState({ screen: 'module', module }) }, { label: t('exercise') }];
            return [homeCrumb, { label: t('exercise') }];
        case 'report':
        case 'voice_report':
             if (appState.currentModule) return [homeCrumb, { label: appState.currentModule.title, onClick: () => setAppState({ screen: 'module', module: appState.currentModule }) }, { label: t('report') }];
             return [homeCrumb, { label: t('report') }];
        case 'review': return [homeCrumb, { label: appState.module.title, onClick: () => handleSelectModule(appState.module) }, { label: t('review') }];
        case 'strategic_checkup': return [homeCrumb, { label: t('strategicCheckup') }];
        case 'communicator_profile': return [homeCrumb, { label: t('communicatorProfile') }];
        case 'paywall': return [homeCrumb, { label: t('unlockPro') }];
        default: return [homeCrumb];
    }
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} onRegister={handleRegister} onGuestAccess={handleGuestAccess} />;
  }
  
  const currentProgress = currentUser ? userProgress[currentUser.email] : undefined;
  const isPro = hasProAccess(entitlements);
  let screenContent;
  let screenKey = 'home';
  const showHeader = appState.screen !== 'api_key_error';

  switch (appState.screen) {
    case 'home':
      screenKey = 'home';
      screenContent = <HomeScreen onSelectModule={handleSelectModule} onSelectExercise={handleSelectExercise} currentUser={currentUser} userProgress={currentProgress} onStartCheckup={handleStartCheckup} />;
      break;
    case 'module':
      screenKey = appState.module.id;
      screenContent = <ModuleScreen module={appState.module} onSelectExercise={handleSelectExercise} onReviewExercise={handleReviewExercise} onBack={handleBack} userProgress={currentProgress} entitlements={entitlements} />;
      break;
    case 'custom_setup':
      screenKey = 'custom_setup';
      screenContent = <CustomSetupScreen module={appState.module} onStart={handleStartCustomExercise} onBack={handleBack} />;
      break;
    case 'exercise':
        screenKey = appState.exercise.id;
        screenContent = <ExerciseScreen exercise={appState.exercise} onCompleteWritten={handleCompleteWrittenExercise} onCompleteVerbal={handleCompleteVerbalExercise} onSkip={handleSkipExercise} onBack={handleBack} onApiKeyError={handleApiKeyError} entitlements={entitlements} isCheckup={appState.isCheckup} checkupStep={appState.checkupStep} totalCheckupSteps={appState.totalCheckupSteps} />;
        break;
    case 'report':
    case 'voice_report':
        const { nextExercise, currentModule } = appState;
        const onNext = () => nextExercise ? handleSelectExercise(nextExercise) : (currentModule && handleSelectModule(currentModule));
        const nextLabel = nextExercise ? t('nextExercise') : t('backToModule');
        if (appState.screen === 'report') {
            screenKey = `report-${appState.exercise.id}`;
            screenContent = <AnalysisReportScreen result={appState.result} exercise={appState.exercise} onRetry={() => handleRetryExercise(appState.exercise)} onNextExercise={onNext} nextExerciseLabel={nextLabel} entitlements={entitlements} onNavigateToPaywall={navigateToPaywall} />;
        } else {
            screenKey = `voice-report-${appState.exercise.id}`;
            screenContent = <VoiceAnalysisReportScreen result={appState.result} exercise={appState.exercise} onRetry={() => handleRetryExercise(appState.exercise)} onNextExercise={onNext} nextExerciseLabel={nextLabel} entitlements={entitlements} onNavigateToPaywall={navigateToPaywall}/>;
        }
        break;
    case 'review':
        screenKey = `review-${appState.historyItem.exerciseId}-${appState.historyItem.timestamp}`;
        screenContent = <ReviewScreen historyItem={appState.historyItem} onRetry={() => handleRetryExercise(MODULES.flatMap(m => m.exercises).find(e => e.id === appState.historyItem.exerciseId)!)} onBack={handleBack} />;
        break;
    case 'api_key_error':
        screenKey = 'api_key_error';
        screenContent = <ApiKeyErrorScreen error={appState.error} />;
        break;
    case 'strategic_checkup':
        screenKey = 'strategic_checkup';
        {/* FIX: Corrected typo from 'entitleaments' to 'entitlements' */}
        screenContent = <StrategicCheckupScreen onCompleteCheckup={handleCompleteCheckup} onApiKeyError={handleApiKeyError} onBack={handleBack} entitlements={entitlements} />;
        break;
    case 'communicator_profile':
        screenKey = 'communicator_profile';
        screenContent = <CommunicatorProfileScreen profile={currentProgress?.checkupResults} onContinue={handleFinishProfileReview} />;
        break;
    case 'paywall':
        screenKey = 'paywall';
        screenContent = <PaywallScreen entitlements={entitlements!} onPurchase={handlePurchase} onRestore={handleRestore} onBack={handleBack} />;
        break;
    default:
        screenContent = <HomeScreen onSelectModule={handleSelectModule} onSelectExercise={handleSelectExercise} currentUser={currentUser} userProgress={currentProgress} onStartCheckup={handleStartCheckup} />;
  }

  return (
    <div>
        {showHeader && <Header currentUser={currentUser} breadcrumbs={generateBreadcrumbs()} onLogout={handleLogout} onGoToPaywall={navigateToPaywall} isPro={isPro} onManualSave={handleManualSave} saveState={saveState}/>}
        <main style={showHeader ? styles.mainContent : {}}>
            <div key={`${screenKey}-${lang}`} style={{ animation: 'fadeInUp 0.5s ease-out' }}>
                {screenContent}
            </div>
        </main>
        {appState.screen !== 'api_key_error' && (
            <footer style={styles.footer}>
                 <div style={styles.footerLinks}>
                    <a href="#" style={styles.footerLink}>{t('privacyPolicy')}</a>
                    <span style={styles.footerSeparator}>|</span>
                    <a href="#" style={styles.footerLink}>{t('termsOfService')}</a>
                </div>
                <div style={styles.copyrightContainer}>
                    <p style={styles.copyrightText}>CES Coach © Copyright 2025</p>
                    <p style={styles.copyrightText}>cfs@centrocfs.it</p>
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