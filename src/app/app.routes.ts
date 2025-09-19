import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
  },
  {
    path: 'theme-demo',
    loadChildren: () =>
      import('./features/theme-demo/theme-demo.routes').then(m => m.THEME_DEMO_ROUTES)
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
