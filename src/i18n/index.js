import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import en from './translations/en';
import es from './translations/es';
import fr from './translations/fr';
import de from './translations/de';
import it from './translations/it';
import pt from './translations/pt';
import zh from './translations/zh';
import ja from './translations/ja';
import ko from './translations/ko';
import ar from './translations/ar';

const i18n = new I18n({ en, es, fr, de, it, pt, zh, ja, ko, ar });

i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'ar', name: 'العربية' },
];

export const getSystemLanguage = () => {
  try {
    const locales = Localization.getLocales();
    const locale = locales[0]?.languageCode || 'en';
    const supported = SUPPORTED_LANGUAGES.map((l) => l.code);
    return supported.includes(locale) ? locale : 'en';
  } catch {
    return 'en';
  }
};

export const setLocale = (lang) => {
  i18n.locale = lang;
};

export const t = (key, options) => i18n.t(key, options);

export default i18n;
