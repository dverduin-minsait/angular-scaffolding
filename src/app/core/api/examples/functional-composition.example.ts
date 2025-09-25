import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, finalize, throwError, tap, map, of } from 'rxjs';

// =============================================================================
// EXAMPLE 2: FUNCTIONAL COMPOSITION APPROACH
// =============================================================================

/**
 * Base API response interface (same as abstract approach)
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  timestamp: number;
}

/**
 * API Error interface (same as abstract approach)
 */
export interface ApiError {
  message: string;
  code: string;
  details?: any;
  timestamp: number;
}

/**
 * Loading state interface (same as abstract approach)
 */
export interface LoadingState {
  isLoading: boolean;
  operation?: 'create' | 'read' | 'update' | 'delete';
}

/**
 * Signal store state interface
 */
export interface ApiState<T> {
  items: T[];
  selectedItem: T | null;
  loading: LoadingState;
  error: ApiError | null;
  lastUpdated: number | null;
}

/**
 * Configuration for API operations
 */
export interface ApiConfig {
  baseUrl: string;
  resourceName: string;
  enableCache?: boolean;
  timeout?: number;
}

// =============================================================================
// COMPOSABLE API FUNCTIONS
// =============================================================================

/**
 * Creates a signal store for API state management
 */
export function createApiStore<T>() {
  // Private signals
  const _items = signal<T[]>([]);
  const _selectedItem = signal<T | null>(null);
  const _loading = signal<LoadingState>({ isLoading: false });
  const _error = signal<ApiError | null>(null);
  const _lastUpdated = signal<number | null>(null);

  // Public readonly signals
  const items = _items.asReadonly();
  const selectedItem = _selectedItem.asReadonly();
  const loading = _loading.asReadonly();
  const error = _error.asReadonly();
  const lastUpdated = _lastUpdated.asReadonly();

  // Computed signals
  const hasData = computed(() => items().length > 0);
  const isEmpty = computed(() => items().length === 0 && !loading().isLoading);
  const isReady = computed(() => !loading().isLoading && error() === null);

  // State mutation functions
  const setItems = (newItems: T[]) => {
    _items.set(newItems);
    _lastUpdated.set(Date.now());
  };

  const addItem = (item: T) => {
    _items.update(items => [...items, item]);
    _lastUpdated.set(Date.now());
  };

  const updateItem = (updatedItem: T, idKey: keyof T = 'id' as keyof T) => {
    _items.update(items =>
      items.map(item =>
        item[idKey] === updatedItem[idKey] ? updatedItem : item
      )
    );
    if (_selectedItem()?.[idKey] === updatedItem[idKey]) {
      _selectedItem.set(updatedItem);
    }
    _lastUpdated.set(Date.now());
  };

  const removeItem = (id: any, idKey: keyof T = 'id' as keyof T) => {
    _items.update(items => items.filter(item => item[idKey] !== id));
    if (_selectedItem()?.[idKey] === id) {
      _selectedItem.set(null);
    }
    _lastUpdated.set(Date.now());
  };

  const setSelectedItem = (item: T | null) => {
    _selectedItem.set(item);
  };

  const setLoading = (isLoading: boolean, operation?: LoadingState['operation']) => {
    _loading.set({ isLoading, operation });
  };

  const setError = (error: ApiError | null) => {
    _error.set(error);
  };

  const clearError = () => {
    _error.set(null);
  };

  const clear = () => {
    _items.set([]);
    _selectedItem.set(null);
    _error.set(null);
    _lastUpdated.set(null);
  };

  return {
    // Read-only state
    items,
    selectedItem,
    loading,
    error,
    lastUpdated,
    hasData,
    isEmpty,
    isReady,
    // State mutations
    setItems,
    addItem,
    updateItem,
    removeItem,
    setSelectedItem,
    setLoading,
    setError,
    clearError,
    clear,
  };
}

/**
 * Creates error handler for API operations
 */
export function createErrorHandler<T>(store: ReturnType<typeof createApiStore<T>>) {
  return (error: HttpErrorResponse): Observable<never> => {
    const apiError: ApiError = {
      message: error.error?.message || error.message || 'An unexpected error occurred',
      code: error.error?.code || error.status?.toString() || 'UNKNOWN',
      details: error.error,
      timestamp: Date.now()
    };

    store.setError(apiError);
    return throwError(() => apiError);
  };
}

