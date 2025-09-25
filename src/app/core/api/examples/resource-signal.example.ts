import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, finalize, tap, of, switchMap, combineLatest } from 'rxjs';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';

// =============================================================================
// EXAMPLE 3: RxJS-INTEROP SIGNAL APPROACH
// =============================================================================

/**
 * Resource configuration interface
 */
export interface ResourceConfig {
  baseUrl: string;
  resourceName: string;
  enableCaching?: boolean;
  revalidateOnFocus?: boolean;
}

/**
 * Loading state for resources
 */
export interface ResourceLoadingState {
  isLoading: boolean;
  operation?: 'load' | 'create' | 'update' | 'delete';
}

/**
 * Abstract Base API Service using RxJS-interop toSignal approach
 * 
 * This approach uses toSignal() to convert observables to signals,
 * providing:
 * - Automatic loading states via RxJS operators
 * - Built-in error handling
 * - Reactive updates
 * - Clean signal API
 * - Easy integration with existing RxJS patterns
 * 
 * NOTE: This uses Angular's toSignal from RxJS-interop instead of the
 * newer resource() API which is still experimental in Angular 20.
 */
@Injectable()
export abstract class BaseResourceService<T, ID = string | number> {
  protected readonly http = inject(HttpClient);
  
  // Abstract properties that must be implemented by child classes
  protected abstract readonly config: ResourceConfig;

  // =============================================================================
  // SIGNAL STATE MANAGEMENT
  // =============================================================================

  // Internal state signals for loading and error management
  protected readonly _loading = signal<ResourceLoadingState>({ isLoading: false });
  protected readonly _error = signal<HttpErrorResponse | null>(null);
  protected readonly _isCleared = signal<boolean>(false);
  
  // Trigger signals - incrementing these causes observables to re-execute
  protected readonly _itemsRefreshTrigger = signal<number>(0);
  protected readonly _selectedId = signal<ID | null>(null);
  protected readonly _searchQuery = signal<Record<string, any> | null>(null);

  // =============================================================================
  // OBSERVABLE CREATORS (WITHOUT STATE MUTATIONS)
  // =============================================================================

