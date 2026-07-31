"use client";

import { createContext, useContext, useState, useEffect } from "react";
import translations from "./i18n/index";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  // Initialize from localStorage if available
  const [language, setLanguageState] = useState("en");
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved language preference on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage && translations[savedLanguage]) {
      setLanguageState(savedLanguage);
    }
    setIsInitialized(true);
  }, []);

  const setLanguage = (newLanguage) => {
    setLanguageState(newLanguage);
    localStorage.setItem("language", newLanguage);
  };

  const t = translations[language] ?? translations.en;

  // Update document direction and lang attribute when language changes
  useEffect(() => {
    if (!isInitialized) return;
    
    const isRTL = language === "ar";
    const html = document.documentElement;
    
    html.setAttribute("lang", language);
    html.setAttribute("dir", isRTL ? "rtl" : "ltr");
    
    // Optional: Update document body direction for better compatibility
    document.body.style.direction = isRTL ? "rtl" : "ltr";
  }, [language, isInitialized]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
