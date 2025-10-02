import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    data: { breadcrumb: 'Auth' },
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'dashboard',
    data: { breadcrumb: 'Dashboard' },
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
  },
  {
    path: 'theme-demo',
    data: { breadcrumb: 'Theme Demo' },
    loadChildren: () =>
      import('./features/theme-demo/theme-demo.routes').then(m => m.THEME_DEMO_ROUTES)
  },
  {
    path: 'clothes',
    data: { breadcrumb: 'Clothes' },
    loadChildren: () =>
      import('./features/clothes/clothes.routes').then(m => m.CLOTHES_ROUTES)
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
