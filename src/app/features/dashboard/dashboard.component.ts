import { Component, signal, computed, inject, Injector, OnInit, OnDestroy, PLATFORM_ID, afterNextRender, viewChild, ElementRef, Type } from '@angular/core';
import { isPlatformBrowser, NgComponentOutlet } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DashboardWidgetComponent } from './components/dashboard-widget/dashboard-widget.component';
import { DashboardLayoutService } from './services/dashboard-layout.service';
import { DashboardPersistenceService } from './services/dashboard-persistence.service';
import { DashboardBreakpointService } from './services/dashboard-breakpoint.service';
import {
  GridPosition,
  GridSize,
  BreakpointTier,
  DashboardWidget
} from './models/dashboard-grid.model';
import { DEFAULT_LAYOUT, DEFAULT_RESPONSIVE_LAYOUT } from './models/default-widgets';
import { WIDGET_REGISTRY } from './tokens/widget-registry.token';
import { WIDGET_CONFIG } from '../../core/tokens/widget-config.token';
import { StatWidgetComponent } from './components/widgets/stat-widget/stat-widget.component';
import { ChartWidgetComponent } from './components/widgets/chart-widget/chart-widget.component';
import { GraphWidgetComponent } from './components/widgets/graph-widget/graph-widget.component';
import { GridWidgetComponent } from './components/widgets/grid-widget/grid-widget.component';
import { WeatherWidgetComponent } from './components/widgets/weather-widget/weather-widget.component';
import { ElectricalWidgetComponent } from './components/widgets/electrical-widget/electrical-widget.component';
import { FocusWidgetComponent } from './components/widgets/focus-widget/focus-widget.component';

