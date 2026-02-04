import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';

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
    canMatch: [authGuard],
    loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
  },
  {
    path: 'demo',
    data: { breadcrumb: 'Demos' },
    canMatch: [authGuard],
    loadChildren: () => import('./features/demo-pages/demo.routes').then(m => m.DEMO_ROUTES)
  },
  {
    path: 'forbidden',
    data: { breadcrumb: 'Forbidden' },
    loadComponent: () => import('./shared/components/forbidden/forbidden.component').then(c => c.ForbiddenComponent)
  },
  {
    path: 'demo-books',
    data: { breadcrumb: 'CRUD Demo' },
    canMatch: [authGuard],
    loadChildren: () => import('./features/demo-pages/demo-books/demo-books.routes').then(m => m.DEMO_BOOKS_ROUTES)
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
