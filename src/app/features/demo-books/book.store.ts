import { Injectable, inject } from '@angular/core';
import { BookApi } from './book.types';
import { BookApiService } from './book.service';
import { GenericCrudStore, CrudPermissionService } from '../../shared/components/crud';

/**
 * Demo Book Store
 * Extends Generic CRUD Store for testing
 */
@Injectable()
export class BookStore extends GenericCrudStore<BookApi, number> {
  constructor() {
    const apiService = inject(BookApiService);
    const permissionService = inject(CrudPermissionService);
    
    super(apiService, permissionService, {
      resource: 'books',
      actions: {
        create: 'feature:book-create',
        read: 'feature:book-read',
        update: 'feature:book-update',
        delete: 'feature:book-delete',
        export: 'feature:book-export'
      }
    });

    // Initialize permissions for demo
    permissionService.setUserRoles([
      { name: 'admin', permissions: ['*'] }
    ]);
    
    permissionService.setFeatureFlags({
      'book-create': true,
      'book-read': true,
      'book-update': true,
      'book-delete': true,
      'book-export': true
    });

    this.updatePermissions();
  }

  // Custom store methods for books
  getByCategory(category: string): BookApi[] {
    return this.filteredItems().filter(book => book.category === category);
  }

  getInStockBooks(): BookApi[] {
    return this.filteredItems().filter(book => book.inStock);
  }

  getHighRatedBooks(minRating = 4.0): BookApi[] {
    return this.filteredItems().filter(book => book.rating >= minRating);
  }
}