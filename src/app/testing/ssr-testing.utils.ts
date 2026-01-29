import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

/**
 * SSR Testing Utilities
 * 
 * These utilities help test components and services in SSR (server) context
 * to ensure they don't crash or have undefined behavior during server-side rendering.
 */

/**
 * Configure TestBed to simulate SSR (server platform)
 * 
 * Usage:
 * ```typescript
 * beforeEach(() => {
 *   configureSSRTestingModule({
 *     imports: [MyComponent],
 *     providers: [MyService]
 *   });
 * });
 * ```
 */
export function configureSSRTestingModule(config: {
  imports?: unknown[];
  providers?: unknown[];
  declarations?: unknown[];
}): void {
  TestBed.configureTestingModule({
    ...config,
    providers: [
      ...(config.providers || []),
      { provide: PLATFORM_ID, useValue: 'server' }
    ]
  });
}

/**
 * Configure TestBed to simulate Browser platform
 * 
 * Usage:
 * ```typescript
 * beforeEach(() => {
 *   configureBrowserTestingModule({
 *     imports: [MyComponent],
 *     providers: [MyService]
 *   });
 * });
 * ```
 */
export function configureBrowserTestingModule(config: {
  imports?: unknown[];
  providers?: unknown[];
  declarations?: unknown[];
}): void {
  TestBed.configureTestingModule({
    ...config,
    providers: [
      ...(config.providers || []),
      { provide: PLATFORM_ID, useValue: 'browser' }
    ]
  });
}

/**
 * Test a component in both SSR and Browser contexts
 * 
 * Usage:
 * ```typescript
 * testComponentInBothContexts(MyComponent, (fixture, context) => {
 *   expect(() => fixture.detectChanges()).not.toThrow();
 *   
 *   if (context === 'browser') {
 *     // Browser-specific assertions
 *   } else {
 *     // SSR-specific assertions
 *   }
 * });
 * ```
 */
export function testComponentInBothContexts<T>(
  component: { new (...args: unknown[]): T },
  testFn: (fixture: ReturnType<typeof TestBed.createComponent<T>>, context: 'browser' | 'server') => void
): void {
  describe('in SSR context', () => {
    beforeEach(() => {
      configureSSRTestingModule({ imports: [component] });
    });

    it('should not crash during server-side rendering', () => {
      const fixture = TestBed.createComponent(component);
      testFn(fixture, 'server');
    });
  });

  describe('in Browser context', () => {
    beforeEach(() => {
      configureBrowserTestingModule({ imports: [component] });
    });

    it('should work correctly in browser', () => {
      const fixture = TestBed.createComponent(component);
      testFn(fixture, 'browser');
    });
  });
}

/**
 * Create a mock Window object for testing
 */
export function createMockWindow(overrides?: Partial<Window>): Partial<Window> {
  return {
    matchMedia: vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    })) as unknown as typeof window.matchMedia,
    localStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn()
    },
    sessionStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn()
    },
    navigator: {
      userAgent: 'Mozilla/5.0 (Test)',
      language: 'en-US',
      platform: 'Test'
    } as Navigator,
    ...overrides
  };
}

/**
 * Create a mock Document object for testing
 */
export function createMockDocument(overrides?: Partial<Document>): Partial<Document> {
  return {
    documentElement: {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        toggle: vi.fn(),
        contains: vi.fn()
      }
    } as unknown as HTMLElement,
    createElement: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(),
    getElementById: vi.fn(),
    ...overrides
  };
}

/**
 * Mock localStorage for SSR tests
 */
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

/**
 * Mock sessionStorage for SSR tests
 */
export const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

/**
 * Setup global mocks for browser APIs in SSR context
 * Call this in beforeAll or beforeEach for SSR tests
 */
export function setupSSRMocks(): void {
  // Mock window if it doesn't exist (SSR context)
  if (typeof window === 'undefined') {
    (global as { window?: Partial<Window> }).window = createMockWindow();
  }
  
  // Mock document if it doesn't exist
  if (typeof document === 'undefined') {
    (global as { document?: Partial<Document> }).document = createMockDocument();
  }
  
  // Mock localStorage
  if (typeof localStorage === 'undefined') {
    (global as { localStorage?: Storage }).localStorage = mockLocalStorage as unknown as Storage;
  }
  
  // Mock sessionStorage
  if (typeof sessionStorage === 'undefined') {
    (global as { sessionStorage?: Storage }).sessionStorage = mockSessionStorage as unknown as Storage;
  }
}

/**
 * Cleanup global mocks after SSR tests
 */
export function cleanupSSRMocks(): void {
  vi.clearAllMocks();
}

/**
 * Assert that a function doesn't access browser-specific APIs in SSR
 */
export function assertSSRSafe(fn: () => void): void {
  const originalWindow = global.window;
  const originalDocument = global.document;
  const originalLocalStorage = global.localStorage;
  
  try {
    // Remove global browser objects
    delete (global as { window?: unknown }).window;
    delete (global as { document?: unknown }).document;
    delete (global as { localStorage?: unknown }).localStorage;
    
    // Function should not throw
    expect(fn).not.toThrow();
  } finally {
    // Restore global objects
    if (originalWindow) (global as { window: unknown }).window = originalWindow;
    if (originalDocument) (global as { document: unknown }).document = originalDocument;
    if (originalLocalStorage) (global as { localStorage: unknown }).localStorage = originalLocalStorage;
  }
}
