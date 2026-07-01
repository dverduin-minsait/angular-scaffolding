import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Territory, MapPoi } from '../models/map.models';
import { ENVIRONMENT } from '../../../../../environments/environment';

@Injectable()
export class MapDataService {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly apiUrl = ENVIRONMENT.API_URL;

  private readonly _territories = signal<Territory[]>([]);
  private readonly _pois = signal<MapPoi[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly territories = this._territories.asReadonly();
  readonly pois = this._pois.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  loadTerritories(): void {
    this._loading.set(true);
    this.http
      .get<Territory[]>(`${this.apiUrl}/territories`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this._territories.set(data);
          this._loading.set(false);
        },
        error: () => {
          this._error.set('map.errors.territoriesLoad');
          this._loading.set(false);
        }
      });
  }

  loadPois(): void {
    this._loading.set(true);
    this.http
      .get<MapPoi[]>(`${this.apiUrl}/map-pois`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this._pois.set(data);
          this._loading.set(false);
        },
        error: () => {
          this._error.set('map.errors.poisLoad');
          this._loading.set(false);
        }
      });
  }
}
