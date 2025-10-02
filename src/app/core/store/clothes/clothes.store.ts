import { Injectable, inject, computed } from "@angular/core";
import { Observable, tap } from "rxjs";
import { ClothesApiClient } from "../../api/clothes/clothes.service";
import { EntityStore } from "../entity-store";
import { ClothingItemApi } from "../../api/clothes/clothes";


@Injectable()
export class ClothesStore extends EntityStore<ClothingItemApi, number> {
  private readonly api = inject(ClothesApiClient);

  // Expose derived/computed data based on entity list
  readonly availableItems = computed(() => this.items().filter(item => item.stock > 0));
  readonly lowStockItems = computed(() => this.items().filter(item => item.stock <= 5 && item.stock > 0));
  readonly totalValue = computed(() => this.items().reduce((sum, item) => sum + (item.price * item.stock), 0));

  constructor() {
    super((inject(ClothesApiClient)) as any); // pass api client as CrudDataSource
  }

  getByCategory(category: string): Observable<ClothingItemApi[]> {
    // Delegates to raw HTTP then sets items manually
    return this.api.getAll().pipe(
      tap(() => {
        // Simpler approach: fetch all then filter locally (placeholder)
        // Could add server-side filtering endpoint instead.
        const filtered = this.items().filter(i => i.category === category);
        // Replace with filtered list without mutating original source permanently?
        // For now, set filtered (feature-specific decision).
        (this as any)._items.set(filtered);
      })
    );
  }

  updateStock(id: number, newStock: number): Observable<ClothingItemApi> {
    return this.api.update(id, { stock: newStock });
  }
}