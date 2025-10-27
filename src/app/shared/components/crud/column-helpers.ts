/**
 * Column definition helper utilities for Generic CRUD
 * Provides pre-configured column definitions for common data types
 * Following Angular 20 + signals + zoneless patterns from AGENTS.md
 */

import { CrudColumnDef, CrudEntity } from './types';

/**
 * Common column configuration options
 */
export interface ColumnOptions {
  flex?: number;
  minWidth?: number;
  visible?: boolean;
}

/**
 * Creates a simple text column definition
 */
export function textColumn<T extends CrudEntity>(
  field: keyof T,
  headerName: string,
  options: ColumnOptions = {}
): CrudColumnDef<T, keyof T> {
  return {
    field,
    headerName,
    flex: options.flex ?? 1,
    minWidth: options.minWidth ?? 100,
    visible: options.visible ?? true
  };
}

/**
 * Creates a number column definition with optional formatting
 */
export function numberColumn<T extends CrudEntity>(
  field: keyof T,
  headerName: string,
  decimals: number = 0,
  options: ColumnOptions = {}
): CrudColumnDef<T, keyof T> {
  return {
    field,
    headerName,
    flex: options.flex ?? 0.8,
    minWidth: options.minWidth ?? 80,
    visible: options.visible ?? true,
    valueFormatter: (value: T[keyof T]) => {
      const num = Number(value);
      return isNaN(num) ? '' : num.toFixed(decimals);
    }
  };
}

/**
 * Creates a price/currency column definition
 */
export function priceColumn<T extends CrudEntity>(
  field: keyof T,
  headerName: string,
  currency: string = '$',
  options: ColumnOptions = {}
): CrudColumnDef<T, keyof T> {
  return {
    field,
    headerName,
    flex: options.flex ?? 0.8,
    minWidth: options.minWidth ?? 100,
    visible: options.visible ?? true,
    valueFormatter: (value: T[keyof T]) => {
      const num = Number(value);
      return isNaN(num) ? '' : `${currency}${num.toFixed(2)}`;
    },
    cellStyle: (value: T[keyof T]) => {
      const num = Number(value);
      return {
        textAlign: 'right',
        fontWeight: num < 0 ? '600' : '400',
        color: num < 0 ? '#dc3545' : 'inherit'
      };
    }
  };
}

/**
 * Creates a date column definition with formatting
 */
export function dateColumn<T extends CrudEntity>(
  field: keyof T,
  headerName: string,
  format: 'full' | 'short' | 'year' = 'short',
  options: ColumnOptions = {}
): CrudColumnDef<T, keyof T> {
  return {
    field,
    headerName,
    flex: options.flex ?? 1,
    minWidth: options.minWidth ?? 120,
    visible: options.visible ?? true,
    valueFormatter: (value: T[keyof T]) => {
      if (!value) return '';
      
      try {
        const date = new Date(value as string | number | Date);
        if (isNaN(date.getTime())) return String(value);
        
        switch (format) {
          case 'full':
            return date.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          case 'year':
            return date.getFullYear().toString();
          case 'short':
          default:
            return date.toLocaleDateString();
        }
      } catch {
        return String(value);
      }
    }
  };
}

/**
 * Creates a boolean column definition with custom labels
 */
export function booleanColumn<T extends CrudEntity>(
  field: keyof T,
  headerName: string,
  trueLabel: string = '✅ Yes',
  falseLabel: string = '❌ No',
  options: ColumnOptions = {}
): CrudColumnDef<T, keyof T> {
  return {
    field,
    headerName,
    flex: options.flex ?? 0.8,
    minWidth: options.minWidth ?? 100,
    visible: options.visible ?? true,
    valueFormatter: (value: T[keyof T]) => value ? trueLabel : falseLabel,
    cellStyle: (value: T[keyof T]) => ({
      color: value ? '#28a745' : '#dc3545',
      fontWeight: '600'
    })
  };
}

/**
 * Creates a rating/stars column definition
 */
