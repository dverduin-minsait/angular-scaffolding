import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { DashboardWidgetComponent } from './dashboard-widget.component';
import { DashboardWidget } from '../../models/dashboard-grid.model';

describe('DashboardWidgetComponent', () => {
  let fixture: ComponentFixture<DashboardWidgetComponent>;
  let component: DashboardWidgetComponent;

  const testWidget: DashboardWidget = {
    id: 'w1',
    title: 'Test Widget',
    type: 'stat',
    position: { col: 2, row: 1 },
    size: { cols: 3, rows: 2 }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardWidgetComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardWidgetComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('widget', testWidget);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display widget title', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h3')?.textContent).toBe('Test Widget');
  });

  it('should compute correct grid-column placement', () => {
    fixture.detectChanges();
    const host = fixture.debugElement.nativeElement as HTMLElement;
    expect(host.style.gridColumn).toBe('3 / span 3');
  });

  it('should compute correct grid-row placement', () => {
    fixture.detectChanges();
    const host = fixture.debugElement.nativeElement as HTMLElement;
    expect(host.style.gridRow).toBe('2 / span 2');
  });

  it('should apply dragging class when isDragging is true', () => {
    fixture.componentRef.setInput('isDragging', true);
    fixture.detectChanges();
    const host = fixture.debugElement.nativeElement as HTMLElement;
    expect(host.classList.contains('dragging')).toBe(true);
  });

  it('should use preview position when provided', () => {
    fixture.componentRef.setInput('previewPosition', { col: 5, row: 3 });
    fixture.componentRef.setInput('previewSize', { cols: 4, rows: 3 });
    fixture.detectChanges();
    const host = fixture.debugElement.nativeElement as HTMLElement;
    expect(host.style.gridColumn).toBe('6 / span 4');
    expect(host.style.gridRow).toBe('4 / span 3');
  });

  it('should have accessible aria-label', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.dashboard-widget') as HTMLElement;
    expect(el.getAttribute('aria-label')).toBe('Test Widget');
    expect(el.getAttribute('aria-roledescription')).toBe('draggable widget');
  });

  it('should emit moveStarted on header pointerdown', () => {
    fixture.detectChanges();
    const emitSpy = vi.spyOn(component.moveStarted, 'emit');
    const header = fixture.nativeElement.querySelector('.widget-header') as HTMLElement;

    const event = new PointerEvent('pointerdown', { clientX: 100, clientY: 50 });
    header.dispatchEvent(event);

    expect(emitSpy).toHaveBeenCalledWith({ widgetId: 'w1', event });
  });

  it('should emit resizeStarted on resize handle pointerdown', () => {
    fixture.detectChanges();
    const emitSpy = vi.spyOn(component.resizeStarted, 'emit');
    const handle = fixture.nativeElement.querySelector('.widget-resize-handle') as HTMLElement;

    const event = new PointerEvent('pointerdown', { clientX: 200, clientY: 150, bubbles: true });
    handle.dispatchEvent(event);

    expect(emitSpy).toHaveBeenCalledWith({ widgetId: 'w1', event });
  });

  it('should have role="article" for accessibility', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('[role="article"]') as HTMLElement;
    expect(el).toBeTruthy();
  });

  it('should have accessible resize handle', () => {
    fixture.detectChanges();
    const handle = fixture.nativeElement.querySelector('.widget-resize-handle') as HTMLElement;
    expect(handle.getAttribute('role')).toBe('separator');
    expect(handle.getAttribute('aria-label')).toBe('Resize widget');
  });

  it('should have focusable header for keyboard navigation', () => {
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('.widget-header') as HTMLElement;
    expect(header.getAttribute('tabindex')).toBe('0');
  });

  it('should emit keyboardMove on header arrow key', () => {
    fixture.detectChanges();
    const emitSpy = vi.spyOn(component.keyboardMove, 'emit');
    const header = fixture.nativeElement.querySelector('.widget-header') as HTMLElement;

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
    header.dispatchEvent(event);

    expect(emitSpy).toHaveBeenCalledWith({ widgetId: 'w1', direction: 'ArrowRight' });
  });

  it('should emit keyboardResize on resize handle arrow key', () => {
    fixture.detectChanges();
    const emitSpy = vi.spyOn(component.keyboardResize, 'emit');
    const handle = fixture.nativeElement.querySelector('.widget-resize-handle') as HTMLElement;

    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
    handle.dispatchEvent(event);

    expect(emitSpy).toHaveBeenCalledWith({ widgetId: 'w1', direction: 'ArrowDown' });
  });

  describe('remove button', () => {
    it('should render a remove button in the header', () => {
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.widget-remove-btn') as HTMLElement;
      expect(btn).not.toBeNull();
    });

    it('should have accessible aria-label on remove button', () => {
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.widget-remove-btn') as HTMLButtonElement;
      expect(btn.getAttribute('aria-label')).toBe('Remove Test Widget');
    });

    it('should be focusable (tabindex not -1)', () => {
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.widget-remove-btn') as HTMLButtonElement;
      const tabindex = btn.getAttribute('tabindex');
      expect(tabindex === null || tabindex === '0').toBe(true);
    });

    it('should emit removed with widget id on click', () => {
      fixture.detectChanges();
      const emitSpy = vi.spyOn(component.removed, 'emit');
      const btn = fixture.nativeElement.querySelector('.widget-remove-btn') as HTMLButtonElement;
      btn.click();
      expect(emitSpy).toHaveBeenCalledWith('w1');
    });

    it('should not emit moveStarted when clicking remove button', () => {
      fixture.detectChanges();
      const moveStartedSpy = vi.spyOn(component.moveStarted, 'emit');
      const btn = fixture.nativeElement.querySelector('.widget-remove-btn') as HTMLButtonElement;
      const event = new PointerEvent('pointerdown', { bubbles: true, cancelable: true });
      btn.dispatchEvent(event);
      expect(moveStartedSpy).not.toHaveBeenCalled();
    });
  });
});
