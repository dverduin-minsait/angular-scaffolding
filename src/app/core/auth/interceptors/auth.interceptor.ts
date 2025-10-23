import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { AuthStore } from '../stores/auth.store';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, switchMap, take } from 'rxjs/operators';

// Full refresh queue: multiple concurrent 401-failing requests pause until single refresh completes.
// We use module-level singletons (closure) to coordinate queue across interceptor invocations.
let refreshInFlight = false;
const refreshSubject = new Subject<boolean>();

// Test helper to reset internal state (not used in production code paths)
export function __resetAuthInterceptorTestState(): void {
  refreshInFlight = false;
  // Reset the refresh state for testing
}

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const store = inject(AuthStore);
  const service = inject(AuthService);

  const withAuth = (r: HttpRequest<unknown>): HttpRequest<unknown> => {
    const t = store.accessToken();
    return t ? r.clone({ setHeaders: { Authorization: `Bearer ${t}` } }) : r;
  };

  return next(withAuth(req)).pipe(
    catchError((err: unknown) => {
      const httpError = err as { status?: number };
      if (httpError.status !== 401) return throwError(() => err);

      // If not authenticated no point refreshing
      if (!store.isAuthenticated()) {
        return throwError(() => err);
      }

      if (!refreshInFlight) {
        refreshInFlight = true;
        // Kick off refresh
        service.refreshAccessToken().then(success => {
          refreshSubject.next(success);
          refreshInFlight = false;
        }).catch(() => {
          refreshSubject.next(false);
          refreshInFlight = false;
        });
      }

      // Wait for refresh result then replay (or error)
      return refreshSubject.pipe(
        take(1),
        switchMap(success => {
          if (!success) return throwError(() => err);
          return next(withAuth(req));
        })
      );
    })
  );
};
