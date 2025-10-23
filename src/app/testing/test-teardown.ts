/**
 * Reusable Jest/Angular test teardown helper for components that schedule timers
 * or maintain Subjects / custom cleanup logic. Ensures deterministic cleanup
 * without producing warnings about advancing real timers.
 */
import { ComponentFixture } from '@angular/core/testing';
import { Subject } from 'rxjs';

export interface DestroyFixtureOptions<T> {
  component?: unknown; // Component instance that may implement ngOnDestroy
  fixture?: ComponentFixture<T> | null;
  /** Subjects to complete so observers release references */
  subjects?: Array<Subject<unknown> | { complete?: () => void; closed?: boolean }>;
  /** Optional extra custom teardown callbacks */
  extraTeardowns?: Array<() => void>;
  /** Clear all Jest mocks after teardown (default true) */
  clearMocks?: boolean;
  /** Clear all Jest timers after teardown (default true) */
  clearTimers?: boolean;
  /** Flush pending fake timers (bounded) before clearing (default true) */
  flushFakeTimers?: boolean;
  /** Max flush iterations to avoid infinite loops (default 3) */
  maxFlushIterations?: number;
}

export function destroyFixtureWithTimers<T = unknown>(options: DestroyFixtureOptions<T>): void {
  const {
    component,
    fixture,
    subjects = [],
    extraTeardowns = [],
    clearMocks = true,
    clearTimers = true,
    flushFakeTimers = true,
    maxFlushIterations = 3
  } = options || {} as DestroyFixtureOptions<T>;

  try {
    // Invoke component destroy first so its own cleanup runs before we clear timers
    try {
      const componentWithDestroy = component as { ngOnDestroy?: () => void } | undefined;
      componentWithDestroy?.ngOnDestroy?.();
    } catch { /* swallow to continue global cleanup */ }

    // Destroy fixture (idempotent) so Angular test harness releases resources
    try {
      fixture?.destroy();
    } catch { /* ignore */ }

    // Complete provided subjects
    for (const subj of subjects) {
      try {
        const subject = subj as { complete?: () => void; closed?: boolean };
        if (subject && subject.complete && !subject.closed) {
          subject.complete();
        }
      } catch { /* ignore subject completion errors */ }
    }

    // Run custom teardowns
    for (const fn of extraTeardowns) {
      try { fn(); } catch { /* ignore */ }
    }

    // Only attempt to flush pending timers if Jest fake timers are active
    const jestWithTimers = jest as { isFakeTimers?: () => boolean; getTimerCount?: () => number };
    if (flushFakeTimers && jestWithTimers.isFakeTimers?.()) {
      try {
        let iterations = 0;
        while (iterations < maxFlushIterations && (jestWithTimers.getTimerCount?.() ?? 0) > 0) {
          jest.runOnlyPendingTimers();
          iterations++;
        }
      } catch { /* ignore flush errors */ }
    }
  } finally {
    if (clearMocks) {
      try { jest.clearAllMocks(); } catch { /* ignore */ }
    }
    if (clearTimers) {
      try { jest.clearAllTimers(); } catch { /* ignore */ }
    }
  }
}

/**
 * Convenience wrapper when you only have component & fixture.
 */
export function basicDestroy<T>(component: unknown, fixture: ComponentFixture<T> | null): void {
  destroyFixtureWithTimers({ component, fixture });
}
