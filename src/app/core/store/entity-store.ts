import { signal, computed } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { CrudDataSource } from '../api/abstract-api.service';

export interface LoadingState {
  isLoading: boolean;
  operation?: 'create' | 'read' | 'update' | 'delete';
}

export interface StoreError {
  message: string;
  code?: string;
  details?: unknown;
  timestamp: number;
}

/**
 * Generic signal-based entity store that composes a CRUD data source.
 * Handles loading / error / selection / caching concerns.
 */
export class EntityStore<T extends { id: ID }, ID = string | number> {
  private readonly _items = signal<T[]>([]);
  private readonly _selected = signal<T | null>(null);
  private readonly _loading = signal<LoadingState>({ isLoading: false });
  private readonly _error = signal<StoreError | null>(null);
  private readonly _lastUpdated = signal<number | null>(null);

  readonly items = this._items.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastUpdated = this._lastUpdated.asReadonly();

  readonly hasData = computed(() => this._items().length > 0);
  readonly isEmpty = computed(() => this._items().length === 0 && !this._loading().isLoading);
  readonly isReady = computed(() => !this._loading().isLoading && this._error() === null);

  constructor(private readonly dataSource: CrudDataSource<T, ID>) {}

  loadAll(): Observable<T[]> {
    this.setLoading(true, 'read');
    this.clearError();
    return this.dataSource.getAll().pipe(
      tap(list => {
        this._items.set(list);
        this._lastUpdated.set(Date.now());
      }),
      catchError(e => this.captureError(e)),
      finalize(() => this.setLoading(false))
    );
  }

  loadOne(id: ID): Observable<T | null> {
    this.setLoading(true, 'read');
    this.clearError();
    return this.dataSource.getById(id).pipe(
      tap(entity => {
        this._selected.set(entity);
        this.upsert(entity);
      }),
      catchError(e => this.captureError(e)),
      finalize(() => this.setLoading(false))
    );
  }

  create(payload: Partial<T>): Observable<T> {
    this.setLoading(true, 'create');
    this.clearError();
    return this.dataSource.create(payload).pipe(
      tap(created => {
        this._items.update(arr => [...arr, created]);
        this._lastUpdated.set(Date.now());
      }),
      catchError(e => this.captureError(e)),
      finalize(() => this.setLoading(false))
    );
  }

  update(id: ID, payload: Partial<T>): Observable<T> {
    this.setLoading(true, 'update');
    this.clearError();
    return this.dataSource.update(id, payload).pipe(
      tap(updated => {
        this.upsert(updated);
        if (this._selected()?.id === id) this._selected.set(updated);
        this._lastUpdated.set(Date.now());
      }),
      catchError(e => this.captureError(e)),
      finalize(() => this.setLoading(false))
    );
  }

  delete(id: ID): Observable<void> {
    this.setLoading(true, 'delete');
    this.clearError();
    return this.dataSource.delete(id).pipe(
      tap(() => {
        this._items.update(list => list.filter(i => i.id !== id));
        if (this._selected()?.id === id) this._selected.set(null);
        this._lastUpdated.set(Date.now());
      }),
      catchError(e => this.captureError(e)),
      finalize(() => this.setLoading(false))
    );
  }

  refresh(): Observable<T[]> { return this.loadAll(); }
  clearAll(): void {
    this._items.set([]);
    this._selected.set(null);
    this._error.set(null);
    this._lastUpdated.set(null);
  }
  setSelected(entity: T | null) { this._selected.set(entity); }

  private upsert(entity: T | null) {
    if (!entity) return;
    this._items.update(list => {
      const idx = list.findIndex(i => i.id === entity.id);
      return idx === -1 ? [...list, entity] : list.map(i => i.id === entity.id ? entity : i);
    });
  }
  private setLoading(isLoading: boolean, operation?: LoadingState['operation']) {
    this._loading.set({ isLoading, operation });
  }
  private clearError() { this._error.set(null); }
  private captureError(err: any) {
    this._error.set({
      message: err?.message || 'Unknown error',
      code: err?.code,
      details: err,
      timestamp: Date.now()
    });
    return throwError(() => err);
  }
}
