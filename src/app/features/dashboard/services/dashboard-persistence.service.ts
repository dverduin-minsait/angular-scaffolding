import { inject, Injectable, InjectionToken, signal } from '@angular/core';
import { PersistedDashboardState, PersistenceStrategy } from '../models/dashboard-grid.model';
import { LOCAL_STORAGE } from '../../../core/tokens';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, of } from 'rxjs';

const STORAGE_KEY = 'dashboard-state';

export const DASHBOARD_PERSISTENCE_STRATEGY = new InjectionToken<PersistenceStrategy>(
  'DASHBOARD_PERSISTENCE_STRATEGY',
  { factory: () => 'localStorage' }
);

@Injectable()
export class DashboardPersistenceService {
  private readonly storage = inject(LOCAL_STORAGE);
  private readonly http = inject(HttpClient);
  private readonly strategy = inject(DASHBOARD_PERSISTENCE_STRATEGY);

  private readonly _saving = signal(false);
  private readonly _lastSaved = signal<number | null>(null);
  private readonly _error = signal<string | null>(null);

  readonly saving = this._saving.asReadonly();
  readonly lastSaved = this._lastSaved.asReadonly();
  readonly error = this._error.asReadonly();

  async save(state: PersistedDashboardState): Promise<void> {
    this._saving.set(true);
    this._error.set(null);

    try {
      if (this.strategy === 'localStorage') {
        this.saveToLocalStorage(state);
      } else {
        await this.saveToApi(state);
      }
      this._lastSaved.set(Date.now());
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to save layout';
      this._error.set(message);
    } finally {
      this._saving.set(false);
    }
  }

  async load(): Promise<PersistedDashboardState | null> {
    this._error.set(null);

    try {
      if (this.strategy === 'localStorage') {
        return this.loadFromLocalStorage();
      } else {
        return await this.loadFromApi();
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load layout';
      this._error.set(message);
      return null;
    }
  }

  private saveToLocalStorage(state: PersistedDashboardState): void {
    const json = JSON.stringify(state);
    this.storage.setItem(STORAGE_KEY, json);
  }

  private loadFromLocalStorage(): PersistedDashboardState | null {
    const json = this.storage.getItem(STORAGE_KEY);
    if (!json) return null;
    return JSON.parse(json) as PersistedDashboardState;
  }

  private saveToApi(state: PersistedDashboardState): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.put(`/api/dashboard-layouts/${state.layout.id}`, state)
        .pipe(catchError((err: HttpErrorResponse) => {
          reject(new Error(err.message || 'API save failed'));
          return of(null);
        }))
        .subscribe(result => {
          if (result !== null) resolve();
        });
    });
  }

  private loadFromApi(): Promise<PersistedDashboardState | null> {
    return new Promise((resolve, reject) => {
      this.http.get<PersistedDashboardState>('/api/dashboard-layouts/default')
        .pipe(catchError((err: HttpErrorResponse) => {
          reject(new Error(err.message || 'API load failed'));
          return of(null);
        }))
        .subscribe(result => resolve(result));
    });
  }
}
