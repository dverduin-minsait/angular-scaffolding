import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WIDGET_CONFIG } from '../../../../../core/tokens/widget-config.token';
import { WeatherApiService } from '../../../services/weather-api.service';
import { WeatherCurrent, WeatherForecastDay } from '../../../services/weather-api.types';

@Component({
  selector: 'app-weather-widget',
  standalone: true,
  template: `
    <div class="weather-widget" role="region" [attr.aria-label]="config.title + ' weather'">
      @if (isLoading()) {
        <div class="weather-loading" aria-live="polite">
          <span class="spinner" aria-hidden="true"></span>
        </div>
      } @else if (hasError()) {
        <p class="weather-error" role="alert">Could not load weather data.</p>
      } @else if (current()) {
        <div class="weather-current">
          <span class="weather-icon" aria-hidden="true">{{ current()!.icon }}</span>
          <div class="weather-main">
            <span class="weather-temp">{{ current()!.temp }}°C</span>
            <span class="weather-city">{{ current()!.city }}</span>
          </div>
          <div class="weather-details">
            <span>{{ current()!.condition }}</span>
            <span>Feels {{ current()!.feelsLike }}°C · {{ current()!.humidity }}% humidity</span>
            <span>Wind {{ current()!.windKph }} km/h</span>
          </div>
        </div>

        @if (forecast().length) {
          <ul class="weather-forecast" role="list" aria-label="5-day forecast">
            @for (day of forecast(); track day.id) {
              <li class="forecast-day">
                <span class="forecast-label">{{ day.day }}</span>
                <span class="forecast-icon" aria-hidden="true">{{ day.icon }}</span>
                <span class="forecast-temps">
                  <strong>{{ day.high }}°</strong>
                  <em>{{ day.low }}°</em>
                </span>
              </li>
            }
          </ul>
        }
      }
    </div>
  `,
  styleUrl: './weather-widget.component.scss'
})
export class WeatherWidgetComponent implements OnInit {
  protected readonly config = inject(WIDGET_CONFIG);
  private readonly weatherApi = inject(WeatherApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly current = signal<WeatherCurrent | null>(null);
  protected readonly forecast = signal<WeatherForecastDay[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);

  private readonly location = computed(
    () => (this.config.data['location'] as string) ?? 'madrid'
  );

  ngOnInit(): void {
    this.weatherApi.getCurrent(this.location())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: WeatherCurrent) => {
          this.current.set(data ?? null);
          this.isLoading.set(false);
        },
        error: () => {
          this.hasError.set(true);
          this.isLoading.set(false);
        }
      });

    this.weatherApi.getForecast(this.location())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (data: WeatherForecastDay[]) => this.forecast.set(data) });
  }
}
