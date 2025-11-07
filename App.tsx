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
  StorableEntitlements,
  Path,
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
import { PathScreen } from './components/PathScreen';
import { HistoryScreen } from './components/HistoryScreen';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { FullScreenLoader } from './components/Loader';
import { ApiKeyErrorScreen } from './components/ApiKeyErrorScreen';
import { ReportProblemModal } from './components/ReportProblemModal';
import { PreloadingScreen } from './components/PreloadingScreen';
import { ObjectiveOnboardingModal } from './components/ObjectiveOnboardingModal';

import { logout, databaseService, subscribeToEntitlements } from './services/firebase';
import { restorePurchases, hasProAccess } from './services/monetizationService';
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
  const [selectedPath, setSelectedPath] = useState<Path | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  
  const [lastAnalysis, setLastAnalysis] = useState<{result: AnalysisResult | VoiceAnalysisResult, userResponse: string, exercise: Exercise, type: 'written' | 'verbal', isReview: boolean} | null>(null);
  const [communicatorProfile, setCommunicatorProfile] = useState<CommunicatorProfile | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isPreloading, setIsPreloading] = useState(true);
  const [isApiKeyError, setIsApiKeyError] = useState(false);
  const [apiKeyErrorMessage, setApiKeyErrorMessage] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false);


  const { addToast } = useToast();

  // State persistence: Save state to localStorage
  useEffect(() => {
    if (user) {
      // Whitelist of screens that are safe to persist and return to.
      const safeScreens = ['home', 'module', 'admin', 'paywall', 'competence_report', 'achievements', 'levels', 'daily_challenge', 'chat_trainer', 'path_screen', 'history'];
      if (safeScreens.includes(currentScreen)) {
        const stateToSave = {
          userId: user.uid,
          currentScreen,
          selectedModuleId: selectedModule?.id,
          selectedPathId: selectedPath?.id,
        };
        localStorage.setItem('ces_coach_app_state', JSON.stringify(stateToSave));
      }
    }
  }, [user, currentScreen, selectedModule, selectedPath]);

  useEffect(() => {
    setUser(initialUser);
    if (initialUser) {
        setIsLoading(true);

        // Fetch one-time data like user progress
        databaseService.getUserProgress(initialUser.uid)
            .then(userProgress => {
                const finalProgress = userProgress || gamificationService.getInitialProgress();
                setProgress(finalProgress);
                if (!finalProgress.mainObjective) {
                    setIsObjectiveModalOpen(true);
                }
            })
            .catch(error => {
                console.error("Failed to fetch user progress:", error);
                addToast("Impossibile caricare i progressi.", 'error');
            });

        // Set up real-time listener for entitlements
        const unsubscribe = subscribeToEntitlements(initialUser.uid, (storableEntitlements: StorableEntitlements | null) => {
            const productIDs = new Set(storableEntitlements?.productIDs || []);
            setEntitlements({
                productIDs,
                teamSeats: storableEntitlements?.teamSeats || 0,
                teamActive: storableEntitlements?.teamActive || false
            });
            setIsLoading(false); // Consider app loaded once entitlements are checked
        });
        
        // Restore app state after initial data might be loaded
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
                  const safeScreens = ['home', 'admin', 'paywall', 'competence_report', 'achievements', 'levels', 'daily_challenge', 'chat_trainer', 'path_screen', 'history'];
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


        // Cleanup subscription on unmount
        return () => unsubscribe();
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
    // FIX: Clear module/path selection when navigating to a top-level screen
    if (['checkup', 'competence_report', 'daily_challenge', 'achievements', 'levels', 'history', 'admin', 'paywall'].includes(screen)) {
        setSelectedModule(null);
        setSelectedPath(null);
    }
    setCurrentScreen(screen);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    if (lastAnalysis) {
        setLastAnalysis(null);
    }
    
    // FIX: Added 'checkup' to ensure it navigates back to home.
    if (['module', 'paywall', 'competence_report', 'achievements', 'levels', 'daily_challenge', 'chat_trainer', 'admin', 'path_screen', 'history', 'checkup'].includes(currentScreen)) {
        setCurrentScreen('home');
    } else if (currentScreen === 'exercise') {
        setCurrentScreen(selectedModule?.isCustom ? 'home' : (selectedPath ? 'path_screen' : 'module'));
    } else if (currentScreen === 'custom_setup') {
        setCurrentScreen('home');
    } else if (currentScreen === 'report' || currentScreen === 'voice_report') {
        setCurrentScreen('exercise');
    }
    window.scrollTo(0, 0);
  };
  
  const handleSelectModule = (module: Module) => {
    setSelectedModule(module);
    setSelectedPath(null);
    if (module.isCustom) {
      if (module.id === 'm6') {
        setCurrentScreen('custom_setup');
      } else if (module.id === 'm7') {
        setCurrentScreen('chat_trainer');
      }
    } else {
      setCurrentScreen('module');
    }
    window.scrollTo(0, 0);
  };
  
  const handleSelectPath = (path: Path) => {
      setSelectedPath(path);
      setSelectedModule(null);
      setCurrentScreen('path_screen');
      window.scrollTo(0, 0);
  }

  const handleSelectExercise = (exercise: Exercise, sourceModule?: Module, sourcePath?: Path) => {
    setSelectedExercise(exercise);
    if (sourceModule) setSelectedModule(sourceModule);
    if (sourcePath) setSelectedPath(sourcePath);
    setCurrentScreen('exercise');
    window.scrollTo(0, 0);
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
        type,
        competence: exercise.competence,
        score,
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

  const handleSetObjective = useCallback(async (objective: string) => {
    if (!user || !progress) return;

    const updatedProgress = { ...progress, mainObjective: objective };
    setProgress(updatedProgress);
    setIsObjectiveModalOpen(false);
    await databaseService.saveUserProgress(user.uid, updatedProgress);
    addToast('Obiettivo impostato! La tua dashboard è ora personalizzata.', 'success');
  }, [user, progress, addToast]);
  
  // FIX: Add handler for changing the objective.
  const handleChangeObjective = useCallback(() => {
    setIsObjectiveModalOpen(true);
  }, []);

  const findNextExercise = (): { label: string; action: () => void } => {
    if (!selectedExercise) return { label: 'Torna alla Home', action: () => handleNavigate('home') };
    
    if (selectedPath) {
        const currentIndex = selectedPath.exerciseIds.findIndex(id => id === selectedExercise.id);
        if (currentIndex > -1 && currentIndex < selectedPath.exerciseIds.length - 1) {
            const nextExerciseId = selectedPath.exerciseIds[currentIndex + 1];
            const nextExercise = MODULES.flatMap(m => m.exercises).find(e => e.id === nextExerciseId);
            if (nextExercise) {
                return { label: 'Prossimo Esercizio', action: () => handleSelectExercise(nextExercise, undefined, selectedPath) };
            }
        }
        return { label: `Torna a "${selectedPath.title}"`, action: () => setCurrentScreen('path_screen') };
    }
    
    if (selectedModule && !selectedModule.isCustom) {
        const currentModuleExercises = selectedModule.exercises;
        const currentIndex = currentModuleExercises.findIndex(ex => ex.id === selectedExercise.id);
        if (currentIndex > -1 && currentIndex < currentModuleExercises.length - 1) {
            return { label: 'Prossimo Esercizio', action: () => handleSelectExercise(currentModuleExercises[currentIndex + 1], selectedModule) };
        }
        return { label: `Torna a "${selectedModule.title}"`, action: () => setCurrentScreen('module') };
    }
    
    return { label: 'Torna alla Home', action: () => handleNavigate('home') };
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
        return (
          <HomeScreen
            user={user}
            progress={progress}
            entitlements={entitlements}
            onSelectModule={handleSelectModule}
            onSelectPath={handleSelectPath}
            onStartCheckup={() => handleNavigate('checkup')}
            onNavigateToReport={() => handleNavigate('competence_report')}
            onStartDailyChallenge={() => handleNavigate('daily_challenge')}
            onNavigate={handleNavigate}
            onChangeObjective={handleChangeObjective}
          />
        );
      case 'module':
        if (!selectedModule) return <HomeScreen user={user} progress={progress} entitlements={entitlements} onSelectModule={handleSelectModule} onSelectPath={handleSelectPath} onStartCheckup={() => handleNavigate('checkup')} onNavigateToReport={() => handleNavigate('competence_report')} onStartDailyChallenge={() => handleNavigate('daily_challenge')} onNavigate={handleNavigate} onChangeObjective={handleChangeObjective} />;
        return (
          <ModuleScreen
            module={selectedModule}
            // FIX: The ModuleScreen component requires a moduleColor prop. Pass the color from the selectedModule.
            moduleColor={selectedModule.color}
            onSelectExercise={(exercise) => handleSelectExercise(exercise, selectedModule)}
            onReviewExercise={handleReviewExercise}
            completedExerciseIds={progress?.completedExerciseIds || []}
            entitlements={entitlements}
            analysisHistory={progress?.analysisHistory || {}}
          />
        );
      case 'path_screen':
        if (!selectedPath) return <HomeScreen user={user} progress={progress} entitlements={entitlements} onSelectModule={handleSelectModule} onSelectPath={handleSelectPath} onStartCheckup={() => handleNavigate('checkup')} onNavigateToReport={() => handleNavigate('competence_report')} onStartDailyChallenge={() => handleNavigate('daily_challenge')} onNavigate={handleNavigate} onChangeObjective={handleChangeObjective} />;
        return (
          <PathScreen
            path={selectedPath}
            onSelectExercise={(exercise) => handleSelectExercise(exercise, undefined, selectedPath)}
            onReviewExercise={handleReviewExercise}
            completedExerciseIds={progress?.completedExerciseIds || []}
            entitlements={entitlements}
            analysisHistory={progress?.analysisHistory || {}}
          />
        );
      case 'exercise':
        if (!selectedExercise) return <HomeScreen user={user} progress={progress} entitlements={entitlements} onSelectModule={handleSelectModule} onSelectPath={handleSelectPath} onStartCheckup={() => handleNavigate('checkup')} onNavigateToReport={() => handleNavigate('competence_report')} onStartDailyChallenge={() => handleNavigate('daily_challenge')} onNavigate={handleNavigate} onChangeObjective={handleChangeObjective} />;
        return (
          <ExerciseScreen
            exercise={selectedExercise}
            moduleColor={selectedModule?.color || '#000'}
            onComplete={handleExerciseComplete}
            entitlements={entitlements}
            analysisHistory={progress?.analysisHistory || {}}
            onApiKeyError={handleApiKeyError}
          />
        );
      case 'custom_setup':
        const customModule = MODULES.find(m => m.id === 'm6');
        if (!customModule) return null;
        return <CustomSetupScreen 
          module={customModule} 
          onStart={(scenario, task) => {
            const customExercise: Exercise = {
              id: `custom_${Date.now()}`,
              title: 'Esercizio Personalizzato',
              scenario: scenario,
              task: task,
              difficulty: 'Medio',
              competence: 'riformulazione',
            };
            handleSelectExercise(customExercise, customModule);
          }}
          onBack={handleBack}
          onApiKeyError={handleApiKeyError}
        />;
      case 'checkup':
        return <StrategicCheckupScreen onComplete={handleCheckupComplete} entitlements={entitlements} onApiKeyError={handleApiKeyError} />;
      case 'profile_results':
        return <CommunicatorProfileScreen profile={communicatorProfile || progress?.checkupProfile} onContinue={() => handleNavigate('home')} />;
      case 'admin':
        return user.isAdmin ? <AdminScreen /> : <HomeScreen user={user} progress={progress} entitlements={entitlements} onSelectModule={handleSelectModule} onSelectPath={handleSelectPath} onStartCheckup={() => handleNavigate('checkup')} onNavigateToReport={() => handleNavigate('competence_report')} onStartDailyChallenge={() => handleNavigate('daily_challenge')} onNavigate={handleNavigate} onChangeObjective={handleChangeObjective} />;
      case 'paywall':
        return <PaywallScreen user={user} entitlements={entitlements!} onRestore={handleRestore} onBack={handleBack} />;
      case 'daily_challenge':
        return <DailyChallengeScreen 
          userProgress={progress!}
          onComplete={(result, userResponse, exercise) => handleExerciseComplete(result as AnalysisResult, userResponse, exercise, 'written')} 
          entitlements={entitlements}
          analysisHistory={progress?.analysisHistory || {}}
          onApiKeyError={handleApiKeyError}
          onBack={handleBack}
        />;
      case 'competence_report':
        return <CompetenceReportScreen 
          userProgress={progress!} 
          onBack={handleBack}
          onSelectExercise={handleSelectExercise}
          isPro={hasProAccess(entitlements)}
          onNavigateToPaywall={() => handleNavigate('paywall')}
        />;
       case 'history':
        return <HistoryScreen 
            userProgress={progress!}
            onReviewExercise={handleReviewExercise}
        />;
      case 'achievements':
        return <AchievementsScreen progress={progress!} />;
      case 'levels':
        return <LevelsScreen />;
      case 'chat_trainer':
        return <StrategicChatTrainerScreen 
          user={user} 
          isPro={hasProAccess(entitlements)} 
          onApiKeyError={handleApiKeyError}
        />;
      default:
        return (
          <HomeScreen
            user={user}
            progress={progress}
            entitlements={entitlements}
            onSelectModule={handleSelectModule}
            onSelectPath={handleSelectPath}
            onStartCheckup={() => handleNavigate('checkup')}
            onNavigateToReport={() => handleNavigate('competence_report')}
            onStartDailyChallenge={() => handleNavigate('daily_challenge')}
            onNavigate={handleNavigate}
            onChangeObjective={handleChangeObjective}
          />
        );
    }
  }

  return (
    <div style={{ paddingTop: '64px' }}>
      <Header
        user={user}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        showBack={currentScreen !== 'home'}
        onBack={handleBack}
        currentModule={selectedModule}
        onReportProblem={() => setIsReportModalOpen(true)}
        entitlements={entitlements}
      />
      
      {isObjectiveModalOpen && (
        <ObjectiveOnboardingModal
          onSetObjective={handleSetObjective}
          onClose={() => setIsObjectiveModalOpen(false)}
          allowClose={!!progress?.mainObjective}
        />
      )}
      
      <main>
        {renderScreen()}
      </main>

      {currentScreen === 'home' || currentScreen === 'admin' ? <Footer /> : null}

      <ReportProblemModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} user={user} />
    </div>
  );
};

export default App;