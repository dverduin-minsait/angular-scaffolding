import { Injectable, signal, computed } from '@angular/core';
import {
  BreakpointTier,
  BreakpointDefinition,
  BREAKPOINTS
} from '../models/dashboard-grid.model';

@Injectable()
export class DashboardBreakpointService {
  private readonly _containerWidth = signal(0);

  readonly containerWidth = this._containerWidth.asReadonly();

  /** Current active breakpoint definition based on container width */
  readonly activeBreakpoint = computed<BreakpointDefinition>(() => {
    const width = this._containerWidth();
    let match = BREAKPOINTS[0];
    for (const bp of BREAKPOINTS) {
      if (width >= bp.minWidth) {
        match = bp;
      }
    }
    return match;
  });

  /** Current active tier name */
  readonly activeTier = computed<BreakpointTier>(() => this.activeBreakpoint().tier);

  /**
   * Cell size in pixels, dynamically computed to fill the container width
   * exactly across the active breakpoint's column count.
   * Falls back to the breakpoint's defined cellSize when width is not yet known.
   */
  readonly cellSize = computed<number>(() => {
    const width = this._containerWidth();
    const bp = this.activeBreakpoint();
    if (width <= 0) return bp.fallbackCellSize;
    return Math.max(40, Math.floor(width / bp.columns));
  });

  /** Update container width — called from ResizeObserver in the component */
  updateWidth(width: number): void {
    this._containerWidth.set(width);
  }
}
