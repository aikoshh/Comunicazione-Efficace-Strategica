import React, { useState, useCallback, useEffect } from 'react';
import { MODULES } from './constants';
import type { Module, Exercise, AnalysisResult, ExerciseType } from './types';
import HomeScreen from './components/HomeScreen';
import ModuleScreen from './components/ModuleScreen';
import ExerciseScreen from './components/ExerciseScreen';
import AnalysisReportScreen from './components/AnalysisReportScreen';
import ApiKeyModal from './components/ApiKeyModal'; // Import the new modal
import { COLORS } from './constants';

type Screen = 'home' | 'module' | 'exercise' | 'report';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [exerciseMode, setExerciseMode] = useState<ExerciseType | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);

  // On initial load, try to get the API key from localStorage
  useEffect(() => {
    const storedApiKey = localStorage.getItem('gemini-api-key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    if (key.trim()) {
      setApiKey(key);
      localStorage.setItem('gemini-api-key', key);
    }
  };

  const handleSelectModule = useCallback((module: Module) => {
    setSelectedModule(module);
    setCurrentScreen('module');
  }, []);

  const handleStartExercise = useCallback((exercise: Exercise, mode: ExerciseType) => {
    setSelectedExercise(exercise);
    setExerciseMode(mode);
    setCurrentScreen('exercise');
  }, []);
  
  const handleCompleteExercise = useCallback((result: AnalysisResult) => {
    setAnalysisResult(result);
    setCurrentScreen('report');
  }, []);
  
  const handleBack = useCallback(() => {
    switch (currentScreen) {
      case 'report':
        setCurrentScreen('module');
        setAnalysisResult(null);
        break;
      case 'exercise':
        setCurrentScreen('module');
        break;
      case 'module':
        setCurrentScreen('home');
        setSelectedModule(null);
        break;
      default:
        setCurrentScreen('home');
    }
  }, [currentScreen]);

  const handleRetry = useCallback(() => {
    setAnalysisResult(null);
    setCurrentScreen('exercise');
  }, []);
  
  const findNextExercise = (): Exercise | null => {
    if (!selectedModule || !selectedExercise) return null;
    const currentExerciseIndex = selectedModule.exercises.findIndex(ex => ex.id === selectedExercise.id);
    if (currentExerciseIndex !== -1 && currentExerciseIndex < selectedModule.exercises.length - 1) {
      return selectedModule.exercises[currentExerciseIndex + 1];
    }
    return null;
  };
  
  const handleNext = useCallback(() => {
    const nextExercise = findNextExercise();
    if (nextExercise && exerciseMode) {
      handleStartExercise(nextExercise, exerciseMode);
    } else {
      setCurrentScreen('module');
    }
    setAnalysisResult(null);
  }, [selectedModule, selectedExercise, exerciseMode, handleStartExercise]);
  
  const handleError = (message: string) => {
      setError(message);
      setTimeout(() => setError(null), 5000); // Auto-dismiss after 5s
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'module':
        if (selectedModule) {
          return (
            <ModuleScreen
              module={selectedModule}
              onStartExercise={handleStartExercise}
              onBack={() => {
                setCurrentScreen('home');
                setSelectedModule(null);
              }}
            />
          );
        }
        return null;
      case 'exercise':
        if (selectedExercise && selectedModule && exerciseMode && apiKey) {
          return (
            <ExerciseScreen
              exercise={selectedExercise}
              moduleTitle={selectedModule.title}
              mode={exerciseMode}
              apiKey={apiKey} // Pass the key to the exercise screen
              onComplete={handleCompleteExercise}
              onBack={handleBack}
              onError={handleError}
            />
          );
        }
        return null;
      case 'report':
        if (analysisResult && selectedExercise) {
          return (
            <AnalysisReportScreen
              result={analysisResult}
              exercise={selectedExercise}
              onNext={handleNext}
              onRetry={handleRetry}
            />
          );
        }
        return null;
      case 'home':
      default:
        return <HomeScreen modules={MODULES} onSelectModule={handleSelectModule} />;
    }
  };
  
  return (
    <div className="min-h-screen font-sans text-gray-800" style={{ backgroundColor: COLORS.fondo }}>
      {!apiKey && <ApiKeyModal onSave={handleSaveApiKey} />}
      <main className={`container mx-auto px-4 py-8 md:py-12 ${!apiKey ? 'blur-sm pointer-events-none' : ''}`}>
        {renderScreen()}
        {error && (
            <div className="fixed bottom-5 right-5 z-50 bg-red-500 text-white py-2 px-4 rounded-lg shadow-lg animate-fade-in">
                {error}
            </div>
        )}
      </main>
    </div>
  );
}

export default App;
