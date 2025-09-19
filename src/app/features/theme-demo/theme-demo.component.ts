import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService, Theme } from '../../core/services/theme.service';

@Component({
  selector: 'app-theme-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="theme-demo theme-transition">
      <div class="demo-section">
        <h2>🎨 Theme System Demo</h2>
        <p>This page demonstrates the complete theme system with all variables, components, and interactive features.</p>
        
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
      </div>

      <div class="demo-section">
        <h3>🎛️ Theme Controls</h3>
        <div class="theme-controls">
          <div class="control-group">
            <label>Theme Selection:</label>
            <div class="theme-buttons">
              <button 
                class="theme-btn"
                [class.active]="themeService.currentTheme() === 'light'"
                (click)="setTheme('light')"
              >
                ☀️ Light
              </button>
              <button 
                class="theme-btn"
                [class.active]="themeService.currentTheme() === 'dark'"
                (click)="setTheme('dark')"
              >
                🌙 Dark
              </button>
              <button 
                class="theme-btn"
                [class.active]="themeService.currentTheme() === 'system'"
                (click)="setTheme('system')"
              >
                🖥️ System
              </button>
            </div>
          </div>
          
          <div class="control-group">
            <label>Quick Toggle:</label>
            <button class="toggle-button btn-primary" (click)="toggleTheme()">
              {{ themeService.isDarkMode() ? '☀️ Switch to Light' : '🌙 Switch to Dark' }}
            </button>
          </div>
          
          <div class="control-group">
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  [checked]="themeService.useSystemPreference()"
                  (change)="toggleSystemPreference()"
                />
                <span>Use System Preference</span>
              </label>
            </div>
          </div>
          
          <div class="control-group">
            <button class="btn-secondary" (click)="resetTheme()">
              🔄 Reset to Defaults
            </button>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h3>🎨 Color Palette</h3>
        <div class="color-section">
          <h4>Primary Colors</h4>
          <div class="color-palette">
            @for (color of primaryColors; track color.name) {
              <div class="color-item">
                <div 
                  class="color-swatch" 
                  [style.background-color]="'var(--' + color.name + ')'"
                  [title]="'var(--' + color.name + ')'"
                ></div>
                <div class="color-info">
                  <div class="color-name">{{ color.name }}</div>
                  <div class="color-value">{{ getComputedColor(color.name) }}</div>
                </div>
              </div>
            }
          </div>
        </div>
        
        <div class="color-section">
          <h4>Background Colors</h4>
          <div class="color-palette">
            @for (color of backgroundColors; track color.name) {
              <div class="color-item">
                <div 
                  class="color-swatch" 
                  [style.background-color]="'var(--' + color.name + ')'"
                  [style.border]="color.name.includes('primary') ? '2px solid var(--border-primary)' : '1px solid var(--border-primary)'"
                  [title]="'var(--' + color.name + ')'"
                ></div>
                <div class="color-info">
                  <div class="color-name">{{ color.name }}</div>
                  <div class="color-value">{{ getComputedColor(color.name) }}</div>
                </div>
              </div>
            }
          </div>
        </div>
        
        <div class="color-section">
          <h4>Text Colors</h4>
          <div class="color-palette">
            @for (color of textColors; track color.name) {
              <div class="color-item">
                <div 
                  class="color-swatch text-swatch" 
                  [style.color]="'var(--' + color.name + ')'"
                  [title]="'var(--' + color.name + ')'"
                >Aa</div>
                <div class="color-info">
                  <div class="color-name">{{ color.name }}</div>
                  <div class="color-value">{{ getComputedColor(color.name) }}</div>
                </div>
              </div>
            }
          </div>
        </div>
        
        <div class="color-section">
          <h4>Status Colors</h4>
          <div class="color-palette">
            @for (color of statusColors; track color.name) {
              <div class="color-item">
                <div 
                  class="color-swatch" 
                  [style.background-color]="'var(--' + color.name + ')'"
                  [title]="'var(--' + color.name + ')'"
                ></div>
                <div class="color-info">
                  <div class="color-name">{{ color.name }}</div>
                  <div class="color-value">{{ getComputedColor(color.name) }}</div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h3>🧩 Interactive Components</h3>
        <div class="component-grid">
          <div class="component-group">
            <h4>Buttons</h4>
            <div class="demo-buttons">
              <button class="btn-primary">Primary Button</button>
              <button class="btn-secondary">Secondary Button</button>
              <button class="btn-ghost">Ghost Button</button>
              <button class="btn-primary" disabled>Disabled Button</button>
            </div>
          </div>
          
          <div class="component-group">
            <h4>Form Elements</h4>
            <div class="demo-inputs">
              <label for="demo-text">Text Input</label>
              <input id="demo-text" type="text" placeholder="Enter text..." />
              
              <label for="demo-email">Email Input</label>
              <input id="demo-email" type="email" placeholder="Enter email..." />
              
              <label for="demo-select">Select</label>
              <select id="demo-select">
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
              
              <label class="checkbox-label">
                <input type="checkbox" checked />
                <span>Checkbox option</span>
              </label>
            </div>
          </div>
          
          <div class="component-group">
            <h4>Cards</h4>
            <div class="demo-cards">
              <div class="demo-card">
                <h5>Standard Card</h5>
                <p>This card demonstrates the standard card styling with theme variables.</p>
                <button class="btn-primary btn-small">Action</button>
              </div>
              <div class="demo-card">
                <h5>Another Card</h5>
                <p>Cards automatically adapt to light and dark themes seamlessly.</p>
                <button class="btn-secondary btn-small">Secondary</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h3>📊 Status Indicators</h3>
        <div class="status-demo">
          <div class="status-item success">
            <span class="status-icon">✅</span>
            <span class="status-text">Success</span>
          </div>
          <div class="status-item warning">
            <span class="status-icon">⚠️</span>
            <span class="status-text">Warning</span>
          </div>
          <div class="status-item error">
            <span class="status-icon">❌</span>
            <span class="status-text">Error</span>
          </div>
          <div class="status-item info">
            <span class="status-icon">ℹ️</span>
            <span class="status-text">Info</span>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h3>📱 Responsive Design</h3>
        <div class="responsive-demo">
          <div class="grid-demo">
            <div class="grid-item">Item 1</div>
            <div class="grid-item">Item 2</div>
            <div class="grid-item">Item 3</div>
            <div class="grid-item">Item 4</div>
            <div class="grid-item">Item 5</div>
            <div class="grid-item">Item 6</div>
          </div>
          <p class="responsive-note">
            This grid automatically adapts to different screen sizes and themes.
          </p>
        </div>
      </div>

      <div class="demo-section">
        <h3>🔧 Theme Configuration</h3>
        <div class="config-panel">
          <div class="config-info">
            <h4>Current Configuration</h4>
            <pre>{{ themeConfigDisplay() }}</pre>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './theme-demo.component.scss'
})
export class ThemeDemoComponent {
  protected readonly themeService = inject(ThemeService);
  
  // Color definitions for the demo
  protected readonly primaryColors = [
    { name: 'primary-50' }, { name: 'primary-100' }, { name: 'primary-200' },
    { name: 'primary-300' }, { name: 'primary-400' }, { name: 'primary-500' },
    { name: 'primary-600' }, { name: 'primary-700' }, { name: 'primary-800' },
    { name: 'primary-900' }, { name: 'primary-950' }
  ];
  
  protected readonly backgroundColors = [
    { name: 'bg-primary' }, { name: 'bg-secondary' }, { name: 'bg-tertiary' },
    { name: 'bg-accent' }, { name: 'bg-muted' }
  ];
  
  protected readonly textColors = [
    { name: 'text-primary' }, { name: 'text-secondary' }, { name: 'text-tertiary' },
    { name: 'text-accent' }, { name: 'text-muted' }, { name: 'text-inverse' }
  ];
  
  protected readonly statusColors = [
    { name: 'success' }, { name: 'success-bg' },
    { name: 'warning' }, { name: 'warning-bg' },
    { name: 'error' }, { name: 'error-bg' },
    { name: 'info' }, { name: 'info-bg' }
  ];
  
  // Computed properties
  protected readonly systemPrefersDark = computed(() => {
    return (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches) ?? false;
  });
  
  protected readonly themeConfigDisplay = computed(() => {
    return JSON.stringify(this.themeService.getThemeConfig(), null, 2);
  });
  
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
  
  protected getComputedColor(colorVar: string): string {
    try {
      const computed = getComputedStyle(document.documentElement);
      const value = computed.getPropertyValue(`--${colorVar}`).trim();
      return value || 'Not defined';
    } catch {
      return 'Unable to read';
    }
  }
}