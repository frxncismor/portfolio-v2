import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly DARK_CLASS = 'dark';

  // Signal to track current theme
  readonly currentTheme = signal<'light' | 'dark'>('light');

  /**
   * Initialize theme based on system preference
   */
  initializeTheme(): void {
    if (!this.isBrowser) {
      return;
    }

    // Get system preference
    const systemPreference = this.getSystemPreference();

    // Always use system preference
    this.currentTheme.set(systemPreference);
    this.applyTheme(systemPreference);
  }

  /**
   * Get system color scheme preference
   */
  private getSystemPreference(): 'light' | 'dark' {
    if (!this.isBrowser) {
      return 'light';
    }

    return globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * Apply theme to the document
   */
  private applyTheme(theme: 'light' | 'dark'): void {
    if (!this.isBrowser) {
      return;
    }

    this.currentTheme.set(theme);

    const htmlElement = document.documentElement;

    if (theme === 'dark') {
      htmlElement.classList.add(this.DARK_CLASS);
    } else {
      htmlElement.classList.remove(this.DARK_CLASS);
    }
  }

  /**
   * Listen to system theme changes
   */
  watchSystemTheme(): void {
    if (!this.isBrowser) {
      return;
    }

    const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)');

    // Use addEventListener (standard) or addListener (legacy) for browser support
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      // Always apply system preference
      const isDark = 'matches' in e ? e.matches : (e as MediaQueryList).matches;
      const newTheme = isDark ? 'dark' : 'light';
      this.currentTheme.set(newTheme);
      this.applyTheme(newTheme);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else if (mediaQuery.addListener) {
      // Fallback for older browsers (deprecated but needed for compatibility)
      // eslint-disable-next-line deprecation/deprecation
      mediaQuery.addListener(handler);
    }
  }
}
