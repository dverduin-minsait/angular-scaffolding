import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from '../stores/auth.store';
import { AuthService } from '../services/auth.service';

// Route guard using canMatch to prevent loading feature modules for unauthenticated users.
// Redirects to /auth/login with returnUrl param.
export const authGuard: CanMatchFn = (_route, segments) => {
  const store = inject(AuthStore);
  const router = inject(Router);
  const auth = inject(AuthService);
  const status = store.status();
  const target = '/' + segments.map(s => s.path).join('/');

  // Structured log (use a consistent prefix so it can be filtered)
   
  console.log('[AuthGuard] evaluating', { target, status });

  // Fast path
  if (status === 'authenticated') {
    console.log('[AuthGuard] authenticated -> allow', { target });
    return true;
  }

  // If we are still initializing, block match without redirect (splash will show).
  if (status === 'unknown') {
    console.log('[AuthGuard] status unknown -> attempt init + block match');
    void auth.ensureInitialized();
    return false;
  }

  // For unauthenticated/refreshing: attempt a silent init once (no manual login)
  console.log('[AuthGuard] not authenticated -> attempt silent init', { target, status });

  return auth.ensureInitialized().then(() => {
    if (store.status() === 'authenticated') {
      console.log('[AuthGuard] silent init succeeded -> allow', { target });
      return true;
    }

    // Silent init failed (could be 401, 404, 500, network error, etc.) - block access
    console.log('[AuthGuard] silent init failed -> redirect to login', { target });
    return router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: target || '/' }
    });
  }).catch((error: unknown) => {
    // Handle any unexpected errors during initialization
    console.error('[AuthGuard] initialization error', error);
    return router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: target || '/' }
    });
  });
  
  
};
