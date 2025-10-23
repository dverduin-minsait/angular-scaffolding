import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { LOCAL_STORAGE } from '../../../core/tokens';
import { CrudPermissionService, UserRole, PermissionConfig } from './permission.service';

/**
 * CRUD Permission Service Tests
 * Following Jest + Testing Library patterns from AGENTS.md
 */
describe('CrudPermissionService', () => {
  let service: CrudPermissionService;
  let mockLocalStorage: jest.Mocked<Storage>;

  beforeEach(() => {
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        CrudPermissionService,
        { provide: LOCAL_STORAGE, useValue: mockLocalStorage }
      ]
    });

    service = TestBed.inject(CrudPermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('User Roles Management', () => {
    it('should initialize with empty roles', () => {
      expect(service.userRoles()).toEqual([]);
    });

    it('should set user roles and persist to localStorage', () => {
      const roles: UserRole[] = [
        { name: 'admin', permissions: ['*'] },
        { name: 'user', permissions: ['read'] }
      ];

      service.setUserRoles(roles);

      expect(service.userRoles()).toEqual(roles);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'crudPermissions',
        expect.stringContaining('"userRoles"')
      );
    });

    it('should detect admin role correctly', () => {
      service.setUserRoles([{ name: 'admin', permissions: ['*'] }]);
      expect(service.hasAdminRole()).toBe(true);

      service.setUserRoles([{ name: 'user', permissions: ['read'] }]);
      expect(service.hasAdminRole()).toBe(false);
    });
  });

  describe('Feature Flags Management', () => {
    it('should initialize with empty feature flags', () => {
      expect(service.featureFlags()).toEqual({});
    });

    it('should set feature flags and persist to localStorage', () => {
      const flags = { 'advanced-crud': true, 'beta-features': false };

      service.setFeatureFlags(flags);

      expect(service.featureFlags()).toEqual(flags);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'crudPermissions',
        expect.stringContaining('"featureFlags"')
      );
    });

    it('should check feature flags correctly', () => {
      service.setFeatureFlags({ 'test-feature': true, 'disabled-feature': false });

      expect(service.isFeatureEnabled('test-feature')).toBe(true);
      expect(service.isFeatureEnabled('disabled-feature')).toBe(false);
      expect(service.isFeatureEnabled('non-existent')).toBe(false);
    });
  });

  describe('Permission Checking', () => {
    beforeEach(() => {
      service.setUserRoles([
        { name: 'editor', permissions: ['users:read', 'users:update', 'posts:*'] },
        { name: 'viewer', permissions: ['users:read'] }
      ]);
    });

    it('should check specific permissions correctly', () => {
      expect(service.hasPermission('users:read')).toBe(true);
      expect(service.hasPermission('users:update')).toBe(true);
      expect(service.hasPermission('users:delete')).toBe(false);
      expect(service.hasPermission('posts:create')).toBe(true); // wildcard
    });

    it('should handle wildcard permissions', () => {
      service.setUserRoles([{ name: 'admin', permissions: ['*'] }]);
      
      expect(service.hasPermission('anything')).toBe(true);
      expect(service.hasPermission('users:delete')).toBe(true);
    });

    it('should return false for no matching permissions', () => {
      service.setUserRoles([{ name: 'limited', permissions: ['specific:action'] }]);
      
      expect(service.hasPermission('other:action')).toBe(false);
    });
  });

  describe('CRUD Permissions Generation', () => {
    const permissionConfig: PermissionConfig = {
      resource: 'products',
      actions: {
        create: 'products:create',
        read: 'products:read',
        update: 'products:update',
        delete: 'products:delete',
        export: 'feature:export-products'
      }
    };

    beforeEach(() => {
      service.setUserRoles([
        { name: 'editor', permissions: ['products:read', 'products:update'] }
      ]);
      service.setFeatureFlags({ 'export-products': true });
    });

    it('should generate CRUD permissions based on user roles', () => {
      const permissions = service.getCrudPermissions(permissionConfig);

      expect(permissions).toEqual({
        create: false,
        read: true,
        update: true,
        delete: false,
        export: true,
        import: false
      });
    });

    it('should use fallback permissions when action not specified', () => {
      const configWithoutActions: PermissionConfig = {
        resource: 'orders',
        actions: {}
      };

      service.setUserRoles([{ name: 'admin', permissions: ['orders:read'] }]);
      const permissions = service.getCrudPermissions(configWithoutActions);

      expect(permissions.read).toBe(true);
      expect(permissions.create).toBe(false); // fallback to orders:create
    });

    it('should handle feature flag permissions', () => {
      const configWithFeatures: PermissionConfig = {
        resource: 'analytics',
        actions: {
          read: 'feature:analytics-view',
          export: 'feature:analytics-export'
        }
      };

      service.setFeatureFlags({
        'analytics-view': true,
        'analytics-export': false
      });

      const permissions = service.getCrudPermissions(configWithFeatures);

      expect(permissions.read).toBe(true);
      expect(permissions.export).toBe(false);
    });
  });

  describe('Reactive Permission Signals', () => {
    it('should create reactive permission signals', () => {
      const permissionSignal = service.createPermissionSignal('users:read');
      
      // Initially false
      expect(permissionSignal()).toBe(false);

      // Grant permission
      service.setUserRoles([{ name: 'viewer', permissions: ['users:read'] }]);
      expect(permissionSignal()).toBe(true);

      // Revoke permission
      service.setUserRoles([{ name: 'limited', permissions: ['other:action'] }]);
      expect(permissionSignal()).toBe(false);
    });

    it('should create reactive feature flag signals', () => {
      const featureSignal = service.createFeatureFlagSignal('beta-feature');
      
      // Initially false
      expect(featureSignal()).toBe(false);

      // Enable feature
      service.setFeatureFlags({ 'beta-feature': true });
      expect(featureSignal()).toBe(true);

      // Disable feature
      service.setFeatureFlags({ 'beta-feature': false });
      expect(featureSignal()).toBe(false);
    });
  });

  describe('State Persistence', () => {
    it('should load persisted state on initialization', () => {
      const persistedState = {
        userRoles: [{ name: 'admin', permissions: ['*'] }],
        featureFlags: { 'test-feature': true }
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(persistedState));

      // Create new service instance to trigger loading
      const newService = new CrudPermissionService();
      (newService as any).localStorage = mockLocalStorage;
      (newService as any).loadPersistedState();

      expect(newService.userRoles()).toEqual(persistedState.userRoles);
      expect(newService.featureFlags()).toEqual(persistedState.featureFlags);
    });

    it('should handle invalid persisted data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      expect(() => {
        const newService = new CrudPermissionService();
        (newService as any).localStorage = mockLocalStorage;
        (newService as any).loadPersistedState();
      }).not.toThrow();
    });

    it('should handle missing localStorage gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      expect(() => {
        const newService = new CrudPermissionService();
        (newService as any).localStorage = mockLocalStorage;
        (newService as any).loadPersistedState();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty permission arrays', () => {
      service.setUserRoles([{ name: 'empty', permissions: [] }]);
      
      expect(service.hasPermission('any:permission')).toBe(false);
    });

    it('should handle undefined permission config actions', () => {
      const config: PermissionConfig = {
        resource: 'test',
        actions: {
          create: undefined,
          read: 'test:read'
        }
      };

      service.setUserRoles([{ name: 'test', permissions: ['test:create', 'test:read'] }]);
      const permissions = service.getCrudPermissions(config);

      expect(permissions.create).toBe(true); // fallback to test:create
      expect(permissions.read).toBe(true);
    });
  });
});