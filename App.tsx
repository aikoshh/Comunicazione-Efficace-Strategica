// App.tsx
import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  UserProgress,
  Entitlements,
  Module,
  Exercise,
  AnalysisResult,
  VoiceAnalysisResult,
  CommunicatorProfile,
  AnalysisHistoryItem,
  DifficultyLevel,
} from './types';
import { PreloadingScreen } from './components/PreloadingScreen';
import { LoginScreen } from './components/LoginScreen';
import { HomeScreen } from './components/HomeScreen';
import { ModuleScreen } from './components/ModuleScreen';
import { ExerciseScreen } from './components/ExerciseScreen';
import { AnalysisReportScreen } from './components/AnalysisReportScreen';
import { VoiceAnalysisReportScreen } from './components/VoiceAnalysisReportScreen';
import { CustomSetupScreen } from './components/CustomSetupScreen';
import { StrategicChatTrainerScreen } from './components/StrategicChatTrainerScreen';
import { StrategicCheckupScreen } from './components/StrategicCheckupScreen';
import { CommunicatorProfileScreen } from './components/CommunicatorProfileScreen';
import { PaywallScreen } from './components/PaywallScreen';
import { AdminScreen } from './components/AdminScreen';
import { ApiKeyErrorScreen } from './components/ApiKeyErrorScreen';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { FullScreenLoader } from './components/Loader';
import { AchievementsScreen } from './components/AchievementsScreen';
import { CompetenceReportScreen } from './components/CompetenceReportScreen';

import { onAuthUserChanged, logout } from './services/authService';
import { databaseService } from './services/databaseService';
import { getUserEntitlements, purchaseProduct, restorePurchases } from './services/monetizationService';
import { updateCompetenceScores } from './services/competenceService';
import { gamificationService } from './services/gamificationService';
import { useToast } from './hooks/useToast';
// FIX: Imported COLORS to resolve reference errors.
import { MODULES, STRATEGIC_CHECKUP_EXERCISES, COLORS } from './constants';
import { soundService } from './services/soundService';

type AppView =
  | { name: 'home' }
  | { name: 'module'; module: Module }
  | { name: 'exercise'; exercise: Exercise; module: Module }
  | { name: 'customSetup'; module: Module }
  | { name: 'chatTrainer'; module: Module }
  | { name: 'report'; result: AnalysisResult | VoiceAnalysisResult; exercise: Exercise; userResponse: string; type: 'written' | 'verbal'; isReview?: boolean }
  | { name: 'checkup' }
  | { name: 'profile'; profile: CommunicatorProfile }
  | { name: 'paywall' }
  | { name: 'admin' }
  | { name: 'achievements' }
  | { name: 'competenceReport' };

