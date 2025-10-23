/**
 * Generic CRUD component types and interfaces
 * Following Angular 20 + signals + zoneless patterns from AGENTS.md
 */

import { Signal } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Base entity interface - all entities must have an id
 */
export interface CrudEntity {
  id: string | number;
  [key: string]: unknown;
}

/**
 * Column definition for grid display
 */
export interface CrudColumnDef<T = unknown> {
  field: keyof T;
  headerName: string;
  flex?: number;
  minWidth?: number;
  visible?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  valueFormatter?: (value: unknown) => string;
  cellStyle?: (value: unknown) => Record<string, string | number>;
  cellRenderer?: (value: unknown) => string;
}

/**
 * CRUD action permissions
 */
export interface CrudPermissions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  export?: boolean;
  import?: boolean;
}

/**
 * CRUD operation state
 */
export interface CrudOperationState {
  operation: 'create' | 'update' | 'delete' | 'read' | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * CRUD configuration
 */
export interface CrudConfig<T extends CrudEntity> {
  entityName: string;
  pluralName: string;
  columns: CrudColumnDef<T>[];
  permissions: CrudPermissions;
  enableBulkOperations?: boolean;
  enableExport?: boolean;
  enableSearch?: boolean;
  pageSize?: number;
}

/**
 * CRUD data source interface - must be implemented by stores
 */
export interface CrudDataSource<T extends CrudEntity, ID = string | number> {
  // Reactive data signals
  items: Signal<T[]>;
  selected: Signal<T | null>;
  loading: Signal<{ isLoading: boolean; operation?: string }>;
  error: Signal<{ message: string } | null>;

  // CRUD operations
  loadAll(): Observable<T[]>;
  loadOne(id: ID): Observable<T | null>;
  create(payload: Partial<T>): Observable<T>;
  update(id: ID, payload: Partial<T>): Observable<T>;
  delete(id: ID): Observable<void>;
  setSelected(entity: T | null): void;
  refresh(): Observable<T[]>;
}

/**
 * Filter context for projected filter forms
 */
export interface CrudFilterContext<T extends CrudEntity> {
  applyFilter: (filter: Partial<T>) => void;
  clearFilter: () => void;
  currentFilter: Signal<Partial<T>>;
}

/**
 * Entity form context for projected entity forms
 */
export interface CrudEntityFormContext<T extends CrudEntity> {
  mode: Signal<'create' | 'edit'>;
  entity: Signal<T | null>;
  onSubmit: (entity: Partial<T>) => void;
  onCancel: () => void;
  isLoading: Signal<boolean>;
  errors: Signal<Record<keyof T, string> | null>;
}

/**
 * CRUD events
 */
export interface CrudEvents<T extends CrudEntity> {
  onEntitySelected?: (entity: T) => void;
  onEntityCreated?: (entity: T) => void;
  onEntityUpdated?: (entity: T) => void;
  onEntityDeleted?: (id: string | number) => void;
  onFilterChanged?: (filter: Partial<T>) => void;
}