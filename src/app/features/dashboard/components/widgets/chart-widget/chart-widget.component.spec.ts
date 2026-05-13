import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ChartWidgetComponent } from './chart-widget.component';
import { WIDGET_CONFIG } from '../../../../../core/tokens/widget-config.token';

describe('ChartWidgetComponent', () => {
  function createFixture(data: Record<string, unknown>, title = 'Revenue Chart'): ComponentFixture<ChartWidgetComponent> {
    TestBed.configureTestingModule({
      imports: [ChartWidgetComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: WIDGET_CONFIG, useValue: { widgetId: 'w-chart', title, data } }
      ]
    });
    const fixture = TestBed.createComponent(ChartWidgetComponent);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('should create', () => {
    expect(createFixture({}).componentInstance).toBeTruthy();
  });

  it('should render 7 default bars when no bars provided', () => {
    const fixture = createFixture({});
    const bars = fixture.nativeElement.querySelectorAll('.bar-col');
    expect(bars.length).toBe(7);
  });

  it('should render custom bars from config data', () => {
    const customBars = [
      { height: 50, label: 'Q1' },
      { height: 80, label: 'Q2' },
      { height: 60, label: 'Q3' }
    ];
    const fixture = createFixture({ bars: customBars });
    const bars = fixture.nativeElement.querySelectorAll('.bar-col');
    expect(bars.length).toBe(3);
  });

  it('should display bar labels', () => {
    const fixture = createFixture({});
    const labels = fixture.nativeElement.querySelectorAll('.bar-label');
    expect(labels[0].textContent?.trim()).toBe('Mon');
  });

  it('should display summary value when provided', () => {
    const fixture = createFixture({ value: '$12.4k' });
    const summary = fixture.nativeElement.querySelector('.chart-summary') as HTMLElement;
    expect(summary.textContent?.trim()).toBe('$12.4k');
  });

  it('should not display summary when value is empty', () => {
    const fixture = createFixture({});
    const summary = fixture.nativeElement.querySelector('.chart-summary');
    expect(summary).toBeNull();
  });

  it('should have accessible role="img" with aria-label', () => {
    const fixture = createFixture({}, 'Revenue Chart');
    const el = fixture.nativeElement.querySelector('[role="img"]') as HTMLElement;
    expect(el).toBeTruthy();
    expect(el.getAttribute('aria-label')).toBe('Revenue Chart bar chart');
  });
});
