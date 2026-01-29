import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { runInInjectionContext, Injector } from '@angular/core';
import { vi } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthStore } from '../stores/auth.store';
import { UserProfile } from '../models/auth.models';

describe('authGuard', () => {
  let store: AuthStore;
  let router: { navigate: ReturnType<typeof vi.fn> };
  let injector: Injector;

  const mockUser: UserProfile = {
    id: '1',
    username: 'testuser',
    displayName: 'Test User',
    roles: ['user'],
    permissions: ['dashboard.view']
  };

  const createMockSegments = (path: string) => 
    path.split('/').filter(p => p).map(p => ({ path: p, parameters: {} }));

  beforeEach(async () => {
    const routerMock = {
      navigate: vi.fn().mockResolvedValue(true)
    };

    await TestBed.configureTestingModule({
      providers: [
        AuthStore,
        provideZonelessChangeDetection(),
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    store = TestBed.inject(AuthStore);
    router = TestBed.inject(Router) as unknown as { navigate: ReturnType<typeof vi.fn> };
    injector = TestBed.inject(Injector);
  });

  const runGuard = (segments: any[]) => {
    return runInInjectionContext(injector, () => authGuard(null as any, segments));
  };

  describe('when user is authenticated', () => {
    beforeEach(() => {
      store.setAuthenticated(mockUser, 'access-token', 3600);
    });

    it('should allow access to protected routes', () => {
      const segments = createMockSegments('dashboard/settings');

      const result = runGuard(segments);

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should allow access to root path', () => {
      const segments = createMockSegments('');

      const result = runGuard(segments);

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should allow access to nested routes', () => {
      const segments = createMockSegments('features/clothes/list');

      const result = runGuard(segments);

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      store.setUnauthenticated();
    });

    it('should redirect to login and block access', () => {
      const segments = createMockSegments('dashboard');

      const result = runGuard(segments);

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/dashboard' }
      });
    });

    it('should redirect to login with root returnUrl for empty path', () => {
      const segments = createMockSegments('');

      const result = runGuard(segments);

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/' }
      });
    });

    it('should redirect to login with full path for nested routes', () => {
      const segments = createMockSegments('features/clothes/edit/123');

      const result = runGuard(segments);

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/features/clothes/edit/123' }
      });
    });
  });

  describe('when auth status is unknown', () => {
    beforeEach(() => {
      // AuthStore starts with 'unknown' status by default
      expect(store.status()).toBe('unknown');
    });

    it('should block access without redirecting for unknown status', () => {
      const segments = createMockSegments('dashboard');

      const result = runGuard(segments);

      expect(result).toBe(false);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should block access for any route when status is unknown', () => {
      const segments = createMockSegments('features/clothes');

      const result = runGuard(segments);

      expect(result).toBe(false);
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('when user is refreshing token', () => {
    beforeEach(() => {
      // First authenticate, then set refreshing (this is how it works in practice)
      store.setAuthenticated(mockUser, 'access-token', 3600);
      store.setRefreshing();
    });

    it('should redirect to login when refreshing', () => {
      const segments = createMockSegments('dashboard');

      const result = runGuard(segments);

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/dashboard' }
      });
    });
  });

  describe('path construction', () => {
    beforeEach(() => {
      store.setUnauthenticated();
    });

    it('should handle single segment paths correctly', () => {
      const segments = createMockSegments('dashboard');

      runGuard(segments);

      expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/dashboard' }
      });
    });

    it('should handle multi-segment paths correctly', () => {
      const segments = createMockSegments('admin/users/profile');

      runGuard(segments);

      expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/admin/users/profile' }
      });
    });

    it('should handle paths with special characters', () => {
      const segments = createMockSegments('reports/user-123/details');

      runGuard(segments);

      expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/reports/user-123/details' }
      });
    });
  });
});