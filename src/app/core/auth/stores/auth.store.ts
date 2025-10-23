import { Injectable, computed, signal } from '@angular/core';
import { AuthSessionMeta, AuthStateSnapshot, UserProfile } from '../models/auth.models';

// Central reactive auth store using Angular signals.
// Tokens are kept ONLY in memory (Option B) and refresh token lives in HttpOnly cookie (handled by backend/IIS SSO).

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly _status = signal<AuthStateSnapshot['status']>('unknown');
  private readonly _user = signal<UserProfile | null>(null);
  private readonly _accessToken = signal<string | null>(null);
  private readonly _meta = signal<AuthSessionMeta | undefined>(undefined);

  // Public readonly computed signals
  readonly status = computed(() => this._status());
  readonly user = computed(() => this._user());
  readonly accessToken = computed(() => this._accessToken());
  readonly isAuthenticated = computed(() => this._status() === 'authenticated');
  readonly displayName = computed(() => this._user()?.displayName || this._user()?.username || '');

  hasRole = (role: string): boolean => !!this._user()?.roles.includes(role);
  hasAnyRole = (roles: string[]): boolean => roles.some(r => this.hasRole(r));
  hasPermission = (perm: string): boolean => !!this._user()?.permissions.includes(perm);
  hasAllPermissions = (perms: string[]): boolean => perms.every(p => this.hasPermission(p));
  hasAnyPermission = (perms: string[]): boolean => perms.some(p => this.hasPermission(p));

  constructor() {}

  setUnknown(): void {
    this._status.set('unknown');
    this._user.set(null);
    this._accessToken.set(null);
    this._meta.set(undefined);
  }

  setUnauthenticated(): void {
    this._status.set('unauthenticated');
    this._user.set(null);
    this._accessToken.set(null);
    this._meta.set(undefined);
  }

  setRefreshing(): void {
    if (this._status() === 'authenticated') {
      this._status.set('refreshing');
    }
  }

  setAuthenticated(user: UserProfile, token: string, expiresInSeconds: number): void {
    const now = Date.now();
    const meta: AuthSessionMeta = {
      accessTokenExpiresAt: now + (expiresInSeconds * 1000),
      issuedAt: now
    };
    this._user.set(user);
    this._accessToken.set(token);
    this._meta.set(meta);
    this._status.set('authenticated');
  }

  patchUser(user: Partial<UserProfile>): void {
    const current = this._user();
    if (current) {
      this._user.set({ ...current, ...user });
    }
  }

  clear(): void {
    this.setUnauthenticated();
  }

  getSnapshot(): AuthStateSnapshot {
    return {
      status: this._status(),
      user: this._user(),
      accessToken: this._accessToken(),
      meta: this._meta()
    };
  }

  /** milliseconds until access token expiry (negative if already expired) */
  msUntilExpiry(): number | undefined {
    const meta = this._meta();
    if (!meta) return undefined;
    return meta.accessTokenExpiresAt - Date.now();
  }
}
