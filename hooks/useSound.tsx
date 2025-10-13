import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { soundService } from '../services/soundService';

const SOUND_ENABLED_KEY = 'ces_coach_sound_enabled';

interface SoundContextType {
  isSoundEnabled: boolean;
  toggleSound: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    try {
      const item = window.localStorage.getItem(SOUND_ENABLED_KEY);
      // Default to sound being ON
      return item ? JSON.parse(item) : true;
    } catch (error) {
      console.error("Failed to read sound setting from localStorage", error);
      return true;
    }
  });

  // Effect to update the sound service and localStorage when the state changes
  useEffect(() => {
    soundService.setEnabled(isSoundEnabled);
    try {
      window.localStorage.setItem(SOUND_ENABLED_KEY, JSON.stringify(isSoundEnabled));
    } catch (error) {
      console.error("Failed to save sound setting to localStorage", error);
    }
  }, [isSoundEnabled]);

  const toggleSound = useCallback(() => {
    setIsSoundEnabled(prev => !prev);
  }, []);

  return (
    <SoundContext.Provider value={{ isSoundEnabled, toggleSound }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};
