import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  APP_INITIALIZER,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import Aura from '@primeng/themes/aura';
import { I18nService } from './services/i18n.service';
import { ThemeService } from './services/theme.service';

export function initializeI18n(i18nService: I18nService) {
  return () => i18nService.initialize();
}

export function initializeTheme(themeService: ThemeService) {
  return () => {
    themeService.initializeTheme();
    themeService.watchSystemTheme();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark',
        },
      },
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeI18n,
      deps: [I18nService],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeTheme,
      deps: [ThemeService],
      multi: true,
    },
  ],
};