/**
 * Composable function for GET all operation
 */
export function createGetAll<T>(
  http: HttpClient,
  config: ApiConfig,
  store: ReturnType<typeof createApiStore<T>>
) {
  return (): Observable<T[]> => {
    store.setLoading(true, 'read');
    store.clearError();

    return http.get<T[]>(`${config.baseUrl}/${config.resourceName}`)
      .pipe(
        tap(response => {
          store.setItems(response);
        }),
        catchError(createErrorHandler(store)),
        finalize(() => store.setLoading(false))
      );
  };
}

/**
 * Composable function for GET by ID operation
 */
export function createGetById<T>(
  http: HttpClient,
  config: ApiConfig,
  store: ReturnType<typeof createApiStore<T>>,
  idKey: keyof T = 'id' as keyof T
) {
  return (id: string | number): Observable<T> => {
    store.setLoading(true, 'read');
    store.clearError();

    return http.get<ApiResponse<T>>(`${config.baseUrl}/${config.resourceName}/${id}`)
      .pipe(
        tap(response => {
          store.setSelectedItem(response.data);
          store.updateItem(response.data, idKey);
        }),
        map((response: ApiResponse<T>) => response.data),
        catchError(createErrorHandler(store)),
        finalize(() => store.setLoading(false))
      );
  };
}

/**
 * Composable function for POST (create) operation
 */
export function createPost<T>(
  http: HttpClient,
  config: ApiConfig,
  store: ReturnType<typeof createApiStore<T>>
) {
  return (item: Partial<T>): Observable<T> => {
    store.setLoading(true, 'create');
    store.clearError();

    return http.post<ApiResponse<T>>(`${config.baseUrl}/${config.resourceName}`, item)
      .pipe(
        tap(response => {
          store.addItem(response.data);
        }),
        map((response: ApiResponse<T>) => response.data),
        catchError(createErrorHandler(store)),
        finalize(() => store.setLoading(false))
      );
  };
}

/**
 * Composable function for PUT (update) operation
 */
export function createPut<T>(
  http: HttpClient,
  config: ApiConfig,
  store: ReturnType<typeof createApiStore<T>>,
  idKey: keyof T = 'id' as keyof T
) {
  return (id: string | number, item: Partial<T>): Observable<T> => {
    store.setLoading(true, 'update');
    store.clearError();

    return http.put<ApiResponse<T>>(`${config.baseUrl}/${config.resourceName}/${id}`, item)
      .pipe(
        tap(response => {
          store.updateItem(response.data, idKey);
        }),
        map((response: ApiResponse<T>) => response.data),
        catchError(createErrorHandler(store)),
        finalize(() => store.setLoading(false))
      );
  };
}

/**
 * Composable function for DELETE operation
 */
export function createDelete<T>(
  http: HttpClient,
  config: ApiConfig,
  store: ReturnType<typeof createApiStore<T>>,
  idKey: keyof T = 'id' as keyof T
) {
  return (id: string | number): Observable<void> => {
    store.setLoading(true, 'delete');
    store.clearError();

    return http.delete<ApiResponse<void>>(`${config.baseUrl}/${config.resourceName}/${id}`)
      .pipe(
        tap(() => {
          store.removeItem(id, idKey);
        }),
        map(() => void 0),
        catchError(createErrorHandler(store)),
        finalize(() => store.setLoading(false))
      );
  };
}

/**
 * Factory function to create a complete API service using functional composition
 */
export function createApiService<T>(config: ApiConfig) {
  const http = inject(HttpClient);
  const store = createApiStore<T>();

  // Create composable functions
  const getAll = createGetAll(http, config, store);
  const getById = createGetById(http, config, store);
  const create = createPost(http, config, store);
  const update = createPut(http, config, store);
  const remove = createDelete(http, config, store);

  // Utility functions
  const refresh = () => getAll();
  
  return {
    // State (readonly signals)
    ...store,
    
    // CRUD Operations
    getAll,
    getById,
    create,
    update,
    delete: remove,
    
    // Utilities
    refresh,
  };
}

