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
    canMatch: [() => import('./core/auth/guards/auth.guard').then(m => m.authGuard)],
    loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
  },
  {
    path: 'theme-demo',
    data: { breadcrumb: 'Theme Demo' },
    canMatch: [
      () => import('./core/auth/guards/auth.guard').then(m => m.authGuard)
    ],
    loadChildren: () => import('./features/theme-demo/theme-demo.routes').then(m => m.THEME_DEMO_ROUTES)
  },
  {
    path: 'forbidden',
    data: { breadcrumb: 'Forbidden' },
    loadComponent: () => import('./shared/components/forbidden/forbidden.component').then(c => c.ForbiddenComponent)
  },
  {
    path: 'clothes',
    data: { breadcrumb: 'Clothes' },
    canMatch: [
      () => import('./core/auth/guards/auth.guard').then(m => m.authGuard),
      () => import('./core/auth/guards/permission.guard').then(m => m.permissionGuard(['clothes.view']))
    ],
    loadChildren: () => import('./features/clothes/clothes.routes').then(m => m.CLOTHES_ROUTES)
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
