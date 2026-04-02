import '@testing-library/jest-dom';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import commonEn from './public/locales/en/common.json';
import dashboardEn from './public/locales/en/dashboard.json';
import projectHubEn from './public/locales/en/projectHub.json';
import reportsEn from './public/locales/en/reports.json';
import settingsEn from './public/locales/en/settings.json';
import sidebarEn from './public/locales/en/sidebar.json';

// Initialize i18next for all tests so components using useTranslation()
// render with real English strings instead of raw translation keys.
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    ns: ['common', 'dashboard', 'projectHub', 'reports', 'settings', 'sidebar'],
    defaultNS: 'common',
    resources: {
      en: {
        common: commonEn,
        dashboard: dashboardEn,
        projectHub: projectHubEn,
        reports: reportsEn,
        settings: settingsEn,
        sidebar: sidebarEn,
      },
    },
    interpolation: { escapeValue: false },
  });
}
