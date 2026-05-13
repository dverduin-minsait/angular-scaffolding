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

  it('should display the title', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toBe('Dashboard');
  });

  it('should render the grid container', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const grid = compiled.querySelector('.dashboard-grid');
    expect(grid).toBeTruthy();
  });

  it('should render grid cells', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const cells = compiled.querySelectorAll('.grid-cell');
    // 12 columns * 8 rows = 96 cells
    expect(cells.length).toBe(96);
  });

  it('should render default widgets when no saved layout', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const widgets = compiled.querySelectorAll('app-dashboard-widget');
    expect(widgets.length).toBe(11);
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

  it('should show save indicator when saving', () => {
    const persistenceService = TestBed.inject(DashboardPersistenceService);
    // Access private signal through service
    (persistenceService as unknown as { _saving: { set: (v: boolean) => void } })._saving.set(true);
    fixture.detectChanges();

    const indicator = fixture.nativeElement.querySelector('.save-indicator') as HTMLElement;
    expect(indicator?.textContent?.trim()).toBe('Saving...');
  });

  it('should set grid template columns based on layout', () => {
    fixture.detectChanges();
    const grid = fixture.nativeElement.querySelector('.dashboard-grid') as HTMLElement;
    const cellSize = Math.floor(1280 / 12); // dynamic: floor(containerWidth / columns)
    expect(grid.style.gridTemplateColumns).toBe(`repeat(12, ${cellSize}px)`);
  });

  it('should set grid template rows based on layout', () => {
    fixture.detectChanges();
    const grid = fixture.nativeElement.querySelector('.dashboard-grid') as HTMLElement;
    const cellSize = Math.floor(1280 / 12);
    expect(grid.style.gridTemplateRows).toBe(`repeat(8, ${cellSize}px)`);
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
      expect(state!.currentSize.cols).toBe(2); // 1 + 1
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
    beforeEach(async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('should move widget via keyboard arrow keys', () => {
      // widget-11 at (2,5) size(1,1) has free space to the right
      const widget = layoutService.widgets().find(w => w.id === 'widget-11')!;
      const originalCol = widget.position.col;

      (component as unknown as { onKeyboardMove: (e: { widgetId: string; direction: string }) => void })
        .onKeyboardMove({ widgetId: 'widget-11', direction: 'ArrowRight' });

      const moved = layoutService.widgets().find(w => w.id === 'widget-11')!;
      expect(moved.position.col).toBe(originalCol + 1);
    });

    it('should resize widget via keyboard arrow keys', () => {
      // widget-11 at (2,5) size(1,1) has free space to the right
      const widget = layoutService.widgets().find(w => w.id === 'widget-11')!;
      const originalCols = widget.size.cols;

      (component as unknown as { onKeyboardResize: (e: { widgetId: string; direction: string }) => void })
        .onKeyboardResize({ widgetId: 'widget-11', direction: 'ArrowRight' });

      const resized = layoutService.widgets().find(w => w.id === 'widget-11')!;
      expect(resized.size.cols).toBe(originalCols + 1);
    });
  });

  describe('breakpoint display', () => {
    it('should show breakpoint badge', () => {
      fixture.detectChanges();
      const badge = fixture.nativeElement.querySelector('.breakpoint-badge') as HTMLElement;
      expect(badge).toBeTruthy();
    });

    it('should reflect current tier in badge data attribute', () => {
      fixture.detectChanges();
      const badge = fixture.nativeElement.querySelector('.breakpoint-badge') as HTMLElement;
      // Default tier is desktop since breakpointService starts at width 0 → mobile,
      // but after loadLayout, applyBreakpoint sets it
      expect(badge.getAttribute('data-tier')).toBeTruthy();
    });

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