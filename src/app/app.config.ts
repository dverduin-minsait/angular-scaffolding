/* REWRITING FILE BELOW */
import { ApplicationConfig, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration, withEventReplay, withNoHttpTransferCache } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { localStorageProvider } from './core/tokens/local.storage.token';
import { ENVIRONMENT } from '../environments/environment';

// Application configuration with blocking translation initialization.
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    TranslateModule.forRoot({ fallbackLang: 'en' }).providers!,
    provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
    provideClientHydration(
      withEventReplay(),
      withNoHttpTransferCache()
    ),
    provideAppInitializer(() => {
      const translate = inject(TranslateService);
      return translationInitializer(translate)();
    }),
    ...ENVIRONMENT.PROVIDERS,
    localStorageProvider
  ]
};

function translationInitializer(translate: TranslateService) {
  return async () => {
    const supported = ['en', 'es', 'pt', 'ca', 'gl'];

    const stored = safeLocalStorageGet('app.lang');
    const browser = detectBrowserLang(supported);

    let chosen = stored && supported.includes(stored) ? stored : (browser || 'es');
    if (!supported.includes(chosen)) {
      chosen = 'es';
    }

    translate.setDefaultLang('es');
    try {
      await firstValueFrom(translate.use(chosen));
    } catch {
      if (chosen !== 'es') {
        await firstValueFrom(translate.use('es'));
      }
    }
  };
}

function safeLocalStorageGet(key: string): string | undefined {
  if (typeof window === 'undefined') return undefined; // SSR guard
  try {
    return localStorage.getItem(key) || undefined;
  } catch {
    return undefined;
  }
}

function detectBrowserLang(supported: string[]): string | undefined {
  if (typeof navigator === 'undefined') return undefined; // SSR guard
  const candidates = [navigator.language, ...(navigator.languages || [])].filter(Boolean) as string[];
  return candidates.map(l => l.slice(0, 2)).find(l => supported.includes(l));
}