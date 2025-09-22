import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService, Theme } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-theme-controls',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="theme-controls">
      <div class="control-group">
        <fieldset>
          <legend>Theme Selection</legend>
          <div class="theme-buttons" role="radiogroup" aria-label="Choose theme">
            <button 
              class="theme-btn"
              [class.active]="themeService.currentTheme() === 'light'"
              (click)="setTheme('light')"
              role="radio"
              [attr.aria-checked]="themeService.currentTheme() === 'light'"
              [attr.aria-label]="'Light theme' + (themeService.currentTheme() === 'light' ? ' (selected)' : '')"
              type="button"
            >
              <span aria-hidden="true">☀️</span> Light
            </button>
            <button 
              class="theme-btn"
              [class.active]="themeService.currentTheme() === 'dark'"
              (click)="setTheme('dark')"
              role="radio"
              [attr.aria-checked]="themeService.currentTheme() === 'dark'"
              [attr.aria-label]="'Dark theme' + (themeService.currentTheme() === 'dark' ? ' (selected)' : '')"
              type="button"
            >
              <span aria-hidden="true">🌙</span> Dark
            </button>
            <button 
              class="theme-btn"
              [class.active]="themeService.currentTheme() === 'system'"
              (click)="setTheme('system')"
              role="radio"
              [attr.aria-checked]="themeService.currentTheme() === 'system'"
              [attr.aria-label]="'System theme' + (themeService.currentTheme() === 'system' ? ' (selected)' : '')"
              type="button"
            >
              <span aria-hidden="true">🖥️</span> System
            </button>
          </div>
        </fieldset>
      </div>
      
      <div class="control-group">
        <label for="quick-toggle">Quick Toggle</label>
        <button 
          id="quick-toggle"
          class="toggle-button btn-primary" 
          (click)="toggleTheme()"
          [attr.aria-label]="'Switch to ' + (themeService.isDarkMode() ? 'light' : 'dark') + ' theme'"
          type="button"
        >
          <span aria-hidden="true">{{ themeService.isDarkMode() ? '☀️' : '🌙' }}</span>
          {{ themeService.isDarkMode() ? 'Switch to Light' : 'Switch to Dark' }}
        </button>
      </div>
      
      <div class="control-group">
        <div class="checkbox-group">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              [checked]="themeService.useSystemPreference()"
              (change)="toggleSystemPreference()"
              id="system-preference"
              [attr.aria-describedby]="'system-preference-description'"
            />
            <span>Use System Preference</span>
          </label>
          <div id="system-preference-description" class="control-description">
            Automatically switches between light and dark themes based on your system settings
          </div>
        </div>
      </div>
      
      <div class="control-group">
        <button 
          class="btn-secondary" 
          (click)="resetTheme()"
          aria-label="Reset theme settings to default values"
          type="button"
        >
          <span aria-hidden="true">🔄</span> Reset to Defaults
        </button>
      </div>
    </div>
  `,
  styleUrl: './theme-controls.component.scss'
})
export class ThemeControlsComponent {
  protected readonly themeService = inject(ThemeService);
  
  protected setTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }
  
  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }
  
  protected toggleSystemPreference(): void {
    this.themeService.setUseSystemPreference(!this.themeService.useSystemPreference());
  }
  
  protected resetTheme(): void {
    this.themeService.resetToDefaults();
  }
}