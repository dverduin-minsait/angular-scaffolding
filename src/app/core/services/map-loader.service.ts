import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface MapLoadState {
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
}

// Typed reference to the Leaflet namespace loaded dynamically
// We avoid a static top-level import so the library is never in the initial bundle
export type LeafletModule = typeof import('leaflet');

@Injectable({
  providedIn: 'root'
})
export class MapLoaderService {
  private readonly platformId = inject(PLATFORM_ID);

  private leafletModule: LeafletModule | null = null;
  private loadPromise: Promise<LeafletModule | null> | null = null;

  private readonly _loadState = signal<MapLoadState>({
    isLoading: false,
    isLoaded: false,
    error: null
  });

  readonly loadState = this._loadState.asReadonly();

  /**
   * Dynamically loads Leaflet and its CSS on the first call.
   * Subsequent calls return the cached module.
   * Always returns null in SSR context.
   */
  async loadLeaflet(): Promise<LeafletModule | null> {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    if (this.leafletModule) {
      return this.leafletModule;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this._loadState.set({ isLoading: true, isLoaded: false, error: null });

    this.loadPromise = this.performLoad();

    try {
      this.leafletModule = await this.loadPromise;
      this._loadState.set({ isLoading: false, isLoaded: true, error: null });
      return this.leafletModule;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this._loadState.set({ isLoading: false, isLoaded: false, error: err });
      this.loadPromise = null;
      return null;
    }
  }

  private async performLoad(): Promise<LeafletModule> {
    const leaflet = await import('leaflet');
    this.injectLeafletCSS();
    return leaflet;
  }

  private injectLeafletCSS(): void {
    const id = 'leaflet-css';
    if (document.getElementById(id)) {
      return;
    }
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = '/assets/styles/leaflet.css';
    document.head.appendChild(link);
  }
}
