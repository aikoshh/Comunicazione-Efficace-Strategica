// App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  UserProfile,
  UserProgress,
  Module,
  Exercise,
  AnalysisResult,
  Entitlements,
  CommunicatorProfile,
  VoiceAnalysisResult,
  AnalysisHistoryItem,
  // FIX: Imported DifficultyLevel to use enum values instead of strings.
  DifficultyLevel,
} from './types';
import {
  onAuthUserChanged,
  logout,
} from './services/authService';
import { databaseService } from './services/databaseService';
import { hasProAccess, getUserEntitlements, purchaseProduct, restorePurchases } from './services/monetizationService';
import { gamificationService, getUnlockedAchievements, ACHIEVEMENTS } from './services/gamificationService';
import { updateCompetenceScores } from './services/competenceService';

import { PreloadingScreen } from './components/PreloadingScreen';
import { LoginScreen } from './components/LoginScreen';
import { Header } from './components/Header';
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
import { Footer } from './components/Footer';
import { ApiKeyErrorScreen } from './components/ApiKeyErrorScreen';
import { StrategicChatTrainerScreen } from './components/StrategicChatTrainerScreen';

import { useToast } from './hooks/useToast';
// FIX: Imported COLORS to resolve reference errors.
import { MODULES, STRATEGIC_CHECKUP_EXERCISES, COLORS } from './constants';

type View =
  | 'home'
  | 'module'
  | 'exercise'
  | 'custom-setup'
  | 'checkup'
  | 'checkup-profile'
  | 'analysis-report'
  | 'voice-analysis-report'
  | 'paywall'
  | 'admin'
  | 'chat-trainer';

