import { Injectable, signal, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { EntityStore } from '../../../core/store/entity-store';
import { AbstractApiClient } from '../../../core/api/abstract-api.service';
import { CrudEntity, CrudDataSource, CrudPermissions } from './types';
import { CrudPermissionService, PermissionConfig } from './permission.service';

/**
 * Generic CRUD store that extends EntityStore with CRUD-specific functionality
 * Follows Angular 20 signals pattern from AGENTS.md
 */
export abstract class GenericCrudStore<T extends CrudEntity & { id: ID }, ID = string | number> 
  extends EntityStore<T, ID> 
  implements CrudDataSource<T, ID> {
  
  // Additional CRUD-specific state
  private readonly _permissions = signal<CrudPermissions>({
    create: false,
    read: false,
    update: false,
    delete: false
  });

  private readonly _filter = signal<Partial<T>>({});
  private readonly _sortField = signal<keyof T | null>(null);
  private readonly _sortDirection = signal<'asc' | 'desc'>('asc');

  readonly permissions = this._permissions.asReadonly();
  readonly filter = this._filter.asReadonly();
  readonly sortField = this._sortField.asReadonly();
  readonly sortDirection = this._sortDirection.asReadonly();

  // Filtered and sorted items
  readonly filteredItems = computed(() => {
    let items = this.items();
    const currentFilter = this._filter();
    
    // Apply filter
    if (Object.keys(currentFilter).length > 0) {
      items = items.filter(item => 
        Object.entries(currentFilter).every(([key, value]) => {
          if (value === undefined || value === null || value === '') return true;
          const itemValue = item[key as keyof T];
          
          if (typeof value === 'string' && typeof itemValue === 'string') {
            return itemValue.toLowerCase().includes(value.toLowerCase());
          }
          
          return itemValue === value;
        })
      );
    }

    // Apply sorting
    const field = this._sortField();
    if (field) {
      const direction = this._sortDirection();
      items = [...items].sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return items;
  });

  constructor(
    dataSource: AbstractApiClient<T, ID>,
    protected readonly permissionService: CrudPermissionService,
    protected readonly permissionConfig: PermissionConfig
  ) {
    super(dataSource);
    this.updatePermissions();
  }

  // Filter methods
  setFilter(filter: Partial<T>): void {
    this._filter.set(filter);
  }

  clearFilter(): void {
    this._filter.set({});
  }

  updateFilter(updates: Partial<T>): void {
    this._filter.update(current => ({ ...current, ...updates }));
  }

  // Sorting methods
  setSorting(field: keyof T, direction: 'asc' | 'desc' = 'asc'): void {
    this._sortField.set(field);
    this._sortDirection.set(direction);
  }

  toggleSort(field: keyof T): void {
    if (this._sortField() === field) {
      this._sortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
    } else {
      this.setSorting(field, 'asc');
    }
  }

  clearSort(): void {
    this._sortField.set(null);
    this._sortDirection.set('asc');
  }

  // Permission methods
  updatePermissions(): void {
    const permissions = this.permissionService.getCrudPermissions(this.permissionConfig);
    this._permissions.set(permissions);
  }

  canCreate(): boolean {
    return this._permissions().create;
  }

  canRead(): boolean {
    return this._permissions().read;
  }

  canUpdate(): boolean {
    return this._permissions().update;
  }

  canDelete(): boolean {
    return this._permissions().delete;
  }

  canExport(): boolean {
    return this._permissions().export || false;
  }

  canImport(): boolean {
    return this._permissions().import || false;
  }

  // Enhanced CRUD operations with permission checks
  override create(payload: Partial<T>): Observable<T> {
    if (!this.canCreate()) {
      throw new Error('Permission denied: Cannot create entity');
    }
    return super.create(payload);
  }

  override update(id: ID, payload: Partial<T>): Observable<T> {
    if (!this.canUpdate()) {
      throw new Error('Permission denied: Cannot update entity');
    }
    return super.update(id, payload);
  }

  override delete(id: ID): Observable<void> {
    if (!this.canDelete()) {
      throw new Error('Permission denied: Cannot delete entity');
    }
    return super.delete(id);
  }

  override loadAll(): Observable<T[]> {
    if (!this.canRead()) {
      throw new Error('Permission denied: Cannot read entities');
    }
    return super.loadAll();
  }

  // Bulk operations
  bulkDelete(ids: ID[]): Observable<void[]> {
    if (!this.canDelete()) {
      throw new Error('Permission denied: Cannot delete entities');
    }

    const deleteOperations = ids.map(id => this.delete(id));
    return new Observable(observer => {
      Promise.all(deleteOperations.map(op => op.toPromise()))
        .then(results => {
          observer.next(results as void[]);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  bulkUpdate(updates: Array<{ id: ID; data: Partial<T> }>): Observable<T[]> {
    if (!this.canUpdate()) {
      throw new Error('Permission denied: Cannot update entities');
    }

    const updateOperations = updates.map(({ id, data }) => this.update(id, data));
    return new Observable(observer => {
      Promise.all(updateOperations.map(op => op.toPromise()))
        .then(results => {
          observer.next(results as T[]);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  // Search functionality
  search(query: string, fields: (keyof T)[]): void {
    if (!query.trim()) {
      this.clearFilter();
      return;
    }

    const searchFilter: Partial<T> = {};
    // This is a simple implementation - in practice, you might want more sophisticated search
    fields.forEach(field => {
      (searchFilter as Record<string, string>)[field as string] = query;
    });

    this.setFilter(searchFilter);
  }

  // Export functionality (basic implementation)
  exportData(format: 'json' | 'csv' = 'json'): string {
    if (!this.canExport()) {
      throw new Error('Permission denied: Cannot export data');
    }

    const data = this.filteredItems();
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }
    
    if (format === 'csv') {
      if (data.length === 0) return '';
      
      const headers = Object.keys(data[0] as Record<string, unknown>);
      const csvRows = [
        headers.join(','),
        ...data.map(item => 
          headers.map(header => {
            const value = (item as Record<string, unknown>)[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
            if (typeof value === 'number' || typeof value === 'boolean') return String(value);
            return `"${JSON.stringify(value)}"`;
          }).join(',')
        )
      ];
      
      return csvRows.join('\n');
    }

    const exhaustiveCheck: never = format;
    throw new Error(`Unsupported export format: ${String(exhaustiveCheck)}`);
  }
}

/**
 * Factory function to create a CRUD store for a specific entity type
 */
export function createCrudStore<T extends CrudEntity & { id: ID }, ID = string | number>(
  apiClient: AbstractApiClient<T, ID>,
  permissionService: CrudPermissionService,
  permissionConfig: PermissionConfig
): GenericCrudStore<T, ID> {
  @Injectable()
  class DynamicCrudStore extends GenericCrudStore<T, ID> {
    constructor() {
      super(apiClient, permissionService, permissionConfig);
    }
  }

  return new DynamicCrudStore();
}