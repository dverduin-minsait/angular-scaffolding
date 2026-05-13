import {
  Component,
  OnDestroy,
  ViewChild,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
  computed,
  afterNextRender,
  DestroyRef
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { GridLoaderService } from '../../../../../core/services';
import { WIDGET_CONFIG } from '../../../../../core/tokens/widget-config.token';

interface RowData {
  name: string;
  value: string;
  status: string;
  change: string;
}

interface ColDef {
  field: string;
  headerName: string;
  flex?: number;
  width?: number;
}

interface GridApi {
  destroy: () => void;
  isDestroyed?: () => boolean;
}

type GridModule = Record<string, unknown> & {
  createGrid?: (el: HTMLElement, opts: Record<string, unknown>) => GridApi;
};

const SAMPLE_DATA: RowData[] = [
  { name: 'CPU Usage',    value: '73%',    status: 'Warning',  change: '+5%'  },
  { name: 'Memory',       value: '4.2 GB', status: 'Normal',   change: '-2%'  },
  { name: 'Disk I/O',     value: '120 MB', status: 'Normal',   change: '+1%'  },
  { name: 'Network In',   value: '850 Mb', status: 'Normal',   change: '+12%' },
  { name: 'Network Out',  value: '210 Mb', status: 'Normal',   change: '-3%'  },
  { name: 'API Latency',  value: '45 ms',  status: 'Normal',   change: '-8%'  },
  { name: 'Error Rate',   value: '0.02%',  status: 'Healthy',  change: '-0.01%' },
  { name: 'Active Users', value: '1,234',  status: 'Normal',   change: '+7%'  }
];

const COLUMN_DEFS: ColDef[] = [
  { field: 'name',   headerName: 'Metric',  flex: 2 },
  { field: 'value',  headerName: 'Value',   flex: 1 },
  { field: 'status', headerName: 'Status',  flex: 1 },
  { field: 'change', headerName: 'Change',  flex: 1 }
];

@Component({
  selector: 'app-grid-widget',
  standalone: true,
  template: `
    <div class="grid-widget" role="region" [attr.aria-label]="title() + ' data grid'">
      @if (isLoading()) {
        <div class="grid-overlay" aria-live="polite" aria-label="Loading grid data">
          <div class="loading-spinner" aria-hidden="true"></div>
        </div>
      } @else if (hasError()) {
        <div class="grid-overlay grid-error" role="alert">
          <span>Failed to load grid</span>
        </div>
      }
      <div #gridContainer [class]="themeClass()" style="height:100%;width:100%"
           [style.visibility]="isLoading() || hasError() ? 'hidden' : 'visible'"></div>
    </div>
  `,
  styleUrl: './grid-widget.component.scss'
})
export class GridWidgetComponent implements OnDestroy {
  private readonly config = inject(WIDGET_CONFIG);
  protected readonly title = computed(() => this.config.title);

  @ViewChild('gridContainer', { static: false }) gridContainer!: ElementRef<HTMLDivElement>;

  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);

  private gridApi: GridApi | null = null;
  private readonly pendingTimers: Set<ReturnType<typeof setTimeout>> = new Set();

  private readonly platformId = inject(PLATFORM_ID);
  private readonly gridLoader = inject(GridLoaderService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly themeClass = computed(() => this.gridLoader.getThemeClass());

  constructor() {
    this.destroyRef.onDestroy(() => this.cleanup());
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) {
        void this.setupGrid();
      }
    });
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private async setupGrid(): Promise<void> {
    try {
      const mod = await this.gridLoader.loadGridModule() as GridModule | null;
      if (!mod?.createGrid || !this.gridContainer?.nativeElement) {
        this.hasError.set(true);
        this.isLoading.set(false);
        return;
      }

      const container = this.gridContainer.nativeElement;
      container.innerHTML = '';

      const gridDiv = document.createElement('div');
      gridDiv.style.height = '100%';
      gridDiv.style.width = '100%';
      gridDiv.className = this.themeClass();
      container.appendChild(gridDiv);

      this.gridApi = mod.createGrid(gridDiv, {
        columnDefs: COLUMN_DEFS,
        rowData: SAMPLE_DATA,
        rowHeight: 28,
        headerHeight: 32,
        suppressMovableColumns: true,
        onGridReady: (params: { api: { sizeColumnsToFit: () => void } }) => {
          this.safeTimer(() => params.api.sizeColumnsToFit(), 80);
        }
      });

      this.isLoading.set(false);
    } catch {
      this.hasError.set(true);
      this.isLoading.set(false);
    }
  }

  private safeTimer(fn: () => void, delay: number): void {
    const t = setTimeout(() => {
      this.pendingTimers.delete(t);
      fn();
    }, delay);
    this.pendingTimers.add(t);
  }

  private cleanup(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers.clear();
    if (this.gridApi && typeof this.gridApi.destroy === 'function') {
      if (!this.gridApi.isDestroyed?.()) {
        this.gridApi.destroy();
      }
      this.gridApi = null;
    }
  }
}
