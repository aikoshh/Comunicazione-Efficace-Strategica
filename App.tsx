// App.tsx
import React, { useState, useEffect, useCallback } from 'react';
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
  Product,
  ExerciseType,
} from './types';
import { LoginScreen } from './components/LoginScreen';
import { HomeScreen } from './components/HomeScreen';
import { ModuleScreen } from './components/ModuleScreen';
import { ExerciseScreen } from './components/ExerciseScreen';
import { CustomSetupScreen } from './components/CustomSetupScreen';
import { AnalysisReportScreen } from './components/AnalysisReportScreen';
import { VoiceAnalysisReportScreen } from './components/VoiceAnalysisReportScreen';
import { StrategicCheckupScreen } from './components/StrategicCheckupScreen';
import { CommunicatorProfileScreen } from './components/CommunicatorProfileScreen';
import { AdminScreen } from './components/AdminScreen';
import { PaywallScreen } from './components/PaywallScreen';
import { DailyChallengeScreen } from './components/DailyChallengeScreen';
import { CompetenceReportScreen } from './components/CompetenceReportScreen';
import { AchievementsScreen } from './components/AchievementsScreen';
import { LevelsScreen } from './components/LevelsScreen';
import { StrategicChatTrainerScreen } from './components/StrategicChatTrainerScreen';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { FullScreenLoader } from './components/Loader';
import { ApiKeyErrorScreen } from './components/ApiKeyErrorScreen';
import { ReportProblemModal } from './components/ReportProblemModal';
import { PreloadingScreen } from './components/PreloadingScreen';

import { logout, databaseService } from './services/firebase';
import { getUserEntitlements, restorePurchases, hasProAccess } from './services/monetizationService';
import { competenceService } from './services/competenceService';
import { gamificationService } from './services/gamificationService';
import { MODULES } from './constants';
import { useToast } from './hooks/useToast';

interface AppProps {
  initialUser: UserProfile | null;
}

