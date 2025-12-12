import { Component } from '@angular/core';


interface ColorDefinition {
  name: string;
}

@Component({
  selector: 'app-color-palette',
  standalone: true,
  imports: [],
  template: `
    <div class="color-palette-container">
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
  `,
  styleUrl: './color-palette.component.scss'
})
export class ColorPaletteComponent {
  protected readonly primaryColors: ColorDefinition[] = [
    { name: 'primary-50' }, { name: 'primary-100' }, { name: 'primary-200' },
    { name: 'primary-300' }, { name: 'primary-400' }, { name: 'primary-500' },
    { name: 'primary-600' }, { name: 'primary-700' }, { name: 'primary-800' },
    { name: 'primary-900' }, { name: 'primary-950' }
  ];
  
  protected readonly backgroundColors: ColorDefinition[] = [
    { name: 'bg-primary' }, { name: 'bg-secondary' }, { name: 'bg-tertiary' },
    { name: 'bg-accent' }, { name: 'bg-muted' }
  ];
  
  protected readonly textColors: ColorDefinition[] = [
    { name: 'text-primary' }, { name: 'text-secondary' }, { name: 'text-tertiary' },
    { name: 'text-accent' }, { name: 'text-muted' }, { name: 'text-inverse' }
  ];
  
  protected readonly statusColors: ColorDefinition[] = [
    { name: 'success' }, { name: 'success-bg' },
    { name: 'warning' }, { name: 'warning-bg' },
    { name: 'error' }, { name: 'error-bg' },
    { name: 'info' }, { name: 'info-bg' }
  ];
  
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