import { Component, inject, computed } from '@angular/core';
import { WIDGET_CONFIG } from '../../../../../core/tokens/widget-config.token';

@Component({
  selector: 'app-stat-widget',
  standalone: true,
  template: `
    <div class="stat-widget" role="group" [attr.aria-label]="label()">
      <span class="stat-value" aria-live="polite">{{ value() }}</span>
      <span class="stat-label">{{ label() }}</span>
      @if (trend() !== null) {
        <span class="stat-trend" [class.up]="trend()! > 0" [class.down]="trend()! < 0"
              [attr.aria-label]="trend()! > 0 ? 'Trending up' : 'Trending down'">
          {{ trend()! > 0 ? '▲' : '▼' }} {{ trendLabel() }}
        </span>
      }
    </div>
  `,
  styleUrl: './stat-widget.component.scss'
})
export class StatWidgetComponent {
  private readonly config = inject(WIDGET_CONFIG);

  protected readonly value = computed(() => (this.config.data['value'] as string) ?? '—');
  protected readonly label = computed(() => this.config.title);
  protected readonly trend = computed(() => (this.config.data['trend'] as number) ?? null);

  protected readonly trendLabel = computed(() => {
    const t = this.trend();
    if (t === null) return '';
    return `${Math.abs(t)}%`;
  });
}
