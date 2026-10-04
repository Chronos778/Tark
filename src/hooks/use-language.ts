import { useState, useEffect, useCallback } from 'react';

export type AppLanguage = 'en' | 'hi';

const STORAGE_KEY = 'nyaya_language';
const EVENT_NAME = 'nyaya-language-change';

export function useLanguage() {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'hi' || saved === 'en') {
        return saved;
      }
    }
    return 'en';
  });

  const setLanguage = useCallback((newLang: AppLanguage) => {
    setLanguageState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newLang);
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: newLang }));
    }
  }, []);

  useEffect(() => {
    const handleEvent = (e: Event) => {
      const custom = e as CustomEvent<AppLanguage>;
      if (custom.detail && (custom.detail === 'en' || custom.detail === 'hi')) {
        setLanguageState(custom.detail);
      }
    };

    window.addEventListener(EVENT_NAME, handleEvent);
    return () => {
      window.removeEventListener(EVENT_NAME, handleEvent);
    };
  }, []);

  return { language, setLanguage };
}
