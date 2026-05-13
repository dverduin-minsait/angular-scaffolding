/** Default number of columns in the grid */
export const DEFAULT_COLUMNS = 12;

/** Default number of rows in the grid */
export const DEFAULT_ROWS = 5;

/** Breakpoint tier names */
export type BreakpointTier = 'mobile' | 'tablet' | 'desktop' | 'controlCenter';

/** Breakpoint definition: tier name + min-width threshold in px */
export interface BreakpointDefinition {
  tier: BreakpointTier;
  minWidth: number;
  columns: number;
  rows: number;
  /** Fallback cell size (px) used when container width is unknown */
  fallbackCellSize: number;
}

/** Ordered breakpoints (ascending by minWidth) */
export const BREAKPOINTS: readonly BreakpointDefinition[] = [
  { tier: 'mobile',        minWidth: 0,    columns: 4,  rows: 6,  fallbackCellSize: 60 },
  { tier: 'tablet',        minWidth: 600,  columns: 8,  rows: 5,  fallbackCellSize: 70 },
  { tier: 'desktop',       minWidth: 1024, columns: 12, rows: 5,  fallbackCellSize: 80 },
  { tier: 'controlCenter', minWidth: 1920, columns: 16, rows: 6, fallbackCellSize: 80 }
] as const;

/** Per-breakpoint layout: the widgets for a specific tier */
export interface BreakpointLayout {
  tier: BreakpointTier;
  widgets: DashboardWidget[];
}

/** Full responsive dashboard state saved to persistence */
export interface ResponsiveDashboardLayout {
  id: string;
  name: string;
  breakpointLayouts: BreakpointLayout[];
}

/** Position of a widget on the grid (cell coordinates) */
export interface GridPosition {
  col: number;
  row: number;
}

/** Size of a widget in grid cells */
export interface GridSize {
  cols: number;
  rows: number;
}

/** A widget placed on the dashboard grid */
export interface DashboardWidget {
  id: string;
  title: string;
  type: string;
  position: GridPosition;
  size: GridSize;
  minSize?: GridSize;
  maxSize?: GridSize;
  data?: Record<string, unknown>;
}

/** Complete layout state of the dashboard */
export interface DashboardLayout {
  id: string;
  name: string;
  columns: number;
  rows: number;
  widgets: DashboardWidget[];
}

/** Interaction state during drag/resize */
export interface DragState {
  widgetId: string;
  type: 'move' | 'resize';
  startPosition: GridPosition;
  startSize: GridSize;
  currentPosition: GridPosition;
  currentSize: GridSize;
  isValid: boolean;
}

/** Persistence strategy identifier */
export type PersistenceStrategy = 'api' | 'localStorage';

/** Full persisted state: current layout + per-tier widget snapshots */
export interface PersistedDashboardState {
  layout: DashboardLayout;
  responsiveLayouts: ResponsiveDashboardLayout;
}
