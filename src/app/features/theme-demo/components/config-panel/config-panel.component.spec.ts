import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ConfigPanelComponent } from './config-panel.component';
import { ThemeService, ThemeConfig } from '../../../../core/services/theme.service';

// Mock ThemeService
const mockThemeService = {
  getThemeConfig: jest.fn((): ThemeConfig => ({
    theme: 'light',
    autoSwitch: false,
    useSystemPreference: false
  }))
};

describe('ConfigPanelComponent', () => {
  let component: ConfigPanelComponent;
  let fixture: ComponentFixture<ConfigPanelComponent>;
  let themeService: jest.Mocked<ThemeService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigPanelComponent],
      providers: [
        { provide: ThemeService, useValue: mockThemeService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigPanelComponent);
    component = fixture.componentInstance;
    themeService = TestBed.inject(ThemeService) as jest.Mocked<ThemeService>;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the configuration panel header', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const header = compiled.querySelector('h4');
    
    expect(header).toBeTruthy();
    expect(header?.textContent?.trim()).toBe('Current Configuration');
  });

  it('should display theme configuration as JSON', () => {
    const mockConfig: ThemeConfig = {
      theme: 'dark',
      autoSwitch: true,
      useSystemPreference: true,
      highContrast: false
    };
    
    themeService.getThemeConfig.mockReturnValue(mockConfig);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const preElement = compiled.querySelector('pre');
    
    expect(preElement).toBeTruthy();
    expect(preElement?.textContent).toContain(JSON.stringify(mockConfig, null, 2));
  });

  it('should call themeService.getThemeConfig()', () => {
    fixture.detectChanges();
    
    expect(themeService.getThemeConfig).toHaveBeenCalled();
  });

  it('should update display when theme configuration changes', () => {
    // Test that the component displays the current configuration
    // Since we're using a mock, we'll test with different initial configs
    const config1: ThemeConfig = {
      theme: 'light',
      autoSwitch: false,
      useSystemPreference: false
    };
    themeService.getThemeConfig.mockReturnValue(config1);
    
    // Create a new component instance to pick up the new mock return value
    const fixture1 = TestBed.createComponent(ConfigPanelComponent);
    fixture1.detectChanges();

    let preElement = fixture1.nativeElement.querySelector('pre');
    expect(preElement?.textContent).toContain('"theme": "light"');
    expect(preElement?.textContent).toContain('"autoSwitch": false');

    // Test with a different configuration
    const config2: ThemeConfig = {
      theme: 'dark',
      autoSwitch: true,
      useSystemPreference: true
    };
    themeService.getThemeConfig.mockReturnValue(config2);
    
    const fixture2 = TestBed.createComponent(ConfigPanelComponent);
    fixture2.detectChanges();

    preElement = fixture2.nativeElement.querySelector('pre');
    expect(preElement?.textContent).toContain('"theme": "dark"');
    expect(preElement?.textContent).toContain('"autoSwitch": true');
  });

  it('should format JSON with proper indentation', () => {
    const mockConfig: ThemeConfig = {
      theme: 'light',
      autoSwitch: false,
      useSystemPreference: false,
      customThemes: [
        { name: 'custom', displayName: 'Custom Theme', icon: '🎨', cssClass: 'custom-theme' }
      ]
    };
    
    themeService.getThemeConfig.mockReturnValue(mockConfig);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const preElement = compiled.querySelector('pre');
    const jsonContent = preElement?.textContent || '';
    
    // Check that JSON is properly formatted with 2-space indentation
    expect(jsonContent).toContain('{\n  "theme":');
    expect(jsonContent).toContain('  "customThemes": [\n    {');
  });

  it('should have proper component structure', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const container = compiled.querySelector('.config-panel');
    const configInfo = compiled.querySelector('.config-info');
    
    expect(container).toBeTruthy();
    expect(configInfo).toBeTruthy();
    
    // Check hierarchy
    expect(container?.contains(configInfo as Node)).toBe(true);
    expect(configInfo?.querySelector('h4')).toBeTruthy();
    expect(configInfo?.querySelector('pre')).toBeTruthy();
  });

  it('should apply correct CSS classes', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    
    expect(compiled.querySelector('.config-panel')).toBeTruthy();
    expect(compiled.querySelector('.config-info')).toBeTruthy();
    
    const preElement = compiled.querySelector('pre');
    expect(preElement).toBeTruthy();
  });

  it('should handle empty configuration object', () => {
    const emptyConfig: ThemeConfig = {
      theme: 'light',
      autoSwitch: false,
      useSystemPreference: false
    };
    themeService.getThemeConfig.mockReturnValue(emptyConfig);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const preElement = compiled.querySelector('pre');
    
    expect(preElement?.textContent).toContain('"theme": "light"');
  });

  it('should handle complex configuration objects', () => {
    const complexConfig: ThemeConfig = {
      theme: 'system',
      autoSwitch: true,
      useSystemPreference: true,
      customThemes: [
        {
          name: 'corporate',
          displayName: 'Corporate Theme',
          icon: '🏢',
          cssClass: 'corporate-theme'
        }
      ],
      highContrast: false
    };
    
    themeService.getThemeConfig.mockReturnValue(complexConfig);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const preElement = compiled.querySelector('pre');
    const jsonContent = preElement?.textContent || '';
    
    expect(jsonContent).toContain('"theme": "system"');
    expect(jsonContent).toContain('"customThemes"');
    expect(jsonContent).toContain('"corporate"');
    expect(jsonContent).toContain('"highContrast": false');
  });

  it('should be a purely display component', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    
    // Should not have any interactive elements
    expect(compiled.querySelectorAll('button')).toHaveLength(0);
    expect(compiled.querySelectorAll('input')).toHaveLength(0);
    expect(compiled.querySelectorAll('select')).toHaveLength(0);
    expect(compiled.querySelectorAll('textarea')).toHaveLength(0);
    
    // Should only have display elements
    expect(compiled.querySelector('h4')).toBeTruthy();
    expect(compiled.querySelector('pre')).toBeTruthy();
  });

  it('should maintain consistent display format', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const configInfo = compiled.querySelector('.config-info');
    
    expect(configInfo).toBeTruthy();
    
    // Check that structure is consistent
    const children = Array.from(configInfo?.children || []);
    expect(children).toHaveLength(2);
    expect(children[0].tagName.toLowerCase()).toBe('h4');
    expect(children[1].tagName.toLowerCase()).toBe('pre');
  });
});