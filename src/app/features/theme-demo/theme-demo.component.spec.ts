import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeDemoComponent } from './theme-demo.component';
import { ThemeService } from '../../core/services/theme.service';

// Mock ThemeService
const mockThemeService = {
  getThemeDisplayName: jest.fn(() => 'Light'),
  getThemeIcon: jest.fn(() => '☀️'),
  isDarkMode: jest.fn(() => false),
  currentTheme: jest.fn(() => 'light'),
  useSystemPreference: jest.fn(() => false),
  getThemeConfig: jest.fn(() => ({
    theme: 'light',
    autoSwitch: false,
    useSystemPreference: false
  })),
  setTheme: jest.fn(),
  toggleTheme: jest.fn(),
  setUseSystemPreference: jest.fn(),
  resetToDefaults: jest.fn(),
};

describe('ThemeDemoComponent', () => {
  let component: ThemeDemoComponent;
  let fixture: ComponentFixture<ThemeDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeDemoComponent],
      providers: [
        { provide: ThemeService, useValue: mockThemeService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeDemoComponent);
    component = fixture.componentInstance;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render main heading and description', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const mainHeading = compiled.querySelector('h2');
    const description = compiled.querySelector('p');
    
    expect(mainHeading).toBeTruthy();
    expect(mainHeading?.textContent?.trim()).toBe('🎨 Theme System Demo');
    expect(description?.textContent?.trim()).toContain('This page demonstrates the complete theme system');
  });

  it('should render all demo sections', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const demoSections = compiled.querySelectorAll('.demo-section');
    
    // Should have 7 demo sections (main + 6 sub-sections)
    expect(demoSections).toHaveLength(7);
  });

  it('should render all section headings', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const sectionHeadings = compiled.querySelectorAll('h3');
    
    expect(sectionHeadings).toHaveLength(6);
    expect(sectionHeadings[0].textContent?.trim()).toBe('🎛️ Theme Controls');
    expect(sectionHeadings[1].textContent?.trim()).toBe('🎨 Color Palette');
    expect(sectionHeadings[2].textContent?.trim()).toBe('🧩 Interactive Components');
    expect(sectionHeadings[3].textContent?.trim()).toBe('📊 Status Indicators');
    expect(sectionHeadings[4].textContent?.trim()).toBe('📱 Responsive Design');
    expect(sectionHeadings[5].textContent?.trim()).toBe('🔧 Theme Configuration');
  });

  it('should include theme-status component', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const themeStatus = compiled.querySelector('app-theme-status');
    
    expect(themeStatus).toBeTruthy();
  });

  it('should include theme-controls component', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const themeControls = compiled.querySelector('app-theme-controls');
    
    expect(themeControls).toBeTruthy();
  });

  it('should include color-palette component', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const colorPalette = compiled.querySelector('app-color-palette');
    
    expect(colorPalette).toBeTruthy();
  });

  it('should include interactive-demo component', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const interactiveDemo = compiled.querySelector('app-interactive-demo');
    
    expect(interactiveDemo).toBeTruthy();
  });

  it('should include status-indicators component', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const statusIndicators = compiled.querySelector('app-status-indicators');
    
    expect(statusIndicators).toBeTruthy();
  });

  it('should include responsive-demo component', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const responsiveDemo = compiled.querySelector('app-responsive-demo');
    
    expect(responsiveDemo).toBeTruthy();
  });

  it('should include config-panel component', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const configPanel = compiled.querySelector('app-config-panel');
    
    expect(configPanel).toBeTruthy();
  });

  it('should have theme-demo root container with correct classes', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const rootContainer = compiled.querySelector('.theme-demo');
    
    expect(rootContainer).toBeTruthy();
    expect(rootContainer).toHaveClass('theme-demo');
    expect(rootContainer).toHaveClass('theme-transition');
  });

  it('should organize components in proper section structure', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const demoSections = compiled.querySelectorAll('.demo-section');
    
    // Verify each section has the expected component
    expect(demoSections[0].querySelector('app-theme-status')).toBeTruthy();
    expect(demoSections[1].querySelector('app-theme-controls')).toBeTruthy();
    expect(demoSections[2].querySelector('app-color-palette')).toBeTruthy();
    expect(demoSections[3].querySelector('app-interactive-demo')).toBeTruthy();
    expect(demoSections[4].querySelector('app-status-indicators')).toBeTruthy();
    expect(demoSections[5].querySelector('app-responsive-demo')).toBeTruthy();
    expect(demoSections[6].querySelector('app-config-panel')).toBeTruthy();
  });

  it('should be a presentation component without complex logic', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    
    // Should be purely a composition of other components
    // The component itself doesn't have direct interactive elements at its template level
    // but it includes child components that do have interactive elements
    expect(compiled.querySelectorAll('app-theme-status')).toHaveLength(1);
    expect(compiled.querySelectorAll('app-theme-controls')).toHaveLength(1);
    expect(compiled.querySelectorAll('app-color-palette')).toHaveLength(1);
    expect(compiled.querySelectorAll('app-interactive-demo')).toHaveLength(1);
    expect(compiled.querySelectorAll('app-status-indicators')).toHaveLength(1);
    expect(compiled.querySelectorAll('app-responsive-demo')).toHaveLength(1);
    expect(compiled.querySelectorAll('app-config-panel')).toHaveLength(1);
    
    // Should have the expected structural elements
    expect(compiled.querySelectorAll('.demo-section')).toHaveLength(7);
    expect(compiled.querySelector('.theme-demo')).toBeTruthy();
  });
});