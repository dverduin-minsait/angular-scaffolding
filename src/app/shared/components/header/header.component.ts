import { Component, inject, signal, computed, ChangeDetectionStrategy, OnDestroy, effect } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';
import { TranslationService, SupportedLang } from '../../../core/services/translation.service';
import { TranslatePipe } from '@ngx-translate/core';

// Navigation data model supports recursive groups (n-level)
interface NavigationItemBase { id: string; label: string; icon?: string; }
export interface NavigationLeaf extends NavigationItemBase { path: string; children?: undefined; }
export interface NavigationGroup extends NavigationItemBase { path?: undefined; children: NavigationItem[]; }
export type NavigationItem = NavigationLeaf | NavigationGroup;

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
  
  // Recursive navigation structure (groups OR links).
  // Example includes a group to demonstrate collapsible behavior.
  protected readonly navigationItems = signal<NavigationItem[]>([
    { id: 'dashboard', label: 'app.navigation.dashboard', path: '/dashboard', icon: '📊' },
    {
      id: 'clothes', label: 'app.navigation.clothes._', icon: '👗', children: [
        { id: 'clothes-men', label: 'app.navigation.clothes.men', path: '/clothes/men' },
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
  private documentClickListener?: (event: Event) => void; // sidebar close listener
  private documentKeydownListener?: (event: KeyboardEvent) => void; // sidebar esc listener
  private desktopOutsideClickListener?: (event: Event) => void; // desktop dropdown outside click
  private desktopOutsideFocusListener?: (event: Event) => void; // desktop dropdown focusout

  // Hover timers for intent (desktop top-level groups)
  private hoverTimers = new Map<string, any>();

  // TrackBy id for either groups or leaves
  protected trackById = (_index: number, item: NavigationItem): string => item.id;

  // Active link detection (leaf only)
  protected isLinkActive = (path: string): boolean => this.router.url === path;

  // Open group state tracked as a Set of ids (supports many open groups simultaneously)
  private readonly openGroupsSignal = signal<Set<string>>(new Set());
  protected isGroup = (item: NavigationItem): item is NavigationGroup => !!(item as NavigationGroup).children?.length;
  protected isGroupOpen = (id: string): boolean => this.openGroupsSignal().has(id);
  protected toggleGroup(id: string): void {
    this.openGroupsSignal.update(current => {
      const next = new Set(current);
      if (next.has(id)) {
        // Closing group: close all descendants too
        const descendants = this.getDescendantGroupIds(id);
        next.delete(id);
        descendants.forEach(d => next.delete(d));
      } else {
        next.add(id);
      }
      return next;
    });
  }

  private findGroupById(id: string, items: NavigationItem[] = this.navigationItems()): NavigationGroup | undefined {
    for (const item of items) {
      if (this.isGroup(item)) {
        if (item.id === id) return item;
        const found = this.findGroupById(id, item.children);
        if (found) return found;
      }
    }
    return undefined;
  }

  private getDescendantGroupIds(id: string): string[] {
    const group = this.findGroupById(id);
    if (!group) return [];
    const collected: string[] = [];
    const walk = (items: NavigationItem[]) => {
      for (const i of items) {
        if (this.isGroup(i)) { collected.push(i.id); walk(i.children); }
      }
    };
    walk(group.children);
    return collected;
  }

  private getTopLevelGroupIds(): string[] {
    return this.navigationItems().filter(i => this.isGroup(i)).map(i => i.id);
  }

  // Auto-open ancestor groups of the active route for deep linking
  private autoOpenActiveAncestorsEffect = effect(() => {
    // Track current URL changes
    const currentUrl = this.router.url; // reactive? not a signal; effect re-run only if other signals change. We'll manually call in constructor after nav.
    // Determine ancestors
    const ancestors: string[] = [];
    const visit = (items: NavigationItem[], lineage: string[]) => {
      for (const item of items) {
        if (this.isGroup(item)) {
          visit(item.children, [...lineage, item.id]);
        } else if (item.path === currentUrl) {
          ancestors.push(...lineage);
        }
      }
    };
    visit(this.navigationItems(), []);
    if (ancestors.length) {
      this.openGroupsSignal.update(prev => {
        const next = new Set(prev);
        ancestors.forEach(id => next.add(id));
        return next;
      });
    }
  });

  constructor() {
    // Effect to manage document event listeners based on sidebar state
    effect(() => {
      if (this.isSidebarOpen()) {
        this.addDocumentListeners();
      } else {
        this.removeDocumentListeners();
      }
    });
  // Listen to router events to trigger ancestor opening (no zone, so subscribe minimal & sync)
    this.router.events.subscribe(() => {
      // Trigger effect manually by updating a dummy signal if needed; simpler: call auto-open logic directly
      const current = this.router.url;
      // replicate logic quickly
      const ancestors: string[] = [];
      const visit = (items: NavigationItem[], lineage: string[]) => {
        for (const item of items) {
          if (this.isGroup(item)) visit(item.children, [...lineage, item.id]);
          else if (item.path === current) ancestors.push(...lineage);
        }
      };
      visit(this.navigationItems(), []);
      if (ancestors.length) {
        this.openGroupsSignal.update(prev => {
          const next = new Set(prev);
            ancestors.forEach(id => next.add(id));
            return next;
        });
      }
    });

    // Effect: manage outside listeners for desktop dropdowns (top-level) only when one is open and sidebar is closed
    effect(() => {
      const anyTopLevelOpen = this.getTopLevelGroupIds().some(id => this.openGroupsSignal().has(id));
      if (anyTopLevelOpen && !this.isSidebarOpen()) {
        this.addDesktopOutsideListeners();
      } else {
        this.removeDesktopOutsideListeners();
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

  private addDesktopOutsideListeners(): void {
    if (!this.desktopOutsideClickListener) {
      this.desktopOutsideClickListener = this.onDesktopOutsideInteraction.bind(this);
      document.addEventListener('click', this.desktopOutsideClickListener, true);
    }
    if (!this.desktopOutsideFocusListener) {
      this.desktopOutsideFocusListener = this.onDesktopOutsideInteraction.bind(this);
      document.addEventListener('focusin', this.desktopOutsideFocusListener, true);
    }
  }

  private removeDesktopOutsideListeners(): void {
    if (this.desktopOutsideClickListener) {
      document.removeEventListener('click', this.desktopOutsideClickListener, true);
      this.desktopOutsideClickListener = undefined;
    }
    if (this.desktopOutsideFocusListener) {
      document.removeEventListener('focusin', this.desktopOutsideFocusListener, true);
      this.desktopOutsideFocusListener = undefined;
    }
  }

  private onDesktopOutsideInteraction(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.closest('.desktop-nav')) return; // inside desktop nav
    // Close only top-level groups
    const topLevel = this.getTopLevelGroupIds();
    this.openGroupsSignal.update(prev => {
      const next = new Set(prev);
      topLevel.forEach(id => next.delete(id));
      return next;
    });
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

  // Keyboard navigation for menu (desktop + mobile). Attach to container via (keydown)
  protected onNavKeydown(event: KeyboardEvent): void {
    const key = event.key;
    const target = event.target as HTMLElement;
    const desktop = !!target.closest('.desktop-nav');
    const groupToggleSelector = desktop ? '.nav-group-toggle' : '.sidebar-group-toggle';
    const linkSelector = desktop ? '.nav-link' : '.sidebar-nav-link';
    const focusableSelector = `${groupToggleSelector}, ${linkSelector}`;
    const isGroupToggle = target.matches(groupToggleSelector);

    const getSiblings = () => {
      const list = target.closest('ul');
      if (!list) return [] as HTMLElement[];
      return Array.from(list.querySelectorAll<HTMLElement>(`:scope > li ${focusableSelector}`));
    };
    const siblings = getSiblings();
    const idx = siblings.indexOf(target);
    const focus = (el?: HTMLElement) => el?.focus();

    if (['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End','Escape'].includes(key)) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (key === 'ArrowDown') { focus(siblings[(idx + 1) % siblings.length]); return; }
    if (key === 'ArrowUp') { focus(siblings[(idx - 1 + siblings.length) % siblings.length]); return; }
    if (key === 'Home') { focus(siblings[0]); return; }
    if (key === 'End') { focus(siblings[siblings.length - 1]); return; }
    if (key === 'ArrowRight' && isGroupToggle) {
      const id = target.getAttribute('aria-controls')?.replace(/^grp-|^mside-/, '') ?? '';
      if (!this.isGroupOpen(id)) { this.toggleGroup(id); return; }
      const panel = document.getElementById(target.getAttribute('aria-controls')!);
      const firstChild = panel?.querySelector<HTMLElement>(focusableSelector);
      focus(firstChild || undefined);
      return;
    }
    if (key === 'ArrowLeft') {
      if (isGroupToggle) {
        const id = target.getAttribute('aria-controls')?.replace(/^grp-|^mside-/, '') ?? '';
        if (this.isGroupOpen(id)) { this.toggleGroup(id); return; }
      }
      const parentLi = target.closest('ul')?.closest('li');
      const parentToggle = parentLi?.querySelector<HTMLElement>(groupToggleSelector);
      focus(parentToggle || undefined);
      return;
    }
    if (key === 'Escape') {
      if (isGroupToggle) {
        const id = target.getAttribute('aria-controls')?.replace(/^grp-|^mside-/, '') ?? '';
        if (this.isGroupOpen(id)) { this.toggleGroup(id); return; }
      }
      if (desktop) {
        // Close all top-level groups
        this.openGroupsSignal.update(prev => {
          const next = new Set(prev);
          this.getTopLevelGroupIds().forEach(id => next.delete(id));
          return next;
        });
      }
      return;
    }
  }

  // Hover intent only for top-level groups on desktop
  protected onGroupMouseEnter(id: string, depth: number): void {
    if (depth !== 0) return;
    if (!matchMedia || !matchMedia('(pointer:fine)').matches) return;
    clearTimeout(this.hoverTimers.get(id));
    const t = setTimeout(() => { if (!this.isGroupOpen(id)) this.toggleGroup(id); }, 120);
    this.hoverTimers.set(id, t);
  }

  protected onGroupMouseLeave(id: string, depth: number, event: MouseEvent): void {
    if (depth !== 0) return;
    if (!matchMedia || !matchMedia('(pointer:fine)').matches) return;
    clearTimeout(this.hoverTimers.get(id));
    const related = event.relatedTarget as HTMLElement | null;
    if (related && related.closest(`#grp-${id}`)) return; // moving into panel
    const t = setTimeout(() => { if (this.isGroupOpen(id)) this.toggleGroup(id); }, 300);
    this.hoverTimers.set(id, t);
  }

  // Backwards compatibility noop (legacy method referenced in tests)
  updateNavigationLinks(_links: any[]): void { /* no-op */ }

  ngOnDestroy(): void {
    this.removeDocumentListeners();
    this.removeDesktopOutsideListeners();
    this.hoverTimers.forEach(t => clearTimeout(t));
  }
}