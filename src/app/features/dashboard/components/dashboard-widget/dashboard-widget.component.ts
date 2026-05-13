import {
  Component,
  input,
  output,
  computed
} from '@angular/core';
import { DashboardWidget, GridPosition, GridSize } from '../../models/dashboard-grid.model';

@Component({
  selector: 'app-dashboard-widget',
  standalone: true,
  imports: [],
  host: {
    '[style.grid-column]': 'gridColumn()',
    '[style.grid-row]': 'gridRow()',
    '[class.dragging]': 'isDragging()'
  },
  template: `
    <div
      class="dashboard-widget"
      role="article"
      [attr.aria-label]="widget().title"
      aria-roledescription="draggable widget">
      <header class="widget-header"
        (pointerdown)="onMoveStart($event)"
        (keydown)="onHeaderKeydown($event)"
        role="toolbar"
        [attr.aria-label]="'Move ' + widget().title"
        tabindex="0">
        <h3>{{ widget().title }}</h3>
        <span class="widget-type">{{ widget().type }}</span>
      </header>
      <div class="widget-content">
        @switch (widget().type) {
          @case ('stat') {
            <div class="widget-stat">
              <span class="stat-value">{{ widgetValue() }}</span>
              <span class="stat-label">{{ widget().title }}</span>
            </div>
          }
          @case ('chart') {
            <div class="widget-chart">
              <div class="chart-placeholder" aria-hidden="true">
                <div class="chart-bar" style="height: 40%"></div>
                <div class="chart-bar" style="height: 70%"></div>
                <div class="chart-bar" style="height: 55%"></div>
                <div class="chart-bar" style="height: 85%"></div>
                <div class="chart-bar" style="height: 60%"></div>
                <div class="chart-bar" style="height: 90%"></div>
                <div class="chart-bar" style="height: 45%"></div>
              </div>
              @if (widgetValue()) {
                <span class="chart-label">{{ widgetValue() }}</span>
              }
            </div>
          }
          @case ('status') {
            <div class="widget-status">
              <span class="status-dot" [class.healthy]="widgetValue() === 'Healthy'"></span>
              <span class="status-text">{{ widgetValue() || 'Unknown' }}</span>
            </div>
          }
          @case ('list') {
            <ul class="widget-list" role="list">
              <li>Item 1</li>
              <li>Item 2</li>
              <li>Item 3</li>
            </ul>
          }
          @default {
            @if (widgetValue()) {
              <span>{{ widgetValue() }}</span>
            }
          }
        }
        <ng-content />
      </div>
      <div
        class="widget-resize-handle"
        (pointerdown)="onResizeStart($event)"
        (keydown)="onResizeKeydown($event)"
        role="separator"
        aria-label="Resize widget"
        aria-orientation="horizontal"
        tabindex="0">
      </div>
    </div>
  `,
  styleUrl: './dashboard-widget.component.scss'
})
export class DashboardWidgetComponent {
  readonly widget = input.required<DashboardWidget>();
  readonly cellSize = input(80);
  readonly isDragging = input(false);
  readonly previewPosition = input<GridPosition | null>(null);
  readonly previewSize = input<GridSize | null>(null);

  readonly moveStarted = output<{ widgetId: string; event: PointerEvent }>();
  readonly resizeStarted = output<{ widgetId: string; event: PointerEvent }>();
  readonly keyboardMove = output<{ widgetId: string; direction: string }>();
  readonly keyboardResize = output<{ widgetId: string; direction: string }>();

  readonly widgetValue = computed(() => {
    const data = this.widget().data;
    return (data?.['value'] as string) ?? '';
  });

  readonly gridColumn = computed(() => {
    const pos = this.previewPosition() ?? this.widget().position;
    const size = this.previewSize() ?? this.widget().size;
    return `${pos.col + 1} / span ${size.cols}`;
  });

  readonly gridRow = computed(() => {
    const pos = this.previewPosition() ?? this.widget().position;
    const size = this.previewSize() ?? this.widget().size;
    return `${pos.row + 1} / span ${size.rows}`;
  });

  onMoveStart(event: PointerEvent): void {
    event.preventDefault();
    this.moveStarted.emit({ widgetId: this.widget().id, event });
  }

  onResizeStart(event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.resizeStarted.emit({ widgetId: this.widget().id, event });
  }

  /** Arrow keys on the header move the widget */
  onHeaderKeydown(event: KeyboardEvent): void {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      this.keyboardMove.emit({ widgetId: this.widget().id, direction: event.key });
    }
  }

  /** Arrow keys on the resize handle resize the widget */
  onResizeKeydown(event: KeyboardEvent): void {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      this.keyboardResize.emit({ widgetId: this.widget().id, direction: event.key });
    }
  }
}
