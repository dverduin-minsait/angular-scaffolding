import { DashboardWidget, ResponsiveDashboardLayout, DEFAULT_COLUMNS, DEFAULT_ROWS } from './dashboard-grid.model';

const DESKTOP_WIDGETS: DashboardWidget[] = [
  { id: 'widget-1', title: 'CPU Load', type: 'stat', position: { col: 0, row: 0 }, size: { cols: 1, rows: 1 }, data: { value: '73%' } },
  { id: 'widget-2', title: 'Memory', type: 'stat', position: { col: 1, row: 0 }, size: { cols: 1, rows: 1 }, data: { value: '4.2 GB' } },
  { id: 'widget-3', title: 'Active Users', type: 'stat', position: { col: 2, row: 0 }, size: { cols: 2, rows: 1 }, data: { value: '1,234' } },
  { id: 'widget-4', title: 'Revenue Chart', type: 'chart', position: { col: 4, row: 0 }, size: { cols: 4, rows: 3 }, data: { value: '$12.4k' } },
  { id: 'widget-5', title: 'Server Status', type: 'status', position: { col: 0, row: 1 }, size: { cols: 2, rows: 3 }, data: { value: 'Healthy' } },
  { id: 'widget-6', title: 'Recent Activity', type: 'list', position: { col: 2, row: 1 }, size: { cols: 2, rows: 2 }, data: {} },
  { id: 'widget-7', title: 'Traffic Overview', type: 'chart', position: { col: 8, row: 0 }, size: { cols: 4, rows: 4 }, data: { value: '24.5k visits' } },
  { id: 'widget-8', title: 'Tasks', type: 'list', position: { col: 2, row: 3 }, size: { cols: 3, rows: 2 }, data: { value: '87%' } },
  { id: 'widget-9', title: 'Notifications', type: 'stat', position: { col: 5, row: 3 }, size: { cols: 3, rows: 2 }, data: { value: '12 new' } },
  { id: 'widget-10', title: 'System Logs', type: 'list', position: { col: 0, row: 4 }, size: { cols: 2, rows: 4 }, data: {} },
  { id: 'widget-11', title: 'Uptime', type: 'stat', position: { col: 2, row: 5 }, size: { cols: 1, rows: 1 }, data: { value: '99.9%' } }
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
  { id: 'widget-6', title: 'Recent Activity', type: 'list', position: { col: 4, row: 3 }, size: { cols: 4, rows: 2 }, data: {} },
  { id: 'widget-7', title: 'Traffic Overview', type: 'chart', position: { col: 0, row: 4 }, size: { cols: 4, rows: 3 }, data: { value: '24.5k visits' } },
  { id: 'widget-8', title: 'Tasks', type: 'list', position: { col: 4, row: 5 }, size: { cols: 4, rows: 2 }, data: { value: '87%' } }
];

const CONTROL_CENTER_WIDGETS: DashboardWidget[] = [
  ...DESKTOP_WIDGETS,
  { id: 'widget-12', title: 'Network I/O', type: 'chart', position: { col: 12, row: 0 }, size: { cols: 4, rows: 4 }, data: { value: '1.2 Gbps' } },
  { id: 'widget-13', title: 'Disk Usage', type: 'stat', position: { col: 16, row: 0 }, size: { cols: 2, rows: 2 }, data: { value: '67%' } },
  { id: 'widget-14', title: 'API Latency', type: 'chart', position: { col: 12, row: 4 }, size: { cols: 4, rows: 3 }, data: { value: '45ms' } },
  { id: 'widget-15', title: 'Error Rate', type: 'stat', position: { col: 16, row: 2 }, size: { cols: 2, rows: 2 }, data: { value: '0.02%' } },
  { id: 'widget-16', title: 'Queue Depth', type: 'status', position: { col: 18, row: 0 }, size: { cols: 2, rows: 4 }, data: { value: '142' } }
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
