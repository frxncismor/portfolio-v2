import { Injectable, signal, computed } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import localeEn from '@angular/common/locales/en';

registerLocaleData(localeEs);
registerLocaleData(localeEn);

export type SupportedLocale = 'es' | 'en';

export interface Translations {
  [key: string]: string | Translations;
}

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private readonly translations: Record<SupportedLocale, Translations> = {
    es: {},
    en: {},
  };

  private readonly currentLocale = signal<SupportedLocale>(this.detectDeviceLanguage());
  private readonly translationsLoaded = signal<boolean>(false);

  readonly locale = this.currentLocale.asReadonly();
  readonly isReady = this.translationsLoaded.asReadonly();

  readonly t = computed(() => {
    const locale = this.currentLocale();
    const loaded = this.translationsLoaded();
      return (key: string): string => {
        if (!loaded) {
          return key;
        }
        return this.getTranslation(key, locale);
      };
  });

  private async loadTranslations(): Promise<void> {
    try {
      const [esTranslations, enTranslations] = await Promise.all([
        fetch('/assets/i18n/es.json').then((res) => {
          if (!res.ok) throw new Error(`Failed to load es.json: ${res.status}`);
          return res.json();
        }),
        fetch('/assets/i18n/en.json').then((res) => {
          if (!res.ok) throw new Error(`Failed to load en.json: ${res.status}`);
          return res.json();
        }),
      ]);

      this.translations.es = esTranslations;
      this.translations.en = enTranslations;
      this.translationsLoaded.set(true);

      this.currentLocale.update((locale) => locale);
    } catch (error) {
      console.error('Error loading translations:', error);
      this.translationsLoaded.set(true);
    }
  }

  setLocale(locale: SupportedLocale): void {
    this.currentLocale.set(locale);
    document.documentElement.lang = locale;
    localStorage.setItem('locale', locale);
  }

  getLocale(): SupportedLocale {
    return this.currentLocale();
  }

  getTranslation(key: string, locale: SupportedLocale): string {
    const keys = key.split('.');
    let value: any = this.translations[locale];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  }

  getTranslationValue(key: string, locale?: SupportedLocale): any {
    const currentLocale = locale || this.currentLocale();
    const keys = key.split('.');
    let value: any = this.translations[currentLocale];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return null;
      }
    }

    return value;
  }

  private detectDeviceLanguage(): SupportedLocale {
    const savedLocale = localStorage.getItem('locale');
    if (savedLocale === 'es' || savedLocale === 'en') {
      return savedLocale;
    }

    const browserLanguage = navigator.language || (navigator as any).userLanguage;
    if (browserLanguage) {
      const detectedLocale = this.normalizeLocale(browserLanguage);
      if (detectedLocale) {
        return detectedLocale;
      }
    }

    if (navigator.languages && navigator.languages.length > 0) {
      for (const lang of navigator.languages) {
        const detectedLocale = this.normalizeLocale(lang);
        if (detectedLocale) {
          return detectedLocale;
        }
      }
    }

    return 'es';
  }

  private normalizeLocale(locale: string): SupportedLocale | null {
    if (!locale) {
      return null;
    }

    const baseLocale = locale.split('-')[0].toLowerCase();

    const localeMap: Record<string, SupportedLocale> = {
      es: 'es',
      en: 'en',
    };

    return localeMap[baseLocale] || null;
  }

  async initialize(): Promise<void> {
    const currentLocale = this.currentLocale();

    document.documentElement.lang = currentLocale;
    localStorage.setItem('locale', currentLocale);

    await this.loadTranslations();

    this.currentLocale.update((locale) => locale);
  }
}
