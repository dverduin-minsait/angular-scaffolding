import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { runInInjectionContext, Injector } from '@angular/core';
import { vi } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthStore } from '../stores/auth.store';
import { UserProfile } from '../models/auth.models';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let store: AuthStore;
  let router: { navigate: ReturnType<typeof vi.fn>; createUrlTree: ReturnType<typeof vi.fn> };
  let injector: Injector;
  let authService: { ensureInitialized: ReturnType<typeof vi.fn> };

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
      navigate: vi.fn().mockResolvedValue(true),
      createUrlTree: vi.fn().mockReturnValue({ __urlTree: true })
    };

    const authServiceMock = {
      ensureInitialized: vi.fn().mockResolvedValue(undefined)
    };

    await TestBed.configureTestingModule({
      providers: [
        AuthStore,
        provideZonelessChangeDetection(),
        { provide: Router, useValue: routerMock },
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();

    store = TestBed.inject(AuthStore);
    router = TestBed.inject(Router) as unknown as { navigate: ReturnType<typeof vi.fn>; createUrlTree: ReturnType<typeof vi.fn> };
    injector = TestBed.inject(Injector);
    authService = TestBed.inject(AuthService) as unknown as { ensureInitialized: ReturnType<typeof vi.fn> };
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
      expect(authService.ensureInitialized).not.toHaveBeenCalled();
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

    it('should attempt silent init and allow if it authenticates', async () => {
      const segments = createMockSegments('dashboard');

      authService.ensureInitialized.mockImplementation(async () => {
        store.setAuthenticated(mockUser, 'token', 3600);
      });

      const result = runGuard(segments);
      const resolved = await Promise.resolve(result as any);

      expect(resolved).toBe(true);
      expect(authService.ensureInitialized).toHaveBeenCalledTimes(1);
      expect(router.createUrlTree).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should attempt silent init and redirect to login if it fails', async () => {
      const segments = createMockSegments('dashboard');

      authService.ensureInitialized.mockResolvedValue(undefined);

      const result = runGuard(segments);
      const resolved = await Promise.resolve(result as any);

      expect(resolved).toEqual({ __urlTree: true });
      expect(authService.ensureInitialized).toHaveBeenCalledTimes(1);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/dashboard' }
      });
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should redirect to login with root returnUrl for empty path (when init fails)', async () => {
      const segments = createMockSegments('');

      authService.ensureInitialized.mockResolvedValue(undefined);

      const result = runGuard(segments);
      const resolved = await Promise.resolve(result as any);

      expect(resolved).toEqual({ __urlTree: true });
      expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/' }
      });
    });

    it('should redirect to login with full path for nested routes (when init fails)', async () => {
      const segments = createMockSegments('features/clothes/edit/123');

      authService.ensureInitialized.mockResolvedValue(undefined);

      const result = runGuard(segments);
      const resolved = await Promise.resolve(result as any);

      expect(resolved).toEqual({ __urlTree: true });
      expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/features/clothes/edit/123' }
      });
    });

    it('should redirect to login when auth endpoint returns 404', async () => {
      const segments = createMockSegments('dashboard');

      authService.ensureInitialized.mockRejectedValue({ status: 404, message: 'Not Found' });

      const result = runGuard(segments);
      const resolved = await Promise.resolve(result as any);

      expect(resolved).toEqual({ __urlTree: true });
      expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/dashboard' }
      });
    });

    it('should redirect to login when auth endpoint returns 500', async () => {
      const segments = createMockSegments('dashboard');

      authService.ensureInitialized.mockRejectedValue({ status: 500, message: 'Server Error' });

      const result = runGuard(segments);
      const resolved = await Promise.resolve(result as any);

      expect(resolved).toEqual({ __urlTree: true });
      expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/dashboard' }
      });
    });
  });

  describe('when auth status is unknown', () => {
    beforeEach(() => {
      // AuthStore starts with 'unknown' status by default
      expect(store.status()).toBe('unknown');
    });

    it('should trigger silent init but block access without redirecting', () => {
      const segments = createMockSegments('dashboard');

      const result = runGuard(segments);

      expect(result).toBe(false);
      expect(authService.ensureInitialized).toHaveBeenCalledTimes(1);
      expect(router.navigate).not.toHaveBeenCalled();
      expect(router.createUrlTree).not.toHaveBeenCalled();
    });

    it('should block access for any route when status is unknown', () => {
      const segments = createMockSegments('features/clothes');

      const result = runGuard(segments);

      expect(result).toBe(false);
      expect(authService.ensureInitialized).toHaveBeenCalledTimes(1);
      expect(router.navigate).not.toHaveBeenCalled();
      expect(router.createUrlTree).not.toHaveBeenCalled();
    });
  });

  describe('when user is refreshing token', () => {
    beforeEach(() => {
      // First authenticate, then set refreshing (this is how it works in practice)
      store.setAuthenticated(mockUser, 'access-token', 3600);
      store.setRefreshing();
    });

    it('should attempt silent init and redirect to login if still not authenticated', async () => {
      const segments = createMockSegments('dashboard');

      authService.ensureInitialized.mockResolvedValue(undefined);

      const result = runGuard(segments);
      const resolved = await Promise.resolve(result as any);

      // Still authenticated? In this test store remains refreshing (not authenticated)
      expect(resolved).toEqual({ __urlTree: true });
      expect(authService.ensureInitialized).toHaveBeenCalledTimes(1);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/dashboard' }
      });
    });
  });

  describe('path construction', () => {
    beforeEach(() => {
      store.setUnauthenticated();
      authService.ensureInitialized.mockResolvedValue(undefined);
    });

    it('should handle single segment paths correctly', async () => {
      const segments = createMockSegments('dashboard');

      const result = runGuard(segments);
      await Promise.resolve(result as any);

      expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/dashboard' }
      });
    });

    it('should handle multi-segment paths correctly', async () => {
      const segments = createMockSegments('admin/users/profile');

      const result = runGuard(segments);
      await Promise.resolve(result as any);

      expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/admin/users/profile' }
      });
    });

    it('should handle paths with special characters', async () => {
      const segments = createMockSegments('reports/user-123/details');

      const result = runGuard(segments);
      await Promise.resolve(result as any);

      expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/reports/user-123/details' }
      });
    });
  });
});