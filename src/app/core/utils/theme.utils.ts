import { Theme } from '../services/theme.service';

/**
 * Theme utility functions for display names and icons
 */
export class ThemeUtils {
  /**
   * Get theme display name for built-in themes
   */
  static getThemeDisplayName(theme: Theme): string {
    switch (theme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
      default: return theme; // Return the theme name itself for custom themes
    }
  }

  /**
   * Get theme icon for built-in themes
   */
  static getThemeIcon(theme: Theme): string {
    switch (theme) {
      case 'light': return '☀️';
      case 'dark': return '🌙';
      case 'system': return '🖥️';
      default: return '🎨'; // Default icon for custom themes
    }
  }
}