const DASHBOARD_WIDGET_REGISTRY: Record<string, Type<unknown>> = {
  stat:        StatWidgetComponent,
  status:      StatWidgetComponent,
  chart:       ChartWidgetComponent,
  graph:       GraphWidgetComponent,
  grid:        GridWidgetComponent,
  weather:     WeatherWidgetComponent,
  electrical:  ElectricalWidgetComponent,
  focus:       FocusWidgetComponent
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DashboardWidgetComponent, NgComponentOutlet, TranslateModule],
  providers: [
    DashboardLayoutService,
    DashboardBreakpointService,
    DashboardPersistenceService,
    { provide: WIDGET_REGISTRY, useValue: DASHBOARD_WIDGET_REGISTRY }
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  protected readonly layoutService = inject(DashboardLayoutService);
  protected readonly persistenceService = inject(DashboardPersistenceService);
  protected readonly breakpointService = inject(DashboardBreakpointService);
  private readonly injector = inject(Injector);
  private readonly widgetRegistry = inject(WIDGET_REGISTRY);
  private readonly platformId = inject(PLATFORM_ID);

  /** Resolve component class from registry; falls back to StatWidgetComponent. */
  protected getWidgetComponent(type: string): Type<unknown> {
    return this.widgetRegistry[type] ?? StatWidgetComponent;
  }

  /**
   * Injector cache keyed by widget ID.
   * Returning the same instance on every change-detection cycle prevents
   * NgComponentOutlet from destroying and recreating the widget component.
   */
  private readonly _widgetInjectors = new Map<string, Injector>();

  protected getWidgetInjector(widget: DashboardWidget): Injector {
    let inj = this._widgetInjectors.get(widget.id);
    if (!inj) {
      inj = Injector.create({
        providers: [{
          provide: WIDGET_CONFIG,
          useValue: { widgetId: widget.id, title: widget.title, data: widget.data ?? {} }
        }],
        parent: this.injector
      });
      this._widgetInjectors.set(widget.id, inj);
    }
    return inj;
  }

  /** Remove a stale cached injector when a widget is removed from the layout. */
  private evictWidgetInjector(widgetId: string): void {
    this._widgetInjectors.delete(widgetId);
  }

  protected readonly dashboardBody = viewChild<ElementRef<HTMLElement>>('dashboardBody');

  private readonly _pointerStart = signal<{ x: number; y: number } | null>(null);

  private resizeObserver: ResizeObserver | null = null;
  private previousTier: BreakpointTier | null = null;
  private layoutLoaded = false;
  private resizeDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly isDragging = computed(() => this.layoutService.dragState() !== null);

  protected readonly cellSizePx = computed(() => `${this.breakpointService.cellSize()}px`);

  protected readonly gridTemplateColumns = computed(
    () => `repeat(${this.layoutService.columns()}, ${this.breakpointService.cellSize()}px)`
  );

  protected readonly gridTemplateRows = computed(
    () => `repeat(${this.layoutService.rows()}, ${this.breakpointService.cellSize()}px)`
  );

  protected readonly breakpointLabel = computed(() => {
    const labels: Record<BreakpointTier, string> = {
      mobile: 'Mobile',
      tablet: 'Tablet',
      desktop: 'Desktop',
      controlCenter: 'Control Center'
    };
    return labels[this.breakpointService.activeTier()];
  });

  protected readonly gridCells = computed(() => {
    const cols = this.layoutService.columns();
    const rows = this.layoutService.rows();
    const cells: { col: number; row: number; key: string }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cells.push({ col: c, row: r, key: `${c},${r}` });
      }
    }
    return cells;
  });

  constructor() {
    afterNextRender(() => this.setupResizeObserver());
  }

  ngOnInit(): void {
    void this.loadLayout();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.resizeDebounceTimer !== null) {
      clearTimeout(this.resizeDebounceTimer);
    }
    this._widgetInjectors.clear();
  }

  private setupResizeObserver(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const el = this.dashboardBody()?.nativeElement;
    if (!el) return;

    // Seed initial width so activeBreakpoint() is correct when loadLayout calls it
    if (el.clientWidth > 0) {
      this.breakpointService.updateWidth(el.clientWidth);
    }

    this.resizeObserver = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (width === 0) return;

      this.breakpointService.updateWidth(width);

      // Don't react until the initial load has finished
      if (!this.layoutLoaded) return;

      const newTier = this.breakpointService.activeTier();
      if (this.previousTier !== null && this.previousTier !== newTier) {
        this.layoutService.applyBreakpoint(this.breakpointService.activeBreakpoint());
        this.previousTier = newTier;

        // Debounce only the persistence write
        if (this.resizeDebounceTimer !== null) {
          clearTimeout(this.resizeDebounceTimer);
        }
        this.resizeDebounceTimer = setTimeout(() => {
          this.resizeDebounceTimer = null;
          this.saveLayout();
        }, 150);
      } else if (this.previousTier === null) {
        this.previousTier = newTier;
      }
    });
    this.resizeObserver.observe(el);
  }

  protected isCellOccupied(col: number, row: number): boolean {
    return this.layoutService.occupiedCells().has(`${col},${row}`);
  }

  protected isCellInValidPreview(col: number, row: number): boolean {
    const state = this.layoutService.dragState();
    if (!state || !state.isValid) return false;
    const { currentPosition: pos, currentSize: size } = state;
    return col >= pos.col && col < pos.col + size.cols &&
           row >= pos.row && row < pos.row + size.rows;
  }

  protected isCellInInvalidPreview(col: number, row: number): boolean {
    const state = this.layoutService.dragState();
    if (!state || state.isValid) return false;
    const { currentPosition: pos, currentSize: size } = state;
    return col >= pos.col && col < pos.col + size.cols &&
           row >= pos.row && row < pos.row + size.rows;
  }

  protected isWidgetDragging(widgetId: string): boolean {
    return this.layoutService.dragState()?.widgetId === widgetId;
  }

  protected getPreviewPosition(widgetId: string): GridPosition | null {
    const state = this.layoutService.dragState();
    if (!state || state.widgetId !== widgetId) return null;
    return state.currentPosition;
  }

  protected getPreviewSize(widgetId: string): GridSize | null {
    const state = this.layoutService.dragState();
    if (!state || state.widgetId !== widgetId) return null;
    return state.currentSize;
  }

  protected onMoveStart(event: { widgetId: string; event: PointerEvent }): void {
    this._pointerStart.set({ x: event.event.clientX, y: event.event.clientY });
    this.layoutService.startDrag(event.widgetId, 'move');
  }

  protected onResizeStart(event: { widgetId: string; event: PointerEvent }): void {
    this._pointerStart.set({ x: event.event.clientX, y: event.event.clientY });
    this.layoutService.startDrag(event.widgetId, 'resize');
  }

  protected onPointerMove(event: PointerEvent): void {
    const state = this.layoutService.dragState();
    const start = this._pointerStart();
    if (!state || !start) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;

    const cs = this.breakpointService.cellSize();
    const cellDeltaCol = Math.round(deltaX / cs);
    const cellDeltaRow = Math.round(deltaY / cs);

    if (state.type === 'move') {
      const newPosition: GridPosition = {
        col: Math.max(0, state.startPosition.col + cellDeltaCol),
        row: Math.max(0, state.startPosition.row + cellDeltaRow)
      };
      this.layoutService.updateDrag(newPosition, state.startSize);
    } else {
      const newSize: GridSize = {
        cols: Math.max(1, state.startSize.cols + cellDeltaCol),
        rows: Math.max(1, state.startSize.rows + cellDeltaRow)
      };
      this.layoutService.updateDrag(state.startPosition, newSize);
    }
  }

  protected onPointerUp(): void {
    if (!this.layoutService.dragState()) return;

    const saved = this.layoutService.endDrag();
    if (saved) {
      this.saveLayout();
    }
    this._pointerStart.set(null);
  }

  /** Handle keyboard-driven widget movement */
  protected onKeyboardMove(event: { widgetId: string; direction: string }): void {
    const widget = this.layoutService.widgets().find(w => w.id === event.widgetId);
    if (!widget) return;

    const delta = this.directionToDelta(event.direction);
    const newPosition: GridPosition = {
      col: widget.position.col + delta.col,
      row: widget.position.row + delta.row
    };

    if (this.layoutService.canPlace(newPosition, widget.size, widget.id)) {
      this.layoutService.startDrag(widget.id, 'move');
      this.layoutService.updateDrag(newPosition, widget.size);
      this.layoutService.endDrag();
      this.saveLayout();
    }
  }

  /** Handle keyboard-driven widget resizing */
  protected onKeyboardResize(event: { widgetId: string; direction: string }): void {
    const widget = this.layoutService.widgets().find(w => w.id === event.widgetId);
    if (!widget) return;

    const delta = this.directionToDelta(event.direction);
    const newSize: GridSize = {
      cols: Math.max(1, widget.size.cols + delta.col),
      rows: Math.max(1, widget.size.rows + delta.row)
    };

    if (this.layoutService.canPlace(widget.position, newSize, widget.id)) {
      this.layoutService.startDrag(widget.id, 'resize');
      this.layoutService.updateDrag(widget.position, newSize);
      this.layoutService.endDrag();
      this.saveLayout();
    }
  }

  private directionToDelta(direction: string): { col: number; row: number } {
    switch (direction) {
      case 'ArrowLeft':  return { col: -1, row: 0 };
      case 'ArrowRight': return { col: 1, row: 0 };
      case 'ArrowUp':    return { col: 0, row: -1 };
      case 'ArrowDown':  return { col: 0, row: 1 };
      default:           return { col: 0, row: 0 };
    }
  }

  protected onWidgetRemoved(widgetId: string): void {
    this.layoutService.removeWidget(widgetId);
    this._widgetInjectors.delete(widgetId);
    this.saveLayout();
  }

  private async loadLayout(): Promise<void> {
    const saved = await this.persistenceService.load();
    if (saved) {
      this.layoutService.setLayout(saved.layout);
      this.layoutService.loadResponsiveLayout(saved.responsiveLayouts);
    } else {
      this.loadDefaultWidgets();
    }

    // Apply the correct breakpoint now that all layouts/snapshots are ready.
    const bp = this.breakpointService.activeBreakpoint();
    this.layoutService.applyBreakpoint(bp);
    this.previousTier = bp.tier;
    this.layoutLoaded = true;
    // Don't auto-save on first load — only save after user interaction
  }

  private loadDefaultWidgets(): void {
    this.layoutService.setLayout(DEFAULT_LAYOUT);
    this.layoutService.loadResponsiveLayout(DEFAULT_RESPONSIVE_LAYOUT);
  }

  private saveLayout(): void {
    void this.persistenceService.save({
      layout: this.layoutService.layout(),
      responsiveLayouts: this.layoutService.getResponsiveLayout()
    });
  }
}