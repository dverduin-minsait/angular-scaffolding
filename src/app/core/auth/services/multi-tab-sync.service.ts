import { Injectable, effect, inject, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthStore } from '../stores/auth.store';
import { AuthService } from './auth.service';

// Responsible for synchronizing auth events (login/logout) across browser tabs using BroadcastChannel / storage fallback.
// Only runs in browser context.
@Injectable({ providedIn: 'root' })
export class MultiTabSyncService {
  private readonly store = inject(AuthStore);
  private readonly auth = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly channel: BroadcastChannel | null = null;
  private lastStatus = this.store.status();
  private lastUserId = this.store.user()?.id;

  constructor() {
    const isBrowser = isPlatformBrowser(this.platformId);
    if (!isBrowser) return; // Angular Universal / SSR safe early exit

    let storageListener: ((e: StorageEvent) => void) | null = null;

    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('app-auth-channel');
      const handler = (ev: MessageEvent): void => void this.onMessage(ev.data);
      this.channel.addEventListener('message', handler);
      // Cleanup channel
      this.destroyRef.onDestroy((): void => {
        try { this.channel?.removeEventListener('message', handler); } catch {}
        try { this.channel?.close(); } catch {}
      });
    } else if (typeof window !== 'undefined') {
      // Fallback using storage events (older browsers)
      storageListener = (e: StorageEvent): void => {
        if (e.key === 'app-auth-event' && e.newValue) {
          try { void this.onMessage(JSON.parse(e.newValue)); } catch { /* ignore */ }
        }
      };
      window.addEventListener('storage', storageListener);
      this.destroyRef.onDestroy((): void => {
        if (storageListener) window.removeEventListener('storage', storageListener);
      });
    }

    // Watch for local auth transitions and broadcast
    effect(() => {
      const status = this.store.status();
      const userId = this.store.user()?.id;
      if (status !== this.lastStatus || userId !== this.lastUserId) {
        this.broadcast({ type: status, userId });
        this.lastStatus = status;
        this.lastUserId = userId;
      }
    });
  }

  private broadcast(payload: unknown): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.channel) {
      this.channel.postMessage(payload);
    } else {
      try { localStorage.setItem('app-auth-event', JSON.stringify(payload)); } catch { /* ignore */ }
    }
  }

  private async onMessage(msg: unknown): Promise<void> {
    if (!msg || typeof msg !== 'object') return;
    const message = msg as { type?: string };
    switch (message.type) {
      case 'authenticated':
        // If we're unauthenticated try to refresh silently to align
        if (!this.store.isAuthenticated()) {
          await this.auth.refreshAccessToken().catch(() => {});
        }
        break;
      case 'unauthenticated':
        if (this.store.isAuthenticated()) {
          this.store.clear();
        }
        break;
      case 'logout':
        if (this.store.isAuthenticated()) this.store.clear();
        break;
    }
  }
}
