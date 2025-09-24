import { mergeApplicationConfig, ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // Disable animations on server for better performance
    importProvidersFrom(NoopAnimationsModule),
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
