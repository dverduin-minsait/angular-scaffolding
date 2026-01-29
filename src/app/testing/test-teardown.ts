/**
 * Reusable Angular test teardown helper for components that schedule timers
 * or maintain Subjects / custom cleanup logic.
 *
 * Supports Vitest at runtime by detecting `globalThis.vi`.
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
  /** Clear all mocks after teardown (default true) */
  clearMocks?: boolean;
  /** Clear all timers after teardown (default true) */
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

  const runtime = globalThis as unknown as {
    vi?: {
      isFakeTimers?: () => boolean;
      getTimerCount?: () => number;
      runOnlyPendingTimers?: () => void;
      clearAllMocks?: () => void;
      clearAllTimers?: () => void;
    };
  };

  const timerApi = runtime.vi;

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

    // Only attempt to flush pending timers if fake timers are active
    if (flushFakeTimers && timerApi?.isFakeTimers?.()) {
      try {
        let iterations = 0;
        while (iterations < maxFlushIterations && (timerApi.getTimerCount?.() ?? 0) > 0) {
          timerApi.runOnlyPendingTimers?.();
          iterations++;
        }
      } catch { /* ignore flush errors */ }
    }
  } finally {
    if (clearMocks) {
      try { timerApi?.clearAllMocks?.(); } catch { /* ignore */ }
    }
    if (clearTimers) {
      try { timerApi?.clearAllTimers?.(); } catch { /* ignore */ }
    }
  }
}

/**
 * Convenience wrapper when you only have component & fixture.
 */
export function basicDestroy<T>(component: unknown, fixture: ComponentFixture<T> | null): void {
  destroyFixtureWithTimers({ component, fixture });
}
