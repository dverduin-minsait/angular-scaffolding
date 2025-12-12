import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';
import { NavigationItem } from './navigation.types';
import { Navbar } from './navbar/navbar';
import { Sidebar } from './sidebar/sidebar';
import { HeaderActions } from './header-actions/header-actions';
import { ThemeService } from '../../../core/services';
import { TranslationService, SupportedLang } from '../../../core/services/translation.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [TranslatePipe, Navbar, Sidebar, HeaderActions],
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
    { id: 'demos', label: 'app.navigation.demos._', icon: '🎨', children: [
      { id: 'theme-demo', label: 'app.navigation.demos.themeDemo', path: '/demo/theme-demo' },
      { id: 'demo-books', label: 'app.navigation.demos.crudDemo', path: '/demo-books' },
      { id: 'ssr-demo', label: 'app.navigation.demos.ssrDemo', path: '/demo/ssr-demo' }
    ] },
    { id: 'auth', label: 'app.navigation.auth._', icon: '🔐', children: [
      { id: 'login', label: 'app.navigation.auth.login', path: '/auth/login' },
      { id: 'register', label: 'app.navigation.auth.register', path: '/auth/register' }
    ] }
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
    void this.i18n.use(value as SupportedLang);
  }

  // Backwards compatibility noop (legacy method referenced in tests)
  updateNavigationLinks(_links: unknown[]): void { /* no-op */ }
}