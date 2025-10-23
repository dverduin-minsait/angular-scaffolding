import { 
  Component, 
  ChangeDetectionStrategy,
  OnDestroy,
  ViewChild,
  inject,
  PLATFORM_ID,
  signal,
  computed,
  input,
  output,
  ElementRef,
  effect,
  AfterViewInit
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DeviceService } from '../../../core/services';
import { GridLoaderService } from '../../../core/services';
import { GridDataService, GridDataConfig } from '../../../core/services';

//#region Interfaces
export interface ResponsiveGridConfig {
  // ag-Grid configuration (for desktop/tablet)
  gridOptions?: GridOptions;
  columnDefs?: unknown[];
  
  // Mobile fallback configuration
  mobileView?: 'table' | 'list' | 'cards';
  
  // Loading configuration
  showLoadingSpinner?: boolean;
  loadingMessage?: string;
  
  // Error handling
  showErrorMessage?: boolean;
  retryOnError?: boolean;
}

interface GridOptions {
  [key: string]: unknown;
}

interface GridApi {
  setGridOption: (option: string, value: unknown) => void;
  sizeColumnsToFit: () => void;
  destroy: () => void;
  isDestroyed?: () => boolean;
}

interface GridReadyEvent {
  api: GridApi;
  [key: string]: unknown;
}

interface GridModule {
  AgGridModule?: unknown;
  AgGridAngular?: unknown;
  createGrid?: (element: HTMLElement, gridOptions: GridOptions) => GridApi;
  [key: string]: unknown;
}

interface GridComponent {
  instance: {
    api: GridApi;
  };
  destroy: () => void;
}
//#endregion

