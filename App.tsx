import React, { useState } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { ModuleScreen } from './components/ModuleScreen';
import { ExerciseScreen } from './components/ExerciseScreen';
import { AnalysisReportScreen } from './components/AnalysisReportScreen';
import { ApiKeyErrorScreen } from './components/ApiKeyErrorScreen';
import CustomSetupScreen from './components/CustomSetupScreen';
import type { Module, Exercise, AnalysisResult, DifficultyLevel } from './types';
import { MODULES } from './constants';

type AppState =
  | { screen: 'home' }
  | { screen: 'module'; module: Module }
  | { screen: 'custom_setup'; module: Module }
  | { screen: 'exercise'; exercise: Exercise }
  | { screen: 'report'; result: AnalysisResult; exercise: Exercise };

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({ screen: 'home' });

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
  
  const handleCompleteExercise = (result: AnalysisResult) => {
    if (appState.screen === 'exercise') {
      setAppState({ screen: 'report', result, exercise: appState.exercise });
    }
  };

  const handleRetryExercise = () => {
      if (appState.screen === 'report') {
          setAppState({ screen: 'exercise', exercise: appState.exercise });
      }
  };

  const handleNextExercise = () => {
    // For simplicity, this just goes back to the home screen.
    // A more complex app might go to the next exercise in the module.
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

  const handleBackToHome = () => {
    setAppState({ screen: 'home' });
  };

  switch (appState.screen) {
    case 'home':
      return <HomeScreen onSelectModule={handleSelectModule} />;
    case 'module':
      return <ModuleScreen module={appState.module} onSelectExercise={handleSelectExercise} onBack={handleBack} />;
    case 'custom_setup':
      return <CustomSetupScreen module={appState.module} onStart={handleStartCustomExercise} onBack={handleBack} />;
    case 'exercise':
        return <ExerciseScreen exercise={appState.exercise} onComplete={handleCompleteExercise} onBack={handleBack} />;
    case 'report':
        return <AnalysisReportScreen result={appState.result} exercise={appState.exercise} onRetry={handleRetryExercise} onNext={handleNextExercise} />;
    default:
        return <HomeScreen onSelectModule={handleSelectModule} />;
  }
};

export default App;
