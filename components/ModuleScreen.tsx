import React from 'react';
import type { Module, Exercise } from '../types';
import { DifficultyLevel, ExerciseType } from '../types';
import { COLORS } from '../constants';
import { BackIcon, NextIcon } from './Icons';

interface ModuleScreenProps {
  module: Module;
  onStartExercise: (exercise: Exercise) => void;
  onBack: () => void;
}

const getDifficultyClass = (difficulty: DifficultyLevel) => {
  switch (difficulty) {
    case DifficultyLevel.BASE:
      return 'bg-green-100 text-green-800';
    case DifficultyLevel.INTERMEDIO:
      return 'bg-yellow-100 text-yellow-800';
    case DifficultyLevel.AVANZATO:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const ExerciseCard: React.FC<{ exercise: Exercise, onStart: () => void }> = ({ exercise, onStart }) => {
    return (
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-gray-200/50 space-y-4">
            <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-nero">{exercise.title}</h3>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getDifficultyClass(exercise.difficulty)}`}>
                    {exercise.difficulty}
                </span>
            </div>
            <div>
                <h4 className="font-semibold text-gray-700">Scenario:</h4>
                <p className="text-gray-600 italic mt-1">"{exercise.scenario}"</p>
            </div>
            <div>
                <h4 className="font-semibold text-gray-700">Compito:</h4>
                <p className="text-gray-600 mt-1">{exercise.task}</p>
            </div>
            <div className="flex items-center justify-end pt-4">
                 <button 
                    onClick={onStart}
                    className="px-6 py-2 bg-accentoVerde text-white font-bold rounded-full shadow-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                    style={{backgroundColor: COLORS.accentoVerde}}
                >
                    <span>Rispondi</span>
                    <NextIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

// FIX: Replaced JSX.Element with React.ReactElement
export default function ModuleScreen({ module, onStartExercise, onBack }: ModuleScreenProps): React.ReactElement {
  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200/50 transition-colors">
          <BackIcon className="w-6 h-6 text-nero" />
        </button>
        <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{backgroundColor: COLORS.azzurroPastello}}>
                <module.icon className="w-6 h-6" style={{color: COLORS.nero}}/>
            </div>
            <div>
                <h1 className="text-3xl font-bold text-nero">{module.title}</h1>
                <p className="text-gray-600">{module.description}</p>
            </div>
        </div>
      </header>
      <div className="space-y-6">
        {module.exercises.map((exercise) => (
          <ExerciseCard key={exercise.id} exercise={exercise} onStart={() => onStartExercise(exercise)} />
        ))}
      </div>
    </div>
  );
}
