import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs';
import { DeviceService } from './device.service';

export interface GridLoadState {
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
  loadStartTime?: number;
  loadEndTime?: number;
}

@Injectable({
  providedIn: 'root'
})
export class GridLoaderService {
  private platformId = inject(PLATFORM_ID);
  private gridModule: any = null;
  private loadPromise: Promise<any> | null = null;
  
  private loadStateSubject = new BehaviorSubject<GridLoadState>({
    isLoading: false,
    isLoaded: false,
    error: null
  });
  
  public loadState$ = this.loadStateSubject.asObservable();

  constructor(private deviceService: DeviceService) {}

  /**
   * Loads ag-Grid module dynamically
   * Returns cached version if already loaded
   */
  async loadGridModule(): Promise<any> {
    // Skip loading if not in browser (SSR)
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    // Skip loading on mobile devices
    if (!this.deviceService.supportsGrids()) {
      return null;
    }

    // Return cached module if already loaded
    if (this.gridModule) {
      return this.gridModule;
    }

    // Return existing promise if currently loading
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Start loading
    this.updateLoadState({ isLoading: true, isLoaded: false, error: null, loadStartTime: Date.now() });

    this.loadPromise = this.performLoad();
    
    try {
      this.gridModule = await this.loadPromise;
      this.updateLoadState({ 
        isLoading: false, 
        isLoaded: true, 
        error: null, 
        loadEndTime: Date.now() 
      });
      
      return this.gridModule;
    } catch (error) {
      const err = error as Error;
      this.updateLoadState({ isLoading: false, isLoaded: false, error: err });
      console.error('Failed to load ag-Grid:', err);
      throw err;
    }
  }

  private async performLoad(): Promise<any> {
    try {
      // Dynamic import of ag-Grid - this creates a separate chunk
      const [agGridAngular, agGridCommunity] = await Promise.all([
        import('ag-grid-angular'),
        import('ag-grid-community')
      ]);

      // Register all community modules
      if (agGridCommunity.ModuleRegistry && agGridCommunity.AllCommunityModule) {
        agGridCommunity.ModuleRegistry.registerModules([agGridCommunity.AllCommunityModule]);
      }

      // Since we removed CSS imports from global styles, inject minimal CSS
      this.ensureMinimalGridCSS();

      // Small delay to ensure CSS is processed before creating components
      await new Promise(resolve => setTimeout(resolve, 50));

      return {
        AgGridModule: agGridAngular.AgGridModule,
        AgGridAngular: agGridAngular.AgGridAngular,
        ...agGridCommunity
      };
    } catch (error) {
      console.error('Failed to load ag-Grid modules:', error);
      throw new Error('ag-Grid modules could not be loaded. Make sure ag-grid-angular and ag-grid-community are installed.');
    }
  }

  /**
   * Inject minimal CSS for ag-Grid since we removed global imports
   */
  private ensureMinimalGridCSS(): void {
    // Skip CSS injection on server-side rendering
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (document.querySelector('style[data-ag-grid-minimal]')) {
      return;
    }

    const style = document.createElement('style');
    style.setAttribute('data-ag-grid-minimal', 'true');
    style.textContent = `
      /* Essential ag-Grid base styles for proper layout */
      .ag-theme-alpine {
        --ag-font-family: inherit;
        --ag-font-size: 14px;
        --ag-row-height: 40px;
        --ag-header-height: 45px;
        --ag-list-item-height: 24px;
        --ag-border-color: #e2e8f0;
        --ag-background-color: #ffffff;
        --ag-header-background-color: #f8fafc;
        --ag-odd-row-background-color: transparent;
        --ag-even-row-background-color: #f8fafc;
        --ag-row-hover-color: #f1f5f9;
        --ag-foreground-color: #1a202c;
        --ag-secondary-foreground-color: #4a5568;
        --ag-disabled-foreground-color: #a0aec0;
        font-family: var(--ag-font-family);
        font-size: var(--ag-font-size);
        line-height: 1.4;
        color: var(--ag-foreground-color);
        background-color: var(--ag-background-color);
        box-sizing: border-box;
      }
      
      .ag-theme-alpine * {
        box-sizing: border-box;
      }
      
      .ag-theme-alpine .ag-root-wrapper {
        border: 1px solid var(--ag-border-color);
        border-radius: 6px;
        overflow: hidden;
        background-color: var(--ag-background-color);
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      
      .ag-theme-alpine .ag-header {
        background-color: var(--ag-header-background-color);
        border-bottom: 1px solid var(--ag-border-color);
        color: var(--ag-foreground-color);
        font-weight: 600;
        display: flex;
        width: 100%;
      }
      
      .ag-theme-alpine .ag-header-row {
        display: flex;
        width: 100%;
        height: var(--ag-header-height);
      }
      
      .ag-theme-alpine .ag-header-cell {
        height: var(--ag-header-height);
        padding: 8px 12px;
        display: flex;
        align-items: center;
        border-right: 1px solid var(--ag-border-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .ag-theme-alpine .ag-header-cell:last-child {
        border-right: none;
      }
      
      .ag-theme-alpine .ag-body-viewport {
        flex: 1 1 auto;
        overflow: auto;
      }
      
      .ag-theme-alpine .ag-center-cols-container {
        display: block;
        position: relative;
        height: 100%;
        overflow: hidden;
      }
      
      .ag-theme-alpine .ag-row {
        border-bottom: 1px solid var(--ag-border-color);
        height: var(--ag-row-height);
        display: flex;
        width: 100%;
        position: absolute;
        left: 0;
      }
      
      .ag-theme-alpine .ag-row:hover {
        background-color: var(--ag-row-hover-color);
      }
      
      .ag-theme-alpine .ag-row:nth-child(even) {
        background-color: var(--ag-even-row-background-color);
      }
      
      .ag-theme-alpine .ag-cell {
        padding: 8px 12px;
        display: flex;
        align-items: center;
        border-right: 1px solid var(--ag-border-color);
        line-height: var(--ag-list-item-height);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        height: 100%;
      }
      
      .ag-theme-alpine .ag-cell:last-child {
        border-right: none;
      }
      
      .ag-theme-alpine .ag-cell:focus {
        outline: 2px solid #3182ce;
        outline-offset: -2px;
      }
      
      .ag-theme-alpine .ag-paging-panel {
        border-top: 1px solid var(--ag-border-color);
        background-color: var(--ag-header-background-color);
        padding: 8px 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Preload ag-Grid (call this when you know grids will be needed soon)
   */
  preload(): void {
    if (isPlatformBrowser(this.platformId) && this.deviceService.supportsGrids() && !this.gridModule && !this.loadPromise) {
      this.loadGridModule().catch(error => {
        console.warn('Preload failed:', error);
      });
    }
  }

  /**
   * Get current load state
   */
  get isLoaded(): boolean {
    return this.loadStateSubject.value.isLoaded;
  }

  get isLoading(): boolean {
    return this.loadStateSubject.value.isLoading;
  }

  get loadError(): Error | null {
    return this.loadStateSubject.value.error;
  }

  private updateLoadState(state: Partial<GridLoadState>): void {
    const currentState = this.loadStateSubject.value;
    this.loadStateSubject.next({ ...currentState, ...state });
  }
}