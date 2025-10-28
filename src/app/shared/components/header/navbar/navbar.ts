import { Component, inject, input, signal, ChangeDetectionStrategy, OnDestroy, effect } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { WINDOW_DOCUMENT } from '../../../../core/tokens/document.token';
import { NavigationItem, NavigationGroup } from '../navigation.types';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Navbar implements OnDestroy {
  private readonly router = inject(Router);
  private readonly document = inject(WINDOW_DOCUMENT);

  // Input for navigation items
  readonly items = input.required<NavigationItem[]>();

  // Group state management
  private readonly openGroupsSignal = signal<Set<string>>(new Set());
  
  // Hover timers for intent (desktop top-level groups)
  private readonly hoverTimers = new Map<string, ReturnType<typeof setTimeout>>();

  // Desktop outside listeners for dropdown closing
  private desktopOutsideClickListener?: (event: Event) => void;
  private desktopOutsideFocusListener?: (event: Event) => void;

  // TrackBy function for performance
  protected trackById = (_index: number, item: NavigationItem): string => item.id;

  // Type guards and state helpers
  protected isGroup = (item: NavigationItem): item is NavigationGroup => !!(item as NavigationGroup).children?.length;
  protected isGroupOpen = (id: string): boolean => this.openGroupsSignal().has(id);
  protected isLinkActive = (path: string): boolean => this.router.url === path;

  constructor() {
    // Effect: manage outside listeners for desktop dropdowns when one is open
    effect(() => {
      const anyTopLevelOpen = this.getTopLevelGroupIds().some(id => this.openGroupsSignal().has(id));
      if (anyTopLevelOpen) {
        this.addDesktopOutsideListeners();
      } else {
        this.removeDesktopOutsideListeners();
      }
    });
  }

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

  private findGroupById(id: string, items: NavigationItem[] = this.items()): NavigationGroup | undefined {
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
    const walk = (items: NavigationItem[]): void => {
      for (const i of items) {
        if (this.isGroup(i)) { collected.push(i.id); walk(i.children); }
      }
    };
    walk(group.children);
    return collected;
  }

  private getTopLevelGroupIds(): string[] {
    return this.items().filter(i => this.isGroup(i)).map(i => i.id);
  }

  // Keyboard navigation for desktop menu
  protected onNavKeydown(event: KeyboardEvent): void {
    const key = event.key;
    const target = event.target as HTMLElement;
    const groupToggleSelector = '.nav-group-toggle';
    const linkSelector = '.nav-link';
    const focusableSelector = `${groupToggleSelector}, ${linkSelector}`;
    const isGroupToggle = target.matches(groupToggleSelector);

    const getSiblings = (): HTMLElement[] => {
      const list = target.closest('ul');
      if (!list) return [] as HTMLElement[];
      return Array.from(list.querySelectorAll<HTMLElement>(`:scope > li ${focusableSelector}`));
    };
    const siblings = getSiblings();
    const idx = siblings.indexOf(target);
    const focus = (el?: HTMLElement): void => el?.focus();

    if (['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End','Escape'].includes(key)) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (key === 'ArrowDown') { focus(siblings[(idx + 1) % siblings.length]); return; }
    if (key === 'ArrowUp') { focus(siblings[(idx - 1 + siblings.length) % siblings.length]); return; }
    if (key === 'Home') { focus(siblings[0]); return; }
    if (key === 'End') { focus(siblings[siblings.length - 1]); return; }
    if (key === 'ArrowRight' && isGroupToggle) {
      const id = target.getAttribute('aria-controls')?.replace(/^grp-/, '') ?? '';
      if (!this.isGroupOpen(id)) { this.toggleGroup(id); return; }
      const panel = this.document.getElementById(target.getAttribute('aria-controls')!);
      const firstChild = panel?.querySelector<HTMLElement>(focusableSelector);
      focus(firstChild || undefined);
      return;
    }
    if (key === 'ArrowLeft') {
      if (isGroupToggle) {
        const id = target.getAttribute('aria-controls')?.replace(/^grp-/, '') ?? '';
        if (this.isGroupOpen(id)) { this.toggleGroup(id); return; }
      }
      const parentLi = target.closest('ul')?.closest('li');
      const parentToggle = parentLi?.querySelector<HTMLElement>(groupToggleSelector);
      focus(parentToggle || undefined);
      return;
    }
    if (key === 'Escape') {
      if (isGroupToggle) {
        const id = target.getAttribute('aria-controls')?.replace(/^grp-/, '') ?? '';
        if (this.isGroupOpen(id)) { this.toggleGroup(id); return; }
      }
      // Close all top-level groups
      this.openGroupsSignal.update(prev => {
        const next = new Set(prev);
        this.getTopLevelGroupIds().forEach(id => next.delete(id));
        return next;
      });
      return;
    }
  }

  // Hover intent only for top-level groups on desktop
  protected onGroupMouseEnter(id: string, depth: number): void {
    if (depth !== 0) return;
    if (!matchMedia || !matchMedia('(pointer:fine)').matches) return;
    const existingTimer = this.hoverTimers.get(id);
    if (existingTimer) clearTimeout(existingTimer);
    const t = setTimeout(() => { if (!this.isGroupOpen(id)) this.toggleGroup(id); }, 120);
    this.hoverTimers.set(id, t);
  }

  protected onGroupMouseLeave(id: string, depth: number, event: MouseEvent): void {
    if (depth !== 0) return;
    if (!matchMedia || !matchMedia('(pointer:fine)').matches) return;
    const existingTimer = this.hoverTimers.get(id);
    if (existingTimer) clearTimeout(existingTimer);
    const related = event.relatedTarget as HTMLElement | null;
    if (related && related.closest(`#grp-${id}`)) return; // moving into panel
    const t = setTimeout(() => { if (this.isGroupOpen(id)) this.toggleGroup(id); }, 300);
    this.hoverTimers.set(id, t);
  }

  ngOnDestroy(): void {
    this.removeDesktopOutsideListeners();
    this.hoverTimers.forEach(timer => clearTimeout(timer));
  }

  private addDesktopOutsideListeners(): void {
    if (!this.desktopOutsideClickListener) {
      this.desktopOutsideClickListener = this.onDesktopOutsideInteraction.bind(this);
      this.document.addEventListener('click', this.desktopOutsideClickListener, true);
    }
    if (!this.desktopOutsideFocusListener) {
      this.desktopOutsideFocusListener = this.onDesktopOutsideInteraction.bind(this);
      this.document.addEventListener('focusin', this.desktopOutsideFocusListener, true);
    }
  }

  private removeDesktopOutsideListeners(): void {
    if (this.desktopOutsideClickListener) {
      this.document.removeEventListener('click', this.desktopOutsideClickListener, true);
      this.desktopOutsideClickListener = undefined;
    }
    if (this.desktopOutsideFocusListener) {
      this.document.removeEventListener('focusin', this.desktopOutsideFocusListener, true);
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
}
