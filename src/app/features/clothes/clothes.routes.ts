import { Routes } from '@angular/router';

export const CLOTHES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => 
      import('./clothes-catalog.component').then(m => m.ClothesCatalogComponent)
  },
  {
    path: 'crud-abstract',
    title: 'Clothes CRUD (Abstract API)',
    loadComponent: () =>
      import('./crud-abstract/clothes-crud-abstract.component').then(m => m.ClothesCrudAbstractComponent)
  },
];