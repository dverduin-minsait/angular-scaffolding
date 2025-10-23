import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService, Theme } from '../../../../core/services';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonDirective } from '../../../../shared/directives';

@Component({
  selector: 'app-theme-controls',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonDirective, TranslatePipe],
  template: `
    <div class="theme-controls">
      <div class="control-group">
        <fieldset>
          <legend>{{ 'app.themes.lightTheme' | translate }} / {{ 'app.themes.darkTheme' | translate }}</legend>
          <div class="theme-buttons" role="radiogroup" [attr.aria-label]="'app.actions.changeTheme' | translate">
            <button 
              class="theme-btn"
              appButton variant="secondary"
              [class.active]="themeService.currentTheme() === 'light'"
              (click)="setTheme('light')"
              role="radio"
              [attr.aria-checked]="themeService.currentTheme() === 'light'"
              [attr.aria-label]="('app.themes.lightTheme' | translate) + (themeService.currentTheme() === 'light' ? ' (selected)' : '')"
              type="button"
            >
              <span aria-hidden="true">☀️</span> {{ 'app.themes.light' | translate }}
            </button>
            <button 
              class="theme-btn"
              appButton variant="secondary"
              [class.active]="themeService.currentTheme() === 'dark'"
              (click)="setTheme('dark')"
              role="radio"
              [attr.aria-checked]="themeService.currentTheme() === 'dark'"
              [attr.aria-label]="('app.themes.darkTheme' | translate) + (themeService.currentTheme() === 'dark' ? ' (selected)' : '')"
              type="button"
            >
              <span aria-hidden="true">🌙</span> {{ 'app.themes.dark' | translate }}
            </button>
            <button 
              class="theme-btn warm-theme"
              appButton variant="secondary"
              [class.active]="themeService.currentTheme() === 'light2'"
              (click)="setTheme('light2')"
              role="radio"
              [attr.aria-checked]="themeService.currentTheme() === 'light2'"
              [attr.aria-label]="('app.themes.lightWarmTheme' | translate) + (themeService.currentTheme() === 'light2' ? ' (selected)' : '')"
              type="button"
            >
              <span aria-hidden="true">🌅</span> {{ 'app.themes.lightWarm' | translate }}
            </button>
            <button 
              class="theme-btn warm-theme"
              appButton variant="secondary"
              [class.active]="themeService.currentTheme() === 'dark2'"
              (click)="setTheme('dark2')"
              role="radio"
              [attr.aria-checked]="themeService.currentTheme() === 'dark2'"
              [attr.aria-label]="('app.themes.darkWarmTheme' | translate) + (themeService.currentTheme() === 'dark2' ? ' (selected)' : '')"
              type="button"
            >
              <span aria-hidden="true">🌆</span> {{ 'app.themes.darkWarm' | translate }}
            </button>
            <button 
              class="theme-btn"
              appButton variant="secondary"
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
        <fieldset>
          <legend>{{ 'app.actions.quickActions' | translate }}</legend>
          <div class="quick-actions">
            <button 
              class="toggle-button" appButton variant="primary" 
              (click)="toggleTheme()"
              [attr.aria-label]="(themeService.isDarkMode() ? 'app.actions.switchToLight' : 'app.actions.switchToDark') | translate"
              type="button"
            >
              <span aria-hidden="true">{{ themeService.isDarkMode() ? '☀️' : '🌙' }}</span>
              {{ (themeService.isDarkMode() ? 'app.actions.switchToLight' : 'app.actions.switchToDark') | translate }}
            </button>
            
            <button 
              class="toggle-button" appButton variant="secondary" 
              (click)="toggleThemePair()"
              [attr.aria-label]="'Switch to ' + (getCurrentThemePairName() === 'Cool' ? 'Warm' : 'Cool') + ' theme pair'"
              type="button"
            >
              <span aria-hidden="true">{{ getCurrentThemePairName() === 'Cool' ? '🌅' : '❄️' }}</span>
              {{ 'app.actions.toggleThemePair' | translate:{ pair: (getCurrentThemePairName() === 'Cool' ? 'Warm' : 'Cool') } }}
            </button>
          </div>
        </fieldset>
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
            <span>{{ 'app.status.systemPreference' | translate }}</span>
          </label>
          <div id="system-preference-description" class="control-description">
            {{ 'app.status.systemPreferenceDescription' | translate }}
          </div>
        </div>
      </div>
      
      <div class="control-group">
        <button 
          appButton variant="secondary" 
          (click)="resetTheme()"
          aria-label="Reset theme settings to default values"
          type="button"
        >
          <span aria-hidden="true">🔄</span> {{ 'app.actions.resetDefaults' | translate }}
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

  protected toggleThemePair(): void {
    this.themeService.toggleThemePair();
  }

  protected getCurrentThemePairName(): string {
    return this.themeService.getCurrentThemePair() === 2 ? 'Warm' : 'Cool';
  }
  
  protected toggleSystemPreference(): void {
    this.themeService.setUseSystemPreference(!this.themeService.useSystemPreference());
  }
  
  protected resetTheme(): void {
    this.themeService.resetToDefaults();
  }
}