export const locales = ['ru', 'uk', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ru';

export const localeNames: Record<Locale, string> = {
  ru: 'Русский',
  uk: 'Українська',
  en: 'English',
};
