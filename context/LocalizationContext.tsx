import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { Language } from '../types';
import { translations } from '../locales/translations';

const LANGUAGE_STORAGE_KEY = 'ces_coach_language';

interface LocalizationContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: keyof typeof translations.it, replacements?: Record<string, string>) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'it';
    const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return (storedLang === 'en' || storedLang === 'it') ? storedLang : 'it';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
        document.documentElement.lang = lang;
    }
  }, [lang]);

  const t = useCallback((key: keyof typeof translations.it, replacements?: Record<string, string>) => {
    let translation = translations[lang][key] || translations.it[key];
    if (replacements) {
        Object.keys(replacements).forEach(rKey => {
            translation = translation.replace(`{${rKey}}`, replacements[rKey]);
        });
    }
    return translation;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};