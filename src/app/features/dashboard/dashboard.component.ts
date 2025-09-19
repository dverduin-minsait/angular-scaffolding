import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <h1>{{ title() }}</h1>
      <p>{{ description() }}</p>
      
      <div class="dashboard-stats">
        @for (stat of stats(); track stat.label) {
          <div class="stat-card">
            <h3>{{ stat.value }}</h3>
            <p>{{ stat.label }}</p>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  protected readonly title = signal('Dashboard');
  protected readonly description = signal('Welcome to your Angular 20 Architecture Blueprint dashboard!');
  
  protected readonly stats = signal([
    { label: 'Active Users', value: '1,234' },
    { label: 'Total Projects', value: '42' },
    { label: 'Completed Tasks', value: '87%' },
    { label: 'Performance', value: '98%' }
  ]);
}