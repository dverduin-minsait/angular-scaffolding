import { Routes } from '@angular/router';

export const MAP_DEMO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./map-demo.component').then(m => m.MapDemoComponent),
    title: 'Map Demo'
  }
];
