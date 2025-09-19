import { Routes } from '@angular/router';

export const THEME_DEMO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./theme-demo.component').then(c => c.ThemeDemoComponent)
  }
];