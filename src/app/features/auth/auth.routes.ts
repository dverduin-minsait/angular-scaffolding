import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    data: { breadcrumb: 'Login' },
    loadComponent: () => import('./login/login.component').then(c => c.LoginComponent)
  },
  {
    path: 'register',
    data: { breadcrumb: 'Register' },
    loadComponent: () => import('./register/register.component').then(c => c.RegisterComponent)
  }
];