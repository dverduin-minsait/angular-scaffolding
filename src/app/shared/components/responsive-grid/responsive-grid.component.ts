import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  ViewChild,
  ComponentRef,
  ViewContainerRef,
  TemplateRef,
  ContentChild,
  inject,
  PLATFORM_ID,
  signal,
  computed,
  input,
  output,
  OnChanges,
  SimpleChanges,
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

@Component({
  selector: 'app-responsive-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './responsive-grid.component.html',
  styleUrls: ['./responsive-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResponsiveGridComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  dataConfig = input.required<GridDataConfig>();
  config = input<ResponsiveGridConfig>({});

  gridReady = output<any>();
  dataLoaded = output<any[]>();
  errorOccurred = output<Error>();
  
  @ViewChild('gridContainer', { static: false }) gridContainer!: ElementRef<HTMLDivElement>;
  
  @ContentChild('mobileTable') mobileTableTemplate!: TemplateRef<any>;
  @ContentChild('mobileList') mobileListTemplate!: TemplateRef<any>;
  @ContentChild('mobileCards') mobileCardsTemplate!: TemplateRef<any>;

  // Component state
  private data = signal<any[]>([]);
  public isLoading = signal(true);
  public hasError = signal(false);
  public errorMessage = signal('');
  
  // Grid state
  private agGridComponent: ComponentRef<any> | null = null;
  private destroy$ = new Subject<void>();
  private pendingTimeouts: Set<NodeJS.Timeout> = new Set();
  
  // Inject services
  private deviceService = inject(DeviceService);
  private gridLoader = inject(GridLoaderService);
  private gridDataService = inject(GridDataService);
  private platformId = inject(PLATFORM_ID);

  protected showMobileView = computed(() => !this.deviceService.supportsGrids());
  protected showDesktopGrid = computed(() => this.deviceService.supportsGrids());

  /** @todo check that timeout, maybe it is not necessary or we can wait for the view to stabilize */
  constructor() {
    // Effect to watch for device changes and setup/teardown grid accordingly
    effect(() => {
      const supportsGrids = this.deviceService.supportsGrids();
      const hasData = this.data().length > 0;
      
      if (supportsGrids && hasData && !this.isLoading() && !this.hasError()) {
        // We switched to desktop and have data - setup grid after view init
        // Use a longer timeout to ensure ViewChild is updated after @if condition changes
        this.safeSetTimeout(() => this.ensureGridSetup(), 200);
      } else if (!supportsGrids && this.agGridComponent) {
        // We switched to mobile - cleanup grid to free memory
        this.cleanupGrid();
      }
    });
  }

  ngOnInit() {
    this.loadData(this.dataConfig());
  }

  ngAfterViewInit() {
    // Initial grid setup if needed
    if (this.showDesktopGrid() && this.data().length > 0 && !this.agGridComponent) {
      this.safeSetTimeout(() => this.ensureGridSetup(), 100);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['dataConfig'] && !changes['dataConfig'].firstChange) {
      this.loadData(this.dataConfig());
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    
    this.cleanupGrid();
  }

  private cleanupGrid() {
    if (this.agGridComponent) {
      this.agGridComponent.destroy();
      this.agGridComponent = null;
    }
    
    // Clear any pending timeouts to prevent calling methods on destroyed grid
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
          console.error('ResponsiveGrid: Error loading data:', error);
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

      // Create a div element for the ag-grid
      const gridDiv = document.createElement('div');
      gridDiv.style.height = '100%';
      gridDiv.style.width = '100%';
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
      console.error('Failed to setup desktop grid:', error);
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

  retry() {
    const currentConfig = this.dataConfig();
    if (currentConfig) {
      this.loadData(currentConfig);
    }
  }
}