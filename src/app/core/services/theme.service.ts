import { Injectable, inject, signal, effect, InjectionToken } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { LOCAL_STORAGE } from '../tokens/local.storage.token';
import { ThemeUtils } from '../utils/theme.utils';

export type Theme = 'light' | 'dark' | 'light2' | 'dark2' | 'system' | string;

export interface CustomTheme {
  name: string;
  displayName: string;
  icon: string;
  cssClass: string;
}

export interface ThemeConfig {
  theme: Theme;
  autoSwitch: boolean;
  useSystemPreference: boolean;
  customThemes?: CustomTheme[];
  highContrast?: boolean;
}

// Storage constants
const STORAGE_KEYS = {
  THEME: 'theme',
  AUTO_SWITCH: 'theme-auto-switch',
  USE_SYSTEM: 'theme-use-system',
  CUSTOM_THEMES: 'theme-custom-themes',
  HIGH_CONTRAST: 'theme-high-contrast'
} as const;

// Time constants for auto-switch
const AUTO_SWITCH_CONFIG = {
  DAY_START_HOUR: 6,
  DAY_END_HOUR: 18,
  CHECK_INTERVAL_MS: 60 * 60 * 1000 // 1 hour
} as const;

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storage = inject(LOCAL_STORAGE);
  
  // Theme state signals
  private _currentTheme = signal<Theme>('system');
  private _isDarkMode = signal<boolean>(false);
  private _autoSwitch = signal<boolean>(false);
  private _useSystemPreference = signal<boolean>(true);
  private _customThemes = signal<CustomTheme[]>([]);
  private _highContrast = signal<boolean>(false);
  
  // Public readonly signals
  readonly currentTheme = this._currentTheme.asReadonly();
  readonly isDarkMode = this._isDarkMode.asReadonly();
  readonly autoSwitch = this._autoSwitch.asReadonly();
  readonly useSystemPreference = this._useSystemPreference.asReadonly();
  readonly customThemes = this._customThemes.asReadonly();
  readonly highContrast = this._highContrast.asReadonly();
  
  // Media query for system preference - initialized lazily for SSR safety
  private _mediaQuery: MediaQueryList | null = null;
  
  // Auto-switch interval tracking
  private _autoSwitchInterval: number | null = null;
  
  // Debounced storage write
  private _storageWriteTimeout: number | null = null;
  // Allow debounce to be overridden in tests
  private static readonly DEFAULT_STORAGE_DEBOUNCE = 300;
  public static readonly THEME_STORAGE_DEBOUNCE_MS = new InjectionToken<number>('THEME_STORAGE_DEBOUNCE_MS', {
    factory: () => ThemeService.DEFAULT_STORAGE_DEBOUNCE
  });
  private readonly STORAGE_WRITE_DEBOUNCE_MS = inject(ThemeService.THEME_STORAGE_DEBOUNCE_MS);
  
  private get mediaQuery(): MediaQueryList | null {
    if (this._mediaQuery === null && this.document.defaultView && typeof this.document.defaultView.matchMedia === 'function') {
      this._mediaQuery = this.document.defaultView.matchMedia('(prefers-color-scheme: dark)');
    }
    return this._mediaQuery;
  }
  
  constructor() {
    this.initializeTheme();
    this.setupSystemPreferenceListener();
    this.setupHighContrastListener();
    this.setupThemeEffect();
  }
  
  /**
   * Initialize theme from localStorage or system preference
   */
  private initializeTheme(): void {
    try {
      if (!this.storage) {
        // SSR environment, use defaults
        this._currentTheme.set('system');
        this.updateDarkModeState();
        return;
      }

      const savedTheme = this.storage.getItem(STORAGE_KEYS.THEME) as Theme;
      const savedAutoSwitch = this.storage.getItem(STORAGE_KEYS.AUTO_SWITCH) === 'true';
      const savedUseSystem = this.storage.getItem(STORAGE_KEYS.USE_SYSTEM) !== 'false'; // Default to true
      const savedCustomThemes = this.loadCustomThemes();
      const savedHighContrast = this.storage.getItem(STORAGE_KEYS.HIGH_CONTRAST) === 'true';
      
      this._autoSwitch.set(savedAutoSwitch);
      this._useSystemPreference.set(savedUseSystem);
      this._customThemes.set(savedCustomThemes);
      this._highContrast.set(savedHighContrast);
      
      if (savedTheme && this.isValidTheme(savedTheme)) {
        this._currentTheme.set(savedTheme);
      } else {
        this._currentTheme.set('system');
      }
      
      this.updateDarkModeState();
    } catch (error) {
      console.warn('Failed to initialize theme from localStorage:', error);
      this._currentTheme.set('system');
      this.updateDarkModeState();
    }
  }
  
  /**
   * Setup listener for system color scheme changes
   */
  private setupSystemPreferenceListener(): void {
    if (this.mediaQuery) {
      this.mediaQuery.addEventListener('change', () => {
        if (this._currentTheme() === 'system') {
          this.updateDarkModeState();
        }
      });
    }
  }
  
  /**
   * Setup listener for system high contrast preference changes
   */
  private setupHighContrastListener(): void {
    // Check if browser supports high contrast media queries
    if (this.document.defaultView && typeof this.document.defaultView.matchMedia === 'function') {
      const highContrastQuery = this.document.defaultView.matchMedia('(prefers-contrast: high)');
      if (highContrastQuery) {
        // Set initial high contrast state if not explicitly set
        try {
          if (this.storage?.getItem(STORAGE_KEYS.HIGH_CONTRAST) === null) {
            this._highContrast.set(highContrastQuery.matches);
          }
        } catch (error) {
          // Ignore storage errors and use default
        }
        
        highContrastQuery.addEventListener('change', (e) => {
          // Only auto-update if user hasn't explicitly set preference
          try {
            if (this.storage?.getItem(STORAGE_KEYS.HIGH_CONTRAST) === null) {
              this._highContrast.set(e.matches);
            }
          } catch (error) {
            // Ignore storage errors
          }
        });
      }
    }
  }
  
  /**
   * Setup effect to apply theme changes to DOM
   */
  private setupThemeEffect(): void {
    effect(() => {
      const isDark = this._isDarkMode();
      const currentTheme = this._currentTheme();
      const isHighContrast = this._highContrast();
      const htmlElement = this.document.documentElement;
      
      // Remove all theme classes
      htmlElement.classList.remove('dark-theme', 'light-theme', 'dark-theme2', 'light-theme2', 'high-contrast');
      this._customThemes().forEach(theme => {
        htmlElement.classList.remove(theme.cssClass);
      });
      
      // Apply current theme classes
      if (currentTheme === 'light') {
        htmlElement.classList.add('light-theme');
      } else if (currentTheme === 'dark') {
        htmlElement.classList.add('dark-theme');
      } else if (currentTheme === 'light2') {
        htmlElement.classList.add('light-theme2');
      } else if (currentTheme === 'dark2') {
        htmlElement.classList.add('dark-theme2');
      } else if (currentTheme === 'system') {
        htmlElement.classList.toggle('dark-theme', isDark);
        htmlElement.classList.toggle('light-theme', !isDark);
      } else {
        // Custom theme
        const customTheme = this._customThemes().find(t => t.name === currentTheme);
        if (customTheme) {
          htmlElement.classList.add(customTheme.cssClass);
        }
      }
      
      // Apply high contrast class
      htmlElement.classList.toggle('high-contrast', isHighContrast);
      
      // Debounce localStorage writes to improve performance
      this.debouncedStorageWrite();
    });
  }
  
  /**
   * Debounced localStorage write to prevent excessive writes
   */
  private debouncedStorageWrite(): void {
    // Clear existing timeout
    if (this._storageWriteTimeout !== null) {
      clearTimeout(this._storageWriteTimeout);
    }
    
    // Schedule new write
    this._storageWriteTimeout = setTimeout(() => {
      try {
        if (this.storage) {
          this.storage.setItem(STORAGE_KEYS.THEME, this._currentTheme());
          this.storage.setItem(STORAGE_KEYS.AUTO_SWITCH, this._autoSwitch().toString());
          this.storage.setItem(STORAGE_KEYS.USE_SYSTEM, this._useSystemPreference().toString());
          this.storage.setItem(STORAGE_KEYS.HIGH_CONTRAST, this._highContrast().toString());
        }
      } catch (error) {
        console.warn('Failed to save theme to localStorage:', error);
      }
      this._storageWriteTimeout = null;
    }, this.STORAGE_WRITE_DEBOUNCE_MS) as any;
  }
  
  /**
   * Update dark mode state based on current theme and system preference
   */
  private updateDarkModeState(): void {
    const currentTheme = this._currentTheme();
    
    if (currentTheme === 'system') {
      const systemPrefersDark = this.mediaQuery?.matches ?? false;
      this._isDarkMode.set(systemPrefersDark);
    } else if (currentTheme === 'dark' || currentTheme === 'dark2') {
      this._isDarkMode.set(true);
    } else if (currentTheme === 'light' || currentTheme === 'light2') {
      this._isDarkMode.set(false);
    } else {
      // Custom theme - check if it's a dark theme variant
      const customTheme = this._customThemes().find(t => t.name === currentTheme);
      if (customTheme) {
        // For now, assume custom themes follow naming convention (dark-*, etc.)
        this._isDarkMode.set(customTheme.name.includes('dark'));
      } else {
        this._isDarkMode.set(false);
      }
    }
  }
  
  /**
   * Validate if a theme is valid (built-in or registered custom theme)
   */
  private isValidTheme(theme: Theme): boolean {
    const builtInThemes = ['light', 'dark', 'light2', 'dark2', 'system'];
    if (builtInThemes.includes(theme)) {
      return true;
    }
    // Check if it's a registered custom theme
    return this._customThemes().some(t => t.name === theme);
  }
  
  /**
   * Load custom themes from localStorage
   */
  private loadCustomThemes(): CustomTheme[] {
    try {
      const stored = this.storage?.getItem(STORAGE_KEYS.CUSTOM_THEMES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load custom themes from localStorage:', error);
    }
    return [];
  }
  
  /**
   * Save custom themes to localStorage
   */
  private saveCustomThemes(): void {
    try {
      if (this.storage) {
        this.storage.setItem(STORAGE_KEYS.CUSTOM_THEMES, JSON.stringify(this._customThemes()));
      }
    } catch (error) {
      console.warn('Failed to save custom themes to localStorage:', error);
    }
  }
  
  /**
   * Set theme explicitly
   */
  setTheme(theme: Theme): void {
    this._currentTheme.set(theme);
    this.updateDarkModeState();
  }
  
  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void {
    const current = this._currentTheme();
    
    if (current === 'system') {
      // If currently system, toggle to opposite of system preference
      const systemPrefersDark = this.mediaQuery?.matches ?? false;
      this.setTheme(systemPrefersDark ? 'light' : 'dark');
    } else if (current === 'light') {
      this.setTheme('dark');
    } else if (current === 'dark') {
      this.setTheme('light');
    } else if (current === 'light2') {
      this.setTheme('dark2');
    } else if (current === 'dark2') {
      this.setTheme('light2');
    } else {
      // For custom themes, fall back to standard toggle
      this.setTheme(current === 'light' ? 'dark' : 'light');
    }
  }

  /**
   * Toggle between theme pairs (1 and 2)
   */
  toggleThemePair(): void {
    const current = this._currentTheme();
    
    switch (current) {
      case 'light':
        this.setTheme('light2');
        break;
      case 'dark':
        this.setTheme('dark2');
        break;
      case 'light2':
        this.setTheme('light');
        break;
      case 'dark2':
        this.setTheme('dark');
        break;
      case 'system':
        // For system, toggle to the warm variant
        const systemPrefersDark = this.mediaQuery?.matches ?? false;
        this.setTheme(systemPrefersDark ? 'dark2' : 'light2');
        break;
      default:
        // For custom themes, default to light2
        this.setTheme('light2');
        break;
    }
  }

  /**
   * Get the current theme pair (1 or 2)
   */
  getCurrentThemePair(): 1 | 2 {
    const current = this._currentTheme();
    return (current === 'light2' || current === 'dark2') ? 2 : 1;
  }
  
  /**
   * Enable/disable auto-switching based on time
   */
  setAutoSwitch(enabled: boolean): void {
    // Clear existing interval if any
    if (this._autoSwitchInterval !== null) {
      clearInterval(this._autoSwitchInterval);
      this._autoSwitchInterval = null;
    }
    
    this._autoSwitch.set(enabled);
    
    if (enabled) {
      this.setupAutoSwitch();
    }
  }
  
  /**
   * Enable/disable using system preference
   */
  setUseSystemPreference(enabled: boolean): void {
    this._useSystemPreference.set(enabled);
    this.updateDarkModeState();
  }
  
  /**
   * Enable/disable high contrast mode
   */
  setHighContrast(enabled: boolean): void {
    this._highContrast.set(enabled);
  }
  
  /**
   * Toggle high contrast mode
   */
  toggleHighContrast(): void {
    this.setHighContrast(!this._highContrast());
  }
  
  /**
   * Setup automatic theme switching based on time of day
   */
  private setupAutoSwitch(): void {
    if (!this._autoSwitch()) return;
    
    // Clear any existing interval
    if (this._autoSwitchInterval !== null) {
      clearInterval(this._autoSwitchInterval);
    }
    
    const updateThemeByTime = () => {
      const hour = new Date().getHours();
      const isDayTime = hour >= AUTO_SWITCH_CONFIG.DAY_START_HOUR && hour < AUTO_SWITCH_CONFIG.DAY_END_HOUR;
      
      if (this._useSystemPreference()) {
        // Don't override system preference if enabled
        return;
      }
      
      const newTheme: Theme = isDayTime ? 'light' : 'dark';
      if (newTheme !== this._currentTheme()) {
        this.setTheme(newTheme);
      }
    };
    
    // Update immediately
    updateThemeByTime();
    
    // Update every hour and store the interval ID
    this._autoSwitchInterval = setInterval(updateThemeByTime, AUTO_SWITCH_CONFIG.CHECK_INTERVAL_MS) as any;
  }
  
  /**
   * Get current theme configuration
   */
  getThemeConfig(): ThemeConfig {
    return {
      theme: this._currentTheme(),
      autoSwitch: this._autoSwitch(),
      useSystemPreference: this._useSystemPreference(),
      customThemes: this._customThemes(),
      highContrast: this._highContrast()
    };
  }
  
  /**
   * Apply theme configuration
   */
  applyThemeConfig(config: Partial<ThemeConfig>): void {
    if (config.theme) {
      this.setTheme(config.theme);
    }
    
    if (config.autoSwitch !== undefined) {
      this.setAutoSwitch(config.autoSwitch);
    }
    
    if (config.useSystemPreference !== undefined) {
      this.setUseSystemPreference(config.useSystemPreference);
    }
    
    if (config.customThemes !== undefined) {
      this._customThemes.set(config.customThemes);
      this.saveCustomThemes();
    }
    
    if (config.highContrast !== undefined) {
      this.setHighContrast(config.highContrast);
    }
  }
  
  /**
   * Reset theme to system default
   */
  resetToDefaults(): void {
    this.applyThemeConfig({
      theme: 'system',
      autoSwitch: false,
      useSystemPreference: true,
      customThemes: [],
      highContrast: false
    });
  }
  
  /**
   * Get theme display name
   */
  getThemeDisplayName(theme?: Theme): string {
    const t = theme || this._currentTheme();
    
    // Check if it's a custom theme first
    const customTheme = this._customThemes().find(ct => ct.name === t);
    if (customTheme) {
      return customTheme.displayName;
    }
    
    return ThemeUtils.getThemeDisplayName(t);
  }
  
  /**
   * Get current theme icon
   */
  getThemeIcon(theme?: Theme): string {
    const t = theme || this._currentTheme();
    
    // Check if it's a custom theme first
    const customTheme = this._customThemes().find(ct => ct.name === t);
    if (customTheme) {
      return customTheme.icon;
    }
    
    return ThemeUtils.getThemeIcon(t);
  }
  
  /**
   * Register a new custom theme
   */
  registerCustomTheme(theme: CustomTheme): void {
    const themes = this._customThemes();
    const existingIndex = themes.findIndex(t => t.name === theme.name);
    
    if (existingIndex >= 0) {
      // Update existing theme
      themes[existingIndex] = theme;
    } else {
      // Add new theme
      themes.push(theme);
    }
    
    this._customThemes.set([...themes]);
    this.saveCustomThemes();
  }
  
  /**
   * Unregister a custom theme
   */
  unregisterCustomTheme(themeName: string): void {
    const themes = this._customThemes();
    const filteredThemes = themes.filter(t => t.name !== themeName);
    
    // If the current theme is being removed, switch to system
    if (this._currentTheme() === themeName) {
      this.setTheme('system');
    }
    
    this._customThemes.set(filteredThemes);
    this.saveCustomThemes();
  }
  
  /**
   * Get all available themes (built-in + custom)
   */
  getAllThemes(): Array<{name: Theme, displayName: string, icon: string, isCustom: boolean}> {
    const builtInThemes = [
      { name: 'light' as Theme, displayName: 'Light', icon: '☀️', isCustom: false },
      { name: 'dark' as Theme, displayName: 'Dark', icon: '🌙', isCustom: false },
      { name: 'light2' as Theme, displayName: 'Light (Warm)', icon: '🌅', isCustom: false },
      { name: 'dark2' as Theme, displayName: 'Dark (Warm)', icon: '🌆', isCustom: false },
      { name: 'system' as Theme, displayName: 'System', icon: '🖥️', isCustom: false }
    ];
    
    const customThemeList = this._customThemes().map(t => ({
      name: t.name as Theme,
      displayName: t.displayName,
      icon: t.icon,
      isCustom: true
    }));
    
    return [...builtInThemes, ...customThemeList];
  }
}