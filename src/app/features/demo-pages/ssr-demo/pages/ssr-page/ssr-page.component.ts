import { Component, signal, inject, PLATFORM_ID, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';

interface ServerData {
  message: string;
  timestamp: string;
  requestId: string;
  serverInfo: {
    nodeVersion: string;
    platform: string;
  };
}

interface PerformanceMetrics {
  renderType: 'server' | 'client';
  renderTime: string;
  hydrationTime?: string;
  timeToInteractive?: string;
  isHydrated: boolean;
}

@Component({
  selector: 'app-ssr-page',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './ssr-page.component.html',
  styleUrl: './ssr-page.component.scss'
})
export class SsrPageComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  
  // Platform detection
  protected readonly isBrowser = isPlatformBrowser(this.platformId);
  protected readonly isServer = !this.isBrowser;
  
  // Data signals
  protected readonly serverData = signal<ServerData | null>(null);
  protected readonly clientData = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  
  // Performance metrics
  protected readonly metrics = signal<PerformanceMetrics>({
    renderType: this.isBrowser ? 'client' : 'server',
    renderTime: new Date().toISOString(),
    isHydrated: false
  });
  
  // Browser-only features
  protected readonly browserFeatures = signal<{
    userAgent: string;
    language: string;
    screenSize: string;
    cookiesEnabled: boolean;
  } | null>(null);
  
  // Computed values
  protected readonly hasData = computed(() => this.serverData() !== null);
  protected readonly renderInfo = computed(() => {
    const m = this.metrics();
    return `Rendered on ${m.renderType} at ${m.renderTime}`;
  });
  
  constructor() {
    // Initialize on construction (runs on both server and client)
    this.initializeComponent();
    
    // Browser-only initialization
    if (this.isBrowser) {
      this.initializeBrowserFeatures();
      this.trackHydration();
    }
  }
  
  private initializeComponent(): void {
    // Simulate server-side data fetching
    // In real app, this would be an HTTP call that runs on server
    const mockServerData: ServerData = {
      message: 'This data was prepared on the server',
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId(),
      serverInfo: {
        nodeVersion: this.isServer ? 'Node.js (SSR)' : 'Browser (Hydrated)',
        platform: this.isServer ? 'Server' : 'Client'
      }
    };
    
    this.serverData.set(mockServerData);
  }
  
  private initializeBrowserFeatures(): void {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }
    
    this.browserFeatures.set({
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      cookiesEnabled: navigator.cookieEnabled
    });
    
    // Track time to interactive
    if (typeof performance !== 'undefined' && performance.timing) {
      setTimeout(() => {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        this.metrics.update(m => ({
          ...m,
          timeToInteractive: `${loadTime}ms`
        }));
      }, 0);
    }
  }
  
  private trackHydration(): void {
    // Mark hydration completion
    setTimeout(() => {
      const hydrationTime = new Date().toISOString();
      this.metrics.update(m => ({
        ...m,
        hydrationTime,
        isHydrated: true
      }));
    }, 100);
  }
  
  protected fetchClientData(): void {
    if (!this.isBrowser) {
      console.warn('fetchClientData called on server - this should only run in browser');
      return;
    }
    
    this.loading.set(true);
    this.error.set(null);
    
    // Simulate API call
    setTimeout(() => {
      this.clientData.set(`Client-side data fetched at ${new Date().toISOString()}`);
      this.loading.set(false);
    }, 1000);
  }
  
  protected checkDOMAccess(): string {
    if (!this.isBrowser) {
      return 'DOM access blocked on server (SSR-safe)';
    }
    
    return `DOM available: Document title is "${document.title}"`;
  }
  
  protected checkLocalStorage(): string {
    if (!this.isBrowser) {
      return 'localStorage not available on server (SSR-safe)';
    }
    
    try {
      const testKey = 'ssr-demo-test';
      localStorage.setItem(testKey, 'test-value');
      const value = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      return `localStorage working: ${value === 'test-value' ? '✅' : '❌'}`;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return `localStorage error: ${message}`;
    }
  }
  
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
