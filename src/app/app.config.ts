import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay, withNoHttpTransferCache } from '@angular/platform-browser';
import { localStorageProvider } from './core/tokens/local.storage.token';
import { ENVIRONMENT } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideClientHydration(
      withEventReplay(),
      // Disable HTTP transfer cache for dynamic imports to ensure fresh loading
      withNoHttpTransferCache()
    ),
    // Environment providers
    ...ENVIRONMENT.PROVIDERS,
    // Core tokens
    localStorageProvider
  ]
};
