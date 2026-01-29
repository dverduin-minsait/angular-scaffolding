import { TestBed } from '@angular/core/testing';
import { ThemeService, Theme, ThemeConfig } from './theme.service';
import { LOCAL_STORAGE } from '../tokens/local.storage.token';
import { DOCUMENT } from '@angular/common';

describe('ThemeService', () => {
  let service: ThemeService;
  let mockStorage: {
    getItem: ReturnType<typeof vi.fn>;
    setItem: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
    key: ReturnType<typeof vi.fn>;
    length: number;
  };
  let mockDocument: any;
  let mockMediaQuery: MediaQueryList & {
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
    dispatchEvent: ReturnType<typeof vi.fn>;
    addListener: ReturnType<typeof vi.fn>;
    removeListener: ReturnType<typeof vi.fn>;
  };
  let mockHtmlElement: any;

  beforeEach(() => {
    // Create mock objects
    mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0
    };

    mockHtmlElement = {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        toggle: vi.fn(),
        contains: vi.fn()
      }
    };

    mockMediaQuery = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      media: '(prefers-color-scheme: dark)',
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      get matches() { return false; }
    } as any;

    mockDocument = {
      defaultView: {
        matchMedia: vi.fn().mockReturnValue(mockMediaQuery)
      },
      documentElement: mockHtmlElement
    };

    // Mock window.matchMedia (the service now uses window.matchMedia directly)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockReturnValue(mockMediaQuery)
    });

    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: LOCAL_STORAGE, useValue: mockStorage },
        { provide: DOCUMENT, useValue: mockDocument },
        { provide: ThemeService.THEME_STORAGE_DEBOUNCE_MS, useValue: 10 } // speed up debounce for tests
      ]
    });

    // Reset mocks
    mockStorage.getItem.mockImplementation((key: string) => {
      // Return appropriate defaults for each storage key
      if (key === 'custom-themes') return '[]';
      return null;
    });
    mockStorage.setItem.mockImplementation(() => {});
  });

  afterEach(() => {
    // Avoid leaving a running interval behind (autoSwitch uses setInterval).
    if (service) {
      service.setAutoSwitch(false);
    }
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should be created', () => {
      service = TestBed.inject(ThemeService);
      expect(service).toBeTruthy();
    });

    it('should initialize with system theme by default', () => {
      service = TestBed.inject(ThemeService);
      expect(service.currentTheme()).toBe('system');
    });

    it('should read saved theme from localStorage', () => {
      mockStorage.getItem.mockImplementation((key: string) => {
        if (key === 'theme') return 'dark';
        if (key === 'custom-themes') return '[]';
        return null;
      });
      service = TestBed.inject(ThemeService);
      
      expect(mockStorage.getItem).toHaveBeenCalledWith('theme');
      expect(service.currentTheme()).toBe('dark');
    });

    it('should handle invalid theme values from localStorage gracefully', () => {
      mockStorage.getItem.mockImplementation((key: string) => {
        if (key === 'theme') return 'invalid-theme';
        if (key === 'custom-themes') return '[]';
        return null;
      });
      service = TestBed.inject(ThemeService);
      
      expect(service.currentTheme()).toBe('system');
    });

    it('should handle localStorage errors gracefully', () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage unavailable');
      });
      
      // Mock console.warn to suppress expected warning
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      expect(() => {
        service = TestBed.inject(ThemeService);
      }).not.toThrow();
      
      expect(service.currentTheme()).toBe('system');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to initialize theme from localStorage:', expect.any(Error));
      
      // Restore console.warn
      consoleSpy.mockRestore();
    });
  });

  describe('Theme Setting', () => {
    beforeEach(() => {
      service = TestBed.inject(ThemeService);
    });

    it('should set light theme', () => {
      service.setTheme('light');
      expect(service.currentTheme()).toBe('light');
    });

    it('should set dark theme', () => {
      service.setTheme('dark');
      expect(service.currentTheme()).toBe('dark');
    });

    it('should set system theme', () => {
      service.setTheme('system');
      expect(service.currentTheme()).toBe('system');
    });

    it('should update isDarkMode when setting light theme', () => {
      service.setTheme('light');
      expect(service.isDarkMode()).toBe(false);
    });

    it('should update isDarkMode when setting dark theme', () => {
      service.setTheme('dark');
      expect(service.isDarkMode()).toBe(true);
    });
  });

  describe('Theme Toggling', () => {
    beforeEach(() => {
      service = TestBed.inject(ThemeService);
    });

    it('should toggle from light to dark', () => {
      service.setTheme('light');
      service.toggleTheme();
      expect(service.currentTheme()).toBe('dark');
    });

    it('should toggle from dark to light', () => {
      service.setTheme('dark');
      service.toggleTheme();
      expect(service.currentTheme()).toBe('light');
    });

    it('should toggle from system to opposite of system preference', () => {
      Object.defineProperty(mockMediaQuery, 'matches', { value: false, configurable: true });
      service.setTheme('system');
      service.toggleTheme();
      expect(service.currentTheme()).toBe('dark'); // Toggle to dark
    });

    it('should toggle from system to light when system prefers dark', () => {
      Object.defineProperty(mockMediaQuery, 'matches', { value: true, configurable: true });
      service.setTheme('system');
      service.toggleTheme();
      expect(service.currentTheme()).toBe('light'); // Toggle to light
    });
  });

  describe('System Preference', () => {
    beforeEach(() => {
      service = TestBed.inject(ThemeService);
    });

    it('should respect system preference when enabled', () => {
      Object.defineProperty(mockMediaQuery, 'matches', { value: true, configurable: true });
      service.setTheme('system');
      service.setUseSystemPreference(true);
      expect(service.isDarkMode()).toBe(true);
    });

    it('should ignore system preference when disabled', () => {
      Object.defineProperty(mockMediaQuery, 'matches', { value: true, configurable: true });
      service.setTheme('light');
      service.setUseSystemPreference(false);
      expect(service.isDarkMode()).toBe(false);
    });

    it('should update when system preference changes', () => {
      const changeHandler = mockMediaQuery.addEventListener.mock.calls[0]?.[1];
      service.setTheme('system');
      
      // Simulate system preference change
      Object.defineProperty(mockMediaQuery, 'matches', { value: true, configurable: true });
      if (changeHandler && typeof changeHandler === 'function') {
        changeHandler({} as MediaQueryListEvent);
      }
      
      expect(service.isDarkMode()).toBe(true);
    });
  });

  describe('DOM Manipulation', () => {
    beforeEach(() => {
      service = TestBed.inject(ThemeService);
    });

    it('should toggle dark-theme class when dark mode is enabled', async () => {
      service.setTheme('dark');
      // Wait for effects to run
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(mockHtmlElement.classList.add).toHaveBeenCalledWith('dark-theme');
      expect(mockHtmlElement.classList.remove).toHaveBeenCalledWith('dark-theme', 'light-theme', 'dark-theme2', 'light-theme2', 'high-contrast');
    });

    it('should toggle light-theme class when light mode is enabled', async () => {
      service.setTheme('light');
      // Wait for effects to run
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(mockHtmlElement.classList.add).toHaveBeenCalledWith('light-theme');
      expect(mockHtmlElement.classList.remove).toHaveBeenCalledWith('dark-theme', 'light-theme', 'dark-theme2', 'light-theme2', 'high-contrast');
    });
  });

  describe('LocalStorage Persistence', () => {
    beforeEach(() => {
      service = TestBed.inject(ThemeService);
    });

    it('should save theme to localStorage', async () => {
      service.setTheme('dark');
      // Wait for effects and debounce timeout to run
      await new Promise(resolve => setTimeout(resolve, 350));
      expect(mockStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('should save auto-switch setting to localStorage', async () => {
      service.setAutoSwitch(true);
      // Wait for effects and debounce timeout to run
      await new Promise(resolve => setTimeout(resolve, 350));
      expect(mockStorage.setItem).toHaveBeenCalledWith('theme-auto-switch', 'true');
    });

    it('should save use-system-preference setting to localStorage', async () => {
      service.setUseSystemPreference(false);
      // Wait for effects and debounce timeout to run
      await new Promise(resolve => setTimeout(resolve, 350));
      expect(mockStorage.setItem).toHaveBeenCalledWith('theme-use-system', 'false');
    });

    it('should handle localStorage errors gracefully', () => {
      mockStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });
      
      expect(() => {
        service.setTheme('dark');
      }).not.toThrow();
    });
  });

  describe('Theme Configuration', () => {
    beforeEach(() => {
      service = TestBed.inject(ThemeService);
    });

    it('should return current theme configuration', () => {
      service.setTheme('dark');
      service.setAutoSwitch(true);
      service.setUseSystemPreference(false);

      const config = service.getThemeConfig();
      expect(config).toEqual({
        theme: 'dark',
        autoSwitch: true,
        useSystemPreference: false,
        customThemes: [],
        highContrast: false
      });
    });

    it('should apply theme configuration', () => {
      const config: Partial<ThemeConfig> = {
        theme: 'light',
        autoSwitch: false,
        useSystemPreference: true
      };

      service.applyThemeConfig(config);

      expect(service.currentTheme()).toBe('light');
      expect(service.autoSwitch()).toBe(false);
      expect(service.useSystemPreference()).toBe(true);
    });

    it('should reset to defaults', () => {
      service.setTheme('dark');
      service.setAutoSwitch(true);
      service.setUseSystemPreference(false);

      service.resetToDefaults();

      expect(service.currentTheme()).toBe('system');
      expect(service.autoSwitch()).toBe(false);
      expect(service.useSystemPreference()).toBe(true);
    });
  });

  describe('Auto Switch', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      service = TestBed.inject(ThemeService);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should enable auto-switch', () => {
      service.setAutoSwitch(true);
      expect(service.autoSwitch()).toBe(true);
    });

    it('should disable auto-switch', () => {
      service.setAutoSwitch(false);
      expect(service.autoSwitch()).toBe(false);
    });
  });

  describe('Utility Methods', () => {
    beforeEach(() => {
      service = TestBed.inject(ThemeService);
    });

    it('should return correct display names', () => {
      expect(service.getThemeDisplayName('light')).toBe('Light');
      expect(service.getThemeDisplayName('dark')).toBe('Dark');
      expect(service.getThemeDisplayName('system')).toBe('System');
    });

    it('should return correct theme icons', () => {
      expect(service.getThemeIcon('light')).toBe('☀️');
      expect(service.getThemeIcon('dark')).toBe('🌙');
      expect(service.getThemeIcon('system')).toBe('🖥️');
    });

    it('should use current theme when no parameter provided', () => {
      service.setTheme('dark');
      expect(service.getThemeDisplayName()).toBe('Dark');
      expect(service.getThemeIcon()).toBe('🌙');
    });
  });

  describe('Variant & Pair Toggling', () => {
    beforeEach(() => {
      service = TestBed.inject(ThemeService);
    });

    it('should toggle light2 -> dark2 and dark2 -> light2', () => {
      service.setTheme('light2');
      service.toggleTheme();
      expect(service.currentTheme()).toBe('dark2');
      service.toggleTheme();
      expect(service.currentTheme()).toBe('light2');
    });

    it('should toggle custom theme to light (fallback branch)', () => {
      // Register a custom theme that does not include dark keyword
      const custom = { name: 'ocean', displayName: 'Ocean', icon: '🌊', cssClass: 'ocean-theme' };
      service.registerCustomTheme(custom);
      service.setTheme('ocean' as Theme);
      service.toggleTheme();
      expect(service.currentTheme()).toBe('light');
    });

    it('should toggle theme pair across all built-ins', () => {
      service.setTheme('light');
      service.toggleThemePair();
      expect(service.currentTheme()).toBe('light2');
      service.toggleThemePair(); // light2 -> light
      expect(service.currentTheme()).toBe('light');
      service.setTheme('dark');
      service.toggleThemePair();
      expect(service.currentTheme()).toBe('dark2');
      service.toggleThemePair();
      expect(service.currentTheme()).toBe('dark');
    });

    it('should toggle theme pair for system respecting media query (dark preferred)', () => {
      Object.defineProperty(mockMediaQuery, 'matches', { value: true, configurable: true });
      service.setTheme('system');
      service.toggleThemePair();
      expect(service.currentTheme()).toBe('dark2');
    });

    it('should toggle theme pair for system when light preferred', () => {
      Object.defineProperty(mockMediaQuery, 'matches', { value: false, configurable: true });
      service.setTheme('system');
      service.toggleThemePair();
      expect(service.currentTheme()).toBe('light2');
    });

    it('should toggle theme pair for custom theme to light2', () => {
      const custom = { name: 'forest', displayName: 'Forest', icon: '🌳', cssClass: 'forest-theme' };
      service.registerCustomTheme(custom);
      service.setTheme('forest' as Theme);
      service.toggleThemePair();
      expect(service.currentTheme()).toBe('light2');
    });

    it('should compute theme pair correctly', () => {
      service.setTheme('light');
      expect(service.getCurrentThemePair()).toBe(1);
      service.setTheme('dark2');
      expect(service.getCurrentThemePair()).toBe(2);
    });
  });

  describe('High Contrast & Custom Themes', () => {
    beforeEach(() => {
      service = TestBed.inject(ThemeService);
    });

    it('should set and toggle high contrast', () => {
      expect(service.highContrast()).toBe(false);
      service.setHighContrast(true);
      expect(service.highContrast()).toBe(true);
      service.toggleHighContrast();
      expect(service.highContrast()).toBe(false);
    });

    it('should register, update, and list custom theme and detect dark mode naming', () => {
      const darkCustom = { name: 'dark-ocean', displayName: 'Dark Ocean', icon: '🌊', cssClass: 'dark-ocean-theme' };
      service.registerCustomTheme(darkCustom);
      service.setTheme('dark-ocean' as Theme);
      expect(service.isDarkMode()).toBe(true); // name includes dark
      // Update existing
      const updated = { ...darkCustom, displayName: 'Deep Dark Ocean' };
      service.registerCustomTheme(updated);
      const all = service.getAllThemes();
      const found = all.find(t => (t as any).name === 'dark-ocean');
      expect(found?.displayName).toBe('Deep Dark Ocean');
    });

    it('should unregister custom theme and fallback to system when removing current theme', () => {
      const theme = { name: 'sunset', displayName: 'Sunset', icon: '🌇', cssClass: 'sunset-theme' };
      service.registerCustomTheme(theme);
      service.setTheme('sunset' as Theme);
      service.unregisterCustomTheme('sunset');
      expect(service.currentTheme()).toBe('system');
      const all = service.getAllThemes();
      expect(all.find(t => (t as any).name === 'sunset')).toBeUndefined();
    });

    it('should apply config with customThemes and highContrast', async () => {
      const customList = [{ name: 'cool', displayName: 'Cool', icon: '🧊', cssClass: 'cool-theme' }];
      service.applyThemeConfig({ customThemes: customList, highContrast: true });
      expect(service.highContrast()).toBe(true);
      expect(service.getAllThemes().some(t => (t as any).name === 'cool')).toBe(true);
      // debounce write
      await new Promise(r => setTimeout(r, 350));
      expect(mockStorage.setItem).toHaveBeenCalledWith('theme-high-contrast', 'true');
    });
  });

  describe('Auto Switch Time-Based Logic', () => {
    beforeEach(() => {
      vi.useFakeTimers({ now: new Date('2025-09-30T10:00:00Z').getTime() }); // 10 AM UTC
      service = TestBed.inject(ThemeService);
      service.setUseSystemPreference(false); // allow override
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('should set light theme during day when autoSwitch enabled', () => {
      service.setTheme('dark'); // start dark
      service.setAutoSwitch(true); // immediate update should run
      expect(['light', 'light2', 'system']).toContain(service.currentTheme());
    });

    it('should set dark theme at night when autoSwitch enabled', () => {
      vi.setSystemTime(new Date('2025-09-30T23:00:00Z'));
      service.setTheme('light');
      service.setAutoSwitch(true);
      expect(['dark', 'dark2', 'system']).toContain(service.currentTheme());
    });
  });
});