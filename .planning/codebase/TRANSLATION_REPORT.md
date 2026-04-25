# Translation Services Report

## Executive Summary

This document provides a comprehensive analysis of the internationalization (i18n) and translation services in the CogniSys BA application.

- **Framework**: i18next with react-i18next
- **Supported Languages**: English (en), French (fr), Arabic (ar)
- **RTL Support**: Arabic (ar) is configured for right-to-left layout
- **Namespaces**: 6 (common, dashboard, settings, sidebar, projectHub, reports)

---

## File Inventory

### Configuration

| File | Purpose |
|------|---------|
| `src/i18n.ts` | i18next initialization with HttpBackend, LanguageDetector |

### UI Components

| File | Purpose |
|------|---------|
| `src/components/ui/LanguageSwitcher.tsx` | Language selector dropdown |

### Locale Files

| Language | Namespace Files |
|----------|---------------|
| en | common.json, dashboard.json, sidebar.json, settings.json, reports.json, projectHub.json |
| fr | common.json, dashboard.json, sidebar.json, settings.json, reports.json, projectHub.json |
| ar | common.json, dashboard.json, sidebar.json, settings.json, reports.json, projectHub.json |

---

## Current Status by Namespace

| Namespace | English | French | Arabic | Status |
|-----------|---------|--------|--------|--------|
| common | 112 keys | 112 keys | 112 keys | ✅ OK |
| dashboard | 438 lines | 438 lines | 438 lines | ⚠️ Duplicate key |
| sidebar | 16 keys | 14 keys | 14 keys | ❌ Missing keys |
| settings | 24 keys | 24 keys | 24 keys | ✅ OK |
| reports | 46 keys | 46 keys | 46 keys | ✅ OK |
| projectHub | ✅ | ✅ | ✅ | ✅ OK |

---

## Issues Identified

### Issue #1: Duplicate Key in dashboard.json

**Severity**: High

**Location**: `public/locales/en/dashboard.json`

**Problem**: The key `intelligenceCenter` is defined twice in the English dashboard translation file:

1. First occurrence: Lines 334-385 (under `dashboard.strategy.tools.intelligenceCenter`)
2. Second occurrence: Lines 387-437 (at top-level `dashboard.intelligenceCenter`)

**Impact**: Unpredictable behavior when accessing `t('dashboard:intelligenceCenter.*')` - i18next may resolve to either definition randomly.

**Recommendation**: Rename one of the keys. Suggested fix:
- Rename the tool key to `strategy.tools.intelligenceCenter` (keep as-is)
- Rename the top-level key to `intelligenceCenterTop` or remove the duplicate entirely

---

### Issue #2: Missing French Sidebar Translations

**Severity**: Medium

**Location**: `public/locales/fr/sidebar.json`

**Problem**: French sidebar is missing 2 keys that exist in English:
- `initiatives`
- `oracle`

**Current French Keys** (14):
```json
{
  "dashboard": "Tableau de bord",
  "projectHub": "Centre de projet",
  "intelligenceCenter": "Centre d'intelligence",
  "reports": "Rapports",
  "settings": "Paramètres",
  "help": "Aide",
  "myWorkspace": "Mon espace de travail",
  "hive": "La Ruche",
  "cortex": "Cortex",
  "predictiveCore": "Noyau prédictif",
  "pulse": "Pulsation",
  "warRoom": "Salle de crise",
  "construct": "Construction",
  "visionBoard": "Tableau de vision"
}
```

**Missing Keys** (need to add):
```json
{
  "initiatives": "Initiatives",
  "oracle": "The Oracle"
}
```

---

### Issue #3: Missing Arabic Sidebar Translations

**Severity**: Medium

**Location**: `public/locales/ar/sidebar.json`

**Problem**: Arabic sidebar is missing 2 keys that exist in English:
- `initiatives`
- `oracle`

