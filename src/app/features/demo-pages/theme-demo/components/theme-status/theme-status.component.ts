import { Component, inject, computed } from '@angular/core';

import { ThemeService } from '../../../../../core/services';

@Component({
  selector: 'app-theme-status',
  standalone: true,
  imports: [],
  template: `
    <div class="theme-status">
      <div class="status-item">
        <span class="label">Current Theme:</span>
        <span class="value">{{ themeService.getThemeDisplayName() }} {{ themeService.getThemeIcon() }}</span>
      </div>
      <div class="status-item">
        <span class="label">Dark Mode:</span>
        <span class="value">{{ themeService.isDarkMode() ? 'Enabled' : 'Disabled' }}</span>
      </div>
      <div class="status-item">
        <span class="label">System Preference:</span>
        <span class="value">{{ systemPrefersDark() ? 'Dark' : 'Light' }}</span>
      </div>
    </div>
  `,
  styleUrl: './theme-status.component.scss'
})
export class ThemeStatusComponent {
  protected readonly themeService = inject(ThemeService);
  
  protected readonly systemPrefersDark = computed(() => {
    return (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches) ?? false;
  });
}