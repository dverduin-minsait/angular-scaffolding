import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-config-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="config-panel">
      <div class="config-info">
        <h4>Current Configuration</h4>
        <pre>{{ themeConfigDisplay() }}</pre>
      </div>
    </div>
  `,
  styleUrl: './config-panel.component.scss'
})
export class ConfigPanelComponent {
  private readonly themeService = inject(ThemeService);
  
  protected readonly themeConfigDisplay = computed(() => {
    return JSON.stringify(this.themeService.getThemeConfig(), null, 2);
  });
}