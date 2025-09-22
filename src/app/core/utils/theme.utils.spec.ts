import { ThemeUtils } from './theme.utils';
import { Theme } from '../services/theme.service';

describe('ThemeUtils', () => {
  describe('getThemeDisplayName', () => {
    it('should return "Light" for light theme', () => {
      const result = ThemeUtils.getThemeDisplayName('light');
      expect(result).toBe('Light');
    });

    it('should return "Dark" for dark theme', () => {
      const result = ThemeUtils.getThemeDisplayName('dark');
      expect(result).toBe('Dark');
    });

    it('should return "System" for system theme', () => {
      const result = ThemeUtils.getThemeDisplayName('system');
      expect(result).toBe('System');
    });

    it('should return the theme name itself for custom themes', () => {
      const customTheme = 'custom-blue' as Theme;
      const result = ThemeUtils.getThemeDisplayName(customTheme);
      expect(result).toBe('custom-blue');
    });

    it('should handle empty string', () => {
      const emptyTheme = '' as Theme;
      const result = ThemeUtils.getThemeDisplayName(emptyTheme);
      expect(result).toBe('');
    });

    it('should handle undefined theme gracefully', () => {
      const undefinedTheme = undefined as any;
      const result = ThemeUtils.getThemeDisplayName(undefinedTheme);
      expect(result).toBe(undefined);
    });
  });

  describe('getThemeIcon', () => {
    it('should return sun icon for light theme', () => {
      const result = ThemeUtils.getThemeIcon('light');
      expect(result).toBe('☀️');
    });

    it('should return moon icon for dark theme', () => {
      const result = ThemeUtils.getThemeIcon('dark');
      expect(result).toBe('🌙');
    });

    it('should return computer icon for system theme', () => {
      const result = ThemeUtils.getThemeIcon('system');
      expect(result).toBe('🖥️');
    });

    it('should return default icon for custom themes', () => {
      const customTheme = 'custom-theme' as Theme;
      const result = ThemeUtils.getThemeIcon(customTheme);
      expect(result).toBe('🎨');
    });

    it('should return default icon for unknown themes', () => {
      const unknownTheme = 'unknown-theme' as Theme;
      const result = ThemeUtils.getThemeIcon(unknownTheme);
      expect(result).toBe('🎨');
    });

    it('should handle empty string', () => {
      const emptyTheme = '' as Theme;
      const result = ThemeUtils.getThemeIcon(emptyTheme);
      expect(result).toBe('🎨');
    });

    it('should handle undefined theme gracefully', () => {
      const undefinedTheme = undefined as any;
      const result = ThemeUtils.getThemeIcon(undefinedTheme);
      expect(result).toBe('🎨');
    });
  });

  describe('static class behavior', () => {
    it('should be a static class with static methods only', () => {
      // Verify methods are static by checking they exist on the class
      expect(typeof ThemeUtils.getThemeDisplayName).toBe('function');
      expect(typeof ThemeUtils.getThemeIcon).toBe('function');
      
      // Verify we can call methods without instantiation
      expect(() => ThemeUtils.getThemeDisplayName('light')).not.toThrow();
      expect(() => ThemeUtils.getThemeIcon('light')).not.toThrow();
    });

    it('should not require instantiation', () => {
      // Should be able to use static methods directly
      const displayName = ThemeUtils.getThemeDisplayName('dark');
      const icon = ThemeUtils.getThemeIcon('dark');
      
      expect(displayName).toBe('Dark');
      expect(icon).toBe('🌙');
    });
  });

  describe('consistency between methods', () => {
    it('should handle all built-in themes consistently', () => {
      const builtInThemes: Theme[] = ['light', 'dark', 'system'];
      
      builtInThemes.forEach(theme => {
        const displayName = ThemeUtils.getThemeDisplayName(theme);
        const icon = ThemeUtils.getThemeIcon(theme);
        
        // Both methods should return non-empty strings for built-in themes
        expect(displayName).toBeTruthy();
        expect(icon).toBeTruthy();
        expect(typeof displayName).toBe('string');
        expect(typeof icon).toBe('string');
      });
    });

    it('should handle custom themes consistently', () => {
      const customThemes = ['custom-blue', 'custom-red', 'enterprise-theme'] as Theme[];
      
      customThemes.forEach(theme => {
        const displayName = ThemeUtils.getThemeDisplayName(theme);
        const icon = ThemeUtils.getThemeIcon(theme);
        
        // Display name should be the theme name itself
        expect(displayName).toBe(theme);
        // Icon should be the default custom theme icon
        expect(icon).toBe('🎨');
      });
    });
  });

  describe('theme mapping correctness', () => {
    it('should have correct display names for built-in themes', () => {
      const expectations = [
        { theme: 'light' as Theme, expectedName: 'Light' },
        { theme: 'dark' as Theme, expectedName: 'Dark' },
        { theme: 'system' as Theme, expectedName: 'System' }
      ];

      expectations.forEach(({ theme, expectedName }) => {
        expect(ThemeUtils.getThemeDisplayName(theme)).toBe(expectedName);
      });
    });

    it('should have correct icons for built-in themes', () => {
      const expectations = [
        { theme: 'light' as Theme, expectedIcon: '☀️' },
        { theme: 'dark' as Theme, expectedIcon: '🌙' },
        { theme: 'system' as Theme, expectedIcon: '🖥️' }
      ];

      expectations.forEach(({ theme, expectedIcon }) => {
        expect(ThemeUtils.getThemeIcon(theme)).toBe(expectedIcon);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle case sensitivity', () => {
      // Method should be case-sensitive
      const upperCaseTheme = 'LIGHT' as Theme;
      const mixedCaseTheme = 'Light' as Theme;
      
      // These should be treated as custom themes, not built-in
      expect(ThemeUtils.getThemeDisplayName(upperCaseTheme)).toBe('LIGHT');
      expect(ThemeUtils.getThemeDisplayName(mixedCaseTheme)).toBe('Light');
      expect(ThemeUtils.getThemeIcon(upperCaseTheme)).toBe('🎨');
      expect(ThemeUtils.getThemeIcon(mixedCaseTheme)).toBe('🎨');
    });

    it('should handle special characters in theme names', () => {
      const specialThemes = ['theme-with-dashes', 'theme_with_underscores', 'theme.with.dots'] as Theme[];
      
      specialThemes.forEach(theme => {
        expect(ThemeUtils.getThemeDisplayName(theme)).toBe(theme);
        expect(ThemeUtils.getThemeIcon(theme)).toBe('🎨');
      });
    });

    it('should handle numeric theme names', () => {
      const numericThemes = ['theme1', '2023-theme', 'v1.0.0'] as Theme[];
      
      numericThemes.forEach(theme => {
        expect(ThemeUtils.getThemeDisplayName(theme)).toBe(theme);
        expect(ThemeUtils.getThemeIcon(theme)).toBe('🎨');
      });
    });
  });
});