const App: React.FC = () => {
  const [isPreloading, setIsPreloading] = useState(true);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [progress, setProgress] = useState<UserProgress | undefined>(undefined);
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const [currentView, setCurrentView] = useState<View>('home');
  const [currentModule, setCurrentModule] = useState<Module | undefined>(undefined);
  const [currentExercise, setCurrentExercise] = useState<Exercise | undefined>(undefined);
  const [lastAnalysis, setLastAnalysis] = useState<{ result: AnalysisResult | VoiceAnalysisResult; userResponse: string; type: 'written' | 'verbal' } | null>(null);

  const { addToast } = useToast();

  const loadUserData = useCallback(async (authUser: UserProfile) => {
    const [userProgress, userEntitlements] = await Promise.all([
      databaseService.getUserProgress(authUser.uid),
      getUserEntitlements(authUser),
    ]);
    setProgress(userProgress || gamificationService.getInitialProgress());
    setEntitlements(userEntitlements);
    setIsLoadingAuth(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthUserChanged((authUser) => {
      setUser(authUser);
      if (authUser) {
        loadUserData(authUser);
      } else {
        setIsLoadingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [loadUserData]);

  const saveProgress = useCallback(async (newProgress: UserProgress) => {
    if (user) {
      setProgress(newProgress);
      await databaseService.saveUserProgress(user.uid, newProgress);
    }
  }, [user]);

  const handleSelectModule = (module: Module) => {
    setCurrentModule(module);
    if (module.isCustom && module.id === 'm6') {
      setCurrentView('custom-setup');
    } else if (module.isCustom && module.id === 'm7') {
      setCurrentView('chat-trainer');
    } else {
      setCurrentView('module');
    }
  };

  const handleSelectExercise = (exercise: Exercise) => {
    setCurrentExercise(exercise);
    setCurrentView('exercise');
  };

  const handleNavigateHome = () => {
    setCurrentView('home');
    setCurrentModule(undefined);
    setCurrentExercise(undefined);
  };
  
  const handleReviewExercise = (exerciseId: string) => {
      if (!progress?.analysisHistory || !progress.analysisHistory[exerciseId]) return;
      const historyItem = progress.analysisHistory[exerciseId];
      // FIX: Correctly flattens module exercises and concatenates checkup exercises to find the target exercise.
      const exercise = [...(MODULES.flatMap(m => m.exercises)), ...STRATEGIC_CHECKUP_EXERCISES].find(e => e.id === exerciseId);
      
      if (exercise) {
        setCurrentExercise(exercise);
        setLastAnalysis({
          result: historyItem.result,
          userResponse: historyItem.userResponse,
          type: historyItem.type,
        });
        setCurrentView(historyItem.type === 'verbal' ? 'voice-analysis-report' : 'analysis-report');
      }
  };

  const handleCompleteExercise = (result: AnalysisResult | VoiceAnalysisResult, userResponse: string, exerciseId: string, type: 'written' | 'verbal') => {
    if (!user || !progress || !currentExercise) return;

    const isRetake = progress.completedExerciseIds.includes(exerciseId);
    const score = 'score' in result ? result.score : (result.scores.reduce((a, b) => a + b.score, 0) / result.scores.length) * 10;
    
    // Gamification & Badges
    const dailyChallenge = STRATEGIC_CHECKUP_EXERCISES[0]; // Simplified daily challenge
    const { updatedProgress: progressAfterGamification, newBadges } = gamificationService.processCompletion(progress, exerciseId, score, isRetake, dailyChallenge.id);

    // Update competences
    const competenceScores = updateCompetenceScores(progressAfterGamification.competenceScores, exerciseId, score);

    // Update analysis history
    const analysisHistory: { [key: string]: AnalysisHistoryItem } = { ...progressAfterGamification.analysisHistory };
    analysisHistory[exerciseId] = { result, userResponse, timestamp: new Date().toISOString(), type };
    
    const newProgress: UserProgress = {
      ...progressAfterGamification,
      competenceScores,
      analysisHistory,
    };
    
    saveProgress(newProgress);

    newBadges.forEach(badge => addToast(`Nuovo traguardo sbloccato!`, 'badge', { title: badge.title, icon: badge.icon }));

    setLastAnalysis({ result, userResponse, type });
    setCurrentView(type === 'verbal' ? 'voice-analysis-report' : 'analysis-report');
  };

  const handleCheckupComplete = (profile: CommunicatorProfile) => {
      if(!progress) return;
      const { newBadges } = gamificationService.processCheckupCompletion(progress);
      const newProgress = { ...progress, checkupProfile: profile };
      saveProgress(newProgress);
      newBadges.forEach(badge => addToast(`Nuovo traguardo sbloccato!`, 'badge', { title: badge.title, icon: badge.icon }));
      setCurrentView('checkup-profile');
  };
  
  const handleStartCustomExercise = (scenario: string, task: string, customObjective?: string) => {
    const customExercise: Exercise = {
      id: `custom_${Date.now()}`,
      title: 'Esercizio Personalizzato',
      scenario,
      task,
      // FIX: Used DifficultyLevel enum instead of string literals to match the type definition.
      difficulty: progress?.checkupProfile ? DifficultyLevel.INTERMEDIO : DifficultyLevel.BASE,
      competence: 'riformulazione',
      customObjective
    };
    handleSelectExercise(customExercise);
  };
  
  const findNextExercise = (): string => {
      if (currentModule && currentExercise) {
          const exerciseIdsInModule = currentModule.exercises.map(e => e.id);
          const currentIndex = exerciseIdsInModule.indexOf(currentExercise.id);
          if (currentIndex !== -1 && currentIndex < exerciseIdsInModule.length - 1) {
              const nextExerciseId = exerciseIdsInModule[currentIndex + 1];
              const nextExercise = currentModule.exercises.find(e => e.id === nextExerciseId);
              if (nextExercise) {
                  return "Prossimo Esercizio";
              }
          }
      }
      return "Torna al Modulo";
  };
  
  const handleNextExercise = () => {
       if (currentModule && currentExercise) {
          const exerciseIdsInModule = currentModule.exercises.map(e => e.id);
          const currentIndex = exerciseIdsInModule.indexOf(currentExercise.id);
          if (currentIndex !== -1 && currentIndex < exerciseIdsInModule.length - 1) {
              const nextExerciseId = exerciseIdsInModule[currentIndex + 1];
              const nextExercise = currentModule.exercises.find(e => e.id === nextExerciseId);
              if (nextExercise) {
                  handleSelectExercise(nextExercise);
                  return;
              }
          }
      }
      setCurrentView('module');
  };

  const handlePurchase = async (product: any) => {
    try {
      const newEntitlements = await purchaseProduct(user, product);
      setEntitlements(newEntitlements);
      addToast(`Grazie! ${product.name} è stato attivato.`, 'success');
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };
  
  const handleRestore = async () => {
    try {
        const restoredEntitlements = await restorePurchases(user);
        setEntitlements(restoredEntitlements);
        addToast("Acquisti ripristinati con successo.", 'success');
    } catch (e: any) {
        addToast(e.message, 'error');
    }
  };

  if (isPreloading) return <PreloadingScreen onComplete={() => setIsPreloading(false)} />;
  if (isLoadingAuth) return <PreloadingScreen onComplete={() => {}} />; // Show preloader during auth check
  if (apiKeyError) return <ApiKeyErrorScreen error={apiKeyError} />;
  if (!user) return <LoginScreen />;

  const dailyChallenge = STRATEGIC_CHECKUP_EXERCISES[new Date().getDate() % STRATEGIC_CHECKUP_EXERCISES.length];
  
  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return <HomeScreen
          user={user}
          progress={progress}
          entitlements={entitlements}
          dailyChallenge={dailyChallenge}
          onSelectModule={handleSelectModule}
          onStartDailyChallenge={(ex) => handleSelectExercise({...ex, title: "Sfida del Giorno"})}
          onStartCheckup={() => setCurrentView('checkup')}
          onStartChatTrainer={() => setCurrentView('chat-trainer')}
          onNavigateToPaywall={() => setCurrentView('paywall')}
          onNavigateToCompetenceReport={() => alert('Competence report coming soon!')}
        />;
      case 'module':
        return currentModule && <ModuleScreen
          module={currentModule}
          moduleColor={COLORS.primary}
          onSelectExercise={(ex) => handleSelectExercise(ex)}
          onReviewExercise={handleReviewExercise}
          onBack={handleNavigateHome}
          completedExerciseIds={progress?.completedExerciseIds || []}
          entitlements={entitlements}
          analysisHistory={progress?.analysisHistory || {}}
        />;
      case 'exercise':
        return currentExercise && <ExerciseScreen
          exercise={currentExercise}
          moduleColor={COLORS.primary}
          onComplete={handleCompleteExercise}
          onBack={() => setCurrentView('module')}
          entitlements={entitlements}
          analysisHistory={progress?.analysisHistory || {}}
          onApiKeyError={setApiKeyError}
        />;
      case 'analysis-report':
        return lastAnalysis && currentExercise && <AnalysisReportScreen
          result={lastAnalysis.result as AnalysisResult}
          exercise={currentExercise}
          userResponse={lastAnalysis.userResponse}
          isReview={progress?.completedExerciseIds.includes(currentExercise.id)}
          onRetry={() => handleSelectExercise(currentExercise)}
          onNextExercise={handleNextExercise}
          nextExerciseLabel={findNextExercise()}
          entitlements={entitlements}
          onNavigateToPaywall={() => setCurrentView('paywall')}
          onPurchase={handlePurchase}
        />;
      case 'voice-analysis-report':
        return lastAnalysis && currentExercise && <VoiceAnalysisReportScreen
          result={lastAnalysis.result as VoiceAnalysisResult}
          exercise={currentExercise}
          userResponse={lastAnalysis.userResponse}
          isReview={progress?.completedExerciseIds.includes(currentExercise.id)}
          onRetry={() => handleSelectExercise(currentExercise)}
          onNextExercise={handleNextExercise}
          nextExerciseLabel={findNextExercise()}
          entitlements={entitlements}
          onNavigateToPaywall={() => setCurrentView('paywall')}
        />;
      case 'custom-setup':
        return currentModule && <CustomSetupScreen
          module={currentModule}
          onStart={handleStartCustomExercise}
          onBack={handleNavigateHome}
          onApiKeyError={setApiKeyError}
        />;
      case 'chat-trainer':
        return currentModule && <StrategicChatTrainerScreen 
            module={currentModule}
            onBack={handleNavigateHome}
            onApiKeyError={setApiKeyError}
        />;
      case 'checkup':
        return <StrategicCheckupScreen
          onComplete={handleCheckupComplete}
          onBack={handleNavigateHome}
          entitlements={entitlements}
          onApiKeyError={setApiKeyError}
        />;
      case 'checkup-profile':
        return <CommunicatorProfileScreen
          profile={progress?.checkupProfile}
          onContinue={handleNavigateHome}
        />;
      case 'paywall':
        return <PaywallScreen
          entitlements={entitlements!}
          onPurchase={handlePurchase}
          onRestore={handleRestore}
          onBack={handleNavigateHome}
        />;
      case 'admin':
        return <AdminScreen onBack={handleNavigateHome} />;
      default:
        return <HomeScreen
          user={user}
          progress={progress}
          entitlements={entitlements}
          dailyChallenge={dailyChallenge}
          onSelectModule={handleSelectModule}
          onStartDailyChallenge={handleSelectExercise}
          onStartCheckup={() => setCurrentView('checkup')}
          onStartChatTrainer={() => setCurrentView('chat-trainer')}
          onNavigateToPaywall={() => setCurrentView('paywall')}
          onNavigateToCompetenceReport={() => alert('Competence report coming soon!')}
        />;
    }
  };

  return (
    <div style={{ backgroundColor: COLORS.base, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        user={user}
        onLogout={logout}
        onNavigateToHome={handleNavigateHome}
        onNavigateToPaywall={() => setCurrentView('paywall')}
        onNavigateToAdmin={() => setCurrentView('admin')}
        entitlements={entitlements}
        currentModule={currentView === 'module' ? currentModule : undefined}
        onNavigateToModule={() => setCurrentView('module')}
      />
      <main style={{ flex: 1 }}>{renderContent()}</main>
      {currentView === 'home' && <Footer />}
    </div>
  );
};

export default App;