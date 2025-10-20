import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from '../stores/auth.store';

// Route guard using canMatch to prevent loading feature modules for unauthenticated users.
// Redirects to /auth/login with returnUrl param.
export const authGuard: CanMatchFn = (_route, segments) => {
  const store = inject(AuthStore);
  const router = inject(Router);
  const status = store.status();
  const target = '/' + segments.map(s => s.path).join('/');

  // Structured log (use a consistent prefix so it can be filtered)
  // eslint-disable-next-line no-console
  console.log('[AuthGuard] evaluating', { target, status });

  // Block access for any non-authenticated state
  if (status !== 'authenticated') {
    if (status === 'unknown') {
      // eslint-disable-next-line no-console
      console.log('[AuthGuard] status unknown -> block match (show splash)');
      return false;
    }
    
    // For unauthenticated, refreshing, or any other non-authenticated state
    // eslint-disable-next-line no-console
    console.log('[AuthGuard] not authenticated (status:', status, ') -> redirect to login', { target });
    
    // Navigate immediately and block the route
    router.navigate(['/auth/login'], { 
      queryParams: { returnUrl: target || '/' }
    });
    return false;
  }
  
  // eslint-disable-next-line no-console
  console.log('[AuthGuard] authenticated -> allow', { target });
  return true;
};
