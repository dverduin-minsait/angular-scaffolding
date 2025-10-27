import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeStatusComponent } from './theme-status.component';
import { ThemeService } from '../../../../../core/services';

// Mock ThemeService
const mockThemeService = {
  getThemeDisplayName: jest.fn(() => 'Light'),
  getThemeIcon: jest.fn(() => '☀️'),
  isDarkMode: jest.fn(() => false),
};

describe('ThemeStatusComponent', () => {
  let component: ThemeStatusComponent;
  let fixture: ComponentFixture<ThemeStatusComponent>;
  let themeService: jest.Mocked<ThemeService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeStatusComponent],
      providers: [
        { provide: ThemeService, useValue: mockThemeService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeStatusComponent);
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

  it('should display current theme information', () => {
    themeService.getThemeDisplayName.mockReturnValue('Light');
    themeService.getThemeIcon.mockReturnValue('☀️');
    themeService.isDarkMode.mockReturnValue(false);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const statusItems = compiled.querySelectorAll('.status-item');
    
    expect(statusItems).toHaveLength(3);
    
    // Check current theme display
    const themeStatus = statusItems[0];
    expect(themeStatus.querySelector('.label')?.textContent).toContain('Current Theme:');
    expect(themeStatus.querySelector('.value')?.textContent).toContain('Light ☀️');
    
    // Check dark mode status
    const darkModeStatus = statusItems[1];
    expect(darkModeStatus.querySelector('.label')?.textContent).toContain('Dark Mode:');
    expect(darkModeStatus.querySelector('.value')?.textContent).toContain('Disabled');
  });

  it('should display dark mode as enabled when in dark mode', () => {
    themeService.getThemeDisplayName.mockReturnValue('Dark');
    themeService.getThemeIcon.mockReturnValue('🌙');
    themeService.isDarkMode.mockReturnValue(true);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const darkModeStatus = compiled.querySelectorAll('.status-item')[1];
    
    expect(darkModeStatus.querySelector('.value')?.textContent).toContain('Enabled');
  });

  it('should detect system preference correctly', () => {
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const systemPreferenceStatus = compiled.querySelectorAll('.status-item')[2];
    
    expect(systemPreferenceStatus.querySelector('.label')?.textContent).toContain('System Preference:');
    expect(systemPreferenceStatus.querySelector('.value')?.textContent).toContain('Dark');
  });

  it('should handle missing window.matchMedia gracefully', () => {
    // Mock window.matchMedia as undefined
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: undefined,
    });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const systemPreferenceStatus = compiled.querySelectorAll('.status-item')[2];
    
    expect(systemPreferenceStatus.querySelector('.value')?.textContent).toContain('Light');
  });

  it('should apply correct CSS classes', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const container = compiled.querySelector('.theme-status');
    
    expect(container).toBeTruthy();
    expect(container?.querySelectorAll('.status-item')).toHaveLength(3);
    
    const statusItem = container?.querySelector('.status-item');
    expect(statusItem?.querySelector('.label')).toBeTruthy();
    expect(statusItem?.querySelector('.value')).toBeTruthy();
  });
});