**Current Arabic Keys** (14):
```json
{
  "dashboard": "لوحة القيادة",
  "projectHub": "مركز المشاريع",
  "intelligenceCenter": "مركز الاستخبارات",
  "reports": "التقارير",
  "settings": "الإعدادات",
  "help": "مساعدة",
  "myWorkspace": "مساحة عملي",
  "hive": "الخلية",
  "cortex": "القشرة",
  "predictiveCore": "النواة التنبؤية",
  "pulse": "النبض",
  "warRoom": "غرفة العمليات",
  "construct": "البناء",
  "visionBoard": "لوحة الرؤية"
}
```

**Missing Keys** (need to add):
```json
{
  "initiatives": "المبادرات",
  "oracle": "الأوراكل"
}
```

---

## Configuration Details

### i18n Initialization (`src/i18n.ts`)

```typescript
i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    load: 'languageOnly',
    ns: ['common', 'dashboard', 'settings', 'sidebar', 'projectHub', 'reports'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' },
    detection: { order: ['localStorage', 'cookie', 'navigator'], caches: ['localStorage', 'cookie'] },
  });
```

### RTL Handling

The language change handler sets document direction:

```typescript
i18n.on('languageChanged', (lng) => {
  const dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
  document.body.classList.remove('lang-en', 'lang-fr', 'lang-ar');
  document.body.classList.add(`lang-${lng}`);
});
```

---

## Language Switcher Component

**Location**: `src/components/ui/LanguageSwitcher.tsx`

### Supported Languages

| Code | Name | Flag |
|------|------|------|
| en | English | 🇺🇸 |
| fr | Français | 🇫🇷 |
| ar | العربية | 🇸🇦 |

### Usage

```typescript
const { i18n } = useTranslation();
const changeLanguage = (code: string) => {
  i18n.changeLanguage(code);
};
```

---

## Usage in Components

The application uses `useTranslation` hook across many components:

| Component Count | Namespaces Used |
|-----------------|-----------------|
| 40+ components | common, dashboard, sidebar, settings, projectHub, reports |

Example usage patterns:
```typescript
const { t } = useTranslation(['common', 'dashboard']);
const { t, i18n } = useTranslation(['dashboard', 'common']);
```

---

## Action Items

### Priority 1: Fix Duplicate Key (High)

- [ ] Rename duplicate `intelligenceCenter` key in `dashboard.json`

### Priority 2: Add Missing Translations (Medium)

- [ ] Add French: `initiatives`, `oracle` to `sidebar.json`
- [ ] Add Arabic: `initiatives`, `oracle` to `sidebar.json`

### Priority 3: Verification (Low)

- [ ] Run TypeScript check for unused translation keys
- [ ] Verify all components use correct namespace prefixes
- [ ] Test language switching works for all 3 languages

---

## Recommendations

1. **Implement Missing Key Detection**: Add a CI check to catch missing translation keys
2. **Document Translation Naming Conventions**: Establish consistent key naming (e.g., `view:section.element`)
3. **Add RTL Testing**: Ensure all UI components work correctly in RTL mode
4. **Consider Adding New Languages**: Plan for future language additions (e.g., Spanish, German)

---

## Appendix: Translation Key Hierarchy

### Common Namespace
```
common
├── welcome, dashboard, initiatives, projectHub, intelligenceCenter, reports, settings, help
├── myWorkspace, hive, cortex, predictiveCore, pulse, warRoom, construct, visionBoard
├── search, create, cancel, save, edit, delete, back, loading, error, noData
├── phases, categories, modules (112 keys)
```

### Dashboard Namespace
```
dashboard
├── title, subtitle, activeInitiatives, completedInitiatives, pendingTasks, efficiency
├── actions, initiative, visionBoard, construct, cortex, hive, strategy, intelligenceCenter
├── (438 lines with nested objects)
```

### Sidebar Namespace
```
sidebar
├── dashboard, projectHub, intelligenceCenter, reports, settings, help
├── myWorkspace, hive, cortex, predictiveCore, pulse, warRoom, construct
├── visionBoard, initiatives, oracle (16 keys)
```

### Settings Namespace
```
settings
├── title, language, theme, notifications, profile, appearance, light, dark
├── aiConfig, activeModel, diagnostics, dataPortability, export, import
├── dangerZone, reset (24 keys)
```

---

*Report generated: April 2026*