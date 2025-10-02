import { Component, inject, signal, computed, ChangeDetectionStrategy, OnDestroy, effect } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';
import { TranslationService, SupportedLang } from '../../../core/services/translation.service';
import { TranslatePipe } from '@ngx-translate/core';

export interface NavigationLink {
  label: string;
  path: string;
  icon?: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnDestroy {
  
  protected readonly themeService = inject(ThemeService);
  protected readonly i18n = inject(TranslationService);
  private readonly router = inject(Router);

  // Signals for reactive data
  protected readonly title = signal('app.title').asReadonly();
  protected readonly isSidebarOpen = signal(false);
  
  // Navigation links as a signal
  protected readonly navigationLinks = signal<NavigationLink[]>([
    { label: 'app.navigation.dashboard', path: '/dashboard', icon: '📊' },
    { label: 'app.navigation.clothes', path: '/clothes', icon: '👗' },
    { label: 'app.navigation.auth', path: '/auth/login', icon: '🔐' },
    { label: 'app.navigation.themeDemo', path: '/theme-demo', icon: '🎨' },
    { label: 'app.navigation.settings', path: '/settings', icon: '⚙️' }
  ]).asReadonly();

  // Computed values to avoid repeated calculations
  protected readonly themeIcon = computed(() => this.themeService.getThemeIcon());
  protected readonly isDarkMode = computed(() => this.themeService.isDarkMode());
  
  // Memoized aria-labels to prevent string concatenation on each render
  protected readonly themeAriaLabel = computed(() => {
    this.i18n.currentLang();
    return this.i18n.instant('app.actions.toggleTheme', { theme: this.isDarkMode() ? 'light' : 'dark' });
  });
  
  protected readonly burgerAriaLabel = computed(() => {
    this.i18n.currentLang();
    return this.isSidebarOpen() ? this.i18n.instant('app.actions.closeMenu') : this.i18n.instant('app.actions.openMenu');
  });
  
  protected readonly sidebarThemeText = computed(() => this.isDarkMode() ? 'Light' : 'Dark');

  // Language selection (keep navigation + pipe unchanged)
  protected readonly languages = this.i18n.availableLangs;

  protected onLanguageChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as SupportedLang;
    // Fire and forget; underlying service handles persistence & html lang
    this.i18n.use(value);
  }

  // Event listener cleanup
  private documentClickListener?: (event: Event) => void;
  private documentKeydownListener?: (event: KeyboardEvent) => void;

  // TrackBy function for better performance
  protected trackByPath = (_index: number, link: NavigationLink): string => link.path;

  // Check if a link is currently active
  protected isLinkActive = (path: string): boolean => {
    return this.router.url === path;
  };

  constructor() {
    // Effect to manage document event listeners based on sidebar state
    effect(() => {
      if (this.isSidebarOpen()) {
        this.addDocumentListeners();
      } else {
        this.removeDocumentListeners();
      }
    });
  }

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  protected toggleSidebar(): void {
    this.isSidebarOpen.update(isOpen => !isOpen);
  }

  protected closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }

  private addDocumentListeners(): void {
    if (this.documentClickListener || this.documentKeydownListener) {
      return; // Already added
    }

    this.documentClickListener = this.onDocumentClick.bind(this);
    this.documentKeydownListener = this.onDocumentKeydown.bind(this);
    
    document.addEventListener('click', this.documentClickListener);
    document.addEventListener('keydown', this.documentKeydownListener);
  }

  private removeDocumentListeners(): void {
    if (this.documentClickListener) {
      document.removeEventListener('click', this.documentClickListener);
      this.documentClickListener = undefined;
    }

    if (this.documentKeydownListener) {
      document.removeEventListener('keydown', this.documentKeydownListener);
      this.documentKeydownListener = undefined;
    }
  }

  private onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeSidebar();
    }
  }

  private onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    
    // Early return if clicking on sidebar or burger menu
    if (target.closest('.sidebar') || target.closest('.burger-menu')) {
      return;
    }
    
    this.closeSidebar();
  }

  // Method to update navigation links if needed
  updateNavigationLinks(_links: NavigationLink[]): void {
    // navigation links now computed from translations
  }

  ngOnDestroy(): void {
    this.removeDocumentListeners();
  }
}