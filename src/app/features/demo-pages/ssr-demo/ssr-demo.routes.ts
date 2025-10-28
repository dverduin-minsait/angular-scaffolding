import { Routes } from '@angular/router';

export const SSR_DEMO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/ssr-page/ssr-page.component').then(
        m => m.SsrPageComponent
      )
  },
];
