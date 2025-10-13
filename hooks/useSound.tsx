import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SOUND_MUTED_KEY = 'ces_coach_sound_muted';

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      const item = window.localStorage.getItem(SOUND_MUTED_KEY);
      return item ? JSON.parse(item) : false;
    } catch (error) {
      console.log(error);
      return false;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(SOUND_MUTED_KEY, JSON.stringify(isMuted));
    } catch (error) {
      console.log(error);
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