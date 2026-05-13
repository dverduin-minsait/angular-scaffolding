import { Component, inject, computed } from '@angular/core';
import { WIDGET_CONFIG } from '../../../../../core/tokens/widget-config.token';

interface BarEntry {
  height: number;
  label: string;
}

const DEFAULT_BARS: BarEntry[] = [
  { height: 40, label: 'Mon' },
  { height: 70, label: 'Tue' },
  { height: 55, label: 'Wed' },
  { height: 85, label: 'Thu' },
  { height: 60, label: 'Fri' },
  { height: 90, label: 'Sat' },
  { height: 45, label: 'Sun' }
];

@Component({
  selector: 'app-chart-widget',
  standalone: true,
  template: `
    <div class="chart-widget" role="img" [attr.aria-label]="title() + ' bar chart'">
      <div class="bars" aria-hidden="true">
        @for (bar of bars(); track bar.label) {
          <div class="bar-col">
            <div class="bar" [style.height.%]="bar.height"
                 [title]="bar.label + ': ' + bar.height + '%'">
            </div>
            <span class="bar-label">{{ bar.label }}</span>
          </div>
        }
      </div>
      @if (summary()) {
        <p class="chart-summary">{{ summary() }}</p>
      }
    </div>
  `,
  styleUrl: './chart-widget.component.scss'
})
export class ChartWidgetComponent {
  private readonly config = inject(WIDGET_CONFIG);

  protected readonly title = computed(() => this.config.title);
  protected readonly summary = computed(() => (this.config.data['value'] as string) ?? '');
  protected readonly bars = computed(() =>
    (this.config.data['bars'] as BarEntry[] | undefined)?.length
      ? (this.config.data['bars'] as BarEntry[])
      : DEFAULT_BARS
  );
}
