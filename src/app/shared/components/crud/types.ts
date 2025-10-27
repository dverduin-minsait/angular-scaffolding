/**
 * Simplified CRUD component types
 * Following Angular 20 + signals + zoneless patterns from AGENTS.md
 */

/**
 * Base entity interface - all entities must have an id
 */
export interface CrudEntity {
  id: string | number;
}

/**
 * Column definition for grid display with improved type safety
 * The generic K ensures the valueFormatter receives the correct type for the field
 */
export interface CrudColumnDef<T extends CrudEntity, K extends keyof T = keyof T> {
  field: K;
  headerName: string;
  flex?: number;
  minWidth?: number;
  visible?: boolean;
  valueFormatter?: (value: T[K]) => string;
  cellStyle?: (value: T[K]) => Record<string, string | number>;
}

/**
 * Simplified CRUD configuration
 * Uses a helper type to allow columns with different field types
 */
export type CrudConfig<T extends CrudEntity> = {
  entityName: string;
  columns: Array<CrudColumnDef<T, keyof T>>;
};

/**
 * CRUD events - simple data emissions
 */
export interface CrudEvents<T extends CrudEntity> {
  entitySelected?: T;
  entityCreated?: T;
  entityUpdated?: T;
  entityDeleted?: string | number;
  filterChanged?: string;
}