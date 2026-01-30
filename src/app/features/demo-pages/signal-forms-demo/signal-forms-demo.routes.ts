import { Routes } from '@angular/router';

/** Lazy routes for the Signal Forms demo page. */
export const SIGNAL_FORMS_DEMO_ROUTES: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Signal Forms' },
    loadComponent: () =>
      import('./signal-forms-demo.component').then(m => m.SignalFormsDemoComponent)
  }
];
