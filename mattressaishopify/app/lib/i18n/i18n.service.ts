/**
 * i18n Service
 * Simple internationalization for storefront widgets
 */

import strings from './storefront-strings.json';

type Locale = 'en';
type StringKeys = typeof strings.en;

let currentLocale: Locale = 'en';

/**
 * Set the current locale
 */
export function setLocale(locale: Locale) {
  currentLocale = locale;
}

/**
 * Get current locale
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Get translated string by key path
 */
export function t(key: string, replacements?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: any = strings[currentLocale];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // Fallback to key if not found
    }
  }

  if (typeof value !== 'string') {
    return key;
  }

  // Replace placeholders
  if (replacements) {
    return value.replace(/\{\{(\w+)\}\}/g, (match, placeholder) => {
      return String(replacements[placeholder] ?? match);
    });
  }

  return value;
}

/**
 * Check if a key exists
 */
export function hasKey(key: string): boolean {
  const keys = key.split('.');
  let value: any = strings[currentLocale];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return false;
    }
  }

  return typeof value === 'string';
}

/**
 * Get all strings for current locale
 */
export function getAllStrings() {
  return strings[currentLocale];
}

