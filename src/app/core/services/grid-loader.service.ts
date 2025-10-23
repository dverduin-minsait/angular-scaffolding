import { Injectable, inject, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { DeviceService } from './device.service';
import { ThemeService } from './theme.service';

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
  private readonly platformId = inject(PLATFORM_ID);
  private readonly deviceService = inject(DeviceService);
  private readonly themeService = inject(ThemeService);
  private gridModule: unknown = null;
  private loadPromise: Promise<unknown> | null = null;
  
  private readonly loadStateSubject = new BehaviorSubject<GridLoadState>({
    isLoading: false,
    isLoaded: false,
    error: null
  });
  
  public loadState$ = this.loadStateSubject.asObservable();

  constructor() {
    // Set up theme change effect to update CSS when theme changes
    if (isPlatformBrowser(this.platformId)) {
      effect(() => {
        // React to theme changes - now supports theme pairs
        const currentTheme = this.themeService.currentTheme();
        const currentThemePair = this.themeService.getCurrentThemePair();
        this.updateGridThemeCSS(currentTheme, currentThemePair);
      });
    }
  }

  /**
   * Loads ag-Grid module dynamically
   * Returns cached version if already loaded
   */
  async loadGridModule(): Promise<unknown> {
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
      // Clear the promise reference after successful resolution so future calls
      // can start a fresh load if needed (and to free memory for large modules)
      this.loadPromise = null;
      
      return this.gridModule;
    } catch (error) {
      const err = error as Error;
      this.updateLoadState({ isLoading: false, isLoaded: false, error: err });
      console.error('Failed to load ag-Grid:', err);
      // Allow subsequent calls to retry after a failure
      this.loadPromise = null;
      throw err;
    }
  }

  private async performLoad(): Promise<unknown> {
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

    // Initialize with current theme
    const currentTheme = this.themeService.currentTheme();
    const currentThemePair = this.themeService.getCurrentThemePair();
    this.updateGridThemeCSS(currentTheme, currentThemePair);
  }

  /**
   * Update ag-Grid theme CSS based on current theme and theme pair
   */
  private updateGridThemeCSS(currentTheme: string, themePair: number): void {
    // Skip CSS injection on server-side rendering
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Remove existing theme CSS if it exists
    const existingStyle = document.querySelector('style[data-ag-grid-theme]');
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.setAttribute('data-ag-grid-theme', 'true');
    
    // Create theme-specific CSS variables
    const themeVars = this.getThemeVariables(currentTheme, themePair);
    
    style.textContent = `
      /* Essential ag-Grid theme styles with dynamic theme support */
      .ag-theme-alpine, .ag-theme-alpine-dark {
        ${themeVars}
        font-family: var(--ag-font-family);
        font-size: var(--ag-font-size);
        line-height: 1.4;
        color: var(--ag-foreground-color);
        background-color: var(--ag-background-color);
        box-sizing: border-box;
      }
      
      .ag-theme-alpine *, .ag-theme-alpine-dark * {
        box-sizing: border-box;
      }
      
      .ag-theme-alpine .ag-root-wrapper, .ag-theme-alpine-dark .ag-root-wrapper {
        border: 1px solid var(--ag-border-color);
        border-radius: 6px;
        overflow: hidden;
        background-color: var(--ag-background-color);
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      
      .ag-theme-alpine .ag-header, .ag-theme-alpine-dark .ag-header {
        background-color: var(--ag-header-background-color);
        border-bottom: 1px solid var(--ag-border-color);
        color: var(--ag-foreground-color);
        font-weight: 600;
        display: flex;
        width: 100%;
      }
      
      .ag-theme-alpine .ag-header-row, .ag-theme-alpine-dark .ag-header-row {
        display: flex;
        width: 100%;
        height: var(--ag-header-height);
      }
      
      .ag-theme-alpine .ag-header-cell, .ag-theme-alpine-dark .ag-header-cell {
        height: var(--ag-header-height);
        padding: 8px 12px;
        display: flex;
        align-items: center;
        border-right: 1px solid var(--ag-border-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .ag-theme-alpine .ag-header-cell:last-child, .ag-theme-alpine-dark .ag-header-cell:last-child {
        border-right: none;
      }
      
      .ag-theme-alpine .ag-body-viewport, .ag-theme-alpine-dark .ag-body-viewport {
        flex: 1 1 auto;
        overflow: auto;
      }
      
      .ag-theme-alpine .ag-center-cols-container, .ag-theme-alpine-dark .ag-center-cols-container {
        display: block;
        position: relative;
        height: 100%;
        overflow: hidden;
      }
      
      .ag-theme-alpine .ag-row, .ag-theme-alpine-dark .ag-row {
        border-bottom: 1px solid var(--ag-border-color);
        height: var(--ag-row-height);
        display: flex;
        width: 100%;
        position: absolute;
        left: 0;
      }
      
      .ag-theme-alpine .ag-row:hover, .ag-theme-alpine-dark .ag-row:hover {
        background-color: var(--ag-row-hover-color);
      }
      
      .ag-theme-alpine .ag-row:nth-child(even), .ag-theme-alpine-dark .ag-row:nth-child(even) {
        background-color: var(--ag-even-row-background-color);
      }
      
      .ag-theme-alpine .ag-cell, .ag-theme-alpine-dark .ag-cell {
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
      
      .ag-theme-alpine .ag-cell:last-child, .ag-theme-alpine-dark .ag-cell:last-child {
        border-right: none;
      }
      
      .ag-theme-alpine .ag-cell:focus, .ag-theme-alpine-dark .ag-cell:focus {
        outline: 2px solid var(--ag-focus-color);
        outline-offset: -2px;
      }
      
      .ag-theme-alpine .ag-paging-panel, .ag-theme-alpine-dark .ag-paging-panel {
        border-top: 1px solid var(--ag-border-color);
        background-color: var(--ag-header-background-color);
        padding: 8px 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .ag-theme-alpine, .ag-theme-alpine-dark {
          --ag-border-color: ${currentTheme.includes('dark') ? '#ffffff' : '#000000'};
          --ag-focus-color: ${currentTheme.includes('dark') ? '#00ffff' : '#ff0000'};
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Get theme-specific CSS variables based on current theme and theme pair
   */
  private getThemeVariables(_currentTheme: string, _themePair: number): string {
    // Use CSS custom properties from our theme system instead of hardcoded values
    return `
      --ag-font-family: inherit;
      --ag-font-size: 14px;
      --ag-row-height: 40px;
      --ag-header-height: 45px;
      --ag-list-item-height: 24px;
      --ag-border-color: var(--border-primary);
      --ag-background-color: var(--bg-primary);
      --ag-header-background-color: var(--bg-tertiary);
      --ag-odd-row-background-color: transparent;
      --ag-even-row-background-color: var(--secondary-200);
      --ag-row-hover-color: var(--hover-bg);
      --ag-foreground-color: var(--text-primary);
      --ag-secondary-foreground-color: var(--text-secondary);
      --ag-disabled-foreground-color: var(--disabled-text);
      --ag-focus-color: var(--primary-600);
    `;
  }

  /**
   * Get the appropriate ag-Grid theme class name based on current theme
   */
  getThemeClass(): string {
    return this.themeService.isDarkMode() ? 'ag-theme-alpine-dark' : 'ag-theme-alpine';
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