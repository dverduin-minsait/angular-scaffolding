import { Routes } from '@angular/router';

export const CLOTHES_ROUTES: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Catalog' },
    loadComponent: () => 
      import('./clothes-catalog.component').then(m => m.ClothesCatalogComponent)
  },
  {
    path: 'crud-abstract',
    title: 'Clothes CRUD (Abstract API)',
    data: { breadcrumb: 'CRUD Abstract' },
    loadComponent: () =>
      import('./crud-abstract/clothes-crud-abstract.component').then(m => m.ClothesCrudAbstractComponent)
  },
];