import { TestBed } from '@angular/core/testing';
import { DashboardLayoutService } from './dashboard-layout.service';
import { DashboardWidget, DashboardLayout, DEFAULT_COLUMNS, DEFAULT_ROWS, BREAKPOINTS, BreakpointDefinition } from '../models/dashboard-grid.model';

describe('DashboardLayoutService', () => {
  let service: DashboardLayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DashboardLayoutService]
    });
    service = TestBed.inject(DashboardLayoutService);
  });

  it('should be created with default layout', () => {
    expect(service).toBeTruthy();
    expect(service.columns()).toBe(DEFAULT_COLUMNS);
    expect(service.rows()).toBe(DEFAULT_ROWS);
    expect(service.widgets()).toHaveLength(0);
  });

  describe('addWidget', () => {
    it('should add a widget to the layout', () => {
      const widget: DashboardWidget = {
        id: 'w1',
        title: 'Test Widget',
        type: 'stat',
        position: { col: 0, row: 0 },
        size: { cols: 2, rows: 2 }
      };

      const result = service.addWidget(widget);

      expect(result).toBe(true);
      expect(service.widgets()).toHaveLength(1);
      expect(service.widgets()[0].id).toBe('w1');
    });

    it('should reject widget that exceeds grid bounds', () => {
      const widget: DashboardWidget = {
        id: 'w1',
        title: 'Too Wide',
        type: 'stat',
        position: { col: 11, row: 0 },
        size: { cols: 3, rows: 1 }
      };

      const result = service.addWidget(widget);

      expect(result).toBe(false);
      expect(service.widgets()).toHaveLength(0);
    });

    it('should reject widget that overlaps existing widget', () => {
      const widget1: DashboardWidget = {
        id: 'w1',
        title: 'First',
        type: 'stat',
        position: { col: 0, row: 0 },
        size: { cols: 3, rows: 3 }
      };
      const widget2: DashboardWidget = {
        id: 'w2',
        title: 'Overlapping',
        type: 'stat',
        position: { col: 2, row: 2 },
        size: { cols: 2, rows: 2 }
      };

      service.addWidget(widget1);
      const result = service.addWidget(widget2);

      expect(result).toBe(false);
      expect(service.widgets()).toHaveLength(1);
    });

    it('should allow non-overlapping widgets', () => {
      const widget1: DashboardWidget = {
        id: 'w1',
        title: 'First',
        type: 'stat',
        position: { col: 0, row: 0 },
        size: { cols: 3, rows: 3 }
      };
      const widget2: DashboardWidget = {
        id: 'w2',
        title: 'Second',
        type: 'stat',
        position: { col: 3, row: 0 },
        size: { cols: 3, rows: 3 }
      };

      service.addWidget(widget1);
      const result = service.addWidget(widget2);

      expect(result).toBe(true);
      expect(service.widgets()).toHaveLength(2);
    });
  });

  describe('removeWidget', () => {
    it('should remove a widget by id', () => {
      const widget: DashboardWidget = {
        id: 'w1',
        title: 'Test',
        type: 'stat',
        position: { col: 0, row: 0 },
        size: { cols: 2, rows: 2 }
      };
      service.addWidget(widget);

      service.removeWidget('w1');

      expect(service.widgets()).toHaveLength(0);
    });
  });

  describe('setLayout', () => {
    it('should replace the entire layout', () => {
      const layout: DashboardLayout = {
        id: 'custom',
        name: 'Custom Layout',
        columns: 8,
        rows: 6,
        widgets: [
          { id: 'w1', title: 'Widget', type: 'stat', position: { col: 0, row: 0 }, size: { cols: 2, rows: 2 } }
        ]
      };

      service.setLayout(layout);

      expect(service.columns()).toBe(8);
      expect(service.rows()).toBe(6);
      expect(service.widgets()).toHaveLength(1);
    });
  });

  describe('drag operations', () => {
    beforeEach(() => {
      service.addWidget({
        id: 'w1',
        title: 'Draggable',
        type: 'stat',
        position: { col: 0, row: 0 },
        size: { cols: 2, rows: 2 }
      });
    });

    it('should start a move drag', () => {
      service.startDrag('w1', 'move');

      const state = service.dragState();
      expect(state).not.toBeNull();
      expect(state!.widgetId).toBe('w1');
      expect(state!.type).toBe('move');
      expect(state!.startPosition).toEqual({ col: 0, row: 0 });
    });

    it('should start a resize drag', () => {
      service.startDrag('w1', 'resize');

      const state = service.dragState();
      expect(state).not.toBeNull();
      expect(state!.type).toBe('resize');
      expect(state!.startSize).toEqual({ cols: 2, rows: 2 });
    });

    it('should update drag position with validity check', () => {
      service.startDrag('w1', 'move');

      service.updateDrag({ col: 3, row: 3 }, { cols: 2, rows: 2 });

      const state = service.dragState();
      expect(state!.currentPosition).toEqual({ col: 3, row: 3 });
      expect(state!.isValid).toBe(true);
    });

    it('should mark invalid position during drag', () => {
      service.startDrag('w1', 'move');

      service.updateDrag({ col: 11, row: 0 }, { cols: 2, rows: 2 });

      const state = service.dragState();
      expect(state!.isValid).toBe(false);
    });

    it('should apply position on valid endDrag', () => {
      service.startDrag('w1', 'move');
      service.updateDrag({ col: 5, row: 3 }, { cols: 2, rows: 2 });

      const result = service.endDrag();

      expect(result).toBe(true);
      expect(service.dragState()).toBeNull();
      expect(service.widgets()[0].position).toEqual({ col: 5, row: 3 });
    });

    it('should not apply position on invalid endDrag', () => {
      service.startDrag('w1', 'move');
      service.updateDrag({ col: 11, row: 0 }, { cols: 2, rows: 2 });

      const result = service.endDrag();

      expect(result).toBe(false);
      expect(service.widgets()[0].position).toEqual({ col: 0, row: 0 });
    });

    it('should cancel drag without applying changes', () => {
      service.startDrag('w1', 'move');
      service.updateDrag({ col: 5, row: 5 }, { cols: 2, rows: 2 });

      service.cancelDrag();

      expect(service.dragState()).toBeNull();
      expect(service.widgets()[0].position).toEqual({ col: 0, row: 0 });
    });
  });

  describe('canPlace', () => {
    it('should return false for negative positions', () => {
      expect(service.canPlace({ col: -1, row: 0 }, { cols: 1, rows: 1 })).toBe(false);
      expect(service.canPlace({ col: 0, row: -1 }, { cols: 1, rows: 1 })).toBe(false);
    });

    it('should return false when widget exceeds column bounds', () => {
      expect(service.canPlace({ col: 11, row: 0 }, { cols: 2, rows: 1 })).toBe(false);
    });

    it('should return false when widget exceeds row bounds', () => {
      expect(service.canPlace({ col: 0, row: 7 }, { cols: 1, rows: 2 })).toBe(false);
    });

    it('should return true for valid empty position', () => {
      expect(service.canPlace({ col: 0, row: 0 }, { cols: 3, rows: 3 })).toBe(true);
    });
  });

  describe('occupiedCells', () => {
    it('should track occupied cells correctly', () => {
      service.addWidget({
        id: 'w1',
        title: 'Test',
        type: 'stat',
        position: { col: 1, row: 1 },
        size: { cols: 2, rows: 2 }
      });

      const cells = service.occupiedCells();
      expect(cells.has('1,1')).toBe(true);
      expect(cells.has('2,1')).toBe(true);
      expect(cells.has('1,2')).toBe(true);
      expect(cells.has('2,2')).toBe(true);
      expect(cells.has('0,0')).toBe(false);
    });

    it('should exclude dragging widget from occupied cells', () => {
      service.addWidget({
        id: 'w1',
        title: 'Test',
        type: 'stat',
        position: { col: 0, row: 0 },
        size: { cols: 2, rows: 2 }
      });

      service.startDrag('w1', 'move');

      const cells = service.occupiedCells();
      expect(cells.has('0,0')).toBe(false);
    });
  });

  describe('applyBreakpoint', () => {
    const mobileBp: BreakpointDefinition = BREAKPOINTS.find(b => b.tier === 'mobile')!;
    const desktopBp: BreakpointDefinition = BREAKPOINTS.find(b => b.tier === 'desktop')!;
    const controlCenterBp: BreakpointDefinition = BREAKPOINTS.find(b => b.tier === 'controlCenter')!;

    it('should change columns and rows to match breakpoint', () => {
      service.applyBreakpoint(mobileBp);

      expect(service.columns()).toBe(mobileBp.columns);
      expect(service.rows()).toBe(mobileBp.rows);
    });

    it('should update active tier signal', () => {
      service.applyBreakpoint(mobileBp);
      expect(service.activeTier()).toBe('mobile');

      service.applyBreakpoint(desktopBp);
      expect(service.activeTier()).toBe('desktop');
    });

    it('should snapshot widgets before switching', () => {
      const widget: DashboardWidget = {
        id: 'w1', title: 'Test', type: 'stat',
        position: { col: 0, row: 0 }, size: { cols: 2, rows: 2 }
      };
      service.addWidget(widget);

      // Switch from desktop (default) → mobile
      service.applyBreakpoint(mobileBp);

      // Switch back to desktop — should restore the snapshot
      service.applyBreakpoint(desktopBp);

      expect(service.widgets()).toHaveLength(1);
      expect(service.widgets()[0].id).toBe('w1');
    });

    it('should clamp oversized widgets when no snapshot exists', () => {
      const wideWidget: DashboardWidget = {
        id: 'w1', title: 'Wide', type: 'chart',
        position: { col: 8, row: 0 }, size: { cols: 4, rows: 4 }
      };
      service.addWidget(wideWidget);

      // Switch to mobile (4 cols) — widget must be clamped
      service.applyBreakpoint(mobileBp);

      const clamped = service.widgets()[0];
      expect(clamped.position.col + clamped.size.cols).toBeLessThanOrEqual(mobileBp.columns);
      expect(clamped.position.row + clamped.size.rows).toBeLessThanOrEqual(mobileBp.rows);
    });
  });

  describe('loadResponsiveLayout / getResponsiveLayout', () => {
    it('should round-trip responsive layouts', () => {
      const widgets: DashboardWidget[] = [
        { id: 'w1', title: 'A', type: 'stat', position: { col: 0, row: 0 }, size: { cols: 2, rows: 1 } }
      ];
      service.loadResponsiveLayout({
        id: 'test',
        name: 'Test',
        breakpointLayouts: [
          { tier: 'mobile', widgets },
          { tier: 'desktop', widgets }
        ]
      });

      const exported = service.getResponsiveLayout();
      expect(exported.breakpointLayouts.length).toBeGreaterThanOrEqual(2);
      const mobile = exported.breakpointLayouts.find(bl => bl.tier === 'mobile');
      expect(mobile?.widgets).toHaveLength(1);
    });
  });
});
