// App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { onAuthUserChanged, logout } from './services/authService';
import { databaseService } from './services/databaseService';
import { getUserEntitlements, purchaseProduct, restorePurchases } from './services/monetizationService';
import { competenceService } from './services/competenceService';
import { gamificationService } from './services/gamificationService';
import { LoginScreen } from './components/LoginScreen';
import { PreloadingScreen } from './components/PreloadingScreen';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeScreen } from './components/HomeScreen';
import { ModuleScreen } from './components/ModuleScreen';
import { ExerciseScreen } from './components/ExerciseScreen';
import { AnalysisReportScreen } from './components/AnalysisReportScreen';
import { VoiceAnalysisReportScreen } from './components/VoiceAnalysisReportScreen';
import { CustomSetupScreen } from './components/CustomSetupScreen';
import { StrategicChatTrainerScreen } from './components/StrategicChatTrainerScreen';
import { StrategicCheckupScreen } from './components/StrategicCheckupScreen';
import { CommunicatorProfileScreen } from './components/CommunicatorProfileScreen';
import { ApiKeyErrorScreen } from './components/ApiKeyErrorScreen';
import { PaywallScreen } from './components/PaywallScreen';
import { AdminScreen } from './components/AdminScreen';
import { AchievementsScreen } from './components/AchievementsScreen';
import { CompetenceReportScreen } from './components/CompetenceReportScreen';
import { LevelsScreen } from './components/LevelsScreen';
import { DailyChallengeScreen } from './components/DailyChallengeScreen';
import { FullScreenLoader } from './components/Loader';
import { useToast } from './hooks/useToast';
import { soundService } from './services/soundService';
import { hasProAccess } from './services/monetizationService';
import {
  UserProfile,
  UserProgress,
  Entitlements,
  Module,
  Exercise,
  AnalysisResult,
  VoiceAnalysisResult,
  CommunicatorProfile,
  Product,
  AnalysisHistoryItem,
} from './types';
import { MODULES } from './constants';

type Screen = 
  | 'home'
  | 'module'
  | 'custom_setup'
  | 'chat_trainer'
  | 'exercise'
  | 'analysis_report'
  | 'checkup'
  | 'checkup_profile'
  | 'daily_challenge'
  | 'paywall'
  | 'admin'
  | 'achievements'
  | 'competence_report'
  | 'levels';

