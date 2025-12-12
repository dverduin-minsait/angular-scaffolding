import { Injectable, inject } from '@angular/core';
import { BookApi } from './book.types';
import { BookApiService } from './book.service';
import { EntityStore } from '../../../core/store/entity-store';

/**
 * Demo Book Store
 * Extends simplified Generic CRUD Store
 * Following Angular 21 + signals + zoneless patterns from AGENTS.md
 */
@Injectable()
export class BookStore extends EntityStore<BookApi, number> {
  constructor() {
    const apiService = inject(BookApiService);
    super(apiService);
  }

  // Custom store methods for books
  getByCategory(category: string): BookApi[] {
    return this.items().filter((book: BookApi) => book.category === category);
  }

  getInStockBooks(): BookApi[] {
    return this.items().filter((book: BookApi) => book.inStock);
  }

  getHighRatedBooks(minRating = 4.0): BookApi[] {
    return this.items().filter((book: BookApi) => book.rating >= minRating);
  }
}