import { 
  Component, 
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  ViewChild,
  ComponentRef,
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

import { DeviceService } from '../../../core/services/device.service';
import { GridLoaderService } from '../../../core/services/grid-loader.service';
import { GridDataService, GridDataConfig } from '../../../core/services/grid-data.service';

//#region Interfaces
export interface ResponsiveGridConfig {
  // ag-Grid configuration (for desktop/tablet)
  gridOptions?: any;
  columnDefs?: any[];
  
  // Mobile fallback configuration
  mobileView?: 'table' | 'list' | 'cards';
  
  // Loading configuration
  showLoadingSpinner?: boolean;
  loadingMessage?: string;
  
  // Error handling
  showErrorMessage?: boolean;
  retryOnError?: boolean;
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
export class ResponsiveGridComponent implements OnInit, OnDestroy, AfterViewInit {
  //#endregion

  //#region Inputs & Outputs
  dataConfig = input.required<GridDataConfig>();
  config = input<ResponsiveGridConfig>({});

  gridReady = output<any>();
  dataLoaded = output<any[]>();
  errorOccurred = output<Error>();
  //#endregion

  //#region ViewChild & Template References
  @ViewChild('gridContainer', { static: false }) gridContainer!: ElementRef<HTMLDivElement>;
  //#endregion

  //#region Component State
  private data = signal<any[]>([]);
  public isLoading = signal(true);
  public hasError = signal(false);
  public errorMessage = signal('');
  //#endregion

  //#region Grid State
  private agGridComponent: ComponentRef<any> | null = null;
  private destroy$ = new Subject<void>();
  private pendingTimeouts: Set<NodeJS.Timeout> = new Set();
  //#endregion

  //#region Services
  private deviceService = inject(DeviceService);
  private gridLoader = inject(GridLoaderService);
  private gridDataService = inject(GridDataService);
  private platformId = inject(PLATFORM_ID);
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
        this.safeSetTimeout(() => this.ensureGridSetup(), 200);
      } else if (!supportsGrids && this.agGridComponent) {
        // Switch to mobile - cleanup grid to free memory
        this.cleanupGrid();
      }
    });

    // Effect to handle data config changes
    effect(() => {
      const currentConfig = this.dataConfig();
      if (currentConfig) {
        this.loadData(currentConfig);
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

  //#region Lifecycle Hooks
  ngOnInit() {
    // Initial data loading is handled by effect in constructor
  }

  ngAfterViewInit() {
    // Initial grid setup if needed
    if (this.showDesktopGrid() && this.data().length > 0 && !this.agGridComponent) {
      this.safeSetTimeout(() => this.ensureGridSetup(), 100);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanupGrid();
  }
  //#endregion

  //#region Public Methods
  retry() {
    const currentConfig = this.dataConfig();
    if (currentConfig) {
      this.loadData(currentConfig);
    }
  }
  //#endregion

  //#region Private Methods - Data Loading
  private loadData(config: GridDataConfig) {
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
            this.setupDesktopGrid();
          } else if (this.showDesktopGrid() && isPlatformBrowser(this.platformId)) {
            // Grid not ready yet, but we have data - setup grid when it becomes ready
            this.waitForGridAndSetup();
          }
          
          // Update grid data if grid is already set up
          this.updateGridData();
        },
        error: (error) => {
          this.isLoading.set(false);
          this.hasError.set(true);
          this.errorMessage.set(error.message);
          this.errorOccurred.emit(error);
        }
      });
  }

  private waitForGridAndSetup() {
    // Subscribe to grid state changes and setup when ready
    this.gridLoader.loadState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        if (state.isLoaded && !state.error && this.data().length > 0) {
          this.setupDesktopGrid();
        }
      });
  }
  //#endregion

  //#region Private Methods - Theme Updates
  private updateGridThemeClass(themeClass: string) {
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
  private cleanupGrid() {
    if (this.agGridComponent) {
      this.agGridComponent.destroy();
      this.agGridComponent = null;
    }
    this.clearPendingTimeouts();
  }

  private clearPendingTimeouts() {
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

  private async ensureGridSetup() {
    // Only setup if we support grids, have data, and don't already have a grid
    if (!this.showDesktopGrid() || !this.data().length || this.agGridComponent) {
      return;
    }
    
    // Check if the ViewChild container is available (might be recreated by @if)
    if (!this.gridContainer?.nativeElement) {
      this.safeSetTimeout(() => this.ensureGridSetup(), 100);
      return;
    }
    
    await this.setupDesktopGrid();
  }

  private async setupDesktopGrid() {
    if (!this.gridContainer?.nativeElement || !isPlatformBrowser(this.platformId)) {
      return;
    }
    
    // Clean up any existing grid first
    this.cleanupGrid();
    
    try {
      const gridModule = await this.gridLoader.loadGridModule();
      
      if (!gridModule) {
        return;
      }

      // Clear any existing content in the grid container
      const containerElement = this.gridContainer.nativeElement;
      containerElement.innerHTML = '';

      // Verify AgGridAngular component is available
      if (!gridModule.AgGridAngular) {
        throw new Error('AgGridAngular component not found in loaded module');
      }

      // Create a div element for the ag-grid with theme class
      const gridDiv = document.createElement('div');
      gridDiv.style.height = '100%';
      gridDiv.style.width = '100%';
      const themeClass = this.gridThemeClass();
      gridDiv.className = themeClass;
      containerElement.appendChild(gridDiv);

      // Initialize ag-Grid directly on the div
      const gridOptions = {
        columnDefs: this.config().columnDefs || [],
        rowData: this.data(),
        ...this.config().gridOptions,
        onGridReady: (params: any) => {
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
      
      // Store the grid API for later updates
      this.agGridComponent = { 
        instance: { api: gridApi },
        destroy: () => {
          if (gridApi) {
            gridApi.destroy();
          }
        }
      } as any;
      
    } catch (error) {
      console.error('ResponsiveGridComponent: Failed to setup desktop grid:', error);
      this.hasError.set(true);
      this.errorMessage.set('Failed to load grid component');
    }
  }

  private updateGridData() {
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
      this.safeSetTimeout(() => this.ensureGridSetup(), 100);
    }
  }
  //#endregion
}