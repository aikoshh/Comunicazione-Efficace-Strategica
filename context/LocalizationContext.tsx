import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { translations } from '../locales/translations';
import type { Language } from '../types';

type TranslateFunction = (key: string, options?: Record<string, string | number>) => string;

interface LocalizationContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: TranslateFunction;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'ces_coach_language';

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (storedLang === 'it' || storedLang === 'en') {
        return storedLang;
      }
    } catch (error) {
      console.error("Failed to load language from storage", error);
    }
    // Default to browser language if available, otherwise 'it'
    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'en' ? 'en' : 'it';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (error) {
      console.error("Failed to save language to storage", error);
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t: TranslateFunction = useCallback((key, options) => {
    let text = translations[language][key] || translations['it'][key] || key;
    if (options) {
      Object.keys(options).forEach(optKey => {
        text = text.replace(`{{${optKey}}}`, String(options[optKey]));
      });
    }
    return text;
  }, [language]);

  return (
    <LocalizationContext.Provider value={{ language, setLanguage, t }}>
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
