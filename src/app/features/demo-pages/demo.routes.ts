import { Routes } from '@angular/router';

export const DEMO_ROUTES: Routes = [
  {
    path: 'theme-demo',
    data: { breadcrumb: 'Theme' },
    loadChildren: () => import('./theme-demo/theme-demo.routes').then(m => m.THEME_DEMO_ROUTES)
  },
  {
    path: 'signal-forms-demo',
    data: { breadcrumb: 'Signal Forms' },
    loadChildren: () =>
      import('./signal-forms-demo/signal-forms-demo.routes').then(m => m.SIGNAL_FORMS_DEMO_ROUTES)
  },
  {
    path: 'books-demo',
    data: { breadcrumb: 'Books CRUD' },
    loadChildren: () => import('./demo-books/demo-books.routes').then(m => m.DEMO_BOOKS_ROUTES)
  },
  {
    path: 'ssr-demo',
    data: { breadcrumb: 'SSR' },
    loadChildren: () => import('./ssr-demo/ssr-demo.routes').then(m => m.SSR_DEMO_ROUTES)
  },
  {
    path: '',
    redirectTo: 'theme-demo',
    pathMatch: 'full'
  }
];