  /**
   * Creates observable that loads all items (pure - no side effects)
   */
  protected createItemsObservable(): Observable<T[]> {
    return this.http.get<T[]>(`${this.config.baseUrl}/${this.config.resourceName}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error loading items:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Creates observable that loads a single item by ID (pure - no side effects)
   */
  protected createSelectedItemObservable(): Observable<T | null> {
    const id = this._selectedId();
    
    if (id === null) {
      // No ID selected, return null immediately
      return of(null);
    }

    return this.http.get<T>(`${this.config.baseUrl}/${this.config.resourceName}/${id}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error loading item:', error);
          return of(null);
        })
      );
  }

  /**
   * Creates observable for search/query results (pure - no side effects)
   */
  protected createQueryObservable(): Observable<T[]> {
    const query = this._searchQuery();
    
    if (!query) {
      // No query set, return empty array
      return of([]);
    }

    // Convert query object to URL search params
    const queryParams = new URLSearchParams(query as any).toString();
    
    return this.http.get<T[]>(`${this.config.baseUrl}/${this.config.resourceName}?${queryParams}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error searching items:', error);
          return of([]);
        })
      );
  }

  // =============================================================================
  // SIGNAL CONVERSIONS USING toSignal()
  // =============================================================================

  /**
   * Convert items observable to signal with toSignal() and proper reactive dependencies
   * Uses toObservable + switchMap to avoid computed context issues
   */
  readonly items = toSignal(
    combineLatest([
      toObservable(this._itemsRefreshTrigger),
      toObservable(this._isCleared)
    ]).pipe(
      switchMap(([trigger, isCleared]) => {
        if (isCleared) return of([]);
        return this.createItemsObservable();
      })
    ),
    { initialValue: [] as T[] }
  );

  /**
   * Convert selected item observable to signal
   */
  readonly selectedItem = toSignal(
    combineLatest([
      toObservable(this._selectedId),
      toObservable(this._isCleared)
    ]).pipe(
      switchMap(([id, isCleared]) => {
        if (isCleared) return of(null);
        return this.createSelectedItemObservable();
      })
    ),
    { initialValue: null as T | null }
  );

  /**
   * Convert query results observable to signal
   */
  readonly queryResults = toSignal(
    combineLatest([
      toObservable(this._searchQuery),
      toObservable(this._isCleared)
    ]).pipe(
      switchMap(([query, isCleared]) => {
        if (isCleared) return of([]);
        return this.createQueryObservable();
      })
    ),
    { initialValue: [] as T[] }
  );

  // =============================================================================
  // PUBLIC COMPUTED SIGNALS FOR COMPONENT CONSUMPTION
  // =============================================================================

  // State signals (readonly) - simplified approach
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  
  // Derived state signals
  readonly hasItems = computed(() => this.items().length > 0);
  readonly hasSelectedItem = computed(() => this.selectedItem() !== null);
  readonly hasQueryResults = computed(() => this.queryResults().length > 0);
  readonly isLoading = computed(() => this.loading().isLoading);
  readonly hasError = computed(() => this.error() !== null);

  // Current operation indicator
  readonly currentOperation = computed(() => this.loading().operation || 'none');

  // =============================================================================
  // PUBLIC CRUD OPERATIONS WITH PROPER LOADING STATES
  // =============================================================================

  /**
   * Load all items - triggers refresh by incrementing trigger signal
   * Loading states are managed outside the computed context
   */
  loadAllItems(): void {
    // Clear the cleared state when loading new data
    this._isCleared.set(false);
    this._itemsRefreshTrigger.update(count => count + 1);
  }

  /**
   * Select item by ID - updates selected ID signal which triggers observable
   */
  selectItem(id: ID | null): void {
    this._selectedId.set(id);
  }

  /**
   * Search/filter items - updates search query signal
   */
  searchItems(query: Record<string, any>): void {
    this._searchQuery.set(query);
  }

  /**
   * Clear search - resets query signal to null
   */
  clearSearch(): void {
    this._searchQuery.set(null);
  }

  /**
   * Clear all state - sets cleared state to hide all data
   */
  clear(): void {
    // Set cleared state to true - this will make all signals return empty values
    this._isCleared.set(true);
    
    // Reset all other state signals
    this._selectedId.set(null);
    this._searchQuery.set(null);
    this._error.set(null);
    this._loading.set({ isLoading: false });
  }

  /**
   * Create new item with loading states
   */
  async createItem(item: Partial<T>): Promise<T> {
    this._loading.set({ isLoading: true, operation: 'create' });
    this._error.set(null);

    try {
      const result = await this.http.post<T>(`${this.config.baseUrl}/${this.config.resourceName}`, item)
        .pipe(
          finalize(() => this._loading.set({ isLoading: false }))
        ).toPromise() as T;

      // Refresh items list to show the new item
      this.loadAllItems();
      
      return result;
    } catch (error) {
      this._error.set(error as HttpErrorResponse);
      throw error;
    }
  }

  /**
   * Update existing item with loading states
   */
  async updateItem(id: ID, updates: Partial<T>): Promise<T> {
    this._loading.set({ isLoading: true, operation: 'update' });
    this._error.set(null);

    try {
      const result = await this.http.put<T>(`${this.config.baseUrl}/${this.config.resourceName}/${id}`, updates)
        .pipe(
          finalize(() => this._loading.set({ isLoading: false }))
        ).toPromise() as T;

      // Refresh items list and selected item if needed
      this.loadAllItems();
      if (this._selectedId() === id) {
        // Force reload of selected item by updating the signal
        this._selectedId.update(currentId => currentId);
      }
      
      return result;
    } catch (error) {
      this._error.set(error as HttpErrorResponse);
      throw error;
    }
  }

  /**
   * Delete item with loading states
   */
  async deleteItem(id: ID): Promise<void> {
    this._loading.set({ isLoading: true, operation: 'delete' });
    this._error.set(null);

    try {
      await this.http.delete<void>(`${this.config.baseUrl}/${this.config.resourceName}/${id}`)
        .pipe(
          finalize(() => this._loading.set({ isLoading: false }))
        ).toPromise();

      // Clear selected item if it's the one being deleted
      if (this._selectedId() === id) {
        this._selectedId.set(null);
      }
      
      // Refresh items list
      this.loadAllItems();
      
    } catch (error) {
      this._error.set(error as HttpErrorResponse);
      throw error;
    }
  }

  /**
   * Refresh all data sources
   */
  refresh(): void {
    // Trigger items refresh
    this.loadAllItems();
    
    // Trigger selected item refresh if there's one selected
    if (this._selectedId()) {
      this._selectedId.update(id => id);
    }
    
    // Trigger query refresh if there's an active search
    if (this._searchQuery()) {
      this._searchQuery.update(query => query);
    }
  }
}

// =============================================================================
// EXAMPLE IMPLEMENTATION: CLOTHES RESOURCE SERVICE
// =============================================================================

export interface ClothingItemResource {
  id: number;
  name: string;
  category: string;
  price: number;
  brand: string;
  season: string;
  stock: number;
  imageUrl?: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClothesResourceService extends BaseResourceService<ClothingItemResource, number> {
  // Implementation of abstract config property
  protected readonly config: ResourceConfig = {
    baseUrl: 'http://localhost:3000',
    resourceName: 'clothes',
    enableCaching: true,
    revalidateOnFocus: true
  };

  // =============================================================================
  // COMPUTED SIGNALS FOR BUSINESS LOGIC
  // =============================================================================

  readonly availableItems = computed(() => {
    const items = this.items();
    if (!items || items.length === 0) return [];
    return items.filter(item => 
      typeof item.stock === 'number' && !isNaN(item.stock) && item.stock > 0
    );
  });

  readonly lowStockItems = computed(() => {
    const items = this.items();
    if (!items || items.length === 0) return [];
    return items.filter(item => 
      typeof item.stock === 'number' && !isNaN(item.stock) && 
      item.stock <= 5 && item.stock > 0
    );
  });

  readonly outOfStockItems = computed(() => {
    const items = this.items();
    if (!items || items.length === 0) return [];
    return items.filter(item => 
      typeof item.stock === 'number' && !isNaN(item.stock) && item.stock === 0
    );
  });

  readonly totalValue = computed(() => {
    const items = this.items();
    if (!items || items.length === 0) return 0;
    
    return items.reduce((sum, item) => {
      const price = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
      const stock = typeof item.stock === 'number' && !isNaN(item.stock) ? item.stock : 0;
      return sum + (price * stock);
    }, 0);
  });

  readonly categories = computed(() => {
    const cats = new Set(this.items().map(item => item.category));
    return Array.from(cats).sort();
  });

  readonly brands = computed(() => {
    const brands = new Set(this.items().map(item => item.brand));
    return Array.from(brands).sort();
  });

  readonly averagePrice = computed(() => {
    const items = this.items();
    if (!items || items.length === 0) return 0;
    
    const validItems = items.filter(item => 
      typeof item.price === 'number' && !isNaN(item.price)
    );
    
    if (validItems.length === 0) return 0;
    
    return validItems.reduce((sum, item) => sum + item.price, 0) / validItems.length;
  });

  readonly totalItems = computed(() => this.items().length);

  readonly stockSummary = computed(() => ({
    total: this.totalItems(),
    available: this.availableItems().length,
    lowStock: this.lowStockItems().length,
    outOfStock: this.outOfStockItems().length
  }));

  // =============================================================================
  // CLOTHING-SPECIFIC METHODS
  // =============================================================================

  /**
   * Search by category using the base search functionality
   */
  searchByCategory(category: string): void {
    this.searchItems({ category });
  }

  /**
   * Search by brand
   */
  searchByBrand(brand: string): void {
    this.searchItems({ brand });
  }

  /**
   * Search by season
   */
  searchBySeason(season: string): void {
    this.searchItems({ season });
  }

  /**
   * Search by multiple criteria with price range support
   */
  searchByCriteria(criteria: {
    category?: string;
    brand?: string;
    season?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  }): void {
    const query: Record<string, any> = {};
    
    // Handle each criteria type
    Object.entries(criteria).forEach(([key, value]) => {
      if (value !== undefined) {
        switch (key) {
          case 'minPrice':
            query['price_gte'] = value;
            break;
          case 'maxPrice':
            query['price_lte'] = value;
            break;
          case 'inStock':
            if (value) {
              query['stock_gt'] = 0;
            }
            break;
          default:
            query[key] = value;
        }
      }
    });

    this.searchItems(query);
  }

  /**
   * Get low stock alerts (items with 5 or fewer in stock)
   */
  getLowStockAlerts(): void {
    this.searchItems({ 'stock_lte': 5, 'stock_gt': 0 });
  }

  /**
   * Get out of stock items
   */
  getOutOfStockItems(): void {
    this.searchItems({ stock: 0 });
  }

  /**
   * Get items in price range
   */
  getItemsInPriceRange(minPrice: number, maxPrice: number): void {
    this.searchItems({ 
      'price_gte': minPrice,
      'price_lte': maxPrice
    });
  }

  /**
   * Quick access to load and select first available item
   */
  selectFirstAvailable(): void {
    const available = this.availableItems();
    if (available.length > 0) {
      this.selectItem(available[0].id);
    }
  }
}