import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { vi } from 'vitest';
import { DashboardComponent } from './dashboard.component';
import { DashboardLayoutService } from './services/dashboard-layout.service';
import { DashboardPersistenceService } from './services/dashboard-persistence.service';
import { LOCAL_STORAGE } from '../../core/tokens/local.storage.token';
import { DashboardLayout, DashboardWidget, BREAKPOINTS, PersistedDashboardState } from './models/dashboard-grid.model';
import { DashboardBreakpointService } from './services/dashboard-breakpoint.service';
import { provideStubTranslationService } from '../../testing/i18n-testing';
import { WIDGET_REGISTRY } from './tokens/widget-registry.token';

// Polyfill ResizeObserver for jsdom
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe(): void { /* noop */ }
    unobserve(): void { /* noop */ }
    disconnect(): void { /* noop */ }
  } as unknown as typeof globalThis.ResizeObserver;
}

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let layoutService: DashboardLayoutService;
  let bpService: DashboardBreakpointService;
  let mockStorage: { getItem: ReturnType<typeof vi.fn>; setItem: ReturnType<typeof vi.fn>; removeItem: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockStorage = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, TranslateModule.forRoot()],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        DashboardLayoutService,
        DashboardBreakpointService,
        DashboardPersistenceService,
        { provide: LOCAL_STORAGE, useValue: mockStorage },
        { provide: WIDGET_REGISTRY, useValue: {} },
        ...provideStubTranslationService({
          'dashboard.title': 'Dashboard',
          'dashboard.saving': 'Saving...',
          'dashboard.saved': 'Saved',
          'dashboard.gridLabel': 'Dashboard widget grid'
        })
      ]
    })
    .overrideComponent(DashboardComponent, { set: { providers: [] } })
    .compileComponents();

    // Configure ngx-translate so the translate pipe resolves keys
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      dashboard: {
        title: 'Dashboard',
        saving: 'Saving...',
        saved: 'Saved',
        gridLabel: 'Dashboard widget grid'
      }
    });
    translate.use('en');

    layoutService = TestBed.inject(DashboardLayoutService);
    // Set desktop breakpoint width before component init
    bpService = TestBed.inject(DashboardBreakpointService);
    bpService.updateWidth(1280);
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the grid container', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const grid = compiled.querySelector('.dashboard-grid');
    expect(grid).toBeTruthy();
  });

  it('should render grid cells', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const cells = compiled.querySelectorAll('.grid-cell');
    // 12 columns * 5 rows = 60 cells (DEFAULT_ROWS = 5)
    expect(cells.length).toBe(60);
  });

  it('should render default widgets when no saved layout', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const widgets = compiled.querySelectorAll('app-dashboard-widget');
    expect(widgets.length).toBe(10);
  });

  it('should load saved layout from persistence', async () => {
    const savedState: PersistedDashboardState = {
      layout: {
        id: 'saved',
        name: 'Saved Layout',
        columns: 12,
        rows: 8,
        widgets: [
          { id: 'saved-w1', title: 'Saved Widget', type: 'stat', position: { col: 0, row: 0 }, size: { cols: 4, rows: 3 } }
        ]
      },
      responsiveLayouts: {
        id: 'saved',
        name: 'Saved Layout',
        breakpointLayouts: [
          { tier: 'desktop', widgets: [
            { id: 'saved-w1', title: 'Saved Widget', type: 'stat', position: { col: 0, row: 0 }, size: { cols: 4, rows: 3 } }
          ]}
        ]
      }
    };
    mockStorage.getItem.mockReturnValue(JSON.stringify(savedState));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(layoutService.widgets()).toHaveLength(1);
    expect(layoutService.widgets()[0].title).toBe('Saved Widget');
  });

  it('should save layout to persistence after widget move', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    mockStorage.setItem.mockClear();

    // Simulate a drag operation
    layoutService.startDrag('widget-1', 'move');
    layoutService.updateDrag({ col: 4, row: 2 }, { cols: 3, rows: 2 });
    layoutService.endDrag();

    // Trigger the save from component
    (component as unknown as { saveLayout: () => void }).saveLayout();

    expect(mockStorage.setItem).toHaveBeenCalled();
  });

  it('should have accessible grid region', () => {
    fixture.detectChanges();
    const grid = fixture.nativeElement.querySelector('[role="region"]') as HTMLElement;
    expect(grid).toBeTruthy();
    expect(grid.getAttribute('aria-label')).toBe('Dashboard widget grid');
  });

  it('should apply dragging class to grid during drag', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    layoutService.startDrag('widget-1', 'move');
    fixture.detectChanges();

    const grid = fixture.nativeElement.querySelector('.dashboard-grid') as HTMLElement;
    expect(grid.classList.contains('dragging')).toBe(true);
  });

  it('should set grid template columns based on layout', () => {
    fixture.detectChanges();
    const grid = fixture.nativeElement.querySelector('.dashboard-grid') as HTMLElement;
    const cellSize = Math.floor(1280 / 12); // dynamic: floor(containerWidth / columns)
    expect(grid.style.gridTemplateColumns).toBe(`repeat(12, ${cellSize}px)`); // stays 12 cols
  });

  it('should set grid template rows based on layout', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const grid = fixture.nativeElement.querySelector('.dashboard-grid') as HTMLElement;
    const cellSize = Math.floor(1280 / 12);
    expect(grid.style.gridTemplateRows).toBe(`repeat(5, ${cellSize}px)`);
  });

  describe('pointer interactions', () => {
    beforeEach(async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('should handle pointer move during drag', () => {
      const cs = bpService.cellSize();
      layoutService.startDrag('widget-1', 'move');
      (component as unknown as { _pointerStart: { set: (v: { x: number; y: number }) => void } })._pointerStart.set({ x: 0, y: 0 });

      const moveEvent = new PointerEvent('pointermove', { clientX: cs * 2, clientY: cs });
      fixture.nativeElement.querySelector('.dashboard-grid').dispatchEvent(moveEvent);

      const state = layoutService.dragState();
      expect(state).not.toBeNull();
      expect(state!.currentPosition.col).toBe(2);
      expect(state!.currentPosition.row).toBe(1);
    });

    it('should handle pointer move during resize', () => {
      const cs = bpService.cellSize();
      layoutService.startDrag('widget-1', 'resize');
      (component as unknown as { _pointerStart: { set: (v: { x: number; y: number }) => void } })._pointerStart.set({ x: 0, y: 0 });

      const moveEvent = new PointerEvent('pointermove', { clientX: cs, clientY: cs });
      fixture.nativeElement.querySelector('.dashboard-grid').dispatchEvent(moveEvent);

      const state = layoutService.dragState();
      expect(state).not.toBeNull();
      // widget-1 has size {cols:3, rows:1}; moving 1 cell each direction
      expect(state!.currentSize.cols).toBe(4); // 3 + 1
      expect(state!.currentSize.rows).toBe(2); // 1 + 1
    });

    it('should end drag on pointer up', () => {
      layoutService.startDrag('widget-1', 'move');
      layoutService.updateDrag({ col: 2, row: 2 }, { cols: 3, rows: 2 });

      const upEvent = new PointerEvent('pointerup');
      fixture.nativeElement.querySelector('.dashboard-grid').dispatchEvent(upEvent);

      expect(layoutService.dragState()).toBeNull();
    });
  });

  describe('keyboard interactions', () => {
    // Use a single-widget layout with room to move/resize
    const movableWidget = { id: 'w-move', title: 'Move Test', type: 'stat', position: { col: 0, row: 0 }, size: { cols: 2, rows: 2 } };

    beforeEach(async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify({
        layout: { id: 'test', name: 'Test', columns: 12, rows: 8, widgets: [movableWidget] },
        responsiveLayouts: {
          id: 'test', name: 'Test',
          breakpointLayouts: [{ tier: 'desktop', widgets: [movableWidget] }]
        }
      }));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('should move widget via keyboard arrow keys', () => {
      const widget = layoutService.widgets().find(w => w.id === 'w-move')!;
      expect(widget).toBeTruthy();

      (component as unknown as { onKeyboardMove: (e: { widgetId: string; direction: string }) => void })
        .onKeyboardMove({ widgetId: 'w-move', direction: 'ArrowRight' });

      const moved = layoutService.widgets().find(w => w.id === 'w-move')!;
      expect(moved.position.col).toBe(1); // moved from col 0 to col 1
    });

    it('should resize widget via keyboard arrow keys', () => {
      (component as unknown as { onKeyboardResize: (e: { widgetId: string; direction: string }) => void })
        .onKeyboardResize({ widgetId: 'w-move', direction: 'ArrowRight' });

      const resized = layoutService.widgets().find(w => w.id === 'w-move')!;
      expect(resized.size.cols).toBe(3); // grew from cols:2 to cols:3
    });
  });

  describe('widget removal', () => {
    beforeEach(async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('should remove widget from layout when onWidgetRemoved is called', () => {
      const before = layoutService.widgets().length;
      (component as unknown as { onWidgetRemoved: (id: string) => void }).onWidgetRemoved('widget-1');
      expect(layoutService.widgets().length).toBe(before - 1);
      expect(layoutService.widgets().find(w => w.id === 'widget-1')).toBeUndefined();
    });

    it('should persist layout after removing a widget', () => {
      mockStorage.setItem.mockClear();
      (component as unknown as { onWidgetRemoved: (id: string) => void }).onWidgetRemoved('widget-1');
      expect(mockStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('breakpoint display', () => {
    it('should use dynamic cell size in grid template', () => {
      // Simulate a narrow container so the cell size changes
      bpService.updateWidth(400); // mobile (4 cols) → floor(400/4) = 100
      layoutService.applyBreakpoint(BREAKPOINTS.find(b => b.tier === 'mobile')!);
      fixture.detectChanges();
      const grid = fixture.nativeElement.querySelector('.dashboard-grid') as HTMLElement;
      expect(grid.style.gridTemplateColumns).toContain('100px');
    });
  });
});