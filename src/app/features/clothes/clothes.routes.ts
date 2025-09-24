import { Routes } from '@angular/router';

export const CLOTHES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => 
      import('./clothes-catalog.component').then(m => m.ClothesCatalogComponent)
  }
];