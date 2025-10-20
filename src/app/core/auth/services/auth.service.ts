import { Injectable, Injector, effect, inject, runInInjectionContext, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { AuthStore } from '../stores/auth.store';
import { LoginCredentials, MeResponse, RefreshResponse, UserProfile } from '../models/auth.models';
import { ENVIRONMENT } from '../../../../environments/environment';

// AuthService orchestrates login, logout, refresh and session initialization.
// Assumes backend issues a secure HttpOnly refresh cookie after successful login (IIS integrated SSO or form fallback).
// Access token is returned on /auth/refresh or /auth/login response and stored only in memory.

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(AuthStore);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  private refreshInFlight: Promise<void> | null = null;

  // Endpoint base; adapt paths to your backend conventions.
  private readonly base = ENVIRONMENT.API_URL;

  /** Attempt silent init of session (used at app start). */
  async initializeSession(): Promise<void> {
    // eslint-disable-next-line no-console
    console.log('[AuthService] initializeSession starting');
    
    try {
      // Call /auth/refresh to get an access token if refresh cookie valid.
      const refreshResp = await this.tryRefresh();
      if (refreshResp) {
        // eslint-disable-next-line no-console
        console.log('[AuthService] initializeSession completed via refresh');
        return; // store already updated in tryRefresh
      }

      // If refresh not available maybe we can call /auth/me for IIS integrated user (SSO) returning implicit session
      const me = await this.tryMeImplicit();
      if (me) {
        // eslint-disable-next-line no-console
        console.log('[AuthService] initializeSession completed via SSO');
        return; // store updated
      }

      // eslint-disable-next-line no-console
      console.log('[AuthService] initializeSession failed - setting unauthenticated');
      this.store.setUnauthenticated();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('[AuthService] initializeSession error', e);
      this.store.setUnauthenticated();
    }
  }

  /** Explicit login for non-SSO scenario (fallback). */
  async login(credentials: LoginCredentials): Promise<void> {
    const resp = await firstValueFrom(this.http.post<RefreshResponse & { user: UserProfile }>(`${this.base}/auth/login`, credentials));
    this.store.setAuthenticated(resp.user, resp.accessToken, resp.expiresIn);
  }

  /** Logout clears memory and informs server to clear refresh cookie. */
  async logout(): Promise<void> {
    try { await lastValueFrom(this.http.post(`${this.base}/auth/logout`, {})); } catch { /* ignore */ }
    this.store.clear();
  }

  /** Returns true if refresh succeeded */
  async refreshAccessToken(): Promise<boolean> {
    // Debounce concurrent refreshes
    if (this.refreshInFlight) {
      await this.refreshInFlight;
      return this.store.isAuthenticated();
    }
    this.store.setRefreshing();
    this.refreshInFlight = this.doRefresh();
    try {
      await this.refreshInFlight;
      return this.store.isAuthenticated();
    } finally {
      this.refreshInFlight = null;
    }
  }

  /** Internal refresh implementation */
  private async doRefresh(): Promise<void> {
    const resp = await this.performRefresh();
    if (!resp) {
      this.store.setUnauthenticated();
      return;
    }
    // If backend optionally returns user again use it, else keep existing
    const user = resp.user || this.store.user();
    if (!user) {
      // try fetch /me if user unknown
      const meResp = await this.fetchMeSafe();
      if (meResp) {
        this.store.setAuthenticated(meResp, resp.accessToken, resp.expiresIn);
        return;
      }
      this.store.setUnauthenticated();
      return;
    }
    this.store.setAuthenticated(user, resp.accessToken, resp.expiresIn);
  }

  private async performRefresh(): Promise<RefreshResponse | null> {
    try {
      return await firstValueFrom(this.http.post<RefreshResponse>(`${this.base}/auth/refresh`, {}));
    } catch {
      return null;
    }
  }

  private async fetchMeSafe(): Promise<MeResponse | null> {
    try {
      return await firstValueFrom(this.http.get<MeResponse>(`${this.base}/auth/me`));
    } catch { return null; }
  }

  private async tryRefresh(): Promise<boolean> {
    const resp = await this.performRefresh();
    if (!resp) return false;
    // Optionally fetch /me if user not included
    let user = resp.user as UserProfile | undefined;
    if (!user) {
      const me = await this.fetchMeSafe();
      if (me) user = me;
    }
    if (user) this.store.setAuthenticated(user, resp.accessToken, resp.expiresIn);
    return true;
  }

  private async tryMeImplicit(): Promise<boolean> {
    // For IIS SSO scenario: hitting /auth/me may establish a session if Windows Auth already validated.
    const me = await this.fetchMeSafe();
    if (!me) return false;
    // Without an access token we cannot call APIs that require it; attempt refresh now.
    const refreshed = await this.tryRefresh();
    if (!refreshed) {
      // As a fallback, mark unauthenticated (or keep a limited session?)
      this.store.setUnauthenticated();
      return false;
    }
    return true;
  }

  /** Schedules a proactive refresh shortly before expiry. Call once at bootstrap. */
  scheduleProactiveRefresh() {
    let pendingTimer: any;
    const setupEffect = () => effect(() => {
      if (pendingTimer) {
        clearTimeout(pendingTimer);
        pendingTimer = null;
      }
      if (!this.store.isAuthenticated()) return;
      const ms = this.store.msUntilExpiry();
      if (ms === undefined) return;
      const lead = 45_000;
      const delay = Math.max(5_000, ms - lead);
      pendingTimer = setTimeout(() => {
        this.refreshAccessToken();
      }, delay);
    });
    runInInjectionContext(this.injector, setupEffect);
    this.destroyRef.onDestroy(() => {
      if (pendingTimer) clearTimeout(pendingTimer);
    });
  }
}
