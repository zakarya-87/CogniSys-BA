import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    load: 'languageOnly', // strips region: en-GB → en, fr-FR → fr
    debug: process.env.NODE_ENV === 'development',
    ns: ['common', 'dashboard', 'settings', 'sidebar', 'projectHub', 'reports'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['localStorage', 'cookie', 'navigator'],
      caches: ['localStorage', 'cookie'],
    },
  });

// Handle RTL for Arabic and set language-specific classes
i18n.on('languageChanged', (lng) => {
  const dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
  
  // Add language-specific classes to body for targeted styling
  document.body.classList.remove('lang-en', 'lang-fr', 'lang-ar');
  document.body.classList.add(`lang-${lng}`);
});

export default i18n;
