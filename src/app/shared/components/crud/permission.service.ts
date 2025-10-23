import { Injectable, inject, signal, computed } from '@angular/core';
import { CrudPermissions } from './types';
import { LOCAL_STORAGE } from '../../../core/tokens';

/**
 * Role-based permission configuration
 */
export interface UserRole {
  name: string;
  permissions: string[];
}

/**
 * Permission configuration for CRUD operations
 */
export interface PermissionConfig {
  resource: string;
  actions: {
    create?: string;
    read?: string;
    update?: string;
    delete?: string;
    export?: string;
    import?: string;
  };
}

/**
 * Service for managing CRUD permissions based on user roles or feature flags
 * Follows Angular 20 signals pattern from AGENTS.md
 */
@Injectable({
  providedIn: 'root'
})
export class CrudPermissionService {
  private readonly localStorage = inject(LOCAL_STORAGE);

  // Current user roles (would typically come from auth service)
  private readonly _userRoles = signal<UserRole[]>([]);
  readonly userRoles = this._userRoles.asReadonly();

  // Feature flags for enabling/disabling functionality
  private readonly _featureFlags = signal<Record<string, boolean>>({});
  readonly featureFlags = this._featureFlags.asReadonly();

  // Computed permissions based on roles and feature flags
  readonly hasAdminRole = computed(() => 
    this._userRoles().some(role => role.name === 'admin')
  );

  constructor() {
    this.loadPersistedState();
  }

  /**
   * Set user roles (typically called by auth service)
   */
  setUserRoles(roles: UserRole[]): void {
    this._userRoles.set(roles);
    this.persistState();
  }

  /**
   * Set feature flags
   */
  setFeatureFlags(flags: Record<string, boolean>): void {
    this._featureFlags.update(current => ({ ...current, ...flags }));
    this.persistState();
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    return this._userRoles().some(role => 
      role.permissions.includes(permission) || 
      role.permissions.includes('*') // Admin wildcard
    );
  }

  /**
   * Check if feature flag is enabled
   */
  isFeatureEnabled(feature: string): boolean {
    return this._featureFlags()[feature] ?? false;
  }

  /**
   * Get CRUD permissions for a specific resource
   */
  getCrudPermissions(config: PermissionConfig): CrudPermissions {
    const { resource, actions } = config;
    
    return {
      create: this.checkCrudAction(actions.create, `${resource}:create`),
      read: this.checkCrudAction(actions.read, `${resource}:read`),
      update: this.checkCrudAction(actions.update, `${resource}:update`),
      delete: this.checkCrudAction(actions.delete, `${resource}:delete`),
      export: this.checkCrudAction(actions.export, `${resource}:export`),
      import: this.checkCrudAction(actions.import, `${resource}:import`)
    };
  }

  /**
   * Create a permission signal for reactive permission checking
   */
  createPermissionSignal(permission: string): ReturnType<typeof computed<boolean>> {
    return computed(() => this.hasPermission(permission));
  }

  /**
   * Create a feature flag signal
   */
  createFeatureFlagSignal(feature: string): ReturnType<typeof computed<boolean>> {
    return computed(() => this.isFeatureEnabled(feature));
  }

  private checkCrudAction(actionPermission: string | undefined, fallbackPermission: string): boolean {
    if (!actionPermission) {
      return this.hasPermission(fallbackPermission);
    }

    // Check if it's a feature flag (prefixed with 'feature:')
    if (actionPermission.startsWith('feature:')) {
      const featureName = actionPermission.replace('feature:', '');
      return this.isFeatureEnabled(featureName);
    }

    return this.hasPermission(actionPermission);
  }

  private persistState(): void {
    try {
      this.localStorage.setItem('crudPermissions', JSON.stringify({
        userRoles: this._userRoles(),
        featureFlags: this._featureFlags()
      }));
    } catch (error) {
      console.warn('Failed to persist CRUD permissions:', error);
    }
  }

  private loadPersistedState(): void {
    try {
      const stored = this.localStorage.getItem('crudPermissions');
      if (stored) {
        const state = JSON.parse(stored) as { userRoles?: UserRole[]; featureFlags?: Record<string, boolean> };
        if (state.userRoles && Array.isArray(state.userRoles)) {
          this._userRoles.set(state.userRoles);
        }
        if (state.featureFlags && typeof state.featureFlags === 'object') {
          this._featureFlags.set(state.featureFlags);
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted CRUD permissions:', error);
    }
  }
}