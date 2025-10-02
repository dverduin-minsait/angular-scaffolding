import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Dashboard' },
    loadComponent: () => import('./dashboard.component').then(c => c.DashboardComponent)
  }
];