const App: React.FC<AppProps> = ({ initialUser }) => {
  const [user, setUser] = useState<UserProfile | null>(initialUser);
  const [progress, setProgress] = useState<UserProgress | undefined>(undefined);
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  
  const [lastAnalysis, setLastAnalysis] = useState<{result: AnalysisResult | VoiceAnalysisResult, userResponse: string, exercise: Exercise, type: 'written' | 'verbal', isReview: boolean} | null>(null);
  const [communicatorProfile, setCommunicatorProfile] = useState<CommunicatorProfile | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isPreloading, setIsPreloading] = useState(true);
  const [isApiKeyError, setIsApiKeyError] = useState(false);
  const [apiKeyErrorMessage, setApiKeyErrorMessage] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const { addToast } = useToast();

  // State persistence: Save state to localStorage
  useEffect(() => {
    if (user) {
      // Whitelist of screens that are safe to persist and return to.
      const safeScreens = ['home', 'module', 'admin', 'paywall', 'competence_report', 'achievements', 'levels', 'daily_challenge', 'chat_trainer'];
      if (safeScreens.includes(currentScreen)) {
        const stateToSave = {
          userId: user.uid,
          currentScreen,
          selectedModuleId: selectedModule?.id,
        };
        localStorage.setItem('ces_coach_app_state', JSON.stringify(stateToSave));
      }
    }
  }, [user, currentScreen, selectedModule]);

  useEffect(() => {
    setUser(initialUser);
    if (initialUser) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const [userProgress, userEntitlements] = await Promise.all([
            databaseService.getUserProgress(initialUser.uid),
            getUserEntitlements(initialUser),
          ]);
          setProgress(userProgress || gamificationService.getInitialProgress());
          setEntitlements(userEntitlements);
          
          // State persistence: Try to restore state after data is loaded
          try {
            const savedStateString = localStorage.getItem('ces_coach_app_state');
            if (savedStateString) {
              const savedState = JSON.parse(savedStateString);
              if (savedState && savedState.userId === initialUser.uid && savedState.currentScreen) {
                if (savedState.currentScreen === 'module' && savedState.selectedModuleId) {
                  const moduleToRestore = MODULES.find(m => m.id === savedState.selectedModuleId);
                  if (moduleToRestore) {
                    setSelectedModule(moduleToRestore);
                    setCurrentScreen('module');
                  }
                } else {
                  // For other safe screens that don't depend on a module
                  const safeScreens = ['home', 'admin', 'paywall', 'competence_report', 'achievements', 'levels', 'daily_challenge', 'chat_trainer'];
                  if (safeScreens.includes(savedState.currentScreen)) {
                    setCurrentScreen(savedState.currentScreen);
                  }
                }
              }
            }
          } catch (e) {
            console.warn("Failed to restore app state:", e);
            localStorage.removeItem('ces_coach_app_state');
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error);
          addToast("Impossibile caricare i dati utente.", 'error');
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [initialUser, addToast]);

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem('ces_coach_app_state');
    setUser(null);
    setProgress(undefined);
    setEntitlements(null);
    setCurrentScreen('home');
  };
  
  const handleNavigate = (screen: string) => {
    setLastAnalysis(null);
    setCurrentScreen(screen);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    if (lastAnalysis) {
        setLastAnalysis(null);
    }
    
    if (currentScreen === 'module' || currentScreen === 'paywall' || currentScreen === 'competence_report' || currentScreen === 'achievements' || currentScreen === 'levels' || currentScreen === 'daily_challenge' || currentScreen === 'chat_trainer' || currentScreen === 'admin') {
        setCurrentScreen('home');
    } else if (currentScreen === 'exercise') {
        setCurrentScreen(selectedModule?.isCustom ? 'home' : 'module');
    } else if (currentScreen === 'custom_setup') {
        setCurrentScreen('home');
    } else if (currentScreen === 'report' || currentScreen === 'voice_report') {
        setCurrentScreen('exercise');
    }
    window.scrollTo(0, 0);
  };
  
  const handleSelectModule = (module: Module) => {
    setSelectedModule(module);
    if (module.isCustom) {
      if (module.id === 'm6') {
        setCurrentScreen('custom_setup');
      } else if (module.id === 'm7') {
        setCurrentScreen('chat_trainer');
      }
    } else {
      setCurrentScreen('module');
    }
  };

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setCurrentScreen('exercise');
  };

  const handleRetryExercise = (exercise: Exercise) => {
    setLastAnalysis(null); // Pulisce l'analisi precedente
    handleSelectExercise(exercise); // Torna alla schermata dell'esercizio
  };
  
  const handleReviewExercise = (exerciseId: string) => {
    if (!progress?.analysisHistory[exerciseId]) return;
    const historyItem = progress.analysisHistory[exerciseId];
    const exercise = MODULES.flatMap(m => m.exercises).find(e => e.id === exerciseId);
    if (!exercise) return;
    
    setLastAnalysis({
      result: historyItem.result,
      userResponse: historyItem.userResponse,
      exercise: exercise,
      type: historyItem.type,
      isReview: true
    });
    
    setCurrentScreen(historyItem.type === 'verbal' ? 'voice_report' : 'report');
  };

  const handleRestore = async () => {
      if(!user) return;
      try {
          const restoredEntitlements = await restorePurchases(user);
          setEntitlements(restoredEntitlements);
          addToast("Acquisti ripristinati.", 'success');
      } catch (error: any) {
          addToast(error.message || "Errore durante il ripristino.", 'error');
      }
  };
  
  const handleApiKeyError = (message: string) => {
    setApiKeyErrorMessage(message);
    setIsApiKeyError(true);
  };
  
  const handleExerciseComplete = useCallback(async (
    result: AnalysisResult | VoiceAnalysisResult,
    userResponse: string,
    exercise: Exercise,
    type: 'written' | 'verbal'
  ) => {
    if (!user || !progress) return;

    let score: number;
    if (type === 'verbal') {
        const voiceResult = result as VoiceAnalysisResult;
        score = Math.round(voiceResult.scores.reduce((acc, s) => acc + s.score, 0) / voiceResult.scores.length * 10);
    } else {
        score = (result as AnalysisResult).score;
    }
    
    const exerciseId = exercise.id;
    const isRetake = progress.completedExerciseIds.includes(exerciseId);
    const updatedProgress = { ...progress };
    updatedProgress.scores = [...(updatedProgress.scores || []), score];
    if (!isRetake) {
        updatedProgress.completedExerciseIds = [...new Set([...(updatedProgress.completedExerciseIds || []), exerciseId])];
    }
    updatedProgress.competenceScores = competenceService.updateCompetenceScores(updatedProgress.competenceScores, exerciseId, score);
    
    const newHistoryItem: AnalysisHistoryItem = {
        timestamp: new Date().toISOString(),
        result,
        userResponse,
        type
    };
    updatedProgress.analysisHistory = { ...updatedProgress.analysisHistory, [exerciseId]: newHistoryItem };
    
    const { newBadges } = gamificationService.processCompletion(progress, exerciseId, score, isRetake, '');
    newBadges.forEach(badge => addToast(`Traguardo sbloccato: ${badge.title}`, 'badge', badge));
    
    setProgress(updatedProgress);
    await databaseService.saveUserProgress(user.uid, updatedProgress);
    
    if(exercise) {
      setLastAnalysis({ result, userResponse, exercise, type, isReview: false });
      setCurrentScreen(type === 'verbal' ? 'voice_report' : 'report');
    }
  }, [user, progress, addToast]);
  
  const handleCheckupComplete = useCallback(async (profile: CommunicatorProfile) => {
      if(!user || !progress) return;

      const { newBadges } = gamificationService.processCheckupCompletion(progress);
      newBadges.forEach(badge => addToast(`Traguardo sbloccato: ${badge.title}`, 'badge', badge));

      const updatedProgress = { ...progress, checkupProfile: profile };
      setProgress(updatedProgress);
      await databaseService.saveUserProgress(user.uid, updatedProgress);

      setCommunicatorProfile(profile);
      setCurrentScreen('profile_results');
  }, [user, progress, addToast]);
  
  const findNextExercise = (): { label: string; action: () => void } => {
    if (!selectedModule || !selectedExercise || selectedModule.isCustom) {
        return { label: 'Torna alla Home', action: () => handleNavigate('home') };
    }
    const currentModuleExercises = selectedModule.exercises;
    const currentIndex = currentModuleExercises.findIndex(ex => ex.id === selectedExercise.id);
    if (currentIndex > -1 && currentIndex < currentModuleExercises.length - 1) {
        return { label: 'Prossimo Esercizio', action: () => handleSelectExercise(currentModuleExercises[currentIndex + 1]) };
    }
    return { label: `Torna a "${selectedModule.title}"`, action: () => setCurrentScreen('module') };
  };

  if (isPreloading) {
      return <PreloadingScreen onComplete={() => setIsPreloading(false)} />;
  }
  
  if (isApiKeyError) {
      return <ApiKeyErrorScreen error={apiKeyErrorMessage} />;
  }

  if (isLoading) {
    return <FullScreenLoader estimatedTime={2} />;
  }

  if (!user) {
    return <LoginScreen />;
  }
  
  const renderScreen = () => {
    if (lastAnalysis && (currentScreen === 'report' || currentScreen === 'voice_report')) {
        const { label, action } = findNextExercise();
        if (lastAnalysis.type === 'verbal') {
            return <VoiceAnalysisReportScreen 
                        result={lastAnalysis.result as VoiceAnalysisResult}
                        exercise={lastAnalysis.exercise}
                        onRetry={() => handleRetryExercise(lastAnalysis.exercise)}
                        onNextExercise={action}
                        nextExerciseLabel={label}
                        entitlements={entitlements}
                        onNavigateToPaywall={() => handleNavigate('paywall')}
                        userResponse={lastAnalysis.userResponse}
                        isReview={lastAnalysis.isReview}
                    />
        }
        return <AnalysisReportScreen 
                    result={lastAnalysis.result as AnalysisResult}
                    exercise={lastAnalysis.exercise}
                    onRetry={() => handleRetryExercise(lastAnalysis.exercise)}
                    onNextExercise={action}
                    nextExerciseLabel={label}
                    entitlements={entitlements}
                    onNavigateToPaywall={() => handleNavigate('paywall')}
                    userResponse={lastAnalysis.userResponse}
                    isReview={lastAnalysis.isReview}
                />
    }

    switch (currentScreen) {
      case 'home':
        return <HomeScreen 
                  user={user} 
                  progress={progress} 
                  entitlements={entitlements}
                  onSelectModule={handleSelectModule} 
                  onStartCheckup={() => handleNavigate('checkup')}
                  onStartDailyChallenge={() => handleNavigate('daily_challenge')}
                  onNavigateToReport={() => handleNavigate('competence_report')}
                  onNavigate={handleNavigate}
                />;
      case 'module':
        return selectedModule && <ModuleScreen 
                                    module={selectedModule} 
                                    moduleColor={selectedModule.color}
                                    onSelectExercise={handleSelectExercise} 
                                    onReviewExercise={handleReviewExercise}
                                    completedExerciseIds={progress?.completedExerciseIds || []}
                                    entitlements={entitlements}
                                    analysisHistory={progress?.analysisHistory || {}}
                                />;
      case 'exercise':
        return selectedExercise && selectedModule && 
               <ExerciseScreen 
                 exercise={selectedExercise} 
                 moduleColor={selectedModule.color}
                 onComplete={handleExerciseComplete}
                 entitlements={entitlements}
                 analysisHistory={progress?.analysisHistory || {}}
                 onApiKeyError={handleApiKeyError}
               />;
      case 'custom_setup':
          return selectedModule && <CustomSetupScreen 
                                      module={selectedModule} 
                                      onStart={(scenario, task) => {
                                        const customExercise: Exercise = {
                                            id: `custom-${Date.now()}`,
                                            title: 'Esercizio Personalizzato',
                                            scenario,
                                            task,
                                            difficulty: 'Medio',
                                            competence: 'riformulazione',
                                            exerciseType: ExerciseType.WRITTEN,
                                        };
                                        handleSelectExercise(customExercise);
                                      }}
                                      onBack={handleBack}
                                      onApiKeyError={handleApiKeyError}
                                  />;
      case 'chat_trainer':
          // FIX: Corrected a typo from 'entitlelezione nts' to 'entitlements'.
          return <StrategicChatTrainerScreen user={user} isPro={hasProAccess(entitlements)} onApiKeyError={handleApiKeyError} />
      case 'checkup':
          return <StrategicCheckupScreen onComplete={handleCheckupComplete} entitlements={entitlements} onApiKeyError={handleApiKeyError} />;
      case 'profile_results':
          return <CommunicatorProfileScreen profile={communicatorProfile!} onContinue={() => handleNavigate('home')} />;
      case 'daily_challenge':
          return <DailyChallengeScreen 
                      onComplete={(result, userResponse, exercise) => handleExerciseComplete(result, userResponse, exercise, 'written')} 
                      entitlements={entitlements}
                      analysisHistory={progress?.analysisHistory || {}}
                      onApiKeyError={handleApiKeyError}
                      onBack={handleBack}
                  />;
      case 'admin':
          return user.isAdmin ? <AdminScreen /> : <HomeScreen user={user} progress={progress} entitlements={entitlements} onSelectModule={handleSelectModule} onStartCheckup={() => handleNavigate('checkup')} onStartDailyChallenge={() => handleNavigate('daily_challenge')} onNavigateToReport={() => handleNavigate('competence_report')} onNavigate={handleNavigate} />;
      case 'paywall':
          return <PaywallScreen entitlements={entitlements!} onRestore={handleRestore} onBack={handleBack} />;
      case 'competence_report':
          return progress && <CompetenceReportScreen userProgress={progress} onBack={handleBack} onSelectExercise={handleSelectExercise} />;
      case 'achievements':
          return progress && <AchievementsScreen progress={progress} />;
      case 'levels':
          return <LevelsScreen />;
      default:
        return <HomeScreen 
                  user={user} 
                  progress={progress} 
                  entitlements={entitlements}
                  onSelectModule={handleSelectModule} 
                  onStartCheckup={() => handleNavigate('checkup')}
                  onStartDailyChallenge={() => handleNavigate('daily_challenge')}
                  onNavigateToReport={() => handleNavigate('competence_report')}
                  onNavigate={handleNavigate}
                />;
    }
  };
  
  const showHeaderAndFooter = !['login', 'preloading', 'api_error'].includes(currentScreen);
  const showBack = currentScreen !== 'home';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#F8F7F4' }}>
        {showHeaderAndFooter && (
            <Header 
                user={user} 
                onLogout={handleLogout} 
                onNavigate={handleNavigate}
                showBack={showBack}
                onBack={handleBack}
                currentModule={currentScreen === 'exercise' || currentScreen === 'module' ? selectedModule : null}
                onReportProblem={() => setIsReportModalOpen(true)}
            />
        )}
        <main style={{ flex: 1, paddingTop: showHeaderAndFooter ? '64px' : '0' }}>
            {renderScreen()}
        </main>
        {showHeaderAndFooter && (currentScreen === 'home' || currentScreen === 'admin') && <Footer />}
        <ReportProblemModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} user={user} />
    </div>
  );
};

export default App;