const App: React.FC = () => {
  // --- STATE ---
  const [user, setUser] = useState<UserProfile | null>(null);
  const [progress, setProgress] = useState<UserProgress | undefined>(undefined);
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isPreloading, setIsPreloading] = useState(true);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const [screen, setScreen] = useState<Screen>('home');
  const [screenStack, setScreenStack] = useState<Screen[]>([]);
  
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | VoiceAnalysisResult | null>(null);
  const [lastUserResponse, setLastUserResponse] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  const { addToast } = useToast();

  // --- EFFECTS ---

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthUserChanged(async (authUser) => {
      setUser(authUser);
      if (authUser) {
        setIsLoading(true);
        try {
          const [userProgress, userEntitlements] = await Promise.all([
            databaseService.getUserProgress(authUser.uid),
            getUserEntitlements(authUser),
          ]);
          setProgress(userProgress || gamificationService.getInitialProgress());
          setEntitlements(userEntitlements);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setProgress(gamificationService.getInitialProgress());
          setEntitlements(null);
        }
      } else {
        // Reset state on logout
        setProgress(undefined);
        setEntitlements(null);
        setScreen('home');
        setCurrentModule(null);
        setCurrentExercise(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- NAVIGATION ---

  const navigate = (newScreen: Screen) => {
    setScreenStack(prev => [...prev, screen]);
    setScreen(newScreen);
  };
  
  const goBack = () => {
    const prevScreen = screenStack.pop();
    if (prevScreen) {
      setScreen(prevScreen);
      setScreenStack([...screenStack]);
    } else {
      setScreen('home');
    }
    if (screen === 'exercise' || screen === 'analysis_report') {
        setCurrentExercise(null);
    }
    if(screen === 'module') {
        setCurrentModule(null);
    }
  };

  // --- DATA UPDATES ---

  const updateProgress = useCallback((newProgress: UserProgress) => {
    setProgress(newProgress);
    if (user) {
      databaseService.saveUserProgress(user.uid, newProgress);
    }
  }, [user]);
  
  // --- HANDLERS ---
  
  const handleSelectModule = (module: Module) => {
    soundService.playClick();
    if (module.id === 'm6') { // Custom Training
      navigate('custom_setup');
    } else if (module.id === 'm7') { // Chat Trainer
      navigate('chat_trainer');
    } else {
      setCurrentModule(module);
      navigate('module');
    }
  };

  const handleSelectExercise = (exercise: Exercise) => {
    soundService.playClick();
    setCurrentExercise(exercise);
    setIsReviewing(false);
    navigate('exercise');
  };
  
  const handleReviewExercise = (exerciseId: string) => {
    if (!progress?.analysisHistory[exerciseId]) return;
    
    soundService.playClick();
    const allExercises = MODULES.flatMap(m => m.exercises);
    const exercise = allExercises.find(e => e.id === exerciseId);
    const historyItem = progress.analysisHistory[exerciseId];
    
    if (exercise && historyItem) {
        setCurrentExercise(exercise);
        setAnalysisResult(historyItem.result);
        setLastUserResponse(historyItem.userResponse);
        setIsReviewing(true);
        navigate('analysis_report');
    }
  };

  const handleCompleteExercise = (result: AnalysisResult | VoiceAnalysisResult, userResponse: string, exerciseId: string, type: 'written' | 'verbal') => {
    const isRetake = !!progress?.analysisHistory[exerciseId];
    const score = 'score' in result ? result.score : (result.scores.reduce((a, b) => a + b.score, 0) / result.scores.length) * 10;
    
    const newHistoryItem: AnalysisHistoryItem = {
      timestamp: new Date().toISOString(),
      result,
      userResponse,
      type
    };

    const { updatedProgress, newBadges, levelUp } = gamificationService.processCompletion(
      progress!,
      exerciseId,
      score,
      isRetake,
      '' // dailyChallengeId if applicable
    );
    
    const newCompetenceScores = competenceService.updateCompetenceScores(
        updatedProgress.competenceScores,
        exerciseId,
        score
    );

    updateProgress({
        ...updatedProgress,
        competenceScores: newCompetenceScores,
        analysisHistory: {
            ...updatedProgress.analysisHistory,
            [exerciseId]: newHistoryItem,
        }
    });

    setAnalysisResult(result);
    setLastUserResponse(userResponse);
    navigate('analysis_report');

    // Show notifications
    newBadges.forEach(badge => addToast(`Traguardo Sbloccato: ${badge.title}`, 'badge', badge));
    if (levelUp) addToast(`Congratulazioni! Hai raggiunto il livello: ${levelUp.label}`, 'success');
  };

  const handleCompleteCheckup = (profile: CommunicatorProfile) => {
    const { newBadges } = gamificationService.processCheckupCompletion(progress!);
    
    updateProgress({ ...progress!, checkupProfile: profile });
    setAnalysisResult(profile as any); // A bit of a hack to reuse state
    navigate('checkup_profile');
    newBadges.forEach(badge => addToast(`Traguardo Sbloccato: ${badge.title}`, 'badge', badge));
  };

  const handleCustomExerciseStart = (scenario: string, task: string) => {
    const customExercise: Exercise = {
      id: `custom-${Date.now()}`,
      title: 'Allenamento Personalizzato',
      scenario,
      task,
      difficulty: 'Medio',
      competence: 'riformulazione', // Default competence
    };
    setCurrentModule(MODULES.find(m => m.id === 'm6')!);
    handleSelectExercise(customExercise);
  };
  
  const handleNextExercise = () => {
      soundService.playClick();
      setAnalysisResult(null);
      setCurrentExercise(null);
      
      if(isReviewing) {
        goBack(); // Go back to where you were
        setIsReviewing(false);
        return;
      }
      
      // Logic to find the next exercise in the module
      if(currentModule && currentExercise) {
          const exerciseIndex = currentModule.exercises.findIndex(e => e.id === currentExercise.id);
          if (exerciseIndex > -1 && exerciseIndex < currentModule.exercises.length - 1) {
              handleSelectExercise(currentModule.exercises[exerciseIndex + 1]);
          } else {
              setScreen('home'); // End of module, go home
          }
      } else {
         setScreen('home'); // No context, go home
      }
  };

  const handlePurchase = async (product: Product) => {
    if (!user) {
      addToast('Devi essere loggato per acquistare.', 'error');
      return;
    }
    try {
      const newEntitlements = await purchaseProduct(user, product);
      setEntitlements(newEntitlements);
      addToast(`Grazie per aver acquistato ${product.name}!`, 'success');
      goBack(); // Go back from paywall
    } catch (e: any) {
      addToast(e.message || 'Errore durante l\'acquisto.', 'error');
    }
  };
  
  const handleRestore = async () => {
      if (!user) return;
      try {
        const restoredEntitlements = await restorePurchases(user);
        setEntitlements(restoredEntitlements);
        addToast('Acquisti ripristinati con successo.', 'success');
      } catch (e: any) {
          addToast(e.message || 'Errore durante il ripristino.', 'error');
      }
  };


  // --- RENDER LOGIC ---

  if (apiKeyError) {
    return <ApiKeyErrorScreen error={apiKeyError} />;
  }

  if (isLoading) {
    return <FullScreenLoader />;
  }
  
  if (!user) {
    return <LoginScreen />;
  }

  if (isPreloading) {
    return <PreloadingScreen onComplete={() => setIsPreloading(false)} />;
  }

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return <HomeScreen 
            user={user} 
            progress={progress} 
            onSelectModule={handleSelectModule} 
            onStartCheckup={() => navigate('checkup')}
            onNavigateToReport={() => navigate('competence_report')}
            onStartDailyChallenge={() => navigate('daily_challenge')}
            entitlements={entitlements}
            onNavigate={(s) => navigate(s as Screen)}
        />;
      case 'module':
        return <ModuleScreen
            module={currentModule!}
            moduleColor={currentModule!.color}
            onSelectExercise={handleSelectExercise}
            onReviewExercise={handleReviewExercise}
            completedExerciseIds={progress?.completedExerciseIds || []}
            entitlements={entitlements}
            analysisHistory={progress?.analysisHistory || {}}
        />
      case 'exercise':
        return <ExerciseScreen 
            exercise={currentExercise!} 
            moduleColor={currentModule?.color || '#1C3E5E'}
            onComplete={(res, uRes, eId, type) => handleCompleteExercise(res, uRes, eId, type)}
            entitlements={entitlements}
            analysisHistory={progress?.analysisHistory || {}}
            onApiKeyError={setApiKeyError}
        />
      case 'analysis_report':
        const nextExerciseLabel = isReviewing ? "Torna Indietro" : (currentModule?.exercises.some(e => e.id === currentExercise?.id) && currentModule?.exercises.findIndex(e => e.id === currentExercise?.id) !== currentModule.exercises.length - 1 ? "Prossimo Esercizio" : "Torna alla Home");
        if (analysisResult && ('scores' in analysisResult)) { // VoiceAnalysisResult
            return <VoiceAnalysisReportScreen result={analysisResult} exercise={currentExercise!} onRetry={() => navigate('exercise')} onNextExercise={handleNextExercise} nextExerciseLabel={nextExerciseLabel} entitlements={entitlements} onNavigateToPaywall={() => navigate('paywall')} userResponse={lastUserResponse} isReview={isReviewing} />;
        }
        if (analysisResult && ('score' in analysisResult)) { // AnalysisResult
            return <AnalysisReportScreen result={analysisResult} exercise={currentExercise!} onRetry={() => navigate('exercise')} onNextExercise={handleNextExercise} nextExerciseLabel={nextExerciseLabel} entitlements={entitlements} onNavigateToPaywall={() => navigate('paywall')} onPurchase={handlePurchase} userResponse={lastUserResponse} isReview={isReviewing} />;
        }
        return null;
      case 'custom_setup':
        return <CustomSetupScreen module={MODULES.find(m => m.id === 'm6')!} onStart={handleCustomExerciseStart} onBack={goBack} onApiKeyError={setApiKeyError} />;
      case 'chat_trainer':
        return <StrategicChatTrainerScreen user={user} isPro={hasProAccess(entitlements)} onApiKeyError={setApiKeyError} />;
      case 'checkup':
        return <StrategicCheckupScreen onComplete={handleCompleteCheckup} entitlements={entitlements} onApiKeyError={setApiKeyError} />;
      case 'checkup_profile':
        return <CommunicatorProfileScreen profile={progress?.checkupProfile} onContinue={() => setScreen('home')} />;
      case 'daily_challenge':
        return <DailyChallengeScreen onComplete={(res, uRes, eId) => handleCompleteExercise(res, uRes, eId, 'written')} entitlements={entitlements} analysisHistory={progress?.analysisHistory || {}} onApiKeyError={setApiKeyError} onBack={goBack} />;
      case 'paywall':
        return <PaywallScreen entitlements={entitlements!} onPurchase={handlePurchase} onRestore={handleRestore} onBack={goBack} />;
      case 'admin':
        return user.isAdmin ? <AdminScreen /> : <p>Accesso negato.</p>;
      case 'achievements':
        return <AchievementsScreen progress={progress!} />;
      case 'competence_report':
        return <CompetenceReportScreen userProgress={progress!} onBack={goBack} onSelectExercise={handleSelectExercise} />;
      case 'levels':
        return <LevelsScreen />;
      default:
        return <div>Schermata non trovata</div>;
    }
  };

  return (
    <div style={{ paddingTop: '64px', minHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <Header 
        user={user} 
        onLogout={logout} 
        onNavigate={(s) => {
            if (s === 'module' && currentModule) {
                navigate('module');
            } else {
                navigate(s as Screen);
            }
        }}
        showBack={screen !== 'home'}
        onBack={goBack}
        currentModule={currentModule}
      />
      <main style={{flex: 1}}>
        {renderScreen()}
      </main>
      {screen === 'home' && <Footer />}
    </div>
  );
};

export default App;
