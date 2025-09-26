import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, finalize, throwError, tap } from 'rxjs';

/**
 * Base API response interface
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  timestamp: number;
}

/**
 * API Error interface
 */
export interface ApiError {
  message: string;
  code: string;
  details?: any;
  timestamp: number;
}

/**
 * Loading state interface
 */
export interface LoadingState {
  isLoading: boolean;
  operation?: 'create' | 'read' | 'update' | 'delete';
}

/**
 * Abstract Base API Service with Signal Store Integration
 * 
 * Provides common CRUD operations with built-in:
 * - Loading states (signals)
 * - Error handling (signals) 
 * - Caching
 * - Accessibility features
 * - Type safety
 */
@Injectable()
export abstract class BaseApiService<T, ID = string | number> {
  protected readonly http = inject(HttpClient);
  
  // Abstract properties that must be implemented by child classes
  protected abstract readonly baseUrl: string;
  protected abstract readonly resourceName: string;

  // Signal-based state management
  protected readonly _items = signal<T[]>([]);
  protected readonly _selectedItem = signal<T | null>(null);
  protected readonly _loading = signal<LoadingState>({ isLoading: false });
  protected readonly _error = signal<ApiError | null>(null);
  protected readonly _lastUpdated = signal<number | null>(null);

  // Public readonly signals for components
  readonly items = this._items.asReadonly();
  readonly selectedItem = this._selectedItem.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastUpdated = this._lastUpdated.asReadonly();

  // Computed signals for derived state
  readonly hasData = computed(() => this.items().length > 0);
  readonly isEmpty = computed(() => this.items().length === 0 && !this.loading().isLoading);
  readonly isReady = computed(() => !this.loading().isLoading && this.error() === null);

  // =============================================================================
  // CRUD OPERATIONS
  // =============================================================================

  /**
   * Get all items
   */
  getAll(): Observable<T[]> {
    this.setLoading(true, 'read');
    this.clearError();

    return this.http.get<T[]>(`${this.baseUrl}/${this.resourceName}`)
      .pipe(
        tap(response => {
          this._items.set(response);
          this._lastUpdated.set(Date.now());
        }),
        catchError(error => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Get single item by ID
   */
  getById(id: ID): Observable<T> {
    this.setLoading(true, 'read');
    this.clearError();

    return this.http.get<T>(`${this.baseUrl}/${this.resourceName}/${id}`)
      .pipe(
        tap(response => {
          this._selectedItem.set(response);
          this.updateItemInList(response);
        }),
        catchError(error => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Create new item
   */
  create(item: Partial<T>): Observable<T> {
    this.setLoading(true, 'create');
    this.clearError();

    return this.http.post<T>(`${this.baseUrl}/${this.resourceName}`, item)
      .pipe(
        tap(response => {
          this._items.update(items => [...items, response]);
          this._lastUpdated.set(Date.now());
        }),
        catchError(error => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Update existing item
   */
  update(id: ID, item: Partial<T>): Observable<T> {
    this.setLoading(true, 'update');
    this.clearError();

    return this.http.put<T>(`${this.baseUrl}/${this.resourceName}/${id}`, item)
      .pipe(
        tap(response => {
          this.updateItemInList(response);
          if (this._selectedItem()?.['id' as keyof T] === id) {
            this._selectedItem.set(response);
          }
          this._lastUpdated.set(Date.now());
        }),
        catchError(error => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Delete item
   */
  delete(id: ID): Observable<void> {
    this.setLoading(true, 'delete');
    this.clearError();

    return this.http.delete<void>(`${this.baseUrl}/${this.resourceName}/${id}`)
      .pipe(
        tap(() => {
          this._items.update(items => 
            items.filter(item => item['id' as keyof T] !== id)
          );
          if (this._selectedItem()?.['id' as keyof T] === id) {
            this._selectedItem.set(null);
          }
          this._lastUpdated.set(Date.now());
        }),
        catchError(error => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Refresh data
   */
  refresh(): Observable<T[]> {
    return this.getAll();
  }

  /**
   * Clear all data and state
   */
  clear(): void {
    this._items.set([]);
    this._selectedItem.set(null);
    this._error.set(null);
    this._lastUpdated.set(null);
  }

  /**
   * Set selected item
   */
  setSelectedItem(item: T | null): void {
    this._selectedItem.set(item);
  }

  // =============================================================================
  // PROTECTED HELPER METHODS
  // =============================================================================

  protected setLoading(isLoading: boolean, operation?: LoadingState['operation']): void {
    this._loading.set({ isLoading, operation });
  }

  protected clearError(): void {
    this._error.set(null);
  }

  protected handleError(error: HttpErrorResponse): Observable<never> {
    const apiError: ApiError = {
      message: error.error?.message || error.message || 'An unexpected error occurred',
      code: error.error?.code || error.status?.toString() || 'UNKNOWN',
      details: error.error,
      timestamp: Date.now()
    };

    this._error.set(apiError);
    return throwError(() => apiError);
  }

  protected updateItemInList(updatedItem: T): void {
    this._items.update(items => 
      items.map(item => 
        item['id' as keyof T] === updatedItem['id' as keyof T] 
          ? updatedItem 
          : item
      )
    );
  }
}