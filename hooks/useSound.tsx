import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const SOUND_ENABLED_KEY = 'ces_coach_sound_enabled';

interface SoundContextType {
  isSoundEnabled: boolean;
  toggleSound: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const storedSetting = localStorage.getItem(SOUND_ENABLED_KEY);
    return storedSetting ? JSON.parse(storedSetting) : true; // Default to enabled
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(SOUND_ENABLED_KEY, JSON.stringify(isSoundEnabled));
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