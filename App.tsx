import React, { useState, useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { ModuleScreen } from './components/ModuleScreen';
import { ExerciseScreen } from './components/ExerciseScreen';
import { AnalysisReportScreen } from './components/AnalysisReportScreen';
import { VoiceAnalysisReportScreen } from './components/VoiceAnalysisReportScreen';
import { ApiKeyErrorScreen } from './components/ApiKeyErrorScreen';
import CustomSetupScreen from './components/CustomSetupScreen';
import { LoginScreen } from './components/LoginScreen';
import type { Module, Exercise, AnalysisResult, VoiceAnalysisResult, DifficultyLevel, User, UserProgress } from './types';
import { MODULES, COLORS } from './constants';
import { initialUserDatabase } from './database';
import { soundService } from './services/soundService';

type AppState =
  | { screen: 'home' }
  | { screen: 'module'; module: Module }
  | { screen: 'custom_setup'; module: Module }
  | { screen: 'exercise'; exercise: Exercise }
  | { screen: 'report'; result: AnalysisResult; exercise: Exercise }
  | { screen: 'voice_report'; result: VoiceAnalysisResult; exercise: Exercise }
  | { screen: 'api_key_error'; error: string };

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

  // Effect to save users to localStorage whenever they change
  useEffect(() => {
    saveToStorage(USERS_STORAGE_KEY, users);
  }, [users]);

  // Effect to save progress to localStorage whenever it changes
  useEffect(() => {
    saveToStorage(PROGRESS_STORAGE_KEY, userProgress);
  }, [userProgress]);

  // Effect to scroll to top when returning to home or module screen
  useEffect(() => {
    if (appState.screen === 'home' || appState.screen === 'module' || appState.screen === 'custom_setup') {
      window.scrollTo(0, 0);
    }
  }, [appState.screen]);


  const handleLogin = (email: string, pass: string) => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user && user.password === pass) {
      setCurrentUser(user);
      setIsAuthenticated(true);
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
  
  const handleGuestAccess = () => {
    setCurrentUser(null);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    soundService.playClick();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setAppState({ screen: 'home' });
  };

  const handleSelectModule = (module: Module) => {
    if (module.isCustom) {
      setAppState({ screen: 'custom_setup', module });
    } else {
      setAppState({ screen: 'module', module });
    }
  };

  const handleSelectExercise = (exercise: Exercise) => {
    setAppState({ screen: 'exercise', exercise });
  };

  const handleStartCustomExercise = (scenario: string, task: string) => {
    const customExercise: Exercise = {
        id: 'custom-' + Date.now(),
        title: 'Esercizio Personalizzato',
        scenario: scenario,
        task: task,
        difficulty: 'Base' as DifficultyLevel, // Custom exercises don't have a fixed difficulty
    };
    setAppState({ screen: 'exercise', exercise: customExercise });
  };
  
  const handleCompleteWrittenExercise = (result: AnalysisResult) => {
    if (appState.screen === 'exercise') {
      if (currentUser) {
        const newScore = result.score;
        setUserProgress(prev => {
            const userEmail = currentUser.email;
            const currentProgress = prev[userEmail] || { scores: [] };
            return {
                ...prev,
                [userEmail]: {
                    ...currentProgress,
                    scores: [...currentProgress.scores, newScore]
                }
            };
        });
      }
      setAppState({ screen: 'report', result, exercise: appState.exercise });
    }
  };

  const handleCompleteVerbalExercise = (result: VoiceAnalysisResult) => {
      if (appState.screen === 'exercise') {
          if (currentUser) {
            const averageScore = result.scores.reduce((acc, s) => acc + s.score, 0) / result.scores.length * 10;
            setUserProgress(prev => {
                const userEmail = currentUser.email;
                const currentProgress = prev[userEmail] || { scores: [] };
                return {
                    ...prev,
                    [userEmail]: {
                        ...currentProgress,
                        scores: [...currentProgress.scores, Math.round(averageScore)]
                    }
                };
            });
          }
          setAppState({ screen: 'voice_report', result, exercise: appState.exercise });
      }
  };

  const handleRetryExercise = () => {
      if (appState.screen === 'report' || appState.screen === 'voice_report') {
          setAppState({ screen: 'exercise', exercise: appState.exercise });
      }
  };

  const handleNextExercise = () => {
    // Per semplicità, torna alla schermata principale.
    setAppState({ screen: 'home' });
  };
  
  const handleBack = () => {
    if (appState.screen === 'module' || appState.screen === 'custom_setup') {
      setAppState({ screen: 'home' });
    }
    if (appState.screen === 'exercise') {
        const isCustom = appState.exercise.id.startsWith('custom-');
        if (isCustom) {
            const customModule = MODULES.find(m => m.isCustom);
            if (customModule) {
                setAppState({ screen: 'custom_setup', module: customModule });
            } else {
                setAppState({ screen: 'home' }); // Fallback
            }
        } else {
            const moduleForExercise = MODULES.find(m => m.exercises.some(e => e.id === appState.exercise.id));
            if (moduleForExercise) {
                setAppState({ screen: 'module', module: moduleForExercise });
            } else {
                setAppState({ screen: 'home' }); // Fallback
            }
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
  let screenKey = 'home'; // default key

  switch (appState.screen) {
    case 'home':
      screenKey = 'home';
      screenContent = <HomeScreen 
                onSelectModule={handleSelectModule} 
                currentUser={currentUser}
                userProgress={currentUser ? userProgress[currentUser.email] : undefined}
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
                    onApiKeyError={handleApiKeyError} />;
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
    default:
        screenContent = <HomeScreen 
                 onSelectModule={handleSelectModule} 
                 currentUser={currentUser}
                 userProgress={currentUser ? userProgress[currentUser.email] : undefined}
               />;
  }

  return (
    <div>
        <style>{hoverStyle}</style>
        <div key={screenKey} style={{ animation: 'fadeInUp 0.5s ease-out' }}>
            {screenContent}
        </div>
        {appState.screen !== 'api_key_error' && (
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
        fontSize: '14px',
        color: COLORS.textSecondary,
    }
};


export default App;