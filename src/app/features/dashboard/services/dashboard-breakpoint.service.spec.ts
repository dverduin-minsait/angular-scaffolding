import { TestBed } from '@angular/core/testing';
import { DashboardBreakpointService } from './dashboard-breakpoint.service';
import { BREAKPOINTS } from '../models/dashboard-grid.model';

describe('DashboardBreakpointService', () => {
  let service: DashboardBreakpointService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DashboardBreakpointService]
    });
    service = TestBed.inject(DashboardBreakpointService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default to mobile tier at width 0', () => {
    expect(service.activeTier()).toBe('mobile');
  });

  it('should resolve mobile tier for narrow widths', () => {
    service.updateWidth(400);
    expect(service.activeTier()).toBe('mobile');
  });

  it('should resolve tablet tier at 600px', () => {
    service.updateWidth(600);
    expect(service.activeTier()).toBe('tablet');
  });

  it('should resolve tablet tier between 600 and 1023', () => {
    service.updateWidth(768);
    expect(service.activeTier()).toBe('tablet');
  });

  it('should resolve desktop tier at 1024px', () => {
    service.updateWidth(1024);
    expect(service.activeTier()).toBe('desktop');
  });

  it('should resolve desktop tier between 1024 and 1919', () => {
    service.updateWidth(1280);
    expect(service.activeTier()).toBe('desktop');
  });

  it('should resolve controlCenter tier at 1920px', () => {
    service.updateWidth(1920);
    expect(service.activeTier()).toBe('controlCenter');
  });

  it('should resolve controlCenter tier for very large widths', () => {
    service.updateWidth(3840);
    expect(service.activeTier()).toBe('controlCenter');
  });

  it('should expose the full breakpoint definition', () => {
    service.updateWidth(1280);
    const bp = service.activeBreakpoint();
    expect(bp.tier).toBe('desktop');
    expect(bp.columns).toBe(12);
    expect(bp.rows).toBe(5);
    expect(bp.fallbackCellSize).toBe(80);
  });

  it('should expose container width signal', () => {
    service.updateWidth(999);
    expect(service.containerWidth()).toBe(999);
  });

  it('should compute cellSize dynamically from container width', () => {
    service.updateWidth(1200); // desktop (12 cols) = floor(1200/12) = 100
    expect(service.cellSize()).toBe(100);
  });

  it('should compute cellSize for tablet breakpoint', () => {
    service.updateWidth(800); // tablet (8 cols) = floor(800/8) = 100
    expect(service.cellSize()).toBe(100);
  });

  it('should fall back to bp.fallbackCellSize when width is 0', () => {
    // default width is 0 → mobile fallback
    expect(service.cellSize()).toBe(BREAKPOINTS[0].fallbackCellSize);
  });

  it('should enforce minimum cell size of 40px', () => {
    service.updateWidth(50); // mobile (4 cols) = floor(50/4) = 12 → clamped to 40
    expect(service.cellSize()).toBe(40);
  });
});
