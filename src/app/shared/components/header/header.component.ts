import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { NavigationItem } from './navigation.types';
import { Navbar } from './navbar/navbar';
import { Sidebar } from './sidebar/sidebar';
import { HeaderActions } from './header-actions/header-actions';
import { ThemeService } from '../../../core/services/theme.service';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, TranslatePipe, Navbar, Sidebar, HeaderActions],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  protected readonly themeService = inject(ThemeService);
  protected readonly i18n = inject(TranslationService);

  // Signals for reactive data
  protected readonly title = signal('app.title').asReadonly();
  protected readonly isSidebarOpen = signal(false);
  
  // Navigation structure (same as before)
  protected readonly navigationItems = signal<NavigationItem[]>([
    { id: 'dashboard', label: 'app.navigation.dashboard', path: '/dashboard', icon: '📊' },
    {
      id: 'clothes', label: 'app.navigation.clothes._', icon: '👗', children: [
        { id: 'clothes-men', label: 'app.navigation.clothes.men', path: '/clothes' },
        { id: 'clothes-crud', label: 'app.navigation.clothes.crud', path: '/clothes/crud-abstract' },
        {
          id: 'clothes-women', label: 'app.navigation.clothes.women._', children: [
            { id: 'clothes-women-dresses', label: 'app.navigation.clothes.women.dresses', path: '/clothes/women/dresses' },
            { id: 'clothes-women-shoes', label: 'app.navigation.clothes.women.shoes', path: '/clothes/women/shoes' }
          ]
        }
      ]
    },
    { id: 'auth', label: 'app.navigation.auth._', icon: '🔐', children: [
      { id: 'login', label: 'app.navigation.auth.login', path: '/auth/login' },
      { id: 'register', label: 'app.navigation.auth.register', path: '/auth/register' }
    ] },
    { id: 'theme-demo', label: 'app.navigation.themeDemo', path: '/theme-demo', icon: '🎨' },
    { id: 'settings', label: 'app.navigation.settings', path: '/settings', icon: '⚙️' }
  ]).asReadonly();

  protected toggleSidebar(): void {
    this.isSidebarOpen.update(isOpen => !isOpen);
  }

  protected closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }

  // Language change handler for sidebar footer
  protected onLanguageChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.i18n.use(value as any);
  }

  // Backwards compatibility noop (legacy method referenced in tests)
  updateNavigationLinks(_links: any[]): void { /* no-op */ }
}