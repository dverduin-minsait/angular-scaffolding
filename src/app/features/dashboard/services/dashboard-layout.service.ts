import { Injectable, signal, computed } from '@angular/core';
import {
  DashboardLayout,
  DashboardWidget,
  DragState,
  GridPosition,
  GridSize,
  DEFAULT_COLUMNS,
  DEFAULT_ROWS,
  BreakpointTier,
  BreakpointDefinition,
  BreakpointLayout,
  ResponsiveDashboardLayout,
  BREAKPOINTS
} from '../models/dashboard-grid.model';

@Injectable()
export class DashboardLayoutService {
  private readonly _layout = signal<DashboardLayout>({
    id: 'default',
    name: 'Default Layout',
    columns: DEFAULT_COLUMNS,
    rows: DEFAULT_ROWS,
    widgets: []
  });

  private readonly _dragState = signal<DragState | null>(null);
  private readonly _activeTier = signal<BreakpointTier>('desktop');

  /**
   * Per-tier widget snapshots. When the user rearranges widgets in a given
   * breakpoint tier, we capture that arrangement here so switching back
   * restores their layout.
   */
  private readonly _breakpointLayouts = signal<Map<BreakpointTier, DashboardWidget[]>>(new Map());

  readonly layout = this._layout.asReadonly();
  readonly dragState = this._dragState.asReadonly();

  readonly widgets = computed(() => this._layout().widgets);
  readonly columns = computed(() => this._layout().columns);
  readonly rows = computed(() => this._layout().rows);
  readonly activeTier = this._activeTier.asReadonly();

  /** Occupied cells map for collision detection */
  readonly occupiedCells = computed(() => {
    const map = new Map<string, string>();
    const dragId = this._dragState()?.widgetId;

    for (const widget of this._layout().widgets) {
      if (widget.id === dragId) continue;
      for (let c = widget.position.col; c < widget.position.col + widget.size.cols; c++) {
        for (let r = widget.position.row; r < widget.position.row + widget.size.rows; r++) {
          map.set(`${c},${r}`, widget.id);
        }
      }
    }
    return map;
  });

  setLayout(layout: DashboardLayout): void {
    this._layout.set({
      ...layout,
      columns: layout.columns || DEFAULT_COLUMNS,
      rows: layout.rows || DEFAULT_ROWS
    });
  }

  addWidget(widget: DashboardWidget): boolean {
    if (!this.canPlace(widget.position, widget.size, widget.id)) {
      return false;
    }
    this._layout.update(l => ({
      ...l,
      widgets: [...l.widgets, widget]
    }));
    return true;
  }

  removeWidget(widgetId: string): void {
    this._layout.update(l => ({
      ...l,
      widgets: l.widgets.filter(w => w.id !== widgetId)
    }));
  }

  startDrag(widgetId: string, type: 'move' | 'resize'): void {
    const widget = this._layout().widgets.find(w => w.id === widgetId);
    if (!widget) return;

    this._dragState.set({
      widgetId,
      type,
      startPosition: { ...widget.position },
      startSize: { ...widget.size },
      currentPosition: { ...widget.position },
      currentSize: { ...widget.size },
      isValid: true
    });
  }

  updateDrag(position: GridPosition, size: GridSize): void {
    const state = this._dragState();
    if (!state) return;

    const isValid = this.canPlace(position, size, state.widgetId);
    this._dragState.set({
      ...state,
      currentPosition: position,
      currentSize: size,
      isValid
    });
  }

  endDrag(): boolean {
    const state = this._dragState();
    if (!state) return false;

    if (state.isValid) {
      this._layout.update(layout => ({
        ...layout,
        widgets: layout.widgets.map(w =>
          w.id === state.widgetId
            ? { ...w, position: state.currentPosition, size: state.currentSize }
            : w
        )
      }));
      this._dragState.set(null);
      return true;
    }

    this._dragState.set(null);
    return false;
  }

  cancelDrag(): void {
    this._dragState.set(null);
  }

  /** Check if a widget can be placed at a given position/size */
  canPlace(position: GridPosition, size: GridSize, excludeWidgetId?: string): boolean {
    const cols = this._layout().columns;
    const rows = this._layout().rows;

    // Bounds check
    if (position.col < 0 || position.row < 0) return false;
    if (position.col + size.cols > cols) return false;
    if (position.row + size.rows > rows) return false;

    // Collision check
    for (const widget of this._layout().widgets) {
      if (widget.id === excludeWidgetId) continue;
      if (this.overlaps(position, size, widget.position, widget.size)) {
        return false;
      }
    }
    return true;
  }

