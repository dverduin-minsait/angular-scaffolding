import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AbstractApiClient } from '../../../core/api/abstract-api.service';
import { WeatherCurrent, WeatherForecastDay } from './weather-api.types';

@Injectable({ providedIn: 'root' })
export class WeatherApiService extends AbstractApiClient<WeatherCurrent, number> {
  protected readonly baseUrl = 'http://localhost:3000';
  protected readonly resourceName = 'weather-current';

  private readonly httpClient = inject(HttpClient);

  /** Get current weather for a location slug (e.g. 'madrid'). */
  getCurrent(location: string): Observable<WeatherCurrent> {
    return this.httpClient
      .get<WeatherCurrent[]>(`${this.baseUrl}/weather-current?location=${location}`)
      .pipe(map(results => results[0]));
  }

  /** Get 5-day forecast for a location slug. */
  getForecast(location: string): Observable<WeatherForecastDay[]> {
    return this.httpClient.get<WeatherForecastDay[]>(
      `${this.baseUrl}/weather-forecast?location=${location}`
    );
  }
}
