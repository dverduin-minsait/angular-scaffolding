import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Public routes: prerendered at build time for best FCP and SEO
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
  // Protected routes: client-side rendered because they require a user session
  // that is only available in the browser (HttpOnly cookie / access token in memory).
  {
    path: 'dashboard/**',
    renderMode: RenderMode.Client
  },
  {
    path: 'demo/**',
    renderMode: RenderMode.Client
  },
  {
    path: 'demo-books/**',
    renderMode: RenderMode.Client
  },
  // Fallback: client-side for any unmatched path
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];
