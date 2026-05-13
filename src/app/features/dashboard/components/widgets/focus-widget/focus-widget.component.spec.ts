import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal, computed } from '@angular/core';
import { FocusWidgetComponent } from './focus-widget.component';
import { WIDGET_CONFIG } from '../../../../../core/tokens/widget-config.token';
import { UserFocusService } from '../../../services/user-focus.service';

describe('FocusWidgetComponent', () => {
  let fixture: ComponentFixture<FocusWidgetComponent>;

  const mockIdleSeconds = signal(0);
  const mockFocusService = {
    idleSeconds: mockIdleSeconds.asReadonly(),
    focusState: computed(() => {
      const s = mockIdleSeconds();
      if (s < 30) return 'focused' as const;
      if (s < 60) return 'idle' as const;
      return 'away' as const;
    }),
    secondsUntilChange: computed(() => {
      const s = mockIdleSeconds();
      if (s < 30) return 30 - s;
      if (s < 60) return 60 - s;
      return 0;
    })
  };

  const mockConfig = { widgetId: 'w-focus', title: 'User Focus', data: { idleThreshold: 30, awayThreshold: 60 } };

  beforeEach(async () => {
    mockIdleSeconds.set(0); // reset between tests
    await TestBed.configureTestingModule({
      imports: [FocusWidgetComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: WIDGET_CONFIG, useValue: mockConfig },
        { provide: UserFocusService, useValue: mockFocusService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FocusWidgetComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have role="status" for accessibility', () => {
    const el = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    expect(el).toBeTruthy();
  });

  it('should have aria-label', () => {
    const el = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    expect(el.getAttribute('aria-label')).toContain('User focus');
  });

  it('should show "Focused" state label at 0s idle', () => {
    const label = fixture.nativeElement.querySelector('.state-label') as HTMLElement;
    expect(label.textContent?.trim()).toBe('Focused');
  });

  it('should show data-state="focused" at 0s', () => {
    const widget = fixture.nativeElement.querySelector('.focus-widget') as HTMLElement;
    expect(widget.getAttribute('data-state')).toBe('focused');
  });

  it('should show "Idle" state label at 30s', () => {
    mockIdleSeconds.set(30);
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.state-label') as HTMLElement;
    expect(label.textContent?.trim()).toBe('Idle');
  });

  it('should show data-state="idle" at 30s', () => {
    mockIdleSeconds.set(30);
    fixture.detectChanges();
    const widget = fixture.nativeElement.querySelector('.focus-widget') as HTMLElement;
    expect(widget.getAttribute('data-state')).toBe('idle');
  });

  it('should show "Away" state label at 60s', () => {
    mockIdleSeconds.set(60);
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.state-label') as HTMLElement;
    expect(label.textContent?.trim()).toBe('Away');
  });

  it('should show idle time in seconds', () => {
    mockIdleSeconds.set(15);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.idle-time') as HTMLElement;
    expect(el.textContent).toContain('15s idle');
  });

  it('should show countdown bar when not away', () => {
    const bar = fixture.nativeElement.querySelector('.countdown-bar-wrap');
    expect(bar).toBeTruthy();
  });

  it('should hide countdown bar when away', () => {
    mockIdleSeconds.set(60);
    fixture.detectChanges();
    const bar = fixture.nativeElement.querySelector('.countdown-bar-wrap');
    expect(bar).toBeNull();
  });

  it('should render SVG face', () => {
    const svg = fixture.nativeElement.querySelector('svg.face');
    expect(svg).toBeTruthy();
  });

  it('should render all three mouth paths', () => {
    const smile   = fixture.nativeElement.querySelector('.mouth-smile');
    const neutral = fixture.nativeElement.querySelector('.mouth-neutral');
    const sad     = fixture.nativeElement.querySelector('.mouth-sad');
    expect(smile).toBeTruthy();
    expect(neutral).toBeTruthy();
    expect(sad).toBeTruthy();
  });
});
