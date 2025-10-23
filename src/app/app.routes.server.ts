import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Only prerender public routes during SSR
  {
    path: '',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'auth/**',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'forbidden',
    renderMode: RenderMode.Prerender
  },
  // Protected routes should render on demand, not prerender
  {
    path: 'dashboard/**',
    renderMode: RenderMode.Server
  },
  {
    path: 'clothes/**',
    renderMode: RenderMode.Server
  },
  {
    path: 'theme-demo/**',
    renderMode: RenderMode.Server
  },
  // Wildcard route for any unmatched paths
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];
