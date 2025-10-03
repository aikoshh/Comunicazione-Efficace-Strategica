import React, { useState, useCallback } from 'react';
import { MODULES } from './constants';
import type { Module, Exercise, AnalysisResult, ExerciseType } from './types';
import HomeScreen from './components/HomeScreen';
import ModuleScreen from './components/ModuleScreen';
import ExerciseScreen from './components/ExerciseScreen';
import AnalysisReportScreen from './components/AnalysisReportScreen';
import { COLORS } from './constants';

type Screen = 'home' | 'module' | 'exercise' | 'report';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [exerciseMode, setExerciseMode] = useState<ExerciseType | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        // From report, go back to the module screen to choose another exercise
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
      // Start next exercise in the same mode
      handleStartExercise(nextExercise, exerciseMode);
    } else {
      // If no next exercise, go back to module screen
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
        if (selectedExercise && selectedModule && exerciseMode) {
          return (
            <ExerciseScreen
              exercise={selectedExercise}
              moduleTitle={selectedModule.title}
              mode={exerciseMode}
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
      <main className="container mx-auto px-4 py-8 md:py-12">
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
