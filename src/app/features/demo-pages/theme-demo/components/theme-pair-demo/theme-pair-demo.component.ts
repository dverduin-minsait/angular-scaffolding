import { Component, inject } from '@angular/core';

import { ThemeService, Theme } from '../../../../../core/services';

@Component({
  selector: 'app-theme-pair-demo',
  standalone: true,
  imports: [],
  template: `
    <div class="theme-pair-demo">
      <h3>🎨 Theme Pair Demonstration</h3>
      
      <div class="demo-section">
        <h4>Current Theme Information</h4>
        <div class="theme-info-grid">
          <div class="info-card">
            <div class="info-label">Current Theme</div>
            <div class="info-value">
              <span class="theme-icon">{{ themeService.getThemeIcon() }}</span>
              {{ themeService.getThemeDisplayName() }}
            </div>
          </div>
          
          <div class="info-card">
            <div class="info-label">Theme Pair</div>
            <div class="info-value">
              Pair {{ themeService.getCurrentThemePair() }} ({{ getCurrentThemePairName() }})
            </div>
          </div>
          
          <div class="info-card">
            <div class="info-label">Dark Mode</div>
            <div class="info-value">
              {{ themeService.isDarkMode() ? 'Yes' : 'No' }}
            </div>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h4>Theme Switching Demo</h4>
        <div class="switch-demo-grid">
          <button 
            class="demo-btn primary"
            (click)="setTheme('light')"
            [class.active]="themeService.currentTheme() === 'light'"
            type="button"
          >
            ☀️ Light (Cool)
          </button>
          
          <button 
            class="demo-btn primary"
            (click)="setTheme('dark')"
            [class.active]="themeService.currentTheme() === 'dark'"
            type="button"
          >
            🌙 Dark (Cool)
          </button>
          
          <button 
            class="demo-btn warm"
            (click)="setTheme('light2')"
            [class.active]="themeService.currentTheme() === 'light2'"
            type="button"
          >
            🌅 Light (Warm)
          </button>
          
          <button 
            class="demo-btn warm"
            (click)="setTheme('dark2')"
            [class.active]="themeService.currentTheme() === 'dark2'"
            type="button"
          >
            🌆 Dark (Warm)
          </button>
        </div>
      </div>

      <div class="demo-section">
        <h4>Color Comparison</h4>
        <div class="color-comparison">
          <div class="color-group">
            <h5>Primary Colors</h5>
            <div class="color-swatches">
              <div class="color-swatch primary-500" title="Primary 500"></div>
              <div class="color-swatch primary-600" title="Primary 600"></div>
              <div class="color-swatch primary-700" title="Primary 700"></div>
            </div>
          </div>
          
          <div class="color-group">
            <h5>Background Colors</h5>
            <div class="color-swatches">
              <div class="color-swatch bg-primary" title="Background Primary"></div>
              <div class="color-swatch bg-secondary" title="Background Secondary"></div>
              <div class="color-swatch bg-accent" title="Background Accent"></div>
            </div>
          </div>
          
          <div class="color-group">
            <h5>Text Colors</h5>
            <div class="color-swatches">
              <div class="color-swatch text-primary" title="Text Primary"></div>
              <div class="color-swatch text-secondary" title="Text Secondary"></div>
              <div class="color-swatch text-accent" title="Text Accent"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h4>Interactive Demo</h4>
        <div class="interactive-demo">
          <div class="sample-card">
            <h5>Sample Card Component</h5>
            <p>This card demonstrates how the theme colors affect different UI elements. 
               Notice how the warm themes have orange/amber tones while the cool themes 
               use blue tones.</p>
            
            <div class="card-actions">
              <button class="btn-primary" type="button">Primary Action</button>
              <button class="btn-secondary" type="button">Secondary Action</button>
            </div>
          </div>
          
          <div class="sample-form">
            <h5>Sample Form</h5>
            <div class="form-group">
              <label for="sample-input">Sample Input</label>
              <input id="sample-input" type="text" placeholder="Type something..." />
            </div>
            
            <div class="form-group">
              <label for="sample-select">Sample Select</label>
              <select id="sample-select">
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './theme-pair-demo.component.scss'
})
export class ThemePairDemoComponent {
  protected readonly themeService = inject(ThemeService);
  
  protected setTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }
  
  protected getCurrentThemePairName(): string {
    return this.themeService.getCurrentThemePair() === 2 ? 'Warm' : 'Cool';
  }
}