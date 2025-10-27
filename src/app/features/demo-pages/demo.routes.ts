import { Routes } from '@angular/router';

export const DEMO_ROUTES: Routes = [
  {
    path: 'theme-demo',
    loadChildren: () => import('./theme-demo/theme-demo.routes').then(m => m.THEME_DEMO_ROUTES)
  },
  {
    path: 'books-demo',
    loadChildren: () => import('./demo-books/demo-books.routes').then(m => m.DEMO_BOOKS_ROUTES)
  },
  {
    path: '',
    redirectTo: 'theme-demo',
    pathMatch: 'full'
  }
];