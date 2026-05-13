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
        <button
          type="button"
          class="widget-remove-btn"
          [attr.aria-label]="'Remove ' + widget().title"
          (pointerdown)="$event.stopPropagation()"
          (click)="onRemove($event)">
          <svg viewBox="0 0 14 14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="1" y1="1" x2="13" y2="13"/>
            <line x1="13" y1="1" x2="1" y2="13"/>
          </svg>
        </button>
      </header>
      <div class="widget-content">
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
  readonly removed = output<string>();

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

  onRemove(event: MouseEvent): void {
    event.stopPropagation();
    this.removed.emit(this.widget().id);
  }
}
