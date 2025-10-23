import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, switchMap, of } from 'rxjs';
import { GridLoaderService } from './grid-loader.service';

export interface GridDataConfig<T = unknown> {
  /**
   * Data source - can be Observable, Promise, or static data
   */
  dataSource: Observable<T[]> | Promise<T[]> | T[];
  
  /**
   * Whether to preload ag-Grid when data loading starts
   */
  preloadGrid?: boolean;
  
  /**
   * Fallback component for mobile (when grids aren't supported)
   */
  mobileComponent?: 'table' | 'list' | 'cards';
}

@Injectable({
  providedIn: 'root'
})
export class GridDataService {
  
  private readonly gridLoader = inject(GridLoaderService);

  /**
   * Smart data loading that coordinates with grid loading
   * This ensures ag-Grid is ready when your data arrives
   */
  loadDataWithGrid<T>(config: GridDataConfig<T>): Observable<{
    data: T[];
    gridReady: boolean;
    error?: Error;
  }> {
    const { dataSource, preloadGrid = true } = config;
    
    // Convert data source to Observable
    const data$ = this.toObservable(dataSource);
    
    // Start grid preload if requested and supported
    if (preloadGrid) {
      this.gridLoader.preload();
    }
    
    // Combine data with grid state, but don't block data emission
    return combineLatest([
      data$,
      this.gridLoader.loadState$
    ]).pipe(
      switchMap(([data, gridState]) => {
        // Always return data with current grid state
        return of({
          data,
          gridReady: gridState.isLoaded && !gridState.error,
          error: gridState.error || undefined
        });
      })
    );
  }

  /**
   * Preload grid before making data call (for maximum performance)
   */
  preloadForRoute(): void {
    this.gridLoader.preload();
  }

  private toObservable<T>(source: Observable<T[]> | Promise<T[]> | T[]): Observable<T[]> {
    if (Array.isArray(source)) {
      return of(source);
    }
    
    if (source instanceof Promise) {
      return new Observable(subscriber => {
        source
          .then(data => {
            subscriber.next(data);
            subscriber.complete();
          })
          .catch(error => subscriber.error(error));
      });
    }
    
    // Assume it's an Observable
    return source;
  }
}