const App: React.FC = () => {
  const [isPreloading, setIsPreloading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [progress, setProgress] = useState<UserProgress | undefined>(undefined);
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [view, setView] = useState<AppView>({ name: 'home' });
  const { addToast } = useToast();

  const dailyChallenge = STRATEGIC_CHECKUP_EXERCISES[new Date().getDate() % STRATEGIC_CHECKUP_EXERCISES.length];

  useEffect(() => {
    const unsubscribe = onAuthUserChanged(async (userProfile) => {
      setUser(userProfile);
      if (userProfile) {
        const [userProgress, userEntitlements] = await Promise.all([
          databaseService.getUserProgress(userProfile.uid),
          getUserEntitlements(userProfile),
        ]);
        setProgress(userProgress || gamificationService.getInitialProgress());
        setEntitlements(userEntitlements);
      } else {
        setProgress(undefined);
        setEntitlements(null);
        setView({ name: 'home' });
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const saveProgress = async (newProgress: UserProgress) => {
    if (user) {
      setProgress(newProgress);
      await databaseService.saveUserProgress(user.uid, newProgress);
    }
  };

  const handleApiKeyError = (error: string) => {
    setApiKeyError(error);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setView({ name: 'home' });
  };

  const handleSelectModule = (module: Module) => {
    soundService.playClick();
    if (module.isCustom) {
      if (module.id === 'm6') {
        setView({ name: 'customSetup', module });
      } else if (module.id === 'm7') {
        setView({ name: 'chatTrainer', module });
      }
    } else {
      setView({ name: 'module', module });
    }
  };

  const handleSelectExercise = (exercise: Exercise, module: Module) => {
    soundService.playClick();
    setView({ name: 'exercise', exercise, module });
  };
  
  const handleReviewExercise = (exerciseId: string) => {
      if (!progress?.analysisHistory[exerciseId]) return;
      const allExercises = MODULES.flatMap(m => m.exercises);
      const exercise = allExercises.find(e => e.id === exerciseId);
      if (!exercise) return;
      
      const { result, userResponse, type } = progress.analysisHistory[exerciseId];
      soundService.playClick();
      setView({ name: 'report', result, exercise, userResponse, type, isReview: true });
  };

  const handleCompleteExercise = async (result: AnalysisResult | VoiceAnalysisResult, userResponse: string, exerciseId: string, type: 'written' | 'verbal') => {
    if (!progress || !user) return;
    
    const isRetake = progress.completedExerciseIds.includes(exerciseId);
    
    let score = 0;
    if ('score' in result) { // AnalysisResult
      score = result.score;
    } else if ('scores' in result) { // VoiceAnalysisResult
      score = Math.round(result.scores.reduce((acc, s) => acc + s.score, 0) / result.scores.length * 10);
    }

    const { updatedProgress: progressAfterGamification, newBadges } = gamificationService.processCompletion(progress, exerciseId, score, isRetake, dailyChallenge.id);

    const newScores = updateCompetenceScores(progressAfterGamification.competenceScores, exerciseId, score);
    
    const newHistoryItem: AnalysisHistoryItem = { result, userResponse, timestamp: new Date().toISOString(), type };

    const finalProgress: UserProgress = {
      ...progressAfterGamification,
      competenceScores: newScores,
      analysisHistory: {
        ...progressAfterGamification.analysisHistory,
        [exerciseId]: newHistoryItem,
      },
    };
    
    await saveProgress(finalProgress);

    newBadges.forEach(badge => {
        addToast(`Traguardo sbloccato!`, 'badge', { title: badge.title, icon: badge.icon });
    });

    const exercise = view.name === 'exercise' && view.exercise.id === exerciseId
        ? view.exercise
        : MODULES.flatMap(m => m.exercises).find(e => e.id === exerciseId);
        
    if (exercise) {
      setView({ name: 'report', result, exercise, userResponse, type });
    }
  };

  const handleCompleteCheckup = async (profile: CommunicatorProfile) => {
    if (!progress || !user) return;

    const { newBadges } = gamificationService.processCheckupCompletion(progress);

    const finalProgress: UserProgress = {
        ...progress,
        checkupProfile: profile,
    };
    await saveProgress(finalProgress);

    newBadges.forEach(badge => {
        addToast(`Traguardo sbloccato!`, 'badge', { title: badge.title, icon: badge.icon });
    });

    setView({ name: 'profile', profile });
  };
  
  const handlePurchase = async (product: any) => {
    if (!user) return;
    try {
      const newEntitlements = await purchaseProduct(user, product);
      setEntitlements(newEntitlements);
      addToast(`Acquisto di ${product.name} completato!`, 'success');
      setView({ name: 'home' });
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };
  
  const handleRestore = async () => {
    if (!user) return;
    try {
      const restoredEntitlements = await restorePurchases(user);
      setEntitlements(restoredEntitlements);
      addToast('Acquisti ripristinati con successo.', 'success');
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };

  const findNextExercise = (currentExerciseId: string) => {
    const allExercises = MODULES.flatMap(m => m.exercises);
    const currentIndex = allExercises.findIndex(e => e.id === currentExerciseId);
    if (currentIndex > -1 && currentIndex < allExercises.length - 1) {
        return allExercises[currentIndex + 1];
    }
    return null;
  };

  const renderContent = () => {
    if (!user) return <LoginScreen />;

    switch (view.name) {
      case 'home':
        return <HomeScreen
            user={user}
            progress={progress}
            entitlements={entitlements}
            dailyChallenge={dailyChallenge}
            onSelectModule={handleSelectModule}
            onStartDailyChallenge={(exercise) => handleSelectExercise(exercise, MODULES.find(m => m.exercises.some(e => e.id === exercise.id))!)}
            onStartCheckup={() => setView({ name: 'checkup' })}
            onStartChatTrainer={() => handleSelectModule(MODULES.find(m => m.id === 'm7')!)}
            onNavigateToPaywall={() => setView({ name: 'paywall' })}
            onNavigateToCompetenceReport={() => setView({ name: 'competenceReport' })}
        />;
      case 'module':
        return <ModuleScreen
            module={view.module}
            moduleColor={COLORS.primary}
            onSelectExercise={(exercise) => handleSelectExercise(exercise, view.module)}
            onReviewExercise={handleReviewExercise}
            onBack={() => setView({ name: 'home' })}
            completedExerciseIds={progress?.completedExerciseIds || []}
            entitlements={entitlements}
            analysisHistory={progress?.analysisHistory || {}}
         />;
      case 'exercise':
        return <ExerciseScreen
            exercise={view.exercise}
            moduleColor={COLORS.primary}
            onComplete={handleCompleteExercise}
            onBack={() => setView({ name: 'module', module: view.module })}
            entitlements={entitlements}
            analysisHistory={progress?.analysisHistory || {}}
            onApiKeyError={handleApiKeyError}
        />;
      case 'report':
        const nextExercise = findNextExercise(view.exercise.id);
        const moduleForExercise = MODULES.find(m => m.exercises.some(e => e.id === view.exercise.id))!;
        if (view.type === 'verbal') {
            return <VoiceAnalysisReportScreen
                result={view.result as VoiceAnalysisResult}
                exercise={view.exercise}
                onRetry={() => handleSelectExercise(view.exercise, moduleForExercise)}
                onNextExercise={() => {
                    if (view.isReview || !nextExercise) { setView({ name: 'home' }); } 
                    else { handleSelectExercise(nextExercise, MODULES.find(m => m.exercises.some(e => e.id === nextExercise.id))!); }
                }}
                nextExerciseLabel={view.isReview ? "Torna alla Home" : (nextExercise ? "Prossimo Esercizio" : "Torna alla Home")}
                entitlements={entitlements}
                onNavigateToPaywall={() => setView({ name: 'paywall' })}
                userResponse={view.userResponse}
                isReview={view.isReview}
            />
        }
        return <AnalysisReportScreen
            result={view.result as AnalysisResult}
            exercise={view.exercise}
            onRetry={() => handleSelectExercise(view.exercise, moduleForExercise)}
            onNextExercise={() => {
                if (view.isReview || !nextExercise) { setView({ name: 'home' }); }
                else { handleSelectExercise(nextExercise, MODULES.find(m => m.exercises.some(e => e.id === nextExercise.id))!); }
            }}
            nextExerciseLabel={view.isReview ? "Torna alla Home" : (nextExercise ? "Prossimo Esercizio" : "Torna alla Home")}
            entitlements={entitlements}
            onNavigateToPaywall={() => setView({ name: 'paywall' })}
            onPurchase={handlePurchase}
            userResponse={view.userResponse}
            isReview={view.isReview}
        />;
      case 'customSetup':
        return <CustomSetupScreen
            module={view.module}
            onStart={(scenario, task) => {
                // FIX: Used DifficultyLevel enum instead of magic string.
                const customExercise: Exercise = { id: `custom_${Date.now()}`, title: 'Esercizio Personalizzato', scenario, task, difficulty: DifficultyLevel.BASE, competence: 'riformulazione' };
                handleSelectExercise(customExercise, view.module);
            }}
            onBack={() => setView({ name: 'home' })}
            onApiKeyError={handleApiKeyError}
        />;
      case 'chatTrainer':
          return <StrategicChatTrainerScreen module={view.module} onBack={() => setView({ name: 'home' })} onApiKeyError={handleApiKeyError} />
      case 'checkup':
          return <StrategicCheckupScreen onComplete={handleCompleteCheckup} onBack={() => setView({ name: 'home' })} entitlements={entitlements} onApiKeyError={handleApiKeyError} />
      case 'profile':
          return <CommunicatorProfileScreen profile={view.profile} onContinue={() => setView({ name: 'home' })} />
      case 'paywall':
          return <PaywallScreen entitlements={entitlements!} onPurchase={handlePurchase} onRestore={handleRestore} onBack={() => setView({ name: 'home' })} />
      case 'admin':
          return <AdminScreen onBack={() => setView({ name: 'home' })} />
      case 'achievements':
          return <AchievementsScreen progress={progress!} onBack={() => setView({ name: 'home' })} />
      case 'competenceReport':
          return <CompetenceReportScreen 
            userProgress={progress!} 
            onBack={() => setView({ name: 'home' })} 
            onSelectExercise={(ex) => handleSelectExercise(ex, MODULES.find(m => m.exercises.some(e => e.id === ex.id))!)}
          />
      default:
        return <HomeScreen
            user={user}
            progress={progress}
            entitlements={entitlements}
            dailyChallenge={dailyChallenge}
            onSelectModule={handleSelectModule}
            onStartDailyChallenge={(exercise) => handleSelectExercise(exercise, MODULES.find(m => m.exercises.some(e => e.id === exercise.id))!)}
            onStartCheckup={() => setView({ name: 'checkup' })}
            onStartChatTrainer={() => handleSelectModule(MODULES.find(m => m.id === 'm7')!)}
            onNavigateToPaywall={() => setView({ name: 'paywall' })}
            onNavigateToCompetenceReport={() => setView({ name: 'competenceReport' })}
        />;
    }
  };

  if (isPreloading) {
    return <PreloadingScreen onComplete={() => setIsPreloading(false)} />;
  }

  if (apiKeyError) {
    return <ApiKeyErrorScreen error={apiKeyError} />;
  }
  
  if (isLoading) {
    return <FullScreenLoader />;
  }
  
  const isLoginScreen = !user;
  const currentModule = view.name === 'module' || view.name === 'exercise' || view.name === 'customSetup' || view.name === 'chatTrainer' ? view.module : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#F8F7F4' }}>
      {!isLoginScreen && (
        <Header
          user={user}
          onLogout={handleLogout}
          onNavigateToHome={() => setView({ name: 'home' })}
          onNavigateToPaywall={() => setView({ name: 'paywall' })}
          onNavigateToAdmin={() => setView({ name: 'admin' })}
          entitlements={entitlements}
          currentModule={currentModule}
          onNavigateToModule={() => currentModule && setView({ name: 'module', module: currentModule })}
        />
      )}
      <main style={{ flex: 1 }}>
        {renderContent()}
      </main>
      {!isLoginScreen && <Footer />}
    </div>
  );
};

export default App;