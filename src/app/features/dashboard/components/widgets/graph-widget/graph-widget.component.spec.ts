import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { GraphWidgetComponent } from './graph-widget.component';
import { WIDGET_CONFIG } from '../../../../../core/tokens/widget-config.token';

describe('GraphWidgetComponent', () => {
  function createFixture(data: Record<string, unknown>, title = 'Traffic'): ComponentFixture<GraphWidgetComponent> {
    TestBed.configureTestingModule({
      imports: [GraphWidgetComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: WIDGET_CONFIG, useValue: { widgetId: 'w-graph', title, data } }
      ]
    });
    const fixture = TestBed.createComponent(GraphWidgetComponent);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('should create', () => {
    expect(createFixture({}).componentInstance).toBeTruthy();
  });

  it('should render an SVG with role="img"', () => {
    const fixture = createFixture({});
    const svg = fixture.nativeElement.querySelector('svg[role="img"]');
    expect(svg).toBeTruthy();
  });

  it('should render the area fill path', () => {
    const fixture = createFixture({});
    const area = fixture.nativeElement.querySelector('.graph-area');
    expect(area).toBeTruthy();
  });

  it('should render the line polyline', () => {
    const fixture = createFixture({});
    const line = fixture.nativeElement.querySelector('.graph-line');
    expect(line).toBeTruthy();
  });

  it('should render 8 default dots', () => {
    const fixture = createFixture({});
    const dots = fixture.nativeElement.querySelectorAll('.graph-dot');
    expect(dots.length).toBe(8); // SAMPLE_POINTS has 8 entries
  });

  it('should render x-axis labels', () => {
    const fixture = createFixture({});
    const labels = fixture.nativeElement.querySelectorAll('.graph-label');
    expect(labels.length).toBe(8);
    expect(labels[0].textContent?.trim()).toBe('Jan');
  });

  it('should have accessible aria-label containing title', () => {
    const fixture = createFixture({}, 'Traffic Overview');
    const svg = fixture.nativeElement.querySelector('svg[role="img"]') as SVGElement;
    expect(svg.getAttribute('aria-label')).toBe('Traffic Overview line graph');
  });
});
