import { Component, inject, signal, computed, ChangeDetectionStrategy, OnDestroy, effect } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
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
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnDestroy {
  
  protected readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  // Signals for reactive data
  protected readonly title = signal('Angular Architecture');
  protected readonly isSidebarOpen = signal(false);
  
  // Navigation links as a signal
  protected readonly navigationLinks = signal<NavigationLink[]>([
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Clothes', path: '/clothes', icon: '👗' },
    { label: 'Authentication', path: '/auth/login', icon: '🔐' },
    { label: 'Theme Demo', path: '/theme-demo', icon: '🎨' },
    { label: 'Settings', path: '/settings', icon: '⚙️' }
  ]);

  // Computed values to avoid repeated calculations
  protected readonly themeIcon = computed(() => this.themeService.getThemeIcon());
  protected readonly isDarkMode = computed(() => this.themeService.isDarkMode());
  
  // Memoized aria-labels to prevent string concatenation on each render
  protected readonly themeAriaLabel = computed(() => 
    `Switch to ${this.isDarkMode() ? 'light' : 'dark'} theme`
  );
  
  protected readonly burgerAriaLabel = computed(() =>
    this.isSidebarOpen() ? 'Close menu' : 'Open menu'
  );
  
  protected readonly sidebarThemeText = computed(() =>
    `${this.isDarkMode() ? 'Light' : 'Dark'} Mode`
  );

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
  updateNavigationLinks(links: NavigationLink[]): void {
    this.navigationLinks.set(links);
  }

  ngOnDestroy(): void {
    this.removeDocumentListeners();
  }
}