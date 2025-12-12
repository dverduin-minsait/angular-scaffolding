import { Component } from '@angular/core';

import { 
  ThemeStatusComponent,
  ThemeControlsComponent,
  ColorPaletteComponent,
  InteractiveDemoComponent,
  StatusIndicatorsComponent,
  ResponsiveDemoComponent,
  ConfigPanelComponent,
  ThemePairDemoComponent
} from './components';

@Component({
  selector: 'app-theme-demo',
  standalone: true,
  imports: [
    ThemeStatusComponent,
    ThemeControlsComponent,
    ThemePairDemoComponent,
    ColorPaletteComponent,
    InteractiveDemoComponent,
    StatusIndicatorsComponent,
    ResponsiveDemoComponent,
    ConfigPanelComponent
],
  template: `
    <div class="theme-demo theme-transition">
      <div class="demo-section">
        <h2>🎨 Theme System Demo</h2>
        <p>This page demonstrates the complete theme system with all variables, components, and interactive features.</p>
        
        <app-theme-status />
      </div>

      <div class="demo-section">
        <h3>🎛️ Theme Controls</h3>
        <app-theme-controls />
      </div>

      <div class="demo-section">
        <app-theme-pair-demo />
      </div>

      <div class="demo-section">
        <h3>🎨 Color Palette</h3>
        <app-color-palette />
      </div>

      <div class="demo-section">
        <h3>🧩 Interactive Components</h3>
        <app-interactive-demo />
      </div>

      <div class="demo-section">
        <h3>📊 Status Indicators</h3>
        <app-status-indicators />
      </div>

      <div class="demo-section">
        <h3>📱 Responsive Design</h3>
        <app-responsive-demo />
      </div>

      <div class="demo-section">
        <h3>🔧 Theme Configuration</h3>
        <app-config-panel />
      </div>
    </div>
  `,
  styleUrl: './theme-demo.component.scss'
})
export class ThemeDemoComponent {}