import React from 'react';
import type { AnalysisResult, Exercise, CESStepAnalysis } from '../types';
import { COLORS } from '../constants';
import { NextIcon, RetryIcon, CheckCircleIcon, XCircleIcon, HomeIcon } from './Icons';

interface AnalysisReportScreenProps {
  result: AnalysisResult;
  exercise: Exercise;
  onNext: () => void;
  onRetry: () => void;
  onGoHome: () => void;
}

const renderMarkdown = (text: string) => {
    const html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />');
    return { __html: html };
};

const ScoreCircle: React.FC<{ score: number }> = ({ score }) => {
    const color = score >= 70 ? COLORS.accentoVerde : score >= 40 ? '#FBBF24' : '#F87171';
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="relative w-32 h-32">
            <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                    className="text-gray-200"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                />
                <circle
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    style={{ color }}
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                    className="transform -rotate-90 origin-center transition-all duration-1000 ease-out"
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold" style={{ color: COLORS.nero }}>
                {score}
            </span>
        </div>
    );
};

const HeatmapStep: React.FC<{ label: string, analysis: CESStepAnalysis }> = ({ label, analysis }) => {
    return (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
                <span className="font-semibold text-nero">{label}</span>
                {analysis.covered ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                ) : (
                    <XCircleIcon className="w-6 h-6 text-red-500" />
                )}
            </div>
            {!analysis.covered && analysis.suggestion && (
                <p className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-200">
                    <span className="font-semibold">Suggerimento:</span> "{analysis.suggestion}"
                </p>
            )}
        </div>
    );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-gray-200/50">
        <h2 className="text-xl font-bold text-nero mb-4 pb-2 border-b-2 border-azzurroPastello">{title}</h2>
        {children}
    </div>
);

const getScoreColorClass = (score: number) => {
    if (score <= 3) return 'text-red-500';
    if (score <= 5) return 'text-orange-500';
    if (score <= 8) return 'text-green-500';
    return 'text-blue-500';
};


// FIX: Replaced JSX.Element with React.ReactElement
export default function AnalysisReportScreen({ result, exercise, onNext, onRetry, onGoHome }: AnalysisReportScreenProps): React.ReactElement {
  return (
    <div className="space-y-8 animate-fade-in">
        <header className="text-center">
            <h1 className="text-3xl font-bold text-nero">Il tuo report per: {exercise.title}</h1>
            <p className="text-gray-600 mt-2">Ecco un'analisi dettagliata della tua performance.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-1 flex flex-col items-center bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-gray-200/50">
                <h2 className="text-xl font-bold text-nero mb-4">Punteggio Globale</h2>
                <ScoreCircle score={result.score} />
                <div className={`mt-4 font-semibold text-lg ${result.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {result.isPositive ? "Ottima risposta!" : "Puoi migliorare!"}
                </div>
            </div>
            <div className="md:col-span-2">
                 <Section title="Feedback Generale">
                    <p className="text-gray-700 leading-relaxed">{result.feedback}</p>
                 </Section>
            </div>
        </div>

        <Section title="Heatmap CES (Comunicazione Efficace Strategica)">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <HeatmapStep label="Ingaggio" analysis={result.cesHeatmap.ingaggio} />
                <HeatmapStep label="Ricalco" analysis={result.cesHeatmap.ricalco} />
                <HeatmapStep label="Riformulazione" analysis={result.cesHeatmap.riformulazione} />
                <HeatmapStep label="Direzionamento" analysis={result.cesHeatmap.direzionamento} />
                <HeatmapStep label="Chiusura" analysis={result.cesHeatmap.chiusura} />
            </div>
        </Section>
        
        <Section title="Scala del Coinvolgimento Comunicativo">
            <div className="p-4 bg-azzurroPastello/30 rounded-lg flex items-center space-x-6">
                <div className="flex-shrink-0 text-center">
                    <div className={`text-6xl font-extrabold ${getScoreColorClass(result.communicativeScaleAnalysis.scaleScore)}`}>
                        {result.communicativeScaleAnalysis.scaleScore}
                    </div>
                    <div className="text-sm font-semibold text-nero">/ 10</div>
                </div>
                <div className="flex-grow">
                    <h3 className="font-bold text-nero text-lg">{result.communicativeScaleAnalysis.phase}</h3>
                    <p className="text-gray-700 mt-1">{result.communicativeScaleAnalysis.feedback}</p>
                </div>
            </div>
        </Section>

        <Section title="La Risposta Ideale">
            <div className="mb-6 p-4 bg-gray-100 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-1">Riepilogo Scenario:</h4>
                <p className="text-gray-600 italic">"{exercise.scenario}"</p>
            </div>
            <div className="space-y-4">
                <div>
                    <h3 className="font-semibold text-lg text-nero mb-2">Versione Breve</h3>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 italic text-gray-800" dangerouslySetInnerHTML={renderMarkdown(result.idealResponse.short)} />
                </div>
                 <div>
                    <h3 className="font-semibold text-lg text-nero mb-2">Versione Lunga</h3>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 italic text-gray-800" dangerouslySetInnerHTML={renderMarkdown(result.idealResponse.long)} />
                </div>
            </div>
        </section>
        
        <footer className="py-6 flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center justify-center space-x-4">
                 <button onClick={onRetry} className="px-6 py-3 bg-white border border-gray-300 text-nero font-bold rounded-full shadow-sm hover:bg-gray-100 transition-colors flex items-center space-x-2">
                    <RetryIcon className="w-5 h-5" />
                    <span>Riprova</span>
                </button>
                <button onClick={onNext} className="px-8 py-3 bg-accentoVerde text-white font-bold rounded-full shadow-lg hover:bg-green-600 transition-colors flex items-center space-x-2" style={{backgroundColor: COLORS.accentoVerde}}>
                    <span>Prossimo Esercizio</span>
                    <NextIcon className="w-5 h-5" />
                </button>
            </div>
            <button onClick={onGoHome} className="px-6 py-2 bg-transparent text-gray-600 font-semibold rounded-full hover:bg-gray-200/50 transition-colors flex items-center space-x-2">
                <HomeIcon className="w-5 h-5" />
                <span>Torna al Menu Principale</span>
            </button>
        </footer>
    </div>
  );
}