  private overlaps(
    pos1: GridPosition, size1: GridSize,
    pos2: GridPosition, size2: GridSize
  ): boolean {
    return !(
      pos1.col + size1.cols <= pos2.col ||
      pos2.col + size2.cols <= pos1.col ||
      pos1.row + size1.rows <= pos2.row ||
      pos2.row + size2.rows <= pos1.row
    );
  }

  /**
   * Switch to a new breakpoint tier.
   * Saves the current widget arrangement for the old tier,
   * then loads the saved arrangement for the new tier (or auto-adapts).
   */
  applyBreakpoint(bp: BreakpointDefinition): void {
    const newTier = bp.tier;

    // Save current widgets snapshot for the current tier
    this.snapshotCurrentTier();

    // Update grid dimensions
    this._layout.update(l => ({
      ...l,
      columns: bp.columns,
      rows: bp.rows
    }));

    this._activeTier.set(newTier);

    // Restore widgets for the new tier (if we have a snapshot)
    const snapshots = this._breakpointLayouts();
    const saved = snapshots.get(newTier);
    if (saved) {
      this._layout.update(l => ({ ...l, widgets: saved }));
    } else {
      // Auto-adapt: clamp widgets that exceed the new grid
      this.clampWidgetsToGrid();
    }
  }

  /** Snapshot the current widgets for the active tier */
  snapshotCurrentTier(): void {
    const tier = this._activeTier();
    const widgets = this._layout().widgets.map(w => ({ ...w }));
    this._breakpointLayouts.update(map => {
      const next = new Map(map);
      next.set(tier, widgets);
      return next;
    });
  }

  /** Load breakpoint layouts from a persisted responsive layout */
  loadResponsiveLayout(data: ResponsiveDashboardLayout): void {
    const map = new Map<BreakpointTier, DashboardWidget[]>();
    for (const bl of data.breakpointLayouts) {
      map.set(bl.tier, bl.widgets);
    }
    this._breakpointLayouts.set(map);
  }

  /** Export current breakpoint layouts for persistence */
  getResponsiveLayout(): ResponsiveDashboardLayout {
    // Ensure current tier is captured
    this.snapshotCurrentTier();

    const breakpointLayouts: BreakpointLayout[] = [];
    const map = this._breakpointLayouts();
    for (const bp of BREAKPOINTS) {
      const widgets = map.get(bp.tier);
      if (widgets) {
        breakpointLayouts.push({ tier: bp.tier, widgets });
      }
    }
    return {
      id: this._layout().id,
      name: this._layout().name,
      breakpointLayouts
    };
  }

  /** Clamp widgets that fall outside the current grid bounds, avoiding collisions */
  private clampWidgetsToGrid(): void {
    const cols = this._layout().columns;
    const rows = this._layout().rows;

    this._layout.update(l => {
      const placed: { position: GridPosition; size: GridSize }[] = [];

      const widgets = l.widgets.map(w => {
        const clampedCols = Math.min(w.size.cols, cols);
        const clampedRows = Math.min(w.size.rows, rows);
        let clampedCol = Math.min(w.position.col, cols - clampedCols);
        let clampedRow = Math.min(w.position.row, rows - clampedRows);
        clampedCol = Math.max(0, clampedCol);
        clampedRow = Math.max(0, clampedRow);

        // Resolve collisions: shift down until no overlap with already-placed widgets
        let candidate = { col: clampedCol, row: clampedRow };
        const size = { cols: clampedCols, rows: clampedRows };

        while (this.collidesWithPlaced(candidate, size, placed, cols, rows)) {
          candidate = { col: candidate.col, row: candidate.row + 1 };
          if (candidate.row + size.rows > rows) {
            // Wrap to next column group or give up (place at origin)
            candidate = { col: 0, row: 0 };
            break;
          }
        }

        placed.push({ position: candidate, size });
        return { ...w, position: candidate, size };
      });

      return { ...l, widgets };
    });
  }

  /** Check if a candidate position collides with any already-placed widget */
  private collidesWithPlaced(
    pos: GridPosition,
    size: GridSize,
    placed: { position: GridPosition; size: GridSize }[],
    _cols: number,
    _rows: number
  ): boolean {
    return placed.some(p => this.overlaps(pos, size, p.position, p.size));
  }
}