//#region Component Declaration
@Component({
  selector: 'app-responsive-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './responsive-grid.component.html',
  styleUrls: ['./responsive-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResponsiveGridComponent implements OnDestroy, AfterViewInit {
  //#endregion

  //#region Inputs & Outputs
  dataConfig = input.required<GridDataConfig>();
  config = input<ResponsiveGridConfig>({});
  // Optional direct signal-based data (bypasses GridDataService loading)
  dataSignal = input<unknown[] | null | undefined>(undefined);

  gridReady = output<GridReadyEvent>();
  dataLoaded = output<unknown[]>();
  errorOccurred = output<Error>();
  //#endregion

  //#region ViewChild & Template References
  @ViewChild('gridContainer', { static: false }) gridContainer!: ElementRef<HTMLDivElement>;
  //#endregion

  //#region Component State
  private readonly data = signal<unknown[]>([]);
  public isLoading = signal(true);
  public hasError = signal(false);
  public errorMessage = signal('');
  //#endregion

  //#region Grid State
  private agGridComponent: GridComponent | null = null;
  private readonly destroy$ = new Subject<void>();
  private readonly pendingTimeouts: Set<NodeJS.Timeout> = new Set();
  //#endregion

  //#region Services
  private readonly deviceService = inject(DeviceService);
  private readonly gridLoader = inject(GridLoaderService);
  private readonly gridDataService = inject(GridDataService);
  private readonly platformId = inject(PLATFORM_ID);
  //#endregion

  //#region Computed Properties
  public showMobileView = computed(() => !this.deviceService.supportsGrids());
  public showDesktopGrid = computed(() => this.deviceService.supportsGrids());
  public gridThemeClass = computed(() => this.gridLoader.getThemeClass());
  //#endregion

  //#region Constructor
  constructor() {
    // Effect to handle device changes and grid setup/teardown
    effect(() => {
      const supportsGrids = this.deviceService.supportsGrids();
      const hasData = this.data().length > 0;
      
      if (supportsGrids && hasData && !this.isLoading() && !this.hasError()) {
        // Switch to desktop with data - setup grid after view init
        this.safeSetTimeout(() => void this.ensureGridSetup(), 200);
      } else if (!supportsGrids && this.agGridComponent) {
        // Switch to mobile - cleanup grid to free memory
        this.cleanupGrid();
      }
    });

    // Effect to handle data config changes
    effect(() => {
      // Skip standard loading if a direct dataSignal is provided
      if (this.dataSignal()) return;
      const currentConfig = this.dataConfig();
      if (currentConfig) {
        this.loadData(currentConfig);
      }
    });

    effect(() => {
      // Remove unused config variable
      this.config();
      void this.setupDesktopGrid();
    });

    // Effect for direct signal-driven data updates
    effect(() => {
      const directData = this.dataSignal();
      if (directData) {
        this.isLoading.set(false);
        this.hasError.set(false);
        this.data.set(directData);
        if (this.showDesktopGrid() && directData.length) {
          if (!this.agGridComponent) {
            this.safeSetTimeout(() => void this.ensureGridSetup(), 80);
          } else {
            this.updateGridData();
          }
        }
      }
    });

    // Effect to handle theme changes - update grid theme class
    effect(() => {
      const themeClass = this.gridThemeClass();
      if (this.gridContainer?.nativeElement && this.agGridComponent) {
        // Update the theme class on the grid container
        this.updateGridThemeClass(themeClass);
      }
    });
  }
  //#endregion

  //#region Lifecycle 
  ngAfterViewInit(): void {
    // Initial grid setup if needed
    if (this.showDesktopGrid() && this.data().length > 0 && !this.agGridComponent) {
      this.safeSetTimeout(() => void this.ensureGridSetup(), 100);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanupGrid();
  }
  //#endregion

  //#region Public Methods
  retry(): void {
    const currentConfig = this.dataConfig();
    if (currentConfig) {
      this.loadData(currentConfig);
    }
  }
  //#endregion

  //#region Private Methods - Data Loading
  private loadData(config: GridDataConfig): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.gridDataService.loadDataWithGrid(config)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.data.set(result.data);
          this.isLoading.set(false);
          this.dataLoaded.emit(result.data);
          
          if (result.gridReady && this.showDesktopGrid() && isPlatformBrowser(this.platformId)) {
            void this.setupDesktopGrid();
          } else if (this.showDesktopGrid() && isPlatformBrowser(this.platformId)) {
            // Grid not ready yet, but we have data - setup grid when it becomes ready
            this.waitForGridAndSetup();
          }
          
          // Update grid data if grid is already set up
          this.updateGridData();
        },
        error: (error: Error) => {
          this.isLoading.set(false);
          this.hasError.set(true);
          this.errorMessage.set(error.message || 'Unknown error occurred');
          this.errorOccurred.emit(error);
        }
      });
  }

  private waitForGridAndSetup(): void {
    // Subscribe to grid state changes and setup when ready
    this.gridLoader.loadState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        if (state.isLoaded && !state.error && this.data().length > 0) {
          void this.setupDesktopGrid();
        }
      });
  }
  //#endregion

  //#region Private Methods - Theme Updates
  private updateGridThemeClass(themeClass: string): void {
    if (this.gridContainer?.nativeElement) {
      const container = this.gridContainer.nativeElement;
      // Remove existing ag-theme classes from container
      container.classList.remove('ag-theme-alpine', 'ag-theme-alpine-dark');
      // Add new theme class to container
      container.classList.add(themeClass);
      
      // Also update the theme class on the actual grid div (child element)
      const gridDiv = container.querySelector('div');
      if (gridDiv) {
        gridDiv.classList.remove('ag-theme-alpine', 'ag-theme-alpine-dark');
        gridDiv.className = themeClass;
      }
    }
  }
  //#endregion

  //#region Private Methods - Cleanup
  private cleanupGrid(): void {
    if (this.agGridComponent) {
      this.agGridComponent.destroy();
      this.agGridComponent = null;
    }
    this.clearPendingTimeouts();
  }

  private clearPendingTimeouts(): void {
    this.pendingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.pendingTimeouts.clear();
  }

  private safeSetTimeout(callback: () => void, delay: number): void {
    const timeout = setTimeout(() => {
      this.pendingTimeouts.delete(timeout);
      callback();
    }, delay);
    this.pendingTimeouts.add(timeout);
  }
  //#endregion

  //#region Private Methods - Grid Management
  private isGridValid(): boolean {
    return !!(
      this.agGridComponent?.instance?.api && 
      !this.agGridComponent.instance.api.isDestroyed?.()
    );
  }

  private async ensureGridSetup(): Promise<void> {
    // Only setup if we support grids, have data, and don't already have a grid
    if (!this.showDesktopGrid() || !this.data().length || this.agGridComponent) {
      return;
    }
    
    // Check if the ViewChild container is available (might be recreated by @if)
    if (!this.gridContainer?.nativeElement) {
      this.safeSetTimeout(() => void this.ensureGridSetup(), 100);
      return;
    }
    
    await this.setupDesktopGrid();
  }

  private async setupDesktopGrid(): Promise<void> {
    if (!this.gridContainer?.nativeElement || !isPlatformBrowser(this.platformId)) {
      return;
    }
    
    // Clean up any existing grid first
    this.cleanupGrid();
    
    try {
      const gridModuleRaw = await this.gridLoader.loadGridModule();
      
      if (!gridModuleRaw) {
        return;
      }

      // Type assertion since we know the structure from GridLoaderService
      const gridModule = gridModuleRaw as GridModule;

      // Clear any existing content in the grid container
      const containerElement = this.gridContainer.nativeElement;
      containerElement.innerHTML = '';

      // Verify createGrid function is available
      if (!gridModule.createGrid) {
        throw new Error('createGrid function not found in loaded module');
      }

      // Create a div element for the ag-grid with theme class
      const gridDiv = document.createElement('div');
      gridDiv.style.height = '100%';
      gridDiv.style.width = '100%';
      const themeClass = this.gridThemeClass();
      gridDiv.className = themeClass;
      containerElement.appendChild(gridDiv);

      // Initialize ag-Grid directly on the div
      const gridOptions: GridOptions = {
        columnDefs: this.config().columnDefs || [],
        rowData: this.data(),
        ...this.config().gridOptions,
        onGridReady: (params: GridReadyEvent) => {
          // Auto-size columns when ready - with safety check
          this.safeSetTimeout(() => {
            if (this.isGridValid() && params.api) {
              params.api.sizeColumnsToFit();
            }
          }, 100);
          this.gridReady.emit(params);
        }
      };

      // Create the grid using ag-Grid's createGrid function
      const gridApi = gridModule.createGrid(gridDiv, gridOptions);
      
      if (!gridApi) {
        throw new Error('Failed to create grid API');
      }

      // Store the grid API for later updates
      this.agGridComponent = { 
        instance: { api: gridApi },
        destroy: () => {
          if (gridApi && typeof gridApi.destroy === 'function') {
            gridApi.destroy();
          }
        }
      };
      
    } catch (error) {
      console.error('ResponsiveGridComponent: Failed to setup desktop grid:', error);
      this.hasError.set(true);
      this.errorMessage.set('Failed to load grid component');
    }
  }

  private updateGridData(): void {
    if (this.agGridComponent && this.data().length > 0) {
      const gridInstance = this.agGridComponent.instance;
      if (this.isGridValid() && gridInstance?.api) {
        gridInstance.api.setGridOption('rowData', this.data());
        
        // Auto-size columns after data update - with safety check
        this.safeSetTimeout(() => {
          if (this.isGridValid() && gridInstance.api) {
            gridInstance.api.sizeColumnsToFit();
          }
        }, 100);
      }
    } else if (this.showDesktopGrid() && this.data().length > 0 && !this.agGridComponent) {
      // We have data and should show grid, but no grid exists - try to set it up
      this.safeSetTimeout(() => void this.ensureGridSetup(), 100);
    }
  }
  //#endregion
}