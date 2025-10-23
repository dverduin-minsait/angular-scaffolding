import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// NOTE: This file previously implemented a full signal-based store (BaseApiService).
// It has been refactored to only contain the transport concerns. State management
// now lives in `core/store/entity-store.ts`. Keep file path stable to avoid broad
// churn; update imports to use `AbstractApiClient` instead of `BaseApiService`.

export interface ApiError {
  message: string;
  code: string;
  details?: unknown;
  timestamp: number;
}

export interface CrudDataSource<T, ID = string | number> {
  getAll(): Observable<T[]>;
  getById(id: ID): Observable<T | null>;
  create(payload: Partial<T>): Observable<T>;
  update(id: ID, payload: Partial<T>): Observable<T>;
  delete(id: ID): Observable<void>;
}

export abstract class AbstractApiClient<T, ID = string | number> implements CrudDataSource<T, ID> {
  protected readonly http = inject(HttpClient);

  protected abstract readonly baseUrl: string;
  protected abstract readonly resourceName: string;

  getAll(): Observable<T[]> {
    return this.http.get<T[]>(`${this.baseUrl}/${this.resourceName}`).pipe(
      catchError((e: HttpErrorResponse) => this.handleError(e))
    );
  }

  getById(id: ID): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${this.resourceName}/${String(id)}`).pipe(
      catchError((e: HttpErrorResponse) => this.handleError(e))
    );
  }

  create(payload: Partial<T>): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${this.resourceName}`, payload).pipe(
      catchError((e: HttpErrorResponse) => this.handleError(e))
    );
  }

  update(id: ID, payload: Partial<T>): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${this.resourceName}/${String(id)}`, payload).pipe(
      catchError((e: HttpErrorResponse) => this.handleError(e))
    );
  }

  delete(id: ID): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${this.resourceName}/${String(id)}`).pipe(
      catchError((e: HttpErrorResponse) => this.handleError(e))
    );
  }

  protected handleError(error: HttpErrorResponse): Observable<never> {
    const errorResponse = error.error as { message?: string; code?: string } | undefined;
    const apiError: ApiError = {
      message: errorResponse?.message || error.message || 'Unexpected error',
      code: errorResponse?.code || (error.status ? String(error.status) : 'UNKNOWN'),
      details: error.error,
      timestamp: Date.now()
    };
    return throwError(() => apiError);
  }
}

// Backwards compatibility re-export (deprecated). Remove once all usages migrated.
 
export const BaseApiService = AbstractApiClient;