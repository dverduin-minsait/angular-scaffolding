import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AbstractApiClient } from '../../../core/api/abstract-api.service';
import { ElectricalReading, ElectricalSummary } from './electrical-api.types';

@Injectable({ providedIn: 'root' })
export class ElectricalApiService extends AbstractApiClient<ElectricalReading, number> {
  protected readonly baseUrl = 'http://localhost:3000';
  protected readonly resourceName = 'electrical-readings';

  private readonly httpClient = inject(HttpClient);

  /** Get hourly readings for a location slug (e.g. 'main'). */
  getReadings(location: string): Observable<ElectricalReading[]> {
    return this.httpClient.get<ElectricalReading[]>(
      `${this.baseUrl}/electrical-readings?location=${location}`
    );
  }

  /** Get the daily/monthly summary for a location slug. */
  getSummary(location: string): Observable<ElectricalSummary> {
    return this.httpClient
      .get<ElectricalSummary[]>(`${this.baseUrl}/electrical-summary?location=${location}`)
      .pipe(map(results => results[0]));
  }
}