// =============================================================================
// EXAMPLE IMPLEMENTATION: CLOTHES API SERVICE (FUNCTIONAL)
// =============================================================================

export interface ClothingItemApi {
  id: number;
  name: string;
  brand: string;
  price: number;
  size: string;
  color: string;
  stock: number;
  season: string;
  category: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClothesFunctionalApiService {
  // Create the base API service using composition
  private api = createApiService<ClothingItemApi>({
    baseUrl: 'http://localhost:3000',
    resourceName: 'clothes'
  });

  // Expose the base API functionality
  readonly items = this.api.items;
  readonly selectedItem = this.api.selectedItem;
  readonly loading = this.api.loading;
  readonly error = this.api.error;
  readonly lastUpdated = this.api.lastUpdated;
  readonly hasData = this.api.hasData;
  readonly isEmpty = this.api.isEmpty;
  readonly isReady = this.api.isReady;

  // Expose CRUD operations
  readonly getAll = this.api.getAll;
  readonly getById = this.api.getById;
  readonly create = this.api.create;
  readonly update = this.api.update;
  readonly delete = this.api.delete;
  readonly refresh = this.api.refresh;

  // Additional computed signals specific to clothes
  readonly availableItems = computed(() => 
    this.items().filter(item => item.stock > 0)
  );

  readonly lowStockItems = computed(() => 
    this.items().filter(item => item.stock <= 5 && item.stock > 0)
  );

  readonly totalValue = computed(() => {
    const items = this.items();
    if (!items || items.length === 0) return 0;
    
    return items.reduce((sum, item) => {
      const price = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
      const stock = typeof item.stock === 'number' && !isNaN(item.stock) ? item.stock : 0;
      return sum + (price * stock);
    }, 0);
  });

  // Custom methods using the composable approach
  private http = inject(HttpClient);

  getByCategory(category: string): Observable<ClothingItemApi[]> {
    this.api.setLoading(true, 'read');
    this.api.clearError();

    return this.http.get<ApiResponse<ClothingItemApi[]>>(
      `https://api.example.com/v1/clothes?category=${category}`
    ).pipe(
      tap(response => {
        this.api.setItems(response.data);
      }),
      map((response: ApiResponse<ClothingItemApi[]>) => response.data),
      catchError(createErrorHandler(this.api)),
      finalize(() => this.api.setLoading(false))
    );
  }

  updateStock(id: number, newStock: number): Observable<ClothingItemApi> {
    return this.update(id, { stock: newStock });
  }

  // Utility methods for state management
  setSelectedItem = this.api.setSelectedItem;
  clear = this.api.clear;
}

// =============================================================================
// STANDALONE COMPOSABLE FUNCTIONS (Alternative approach)
// =============================================================================

/**
 * Alternative: Pure functional approach without service classes
 * These can be used directly in components or custom services
 */

export const clothesApiConfig: ApiConfig = {
  baseUrl: 'http://localhost:3000',
  resourceName: 'clothes'
};

// Export individual composable functions for direct use
export function useClothesApi() {
  const http = inject(HttpClient);
  const store = createApiStore<ClothingItemApi>();

  return {
    // State
    ...store,
    
    // Operations
    getAll: createGetAll(http, clothesApiConfig, store),
    getById: createGetById(http, clothesApiConfig, store),
    create: createPost(http, clothesApiConfig, store),
    update: createPut(http, clothesApiConfig, store),
    delete: createDelete(http, clothesApiConfig, store),
    
    // Custom operations
    getByCategory: (category: string) => {
      store.setLoading(true, 'read');
      store.clearError();
      
      return http.get<ApiResponse<ClothingItemApi[]>>(
        `${clothesApiConfig.baseUrl}/${clothesApiConfig.resourceName}?category=${category}`
      ).pipe(
        tap(response => store.setItems(response.data)),
        map((response: ApiResponse<ClothingItemApi[]>) => response.data),
        catchError(createErrorHandler(store)),
        finalize(() => store.setLoading(false))
      );
    }
  };
}