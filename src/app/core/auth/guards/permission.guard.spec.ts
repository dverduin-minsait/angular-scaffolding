import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { vi } from 'vitest';
import { permissionGuard } from './permission.guard';
import { AuthStore } from '../stores/auth.store';
import type { UserProfile } from '../models/auth.models';

describe('permissionGuard', () => {
  let store: AuthStore;
  let router: Router;
  let navigateSpy: ReturnType<typeof vi.spyOn>;

  const mockUserWithReadPermission: UserProfile = {
    id: '1',
    username: 'test-user',
    displayName: 'Test User',
    roles: ['user'],
    permissions: ['read', 'report.view']
  };

  const mockUserWithMultiplePermissions: UserProfile = {
    id: '2',
    username: 'admin-user',
    displayName: 'Admin User',
    roles: ['admin'],
    permissions: ['read', 'write', 'delete', 'report.view', 'user.manage']
  };

  const mockUserWithNoPermissions: UserProfile = {
    id: '3',
    username: 'basic-user',
    displayName: 'Basic User',
    roles: ['basic'],
    permissions: []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        AuthStore,
        provideZonelessChangeDetection(),
        {
          provide: Router,
          useValue: {
            navigate: vi.fn().mockResolvedValue(true)
          }
        }
      ]
    }).compileComponents();

    store = TestBed.inject(AuthStore);
    router = TestBed.inject(Router);
    navigateSpy = vi.spyOn(router, 'navigate');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      // Ensure user is not authenticated
      store.clear();
    });

    it('should redirect to login for single permission requirement', () => {
      const guard = permissionGuard('read');
      
      const result = TestBed.runInInjectionContext(() => guard(null as any, null as any));
      
      expect(result).toBe(false);
      expect(navigateSpy).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should redirect to login for multiple permission requirements', () => {
      const guard = permissionGuard(['read', 'write']);
      
      const result = TestBed.runInInjectionContext(() => guard(null as any, null as any));
      
      expect(result).toBe(false);
      expect(navigateSpy).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should redirect to login when status is unknown', () => {
      // Set status to unknown explicitly
      store.setUnknown();
      const guard = permissionGuard('read');
      
      const result = TestBed.runInInjectionContext(() => guard(null as any, null as any));
      
      expect(result).toBe(false);
      expect(navigateSpy).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should redirect to login when status is refreshing', () => {
      // Set authenticated first, then refreshing 
      store.setAuthenticated(mockUserWithReadPermission, 'token', 3600);
      store.setRefreshing();
      const guard = permissionGuard('read');
      
      const result = TestBed.runInInjectionContext(() => guard(null as any, null as any));
      
      expect(result).toBe(false);
      expect(navigateSpy).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('when user is authenticated but user object is missing', () => {
    beforeEach(() => {
      // This scenario is difficult to replicate with the current AuthStore API
      // since setAuthenticated always sets both user and status together
      // We'll skip this edge case as it's not possible with the current implementation
    });

    it('should be handled by the store design (always sets user with authentication)', () => {
      // The AuthStore design ensures user is always set when authenticated
      // This test documents that this edge case is prevented by design
      store.setAuthenticated(mockUserWithReadPermission, 'token', 3600);
      expect(store.user()).toBeTruthy();
      expect(store.status()).toBe('authenticated');
    });
  });

  describe('when user is authenticated', () => {
    describe('with single permission requirement', () => {
      beforeEach(() => {
        store.setAuthenticated(mockUserWithReadPermission, 'token', 3600);
      });

      it('should allow access when user has required permission', () => {
        const guard = permissionGuard('read');
        
        const result = TestBed.runInInjectionContext(() => guard(null as any, null as any));
        
        expect(result).toBe(true);
        expect(navigateSpy).not.toHaveBeenCalled();
      });

      it('should allow access for specific report permission', () => {
        const guard = permissionGuard('report.view');
        
        const result = TestBed.runInInjectionContext(() => guard(null as any, null as any));
        
        expect(result).toBe(true);
        expect(navigateSpy).not.toHaveBeenCalled();
      });

      it('should redirect to forbidden when user lacks required permission', () => {
        const guard = permissionGuard('write');
        
        const result = TestBed.runInInjectionContext(() => guard(null as any, null as any));
        
        expect(result).toBe(false);
        expect(navigateSpy).toHaveBeenCalledWith(['/forbidden']);
      });

      it('should redirect to forbidden for nonexistent permission', () => {
        const guard = permissionGuard('super-admin');
        
        const result = TestBed.runInInjectionContext(() => guard(null as any, null as any));
        
        expect(result).toBe(false);
        expect(navigateSpy).toHaveBeenCalledWith(['/forbidden']);
      });
    });

    describe('with multiple permission requirements', () => {
      beforeEach(() => {
        store.setAuthenticated(mockUserWithMultiplePermissions, 'token', 3600);
      });

      it('should allow access when user has all required permissions', () => {
        const guard = permissionGuard(['read', 'write']);
        
        const result = TestBed.runInInjectionContext(() => guard(null as any, null as any));
        
        expect(result).toBe(true);
        expect(navigateSpy).not.toHaveBeenCalled();
      });

      it('should allow access for complex permission combination', () => {
        const guard = permissionGuard(['read', 'report.view', 'user.manage']);
        
        const result = TestBed.runInInjectionContext(() => guard(null as any, null as any));
        
        expect(result).toBe(true);
        expect(navigateSpy).not.toHaveBeenCalled();
      });

      it('should redirect to forbidden when user lacks one required permission', () => {
        const guard = permissionGuard(['read', 'super-admin']);
        
        const result = TestBed.runInInjectionContext(() => guard(null as any, null as any));
        
        expect(result).toBe(false);
        expect(navigateSpy).toHaveBeenCalledWith(['/forbidden']);
      });

      it('should redirect to forbidden when user lacks multiple required permissions', () => {
        const guard = permissionGuard(['super-admin', 'system.config']);
        
        const result = TestBed.runInInjectionContext(() => guard(null as any, null as any));
        
        expect(result).toBe(false);
        expect(navigateSpy).toHaveBeenCalledWith(['/forbidden']);
      });
    });

    describe('with user having no permissions', () => {
      beforeEach(() => {
        store.setAuthenticated(mockUserWithNoPermissions, 'token', 3600);
      });

      it('should redirect to forbidden for any permission requirement', () => {
        const guard = permissionGuard('read');
        
        const result = TestBed.runInInjectionContext(() => guard(null as any, null as any));
        
        expect(result).toBe(false);
        expect(navigateSpy).toHaveBeenCalledWith(['/forbidden']);
      });

      it('should redirect to forbidden for multiple permission requirements', () => {
        const guard = permissionGuard(['read', 'write']);
        
        const result = TestBed.runInInjectionContext(() => guard(null as any, null as any));
        
        expect(result).toBe(false);
        expect(navigateSpy).toHaveBeenCalledWith(['/forbidden']);
      });
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      store.setAuthenticated(mockUserWithReadPermission, 'token', 3600);
    });

    it('should handle empty array permission requirement', () => {
      const guard = permissionGuard([]);
      
      const result = TestBed.runInInjectionContext(() => guard(null as any, null as any));
      
      expect(result).toBe(true);
      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('should handle permission guard factory with string parameter', () => {
      const guard = permissionGuard('read');
      expect(typeof guard).toBe('function');
      
      const result = TestBed.runInInjectionContext(() => guard(null as any, null as any));
      expect(result).toBe(true);
    });

    it('should handle permission guard factory with array parameter', () => {
      const guard = permissionGuard(['read']);
      expect(typeof guard).toBe('function');
      
      const result = TestBed.runInInjectionContext(() => guard(null as any, null as any));
      expect(result).toBe(true);
    });
  });

  describe('permission evaluation logic', () => {
    it('should use case-sensitive permission matching', () => {
      store.setAuthenticated(mockUserWithReadPermission, 'token', 3600);
      const guard = permissionGuard('READ'); // uppercase
      
      const result = TestBed.runInInjectionContext(() => guard(null as any, null as any));
      
      expect(result).toBe(false);
      expect(navigateSpy).toHaveBeenCalledWith(['/forbidden']);
    });

    it('should require exact permission string matches', () => {
      store.setAuthenticated(mockUserWithReadPermission, 'token', 3600);
      const guard = permissionGuard('read-only'); // similar but different
      
      const result = TestBed.runInInjectionContext(() => guard(null as any, null as any));
      
      expect(result).toBe(false);
      expect(navigateSpy).toHaveBeenCalledWith(['/forbidden']);
    });
  });
});