export function ratingColumn<T extends CrudEntity>(
  field: keyof T,
  headerName: string,
  maxRating: number = 5,
  options: ColumnOptions = {}
): CrudColumnDef<T, keyof T> {
  return {
    field,
    headerName,
    flex: options.flex ?? 0.7,
    minWidth: options.minWidth ?? 80,
    visible: options.visible ?? true,
    valueFormatter: (value: T[keyof T]) => {
      const rating = Number(value);
      return isNaN(rating) ? '' : `⭐ ${rating.toFixed(1)}`;
    },
    cellStyle: (value: T[keyof T]) => {
      const rating = Number(value);
      const threshold = maxRating * 0.8; // 4.0 for 5-star scale
      const midThreshold = maxRating * 0.6; // 3.0 for 5-star scale
      
      return {
        color: rating >= threshold ? '#28a745' : 
               rating >= midThreshold ? '#ffc107' : '#dc3545',
        fontWeight: '600'
      };
    }
  };
}

/**
 * Creates a percentage column definition
 */
export function percentageColumn<T extends CrudEntity>(
  field: keyof T,
  headerName: string,
  decimals: number = 1,
  options: ColumnOptions = {}
): CrudColumnDef<T, keyof T> {
  return {
    field,
    headerName,
    flex: options.flex ?? 0.7,
    minWidth: options.minWidth ?? 80,
    visible: options.visible ?? true,
    valueFormatter: (value: T[keyof T]) => {
      const num = Number(value);
      return isNaN(num) ? '' : `${num.toFixed(decimals)}%`;
    },
    cellStyle: () => ({
      textAlign: 'right'
    })
  };
}

/**
 * Creates an email column definition with mailto link styling
 */
export function emailColumn<T extends CrudEntity>(
  field: keyof T,
  headerName: string,
  options: ColumnOptions = {}
): CrudColumnDef<T, keyof T> {
  return {
    field,
    headerName,
    flex: options.flex ?? 1.5,
    minWidth: options.minWidth ?? 150,
    visible: options.visible ?? true,
    cellStyle: () => ({
      color: '#0066cc',
      textDecoration: 'underline'
    })
  };
}

/**
 * Creates a status/badge column with color coding
 */
export function statusColumn<T extends CrudEntity>(
  field: keyof T,
  headerName: string,
  statusColors: Record<string, string> = {},
  options: ColumnOptions = {}
): CrudColumnDef<T, keyof T> {
  const defaultColors: Record<string, string> = {
    active: '#28a745',
    inactive: '#6c757d',
    pending: '#ffc107',
    error: '#dc3545',
    success: '#28a745',
    ...statusColors
  };

  return {
    field,
    headerName,
    flex: options.flex ?? 0.9,
    minWidth: options.minWidth ?? 100,
    visible: options.visible ?? true,
    valueFormatter: (value: T[keyof T]) => {
      const status = String(value).toLowerCase();
      return status.charAt(0).toUpperCase() + status.slice(1);
    },
    cellStyle: (value: T[keyof T]) => {
      const status = String(value).toLowerCase();
      return {
        color: defaultColors[status] || '#6c757d',
        fontWeight: '600'
      };
    }
  };
}

/**
 * Utility to create multiple columns at once
 */
export function createColumns<T extends CrudEntity>(
  configs: Array<{
    type: 'text' | 'number' | 'price' | 'date' | 'boolean' | 'rating' | 'percentage' | 'email' | 'status';
    field: keyof T;
    headerName: string;
    options?: ColumnOptions;
    extraConfig?: unknown;
  }>
): Array<CrudColumnDef<T, keyof T>> {
  return configs.map(config => {
    switch (config.type) {
      case 'text':
        return textColumn(config.field, config.headerName, config.options);
      case 'number':
        return numberColumn(config.field, config.headerName, 0, config.options);
      case 'price':
        return priceColumn(config.field, config.headerName, '$', config.options);
      case 'date':
        return dateColumn(config.field, config.headerName, 'short', config.options);
      case 'boolean':
        return booleanColumn(config.field, config.headerName, '✅ Yes', '❌ No', config.options);
      case 'rating':
        return ratingColumn(config.field, config.headerName, 5, config.options);
      case 'percentage':
        return percentageColumn(config.field, config.headerName, 1, config.options);
      case 'email':
        return emailColumn(config.field, config.headerName, config.options);
      case 'status':
        return statusColumn(config.field, config.headerName, {}, config.options);
      default:
        return textColumn(config.field, config.headerName, config.options);
    }
  });
}
