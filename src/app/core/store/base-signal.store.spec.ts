import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { BaseSignalStore, LoadingState, StoreError } from './base-signal.store';

// Concrete implementation for testing the abstract class
class TestStore extends BaseSignalStore {
  callSetLoading(isLoading: boolean, operation?: string): void {
    this.setLoading(isLoading, operation);
  }

  callClearError(): void {
    this.clearError();
  }

  callCaptureError(err: unknown) {
    return this.captureError(err);
  }
}

describe('BaseSignalStore', () => {
  let store: TestStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()]
    });
    store = new TestStore();
  });

  describe('Initial state', () => {
    it('should have loading set to false initially', () => {
      const loadingState: LoadingState = store.loading();
      expect(loadingState.isLoading).toBe(false);
      expect(loadingState.operation).toBeUndefined();
    });

    it('should have error set to null initially', () => {
      expect(store.error()).toBeNull();
    });

    it('should have isReady true when not loading and no error', () => {
      expect(store.isReady()).toBe(true);
    });
  });

  describe('setLoading', () => {
    it('should set isLoading to true with optional operation', () => {
      store.callSetLoading(true, 'fetchData');
      expect(store.loading().isLoading).toBe(true);
      expect(store.loading().operation).toBe('fetchData');
    });

    it('should set isLoading to false', () => {
      store.callSetLoading(true, 'fetchData');
      store.callSetLoading(false);
      expect(store.loading().isLoading).toBe(false);
    });

    it('should make isReady false when loading', () => {
      store.callSetLoading(true);
      expect(store.isReady()).toBe(false);
    });

    it('should restore isReady when loading stops', () => {
      store.callSetLoading(true);
      store.callSetLoading(false);
      expect(store.isReady()).toBe(true);
    });
  });

  describe('clearError', () => {
    it('should clear a previously set error', () => {
      store.callCaptureError(new Error('test error')).subscribe({ error: () => {} });
      expect(store.error()).not.toBeNull();
      store.callClearError();
      expect(store.error()).toBeNull();
    });

    it('should restore isReady after clearing error', () => {
      store.callCaptureError(new Error('test')).subscribe({ error: () => {} });
      store.callClearError();
      expect(store.isReady()).toBe(true);
    });
  });

  describe('captureError', () => {
    it('should set error state from Error instance', () => {
      const err = new Error('Something went wrong');
      store.callCaptureError(err).subscribe({ error: () => {} });

      const error: StoreError | null = store.error();
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Something went wrong');
      expect(error?.timestamp).toBeGreaterThan(0);
    });

    it('should set error with code when available', () => {
      const err = { message: 'Not found', code: 'NOT_FOUND' };
      store.callCaptureError(err).subscribe({ error: () => {} });

      expect(store.error()?.code).toBe('NOT_FOUND');
    });

    it('should use "Unknown error" for error without message', () => {
      store.callCaptureError({}).subscribe({ error: () => {} });
      expect(store.error()?.message).toBe('Unknown error');
    });

    it('should return an observable that errors', () => {
      const errorSpy = vi.fn();
      store.callCaptureError(new Error('test')).subscribe({ error: errorSpy });
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });

    it('should make isReady false after capturing error', () => {
      store.callCaptureError(new Error('test')).subscribe({ error: () => {} });
      expect(store.isReady()).toBe(false);
    });

    it('should store error details in details field', () => {
      const err = new Error('detail test');
      store.callCaptureError(err).subscribe({ error: () => {} });
      expect(store.error()?.details).toBe(err);
    });
  });

  describe('isReady computed', () => {
    it('should be false when both loading and error are set', () => {
      store.callSetLoading(true);
      store.callCaptureError(new Error('test')).subscribe({ error: () => {} });
      expect(store.isReady()).toBe(false);
    });
  });
});
