import { computed, Injectable } from "@angular/core";
import { BaseApiService } from "../abstract-api.service";
import { Observable, tap, catchError, finalize } from "rxjs";

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

@Injectable()
export class ClothesApiService extends BaseApiService<ClothingItemApi, number> {
  protected readonly baseUrl = 'http://localhost:3000';
  protected readonly resourceName = 'clothes';

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

  // Clothes-specific methods
  getByCategory(category: string): Observable<ClothingItemApi[]> {
    this.setLoading(true, 'read');
    this.clearError();

    return this.http.get<ClothingItemApi[]>(
      `${this.baseUrl}/${this.resourceName}?category=${category}`
    ).pipe(
      tap(response => {
        // Update the items signal with filtered results
        this._items.set(response);
        this._lastUpdated.set(Date.now());
      }),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  updateStock(id: number, newStock: number): Observable<ClothingItemApi> {
    return this.update(id, { stock: newStock });
  }
}