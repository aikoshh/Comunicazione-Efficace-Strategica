import React from 'react';
import type { Module } from '../types';
import { COLORS } from '../constants';

interface HomeScreenProps {
  modules: Module[];
  onSelectModule: (module: Module) => void;
}

const ModuleCard: React.FC<{ module: Module, onSelect: () => void }> = ({ module, onSelect }) => (
    <button 
        onClick={onSelect}
        className="group w-full text-left bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
        <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{backgroundColor: COLORS.azzurroPastello}}>
                <module.icon className="w-6 h-6" style={{color: COLORS.nero}}/>
            </div>
            <div className="flex-1">
                <h3 className="text-xl font-bold text-nero">{module.title}</h3>
                <p className="text-gray-600 mt-1">{module.description}</p>
            </div>
        </div>
    </button>
);


export default function HomeScreen({ modules, onSelectModule }: HomeScreenProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      <header className="text-center">
        <h1 className="text-4xl font-extrabold text-nero tracking-tight">Comunicazione Efficace Strategica®</h1>
        <p className="mt-2 text-lg text-gray-600">Inizia ora il tuo allenamento personalizzato per migliorare rapidamente e in modo concreto la tua comunicazione.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <ModuleCard key={module.id} module={module} onSelect={() => onSelectModule(module)} />
        ))}
      </div>
    </div>
  );
}