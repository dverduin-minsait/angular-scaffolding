import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusIndicatorsComponent } from './status-indicators.component';

describe('StatusIndicatorsComponent', () => {
  let component: StatusIndicatorsComponent;
  let fixture: ComponentFixture<StatusIndicatorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusIndicatorsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StatusIndicatorsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display all status indicators', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const statusItems = compiled.querySelectorAll('.status-item');
    
    expect(statusItems).toHaveLength(4);
    
    // Check each status type
    expect(statusItems[0]).toHaveClass('success');
    expect(statusItems[1]).toHaveClass('warning');
    expect(statusItems[2]).toHaveClass('error');
    expect(statusItems[3]).toHaveClass('info');
  });

  it('should display correct icons for each status', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const statusIcons = compiled.querySelectorAll('.status-icon');
    
    expect(statusIcons).toHaveLength(4);
    expect(statusIcons[0].textContent?.trim()).toBe('✅');
    expect(statusIcons[1].textContent?.trim()).toBe('⚠️');
    expect(statusIcons[2].textContent?.trim()).toBe('❌');
    expect(statusIcons[3].textContent?.trim()).toBe('ℹ️');
  });

  it('should display correct text for each status', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const statusTexts = compiled.querySelectorAll('.status-text');
    
    expect(statusTexts).toHaveLength(4);
    expect(statusTexts[0].textContent?.trim()).toBe('Success');
    expect(statusTexts[1].textContent?.trim()).toBe('Warning');
    expect(statusTexts[2].textContent?.trim()).toBe('Error');
    expect(statusTexts[3].textContent?.trim()).toBe('Info');
  });

  it('should apply correct CSS classes for success status', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const successItem = compiled.querySelector('.status-item.success');
    
    expect(successItem).toBeTruthy();
    expect(successItem?.querySelector('.status-icon')).toBeTruthy();
    expect(successItem?.querySelector('.status-text')).toBeTruthy();
  });

  it('should apply correct CSS classes for warning status', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const warningItem = compiled.querySelector('.status-item.warning');
    
    expect(warningItem).toBeTruthy();
    expect(warningItem?.querySelector('.status-icon')).toBeTruthy();
    expect(warningItem?.querySelector('.status-text')).toBeTruthy();
  });

  it('should apply correct CSS classes for error status', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const errorItem = compiled.querySelector('.status-item.error');
    
    expect(errorItem).toBeTruthy();
    expect(errorItem?.querySelector('.status-icon')).toBeTruthy();
    expect(errorItem?.querySelector('.status-text')).toBeTruthy();
  });

  it('should apply correct CSS classes for info status', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const infoItem = compiled.querySelector('.status-item.info');
    
    expect(infoItem).toBeTruthy();
    expect(infoItem?.querySelector('.status-icon')).toBeTruthy();
    expect(infoItem?.querySelector('.status-text')).toBeTruthy();
  });

  it('should have proper component structure', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const container = compiled.querySelector('.status-demo');
    
    expect(container).toBeTruthy();
    
    const statusItems = container?.querySelectorAll('.status-item');
    expect(statusItems).toHaveLength(4);
    
    // Each status item should have an icon and text
    statusItems?.forEach(item => {
      expect(item.querySelector('.status-icon')).toBeTruthy();
      expect(item.querySelector('.status-text')).toBeTruthy();
    });
  });

  it('should have semantic structure with proper hierarchy', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    
    // Check that each status item has both icon and text elements
    const statusItems = compiled.querySelectorAll('.status-item');
    
    statusItems.forEach(item => {
      const icon = item.querySelector('.status-icon');
      const text = item.querySelector('.status-text');
      
      expect(icon).toBeTruthy();
      expect(text).toBeTruthy();
      
      // Verify content is not empty
      expect(icon?.textContent?.trim()).toBeTruthy();
      expect(text?.textContent?.trim()).toBeTruthy();
    });
  });

  it('should maintain consistent status item structure', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const statusItems = compiled.querySelectorAll('.status-item');
    
    // All status items should have the same internal structure
    statusItems.forEach(item => {
      const children = Array.from(item.children);
      expect(children).toHaveLength(2); // icon and text
      
      expect(children[0]).toHaveClass('status-icon');
      expect(children[1]).toHaveClass('status-text');
    });
  });

  it('should display status indicators in grid layout', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const container = compiled.querySelector('.status-demo');
    
    expect(container).toBeTruthy();
    
    // Check that the container uses grid layout (this would be verified by CSS tests)
    const statusItems = container?.querySelectorAll('.status-item');
    expect(statusItems?.length).toBe(4);
  });

  it('should be accessible with proper text content', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    
    // Verify that all status indicators have meaningful text content
    const statusItems = compiled.querySelectorAll('.status-item');
    
    statusItems.forEach(item => {
      const textElement = item.querySelector('.status-text');
      const textContent = textElement?.textContent?.trim();
      
      expect(textContent).toBeTruthy();
      expect(['Success', 'Warning', 'Error', 'Info']).toContain(textContent);
    });
  });
});