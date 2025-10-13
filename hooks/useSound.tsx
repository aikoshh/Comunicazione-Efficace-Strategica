import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const SOUND_MUTED_KEY = 'ces_coach_sound_muted';

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      const storedValue = localStorage.getItem(SOUND_MUTED_KEY);
      return storedValue ? JSON.parse(storedValue) : false;
    } catch (error) {
      console.error("Failed to load sound preference from storage:", error);
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SOUND_MUTED_KEY, JSON.stringify(isMuted));
    } catch (error) {
      console.error("Failed to save sound preference to storage:", error);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return (
    <SoundContext.Provider value={{ isMuted, toggleMute }}>
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
