import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ThemeControlsComponent } from './theme-controls.component';
import { ThemeService, Theme } from '../../../../core/services/theme.service';

// Mock ThemeService
const mockThemeService = {
  currentTheme: jest.fn(() => 'light' as Theme),
  isDarkMode: jest.fn(() => false),
  useSystemPreference: jest.fn(() => false),
  setTheme: jest.fn(),
  toggleTheme: jest.fn(),
  setUseSystemPreference: jest.fn(),
  resetToDefaults: jest.fn(),
  getCurrentThemePair: jest.fn(() => 1),
  toggleThemePair: jest.fn(),
};

describe('ThemeControlsComponent', () => {
  let component: ThemeControlsComponent;
  let fixture: ComponentFixture<ThemeControlsComponent>;
  let themeService: jest.Mocked<ThemeService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeControlsComponent, FormsModule],
      providers: [
        { provide: ThemeService, useValue: mockThemeService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeControlsComponent);
    component = fixture.componentInstance;
    themeService = TestBed.inject(ThemeService) as jest.Mocked<ThemeService>;
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display theme selection buttons', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const themeButtons = compiled.querySelectorAll('.theme-btn');
    
    expect(themeButtons).toHaveLength(5);
    expect(themeButtons[0].textContent?.trim()).toContain('Light');
    expect(themeButtons[1].textContent?.trim()).toContain('Dark');
    expect(themeButtons[2].textContent?.trim()).toContain('Light (Warm)');
    expect(themeButtons[3].textContent?.trim()).toContain('Dark (Warm)');
    expect(themeButtons[4].textContent?.trim()).toContain('System');
  });

  it('should mark active theme button correctly', () => {
    themeService.currentTheme.mockReturnValue('dark');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const themeButtons = compiled.querySelectorAll('.theme-btn');
    
    expect(themeButtons[0]).not.toHaveClass('active'); // Light
    expect(themeButtons[1]).toHaveClass('active'); // Dark
    expect(themeButtons[2]).not.toHaveClass('active'); // System
  });

  it('should call setTheme when theme button is clicked', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const lightButton = compiled.querySelector('.theme-btn') as HTMLButtonElement;
    
    lightButton.click();
    
    expect(themeService.setTheme).toHaveBeenCalledWith('light');
  });

  it('should display correct toggle button text for light mode', () => {
    themeService.isDarkMode.mockReturnValue(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const toggleButton = compiled.querySelector('.toggle-button') as HTMLButtonElement;
    
    expect(toggleButton.textContent?.trim()).toContain('🌙 Switch to Dark');
  });

  it('should display correct toggle button text for dark mode', () => {
    themeService.isDarkMode.mockReturnValue(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const toggleButton = compiled.querySelector('.toggle-button') as HTMLButtonElement;
    
    expect(toggleButton.textContent?.trim()).toContain('☀️ Switch to Light');
  });

  it('should call toggleTheme when toggle button is clicked', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const toggleButton = compiled.querySelector('.toggle-button') as HTMLButtonElement;
    
    toggleButton.click();
    
    expect(themeService.toggleTheme).toHaveBeenCalled();
  });

  it('should reflect system preference checkbox state', () => {
    themeService.useSystemPreference.mockReturnValue(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const checkbox = compiled.querySelector('input[type="checkbox"]') as HTMLInputElement;
    
    expect(checkbox.checked).toBe(true);
  });

  it('should call toggleSystemPreference when checkbox is changed', () => {
    themeService.useSystemPreference.mockReturnValue(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const checkbox = compiled.querySelector('input[type="checkbox"]') as HTMLInputElement;
    
    checkbox.click();
    
    expect(themeService.setUseSystemPreference).toHaveBeenCalledWith(true);
  });

  it('should call resetToDefaults when reset button is clicked', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const resetButton = compiled.querySelector('button[aria-label*="Reset theme settings"]') as HTMLButtonElement;
    
    resetButton.click();
    
    expect(themeService.resetToDefaults).toHaveBeenCalled();
  });

  it('should have proper control group structure', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const controlGroups = compiled.querySelectorAll('.control-group');
    
    expect(controlGroups).toHaveLength(4);
    
    // Check that control groups have proper labeling (legend for fieldset, label for others)
    const legends = compiled.querySelectorAll('.control-group fieldset legend');
    const labels = compiled.querySelectorAll('.control-group > label');
    expect(legends.length + labels.length).toBeGreaterThanOrEqual(2); // At least theme selection legend and quick toggle label
  });

  it('should apply correct CSS classes', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const container = compiled.querySelector('.theme-controls');
    
    expect(container).toBeTruthy();
    expect(container?.querySelector('.theme-buttons')).toBeTruthy();
    expect(container?.querySelector('.checkbox-group')).toBeTruthy();
  });
});