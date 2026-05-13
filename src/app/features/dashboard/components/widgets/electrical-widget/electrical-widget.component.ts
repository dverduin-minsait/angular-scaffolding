import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WIDGET_CONFIG } from '../../../../../core/tokens/widget-config.token';
import { ElectricalApiService } from '../../../services/electrical-api.service';
import { ElectricalReading, ElectricalSummary } from '../../../services/electrical-api.types';

@Component({
  selector: 'app-electrical-widget',
  standalone: true,
  template: `
    <div class="electrical-widget" role="region" [attr.aria-label]="config.title + ' consumption'">
      @if (isLoading()) {
        <div class="elec-loading" aria-live="polite">
          <span class="spinner" aria-hidden="true"></span>
        </div>
      } @else if (hasError()) {
        <p class="elec-error" role="alert">Could not load consumption data.</p>
      } @else {
        @if (summary()) {
          <div class="elec-summary" role="group" aria-label="Today's summary">
            <div class="summary-stat">
              <span class="summary-value">{{ summary()!.todayKwh }}</span>
              <span class="summary-label">kWh today</span>
            </div>
            <div class="summary-stat">
              <span class="summary-value">€{{ summary()!.todayCostEur.toFixed(2) }}</span>
              <span class="summary-label">cost today</span>
            </div>
            <div class="summary-stat">
              <span class="summary-value">{{ summary()!.peakHour }}</span>
              <span class="summary-label">peak hour</span>
            </div>
          </div>
        }

        @if (readings().length) {
          <div class="elec-chart" aria-hidden="true" role="img" [attr.aria-label]="'Hourly consumption bars'">
            @for (r of readings(); track r.id) {
              <div
                class="elec-bar"
                [style.height.%]="barHeight(r)"
                [title]="r.hour + ': ' + r.kwh + ' kWh'">
              </div>
            }
          </div>
          <div class="elec-axis">
            @for (r of axisLabels(); track r) {
              <span class="axis-label">{{ r }}</span>
            }
          </div>
        }
      }
    </div>
  `,
  styleUrl: './electrical-widget.component.scss'
})
export class ElectricalWidgetComponent implements OnInit {
  protected readonly config = inject(WIDGET_CONFIG);
  private readonly electricalApi = inject(ElectricalApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly readings = signal<ElectricalReading[]>([]);
  protected readonly summary = signal<ElectricalSummary | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);

  private readonly location = computed(
    () => (this.config.data['location'] as string) ?? 'main'
  );

  protected readonly maxKwh = computed(() =>
    Math.max(...this.readings().map(r => r.kwh), 1)
  );

  protected readonly axisLabels = computed(() => {
    const r = this.readings();
    if (!r.length) return [];
    const step = Math.ceil(r.length / 4);
    return r.filter((_, i) => i % step === 0).map(x => x.hour);
  });

  barHeight(r: ElectricalReading): number {
    return Math.round((r.kwh / this.maxKwh()) * 100);
  }

  ngOnInit(): void {
    this.electricalApi.getReadings(this.location())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: ElectricalReading[]) => {
          this.readings.set(data);
          this.isLoading.set(false);
        },
        error: () => {
          this.hasError.set(true);
          this.isLoading.set(false);
        }
      });

    this.electricalApi.getSummary(this.location())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (data: ElectricalSummary) => this.summary.set(data ?? null) });
  }
}
