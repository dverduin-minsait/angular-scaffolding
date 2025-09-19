import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';

export interface NavigationLink {
  label: string;
  path: string;
  icon?: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <h1>{{ title() }}</h1>
        </div>
        
        <nav class="navigation">
          <ul class="nav-list">
            @for (link of navigationLinks(); track link.path) {
              <li class="nav-item">
                <a 
                  [routerLink]="link.path" 
                  routerLinkActive="active"
                  class="nav-link"
                  [attr.aria-label]="link.label"
                >
                  @if (link.icon) {
                    <span class="nav-icon" [attr.aria-hidden]="true">{{ link.icon }}</span>
                  }
                  {{ link.label }}
                </a>
              </li>
            }
          </ul>
        </nav>
        
        <div class="header-actions">
          <button 
            class="theme-toggle"
            (click)="toggleTheme()"
            [attr.aria-label]="'Switch to ' + (themeService.isDarkMode() ? 'light' : 'dark') + ' theme'"
          >
            {{ themeService.getThemeIcon() }}
          </button>
        </div>
      </div>
    </header>
  `,
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  
  protected readonly themeService = inject(ThemeService);

  // Signals for reactive data
  protected readonly title = signal('Angular Architecture');
  
  // Navigation links as a signal
  protected readonly navigationLinks = signal<NavigationLink[]>([
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Authentication', path: '/auth/login', icon: '🔐' },
    { label: 'Theme Demo', path: '/theme-demo', icon: '🎨' },
    { label: 'Settings', path: '/settings', icon: '⚙️' }
  ]);

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  // Method to update navigation links if needed
  updateNavigationLinks(links: NavigationLink[]): void {
    this.navigationLinks.set(links);
  }
}