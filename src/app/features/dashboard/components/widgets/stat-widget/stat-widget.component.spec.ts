import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { StatWidgetComponent } from './stat-widget.component';
import { WIDGET_CONFIG } from '../../../../../core/tokens/widget-config.token';

describe('StatWidgetComponent', () => {
  function createFixture(data: Record<string, unknown>, title = 'CPU Load'): ComponentFixture<StatWidgetComponent> {
    TestBed.configureTestingModule({
      imports: [StatWidgetComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: WIDGET_CONFIG, useValue: { widgetId: 'w1', title, data } }
      ]
    });
    const fixture = TestBed.createComponent(StatWidgetComponent);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('should create', () => {
    const fixture = createFixture({ value: '73%' });
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display the value', () => {
    const fixture = createFixture({ value: '73%' });
    const el = fixture.nativeElement.querySelector('.stat-value') as HTMLElement;
    expect(el.textContent?.trim()).toBe('73%');
  });

  it('should display the title as label', () => {
    const fixture = createFixture({ value: '73%' }, 'My Metric');
    const el = fixture.nativeElement.querySelector('.stat-label') as HTMLElement;
    expect(el.textContent?.trim()).toBe('My Metric');
  });

  it('should show fallback "—" when value is missing', () => {
    const fixture = createFixture({});
    const el = fixture.nativeElement.querySelector('.stat-value') as HTMLElement;
    expect(el.textContent?.trim()).toBe('—');
  });

  it('should show upward trend when trend > 0', () => {
    const fixture = createFixture({ value: '73%', trend: 5 });
    const trend = fixture.nativeElement.querySelector('.stat-trend') as HTMLElement;
    expect(trend).toBeTruthy();
    expect(trend.classList.contains('up')).toBe(true);
    expect(trend.getAttribute('aria-label')).toBe('Trending up');
    expect(trend.textContent).toContain('5%');
  });

  it('should show downward trend when trend < 0', () => {
    const fixture = createFixture({ value: '73%', trend: -3 });
    const trend = fixture.nativeElement.querySelector('.stat-trend') as HTMLElement;
    expect(trend.classList.contains('down')).toBe(true);
    expect(trend.getAttribute('aria-label')).toBe('Trending down');
    expect(trend.textContent).toContain('3%');
  });

  it('should not show trend when trend is null/missing', () => {
    const fixture = createFixture({ value: '73%' });
    const trend = fixture.nativeElement.querySelector('.stat-trend');
    expect(trend).toBeNull();
  });

  it('should have accessible role="group" with aria-label', () => {
    const fixture = createFixture({ value: '73%' }, 'CPU Load');
    const group = fixture.nativeElement.querySelector('[role="group"]') as HTMLElement;
    expect(group).toBeTruthy();
    expect(group.getAttribute('aria-label')).toBe('CPU Load');
  });
});
