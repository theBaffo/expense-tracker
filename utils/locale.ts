import { de, en, enGB, it, registerTranslation } from 'react-native-paper-dates';

// ─── Translation registry ─────────────────────────────────────────────────────

// Keys are the locale strings used by registerTranslation / DatePickerModal.
const TRANSLATIONS: Record<string, any> = {
  de,
  en,
  'en-GB': enGB,
  it,
};

/** Register every supported locale once at app startup. */
export function registerAllTranslations() {
  for (const [locale, translation] of Object.entries(TRANSLATIONS)) {
    registerTranslation(locale, translation);
  }
}

// ─── Locale resolution ────────────────────────────────────────────────────────

const SUPPORTED = Object.keys(TRANSLATIONS);

/**
 * Given a BCP 47 language tag (e.g. "en-US", "fr-FR", "zh-Hans-CN"),
 * returns the best matching locale key supported by react-native-paper-dates,
 * defaulting to "en".
 */
export function resolvePickerLocale(languageTag: string): string {
  // 1. Exact match (handles "en-GB", "zh-TW", "uk-UA", "no-NO" correctly)
  if (SUPPORTED.includes(languageTag)) return languageTag;

  // 2. Match a supported locale whose base language matches (e.g. "fr-FR" → "fr")
  const base = languageTag.split('-')[0];
  const match = SUPPORTED.find((s) => s === base || s.startsWith(`${base}-`));

  if (match) return match;

  return 'en';
}
