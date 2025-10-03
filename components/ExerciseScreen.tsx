import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Exercise, AnalysisResult } from '../types';
import { ExerciseType } from '../types';
import { useSpeech } from '../hooks/useSpeech';
import { analyzeResponse } from '../services/geminiService';
import { COLORS } from '../constants';
import { BackIcon, MicIcon, SendIcon, SpeakerIcon, SpeakerOffIcon } from './Icons';

interface ExerciseScreenProps {
  exercise: Exercise;
  moduleTitle: string;
  apiKey: string;
  onComplete: (result: AnalysisResult) => void;
  onBack: () => void;
  onError: (message: string) => void;
}

const replacePunctuation = (text: string): string => {
  let processedText = text
    .replace(/\bpunto interrogativo\b/gi, '?')
    .replace(/\bpunto esclamativo\b/gi, '!')
    .replace(/\bvirgola\b/gi, ',')
    .replace(/\bpunto\b/gi, '.');
  
  processedText = processedText.replace(/\s+([,.?!])/g, '$1');

  return processedText;
};


export default function ExerciseScreen({ exercise, moduleTitle, apiKey, onComplete, onBack, onError }: ExerciseScreenProps) {
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastInputMethod, setLastInputMethod] = useState<ExerciseType>(ExerciseType.WRITTEN);
  const { isListening, transcript, startListening, stopListening, speak, isSupported, isSpeaking, stopSpeaking } = useSpeech();
  const prevIsListening = useRef(isListening);

  const handleToggleScenarioAudio = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(exercise.scenario);
    }
  };
  
  const submitAnalysis = useCallback(async (textToAnalyze: string) => {
    if (!textToAnalyze.trim()) {
        onError("La risposta non può essere vuota.");
        return;
    }
    setIsLoading(true);
    try {
      const result = await analyzeResponse(textToAnalyze, exercise.scenario, exercise.task, lastInputMethod === ExerciseType.VERBAL, apiKey);
      onComplete(result);
    } catch (error) {
      console.error(error);
      onError(error instanceof Error ? error.message : "Si è verificato un errore sconosciuto.");
    } finally {
      setIsLoading(false);
    }
  }, [exercise.scenario, exercise.task, onComplete, onError, apiKey, lastInputMethod]);

  
  useEffect(() => {
    if (transcript) {
        setResponse(transcript);
    }
  }, [transcript]);
  
  useEffect(() => {
    if (prevIsListening.current && !isListening && transcript) {
        const finalResponse = replacePunctuation(transcript);
        setResponse(finalResponse);
        setLastInputMethod(ExerciseType.VERBAL);
    }
    prevIsListening.current = isListening;
  }, [isListening, transcript]);

  const handleSubmit = () => {
    if (!response.trim()) {
      onError("La risposta non può essere vuota.");
      return;
    }
    submitAnalysis(response);
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResponse(e.target.value);
    setLastInputMethod(ExerciseType.WRITTEN);
  };

  return (
    <div className="min-h-[80vh] flex flex-col animate-fade-in">
        <header className="flex items-center space-x-4 mb-6">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200/50 transition-colors">
                <BackIcon className="w-6 h-6 text-nero" />
            </button>
            <div>
                <h3 className="text-gray-600 text-sm">{moduleTitle}</h3>
                <h1 className="text-2xl font-bold text-nero">{exercise.title}</h1>
            </div>
        </header>

        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-gray-200/50 flex-grow flex flex-col">
            <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-lg text-nero">Scenario:</h2>
                    <button 
                        onClick={handleToggleScenarioAudio} 
                        className="flex items-center space-x-2 px-3 py-2 text-sm font-semibold text-nero bg-gray-100 rounded-full hover:bg-gray-200 transition-colors" 
                        aria-label={isSpeaking ? "Ferma audio" : "Ascolta scenario"}
                    >
                       {isSpeaking ? <SpeakerOffIcon className="w-5 h-5 text-blue-600" /> : <SpeakerIcon className="w-5 h-5" />}
                       <span>Ascolta il testo</span>
                    </button>
                </div>
                <p className="text-gray-700 leading-relaxed italic">"{exercise.scenario}"</p>
                <h2 className="font-semibold text-lg text-nero">Il tuo compito:</h2>
                <p className="text-gray-700 leading-relaxed">{exercise.task}</p>
            </div>

            <div className="flex-grow flex flex-col justify-end">
                <textarea
                    value={response}
                    onChange={handleTextChange}
                    placeholder="Scrivi qui la tua risposta o usa il microfono per dettarla..."
                    className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azzurroPastello focus:border-azzurroPastello transition-shadow"
                    disabled={isLoading || isListening}
                />
                {isListening && (
                    <div className="flex items-center text-sm text-gray-500 mt-2">
                        <span className="inline-block w-2 h-2 mr-2 bg-red-500 rounded-full animate-pulse"></span>
                        Sto ascoltando... Tocca di nuovo il microfono per fermare.
                    </div>
                )}
            </div>
        </div>

        <div className="py-6 flex items-center justify-center">
            {isLoading ? (
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-t-accentoVerde border-gray-200 rounded-full animate-spin mx-auto" style={{borderColor: COLORS.nero, borderTopColor: COLORS.accentoVerde}}></div>
                    <p className="mt-2 text-gray-700">Analisi in corso...</p>
                </div>
            ) : (
                <div className="flex w-full items-center justify-between space-x-4">
                    <div className="flex flex-col items-center">
                         <button 
                            onClick={handleMicClick} 
                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${isListening ? 'bg-red-500 animate-pulse' : 'bg-white border-2'}`}
                            style={{borderColor: COLORS.accentoVerde, backgroundColor: isListening ? '#ef4444' : 'white'}}
                            aria-label={isListening ? 'Ferma registrazione' : 'Inizia registrazione'}
                        >
                            <MicIcon className={`w-8 h-8 ${isListening ? 'text-white' : ''}`} style={{color: isListening ? 'white' : COLORS.accentoVerde}}/>
                        </button>
                         {!isSupported && <p className="text-red-500 text-xs mt-2 text-center">Riconoscimento vocale non supportato.</p>}
                    </div>
                    <button 
                        onClick={handleSubmit} 
                        disabled={!response.trim()}
                        className="flex-grow px-8 py-4 bg-accentoVerde text-white font-bold rounded-full shadow-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2" 
                        style={{backgroundColor: response.trim() ? COLORS.accentoVerde : ''}}
                    >
                        <SendIcon className="w-5 h-5" />
                        <span>Invia Risposta</span>
                    </button>
                </div>
            )}
        </div>
    </div>
  );
}
