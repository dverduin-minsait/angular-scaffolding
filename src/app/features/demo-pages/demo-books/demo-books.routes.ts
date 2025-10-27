import { Routes } from '@angular/router';

export const DEMO_BOOKS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./demo-book-crud.component').then(m => m.DemoBookCrudComponent),
    title: 'CRUD Demo - Books'
  }
];