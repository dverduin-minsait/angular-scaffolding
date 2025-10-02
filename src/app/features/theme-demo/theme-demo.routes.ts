import { Routes } from '@angular/router';

export const THEME_DEMO_ROUTES: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Theme Demo' },
    loadComponent: () => import('./theme-demo.component').then(c => c.ThemeDemoComponent)
  }
];