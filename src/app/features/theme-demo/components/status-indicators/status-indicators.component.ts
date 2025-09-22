import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-indicators',
  standalone: true,
  imports: [CommonModule],
  template: `
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
  `,
  styleUrl: './status-indicators.component.scss'
})
export class StatusIndicatorsComponent {}