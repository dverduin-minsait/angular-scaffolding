import { Injectable, Signal, computed, inject } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { BreadcrumbConfig, BreadcrumbItem } from './breadcrumb.types';
import { filter } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';

// Utility: generate a human readable label from a raw url segment
function autoLabel(segment: string): string {
  if (!segment) return '';
  return segment
    .split('-')
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

function resolveConfig(config: BreadcrumbConfig | undefined, route: ActivatedRouteSnapshot): { label: string; icon?: string; hide?: boolean } | undefined {
  if (!config) return undefined;
  if (typeof config === 'string') {
    return { label: config };
  }
  if (typeof config === 'function') {
    return { label: config(route) };
  }
  const label = typeof config.label === 'function' ? config.label(route) : config.label;
  return { label, icon: config.icon, hide: config.hide };
}

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private readonly router = inject(Router);

  private readonly navEnd$ = this.router.events.pipe(
    filter((ev): ev is NavigationEnd => ev instanceof NavigationEnd),
    startWith<NavigationEnd | null>(null)
  );

  // We only care about triggering recomputation, not the event value itself.
  private readonly itemsInternal = toSignal(this.navEnd$, { initialValue: null });

  readonly items: Signal<BreadcrumbItem[]> = computed(() => {
    // Recompute when navigation event fires
    this.itemsInternal(); // access to establish dependency
    return this.build();
  });

  private build(): BreadcrumbItem[] {
    const root = this.router.routerState.snapshot.root;
    const acc: BreadcrumbItem[] = [];
    this.walk(root, acc, '');
    return acc.map((b, idx, arr) => ({ ...b, isLast: idx === arr.length - 1 }));
  }

  private walk(node: ActivatedRouteSnapshot | null, acc: BreadcrumbItem[], parentUrl: string) {
    if (!node) return;

    const pathSegment = node.url.map(u => u.path).join('/');
    let currentUrl = parentUrl;
    if (pathSegment) {
      currentUrl = `${parentUrl}/${pathSegment}`;
      const rawConfig = node.data?.['breadcrumb'] as BreadcrumbConfig | undefined;
      const resolved = resolveConfig(rawConfig, node);
      const label = resolved?.label || autoLabel(pathSegment);
      const hide = resolved?.hide;
      if (!hide && label) {
        acc.push({
          url: currentUrl,
            label,
            icon: resolved?.icon,
            isLast: false,
            route: node
        });
      }
    }

    // Continue into children
    for (const child of node.children) {
      this.walk(child, acc, currentUrl);
    }
  }
}
