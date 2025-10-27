import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { LOCAL_STORAGE } from '../../../core/tokens';

export interface CrudPreferences {
  columnVisibility: Record<string, boolean>;
  [key: string]: unknown; // Allow for future settings
}

export interface CrudPreferencesStorage {
  savePreferences(entityName: string, preferences: CrudPreferences): Observable<void>;
  loadPreferences(entityName: string): Observable<CrudPreferences | null>;
  clearPreferences(entityName: string): Observable<void>;
}

/**
 * Generic CRUD Service for managing CRUD-related preferences and settings
 * 
 * Features:
 * - Async by design for easy migration to API storage
 * - localStorage implementation with fallback to memory
 * - Type-safe preferences interface
 * - Per-entity configuration storage
 * 
 * Following Angular 20 + signals + zoneless patterns from AGENTS.md
 */
@Injectable()
export class GenericCrudService implements CrudPreferencesStorage {
  private readonly localStorage = inject(LOCAL_STORAGE);
  private readonly storageKey = 'crud-preferences';
  
  // In-memory fallback for cases where localStorage is not available
  private readonly memoryStorage = new Map<string, CrudPreferences>();

  /**
   * Save CRUD preferences for a specific entity
   * @param entityName - Unique identifier for the entity (e.g., 'Book', 'User')
   * @param preferences - Preferences to save
   * @returns Observable that completes when save is done
   */
  savePreferences(entityName: string, preferences: CrudPreferences): Observable<void> {
    this.performSave(entityName, preferences);
    return of(undefined);
  }

  /**
   * Load CRUD preferences for a specific entity
   * @param entityName - Unique identifier for the entity
   * @returns Observable with preferences or null if not found
   */
  loadPreferences(entityName: string): Observable<CrudPreferences | null> {
    return of(this.performLoad(entityName));
  }

  /**
   * Clear CRUD preferences for a specific entity
   * @param entityName - Unique identifier for the entity
   * @returns Observable that completes when clear is done
   */
  clearPreferences(entityName: string): Observable<void> {
    this.performClear(entityName);
    return of(undefined);
  }

  /**
   * Get default preferences for an entity
   * @param columnFields - List of column field names
   * @returns Default preferences with all columns visible
   */
  getDefaultPreferences(columnFields: string[]): CrudPreferences {
    const columnVisibility: Record<string, boolean> = {};
    columnFields.forEach(field => {
      columnVisibility[field] = true;
    });

    return {
      columnVisibility
    };
  }

  private performSave(entityName: string, preferences: CrudPreferences): void {
    // Always save to memory storage first as a fallback
    this.memoryStorage.set(entityName, preferences);
    
    try {
      // Try localStorage if available
      if (this.localStorage) {
        const allPreferences = this.getAllStoredPreferences();
        allPreferences[entityName] = preferences;
        this.localStorage.setItem(this.storageKey, JSON.stringify(allPreferences));
      }
    } catch {
      // localStorage failed, but memory storage already has the data
      // Silent failure - memory storage is sufficient fallback
    }
  }

  private performLoad(entityName: string): CrudPreferences | null {
    try {
      // Try localStorage first if available
      if (this.localStorage) {
        const allPreferences = this.getAllStoredPreferences();
        const stored = allPreferences[entityName];
        if (stored) {
          return stored;
        }
      }
    } catch {
      // localStorage failed, fall through to check memory storage
      // Silent failure - will use memory storage fallback
    }
    
    // Check memory storage (either localStorage not available or failed)
    return this.memoryStorage.get(entityName) || null;
  }

  private performClear(entityName: string): void {
    // Clear from memory storage
    this.memoryStorage.delete(entityName);
    
    try {
      // Try to clear from localStorage if available
      if (this.localStorage) {
        const allPreferences = this.getAllStoredPreferences();
        delete allPreferences[entityName];
        this.localStorage.setItem(this.storageKey, JSON.stringify(allPreferences));
      }
    } catch {
      // localStorage failed, but memory storage already cleared
      // Silent failure - memory storage is sufficient
    }
  }

  private getAllStoredPreferences(): Record<string, CrudPreferences> {
    try {
      const stored = this.localStorage?.getItem(this.storageKey);
      return stored ? JSON.parse(stored) as Record<string, CrudPreferences> : {};
    } catch {
      // Parse failed - return empty preferences object
      return {};
    }
  }
}

/**
 * Factory function to create different storage implementations
 * This allows for easy migration to API-based storage in the future
 * 
 * Usage:
 * providers: [
 *   {
 *     provide: GenericCrudService,
 *     useFactory: createCrudStorageService,
 *     deps: [LOCAL_STORAGE]
 *   }
 * ]
 */
export function createCrudStorageService(_localStorage: Storage | null): GenericCrudService {
  return new GenericCrudService();
}