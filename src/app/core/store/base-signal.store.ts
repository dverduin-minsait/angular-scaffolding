import { signal, computed } from '@angular/core';
import { Observable, throwError } from 'rxjs';

export interface LoadingState {
  isLoading: boolean;
  operation?: string;
}

export interface StoreError {
  message: string;
  code?: string;
  details?: unknown;
  timestamp: number;
}

/**
 * Abstract base class for signal-driven stores.
 * Provides shared loading and error state management.
 * Extend this class for any feature store that needs loading/error tracking.
 */
export abstract class BaseSignalStore {
  protected readonly _loading = signal<LoadingState>({ isLoading: false });
  protected readonly _error = signal<StoreError | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isReady = computed(() => !this._loading().isLoading && this._error() === null);

  protected setLoading(isLoading: boolean, operation?: string): void {
    this._loading.set({ isLoading, operation });
  }

  protected clearError(): void {
    this._error.set(null);
  }

  protected captureError(err: unknown): Observable<never> {
    const error = err as { message?: string; code?: string };
    this._error.set({
      message: error?.message ?? 'Unknown error',
      code: error?.code,
      details: err,
      timestamp: Date.now(),
    });
    return throwError(() => err);
  }
}
