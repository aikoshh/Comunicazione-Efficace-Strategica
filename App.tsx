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
import type { Module, Exercise, AnalysisResult, VoiceAnalysisResult, DifficultyLevel, User, UserProgress, CommunicatorProfile } from './types';
import { MODULES, COLORS } from './constants';
import { initialUserDatabase } from './database';
import { soundService } from './services/soundService';

type AppState =
  | { screen: 'home' }
  | { screen: 'module'; module: Module }
  | { screen: 'custom_setup'; module: Module }
  | { screen: 'exercise'; exercise: Exercise; isCheckup?: boolean; checkupStep?: number; totalCheckupSteps?: number }
  | { screen: 'report'; result: AnalysisResult; exercise: Exercise }
  | { screen: 'voice_report'; result: VoiceAnalysisResult; exercise: Exercise }
  | { screen: 'api_key_error'; error: string }
  | { screen: 'strategic_checkup' }
  | { screen: 'communicator_profile' };

const USERS_STORAGE_KEY = 'ces_coach_users';
const PROGRESS_STORAGE_KEY = 'ces_coach_progress';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [users, setUsers] = useState<User[]>(() => {
    const storedUsers = loadFromStorage<User[]>(USERS_STORAGE_KEY);
    if (storedUsers && storedUsers.length > 0) {
        return storedUsers;
    }
    const initialUsers = parseDatabase(initialUserDatabase);
    saveToStorage(USERS_STORAGE_KEY, initialUsers);
    return initialUsers;
  });

  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>(() => {
    return loadFromStorage<Record<string, UserProgress>>(PROGRESS_STORAGE_KEY) || {};
  });

  const [appState, setAppState] = useState<AppState>({ screen: 'home' });

  useEffect(() => {
    saveToStorage(USERS_STORAGE_KEY, users);
  }, [users]);

  useEffect(() => {
    saveToStorage(PROGRESS_STORAGE_KEY, userProgress);
  }, [userProgress]);

  useEffect(() => {
    if (appState.screen === 'home' || appState.screen === 'module' || appState.screen === 'custom_setup') {
      window.scrollTo(0, 0);
    }
  }, [appState.screen]);

  const updateUserProgress = (email: string, updates: Partial<UserProgress>) => {
      setUserProgress(prev => {
          const currentProgress = prev[email] || { scores: [], completedExerciseIds: [], completedModuleIds: [] };
          return {
              ...prev,
              [email]: { ...currentProgress, ...updates }
          };
      });
  };

  const handleLogin = (email: string, pass: string, apiKey: string) => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user && user.password === pass) {
      if (apiKey) {
          sessionStorage.setItem('gemini_api_key', apiKey);
      } else {
          sessionStorage.removeItem('gemini_api_key');
      }
      setCurrentUser(user);
      setIsAuthenticated(true);
      // Always go to home screen after login. The checkup is now optional from the home screen.
      setAppState({ screen: 'home' });
    } else {
      throw new Error("Email o password non validi.");
    }
  };
  
  const handleRegister = (newUser: Omit<User, 'password'> & { password: string }) => {
    const userExists = users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase());
    if (userExists) {
        throw new Error("Un utente con questa email è già registrato.");
    }
    const userToSave: User = { ...newUser };
    setUsers(prevUsers => [...prevUsers, userToSave]);
  };
  
  const handleGuestAccess = (apiKey: string) => {
    if (apiKey) {
        sessionStorage.setItem('gemini_api_key', apiKey);
    } else {
        sessionStorage.removeItem('gemini_api_key');
    }
    setCurrentUser(null);
    setIsAuthenticated(true);
    setAppState({ screen: 'home' }); // Guests skip checkup
  };

  const handleLogout = () => {
    soundService.playClick();
    setIsAuthenticated(false);
    setCurrentUser(null);
    sessionStorage.removeItem('gemini_api_key'); // Clear API key on logout
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

  const handleSelectModule = (module: Module) => {
    if (module.isCustom) {
      setAppState({ screen: 'custom_setup', module });
    } else {
      setAppState({ screen: 'module', module });
    }
  };

  const handleSelectExercise = (exercise: Exercise, isCheckup: boolean = false, checkupStep: number = 0, totalCheckupSteps: number = 0) => {
    setAppState({ screen: 'exercise', exercise, isCheckup, checkupStep, totalCheckupSteps });
  };

  const handleStartCustomExercise = (scenario: string, task: string) => {
    const customExercise: Exercise = {
        id: 'custom-' + Date.now(),
        title: 'Esercizio Personalizzato',
        scenario: scenario,
        task: task,
        difficulty: 'Base' as DifficultyLevel,
    };
    setAppState({ screen: 'exercise', exercise: customExercise });
  };

  const processExerciseCompletion = (exerciseId: string, score: number) => {
      if (!currentUser) return;
      
      const userEmail = currentUser.email;
      const currentProgress = userProgress[userEmail] || { scores: [], completedExerciseIds: [], completedModuleIds: [] };
      
      const newScores = [...currentProgress.scores, score];
      const newCompletedIds = [...new Set([...(currentProgress.completedExerciseIds || []), exerciseId])];
      
      // Check for module completion
      const newCompletedModuleIds = [...(currentProgress.completedModuleIds || [])];
      for (const module of MODULES.filter(m => !m.isCustom)) {
          if (!newCompletedModuleIds.includes(module.id)) {
              const allExercisesInModuleCompleted = module.exercises.every(ex => newCompletedIds.includes(ex.id));
              if (allExercisesInModuleCompleted) {
                  newCompletedModuleIds.push(module.id);
                  soundService.playSuccess(); // Play a sound for module completion
              }
          }
      }

      updateUserProgress(userEmail, {
          scores: newScores,
          completedExerciseIds: newCompletedIds,
          completedModuleIds: newCompletedModuleIds,
      });
  };
  
  const handleCompleteWrittenExercise = (result: AnalysisResult) => {
    if (appState.screen === 'exercise') {
      if (!appState.isCheckup) {
        processExerciseCompletion(appState.exercise.id, result.score);
        setAppState({ screen: 'report', result, exercise: appState.exercise });
      }
    }
  };

  const handleCompleteVerbalExercise = (result: VoiceAnalysisResult) => {
      if (appState.screen === 'exercise') {
          const averageScore = Math.round(result.scores.reduce((acc, s) => acc + s.score, 0) / result.scores.length * 10);
          if (!appState.isCheckup) {
              processExerciseCompletion(appState.exercise.id, averageScore);
              setAppState({ screen: 'voice_report', result, exercise: appState.exercise });
          }
      }
  };

  const handleRetryExercise = () => {
      if (appState.screen === 'report' || appState.screen === 'voice_report') {
          setAppState({ screen: 'exercise', exercise: appState.exercise });
      }
  };

  const handleNextExercise = () => {
    setAppState({ screen: 'home' });
  };
  
  const handleBack = () => {
    if (appState.screen === 'module' || appState.screen === 'custom_setup' || appState.screen === 'communicator_profile' || appState.screen === 'strategic_checkup') {
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
            if (moduleForExercise) setAppState({ screen: 'module', module: moduleForExercise });
            else setAppState({ screen: 'home' });
        }
    }
  };

  const handleApiKeyError = (error: string) => {
      setAppState({ screen: 'api_key_error', error });
  };
  
  const hoverStyle = `
      .logout-button:hover {
        opacity: 0.9;
        transform: translateY(-2px);
      }
    `;

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} onRegister={handleRegister} onGuestAccess={handleGuestAccess} />;
  }

  let screenContent;
  let screenKey = 'home';

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
      screenContent = <ModuleScreen module={appState.module} onSelectExercise={handleSelectExercise} onBack={handleBack} />;
      break;
    case 'custom_setup':
      screenKey = 'custom_setup';
      screenContent = <CustomSetupScreen module={appState.module} onStart={handleStartCustomExercise} onBack={handleBack} />;
      break;
    case 'exercise':
        screenKey = appState.exercise.id;
        screenContent = <ExerciseScreen 
                    exercise={appState.exercise} 
                    onCompleteWritten={handleCompleteWrittenExercise} 
                    onCompleteVerbal={handleCompleteVerbalExercise}
                    onBack={handleBack} 
                    onApiKeyError={handleApiKeyError}
                    isCheckup={appState.isCheckup}
                    checkupStep={appState.checkupStep}
                    totalCheckupSteps={appState.totalCheckupSteps}
                    />;
        break;
    case 'report':
        screenKey = `report-${appState.exercise.id}`;
        screenContent = <AnalysisReportScreen result={appState.result} exercise={appState.exercise} onRetry={handleRetryExercise} onNext={handleNextExercise} />;
        break;
    case 'voice_report':
        screenKey = `voice-report-${appState.exercise.id}`;
        screenContent = <VoiceAnalysisReportScreen result={appState.result} exercise={appState.exercise} onRetry={handleRetryExercise} onNext={handleNextExercise} />;
        break;
    case 'api_key_error':
        screenKey = 'api_key_error';
        screenContent = <ApiKeyErrorScreen error={appState.error} />;
        break;
    case 'strategic_checkup':
        screenKey = 'strategic_checkup';
        screenContent = <StrategicCheckupScreen onSelectExercise={handleSelectExercise} onCompleteCheckup={handleCompleteCheckup} onApiKeyError={handleApiKeyError} onBack={handleBack} />;
        break;
    case 'communicator_profile':
        screenKey = 'communicator_profile';
        const profile = currentUser ? userProgress[currentUser.email]?.checkupResults : undefined;
        screenContent = <CommunicatorProfileScreen profile={profile} onContinue={handleFinishProfileReview} />;
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
        <style>{hoverStyle}</style>
        <div key={screenKey} style={{ animation: 'fadeInUp 0.5s ease-out' }}>
            {screenContent}
        </div>
        {(appState.screen !== 'api_key_error' && appState.screen !== 'strategic_checkup') && (
            <footer style={styles.footer}>
                <button onClick={handleLogout} style={styles.logoutButton} className="logout-button">
                    Logout
                </button>
                <p style={styles.copyrightText}>
                    CES Coach © Copyright 2025 email: cfs@centrocfs.it
                </p>
            </footer>
        )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    footer: {
        textAlign: 'center',
        padding: '32px 20px',
        backgroundColor: COLORS.base,
    },
    logoutButton: {
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: '500',
        border: 'none',
        backgroundColor: '#dc3545',
        color: 'white',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)',
    },
    copyrightText: {
        marginTop: '24px',
        fontSize: '12px',
        color: COLORS.textSecondary,
        lineHeight: '1.4',
    }
};


export default App;
