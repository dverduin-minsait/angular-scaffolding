import { Component, inject, computed } from '@angular/core';
import { WIDGET_CONFIG } from '../../../../../core/tokens/widget-config.token';

interface DataPoint {
  x: number;
  y: number;
  label: string;
}

const SAMPLE_POINTS: DataPoint[] = [
  { x: 0, y: 30, label: 'Jan' },
  { x: 1, y: 55, label: 'Feb' },
  { x: 2, y: 40, label: 'Mar' },
  { x: 3, y: 72, label: 'Apr' },
  { x: 4, y: 60, label: 'May' },
  { x: 5, y: 85, label: 'Jun' },
  { x: 6, y: 78, label: 'Jul' },
  { x: 7, y: 92, label: 'Aug' }
];

const VIEWBOX_W = 200;
const VIEWBOX_H = 80;
const PAD = 8;

@Component({
  selector: 'app-graph-widget',
  standalone: true,
  template: `
    <div class="graph-widget">
      <svg
        class="graph-svg"
        [attr.viewBox]="'0 0 ' + viewW + ' ' + viewH"
        preserveAspectRatio="none"
        role="img"
        [attr.aria-label]="title() + ' line graph'">
        <defs>
          <linearGradient [id]="gradientId" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--primary-500)" stop-opacity="0.35" />
            <stop offset="100%" stop-color="var(--primary-500)" stop-opacity="0.02" />
          </linearGradient>
        </defs>

        <!-- Area fill -->
        <path
          class="graph-area"
          [attr.d]="areaPath()"
          [attr.fill]="'url(#' + gradientId + ')'" />

        <!-- Line -->
        <polyline
          class="graph-line"
          [attr.points]="linePoints()" />

        <!-- Dots -->
        @for (pt of svgPoints(); track pt.label) {
          <circle
            class="graph-dot"
            [attr.cx]="pt.cx"
            [attr.cy]="pt.cy"
            r="2.5">
            <title>{{ pt.label }}: {{ pt.rawY }}</title>
          </circle>
        }
      </svg>

      <!-- X-axis labels -->
      <div class="graph-labels" aria-hidden="true">
        @for (pt of points(); track pt.label) {
          <span class="graph-label">{{ pt.label }}</span>
        }
      </div>

      @if (summary()) {
        <p class="graph-summary">{{ summary() }}</p>
      }
    </div>
  `,
  styleUrl: './graph-widget.component.scss'
})
export class GraphWidgetComponent {
  private readonly config = inject(WIDGET_CONFIG);

  protected readonly title = computed(() => this.config.title);
  protected readonly summary = computed(() => (this.config.data['value'] as string) ?? '');
  private readonly data = computed(() =>
    (this.config.data['points'] as DataPoint[] | undefined) ?? SAMPLE_POINTS
  );

  protected readonly viewW = VIEWBOX_W;
  protected readonly viewH = VIEWBOX_H;
  protected readonly gradientId = `graph-gradient-${Math.random().toString(36).slice(2, 7)}`;

  readonly points = computed(() => this.data().length >= 2 ? this.data() : SAMPLE_POINTS);

  readonly svgPoints = computed(() => {
    const pts = this.points();
    const maxY = Math.max(...pts.map(p => p.y));
    const minY = Math.min(...pts.map(p => p.y));
    const range = maxY - minY || 1;
    const xStep = (VIEWBOX_W - PAD * 2) / (pts.length - 1);
    return pts.map((p, i) => ({
      cx: PAD + i * xStep,
      cy: PAD + ((maxY - p.y) / range) * (VIEWBOX_H - PAD * 2),
      label: p.label,
      rawY: p.y
    }));
  });

  readonly linePoints = computed(() =>
    this.svgPoints().map(p => `${p.cx},${p.cy}`).join(' ')
  );

  readonly areaPath = computed(() => {
    const pts = this.svgPoints();
    if (!pts.length) return '';
    const bottom = VIEWBOX_H - PAD;
    const first = pts[0];
    const last = pts[pts.length - 1];
    const linePart = pts.map(p => `${p.cx},${p.cy}`).join(' L');
    return `M${first.cx},${bottom} L${linePart} L${last.cx},${bottom} Z`;
  });
}
