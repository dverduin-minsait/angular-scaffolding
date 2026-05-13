import { DashboardWidget, ResponsiveDashboardLayout, DEFAULT_COLUMNS, DEFAULT_ROWS } from './dashboard-grid.model';

const DESKTOP_WIDGETS: DashboardWidget[] = [
  // Row 0 — 3 stats (cols 0-8) + focus widget top (col 9-11)
  { id: 'widget-1',     title: 'CPU Load',       type: 'stat',       position: { col: 0, row: 0 }, size: { cols: 3, rows: 1 }, data: { value: '73%' } },
  { id: 'widget-2',     title: 'Memory',          type: 'stat',       position: { col: 3, row: 0 }, size: { cols: 3, rows: 1 }, data: { value: '4.2 GB' } },
  { id: 'widget-3',     title: 'Active Users',    type: 'stat',       position: { col: 6, row: 0 }, size: { cols: 3, rows: 1 }, data: { value: '1,234' } },
  // Focus widget spans col 9-11, rows 0-2
  { id: 'widget-focus', title: 'User Focus',      type: 'focus',      position: { col: 9, row: 0 }, size: { cols: 3, rows: 3 }, data: { idleThreshold: 30, awayThreshold: 60 } },
  // Rows 1-2 — status (3) + chart (6); col 9-11 taken by focus widget
  { id: 'widget-5',     title: 'Server Status',   type: 'status',     position: { col: 0, row: 1 }, size: { cols: 3, rows: 2 }, data: { value: 'Healthy' } },
  { id: 'widget-6',     title: 'Revenue Chart',   type: 'chart',      position: { col: 3, row: 1 }, size: { cols: 6, rows: 2 }, data: { value: '$12.4k' } },
  // Rows 3-4 — 4 monitoring widgets × 3 cols = 12
  { id: 'widget-8',     title: 'Network I/O',     type: 'chart',      position: { col: 0, row: 3 }, size: { cols: 3, rows: 2 }, data: { value: '1.2 Gbps' } },
  { id: 'widget-9',     title: 'Traffic',         type: 'graph',      position: { col: 3, row: 3 }, size: { cols: 3, rows: 2 }, data: { value: '24.5k visits' } },
  { id: 'widget-10',    title: 'Madrid Weather',  type: 'weather',    position: { col: 6, row: 3 }, size: { cols: 3, rows: 2 }, data: { location: 'madrid' } },
  { id: 'widget-11',    title: 'Power — Main',    type: 'electrical', position: { col: 9, row: 3 }, size: { cols: 3, rows: 2 }, data: { location: 'main' } }
];

const MOBILE_WIDGETS: DashboardWidget[] = [
  { id: 'widget-1', title: 'CPU Load', type: 'stat', position: { col: 0, row: 0 }, size: { cols: 2, rows: 1 }, data: { value: '73%' } },
  { id: 'widget-2', title: 'Memory', type: 'stat', position: { col: 2, row: 0 }, size: { cols: 2, rows: 1 }, data: { value: '4.2 GB' } },
  { id: 'widget-3', title: 'Active Users', type: 'stat', position: { col: 0, row: 1 }, size: { cols: 4, rows: 1 }, data: { value: '1,234' } },
  { id: 'widget-4', title: 'Revenue Chart', type: 'chart', position: { col: 0, row: 2 }, size: { cols: 4, rows: 2 }, data: { value: '$12.4k' } },
  { id: 'widget-5', title: 'Server Status', type: 'status', position: { col: 0, row: 4 }, size: { cols: 4, rows: 2 }, data: { value: 'Healthy' } }
];

const TABLET_WIDGETS: DashboardWidget[] = [
  { id: 'widget-1', title: 'CPU Load', type: 'stat', position: { col: 0, row: 0 }, size: { cols: 2, rows: 1 }, data: { value: '73%' } },
  { id: 'widget-2', title: 'Memory', type: 'stat', position: { col: 2, row: 0 }, size: { cols: 2, rows: 1 }, data: { value: '4.2 GB' } },
  { id: 'widget-3', title: 'Active Users', type: 'stat', position: { col: 4, row: 0 }, size: { cols: 4, rows: 1 }, data: { value: '1,234' } },
  { id: 'widget-4', title: 'Revenue Chart', type: 'chart', position: { col: 0, row: 1 }, size: { cols: 4, rows: 3 }, data: { value: '$12.4k' } },
  { id: 'widget-5', title: 'Server Status', type: 'status', position: { col: 4, row: 1 }, size: { cols: 4, rows: 2 }, data: { value: 'Healthy' } },
  { id: 'widget-6', title: 'Traffic Overview', type: 'graph', position: { col: 4, row: 3 }, size: { cols: 4, rows: 2 }, data: { value: '24.5k visits' } },
  { id: 'widget-7', title: 'System Metrics', type: 'grid', position: { col: 0, row: 4 }, size: { cols: 4, rows: 3 }, data: {} },
  { id: 'widget-8', title: 'Tasks', type: 'stat', position: { col: 4, row: 5 }, size: { cols: 4, rows: 2 }, data: { value: '87%' } }
];

const CONTROL_CENTER_WIDGETS: DashboardWidget[] = [
  ...DESKTOP_WIDGETS,
  // Extra cols 12-15 (controlCenter has 16 cols, desktop uses 0-11)
  { id: 'widget-cc-1', title: 'Disk Usage',   type: 'stat',   position: { col: 12, row: 0 }, size: { cols: 2, rows: 1 }, data: { value: '67%' } },
  { id: 'widget-cc-2', title: 'Error Rate',   type: 'stat',   position: { col: 14, row: 0 }, size: { cols: 2, rows: 1 }, data: { value: '0.02%' } },
  { id: 'widget-cc-3', title: 'Queue Depth',  type: 'status', position: { col: 12, row: 1 }, size: { cols: 4, rows: 2 }, data: { value: '142' } },
  { id: 'widget-cc-4', title: 'API Metrics',  type: 'grid',   position: { col: 12, row: 3 }, size: { cols: 4, rows: 2 }, data: {} }
];

export const DEFAULT_LAYOUT = {
  id: 'default',
  name: 'Default Layout',
  columns: DEFAULT_COLUMNS,
  rows: DEFAULT_ROWS,
  widgets: DESKTOP_WIDGETS
};

export const DEFAULT_RESPONSIVE_LAYOUT: ResponsiveDashboardLayout = {
  id: 'default',
  name: 'Default Layout',
  breakpointLayouts: [
    { tier: 'mobile' as const, widgets: MOBILE_WIDGETS },
    { tier: 'tablet' as const, widgets: TABLET_WIDGETS },
    { tier: 'desktop' as const, widgets: DESKTOP_WIDGETS },
    { tier: 'controlCenter' as const, widgets: CONTROL_CENTER_WIDGETS }
  ]
};
