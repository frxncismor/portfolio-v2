import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  APP_INITIALIZER,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import Aura from '@primeng/themes/aura';
import { I18nService } from './services/i18n.service';

export function initializeI18n(i18nService: I18nService) {
  return () => i18nService.initialize();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    providePrimeNG({
      theme: {
        preset: Aura,
      },
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeI18n,
      deps: [I18nService],
      multi: true,
    },
  ],
};
