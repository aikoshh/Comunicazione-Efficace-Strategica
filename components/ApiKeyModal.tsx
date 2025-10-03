import React, { useState } from 'react';
import { COLORS } from '../constants';

interface ApiKeyModalProps {
  onSave: (apiKey: string) => void;
}

export default function ApiKeyModal({ onSave }: ApiKeyModalProps) {
  const [key, setKey] = useState('');

  const handleSave = () => {
    if (key.trim()) {
      onSave(key.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-fade-in">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-nero mb-2">Benvenuto nel CES Coach!</h1>
          <p className="text-gray-600 mb-6">
            Per iniziare il tuo allenamento, inserisci la tua chiave API di Google Gemini. Verrà salvata solo nel tuo browser.
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Incolla qui la tua API Key..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azzurroPastello focus:border-azzurroPastello transition-shadow"
          />
          <button
            onClick={handleSave}
            disabled={!key.trim()}
            className="w-full px-8 py-3 bg-accentoVerde text-white font-bold rounded-full shadow-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            style={{ backgroundColor: key.trim() ? COLORS.accentoVerde : '' }}
          >
            Salva e Inizia ad Allenarti
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-4 text-center">
          Puoi ottenere la tua chiave API gratuita da 
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"> Google AI Studio</a>.
        </p>
      </div>
    </div>
  );
}
