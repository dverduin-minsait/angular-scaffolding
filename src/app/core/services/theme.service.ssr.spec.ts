import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { ThemeService } from './theme.service';
import { LOCAL_STORAGE } from '../tokens/local.storage.token';
import { 
  configureBrowserTestingModule,
  createMockDocument
} from '../../testing/ssr-testing.utils';

/**
 * ThemeService - SSR Safety Tests
 * 
 * Note: Server-side rendering tests are not included here due to TestBed
 * limitations with server platform teardown. SSR safety is instead verified by:
 * 1. The service implementation using isPlatformBrowser() guards
 * 2. Integration tests in ssr-page.component.spec.ts (23 tests)
 * 3. Manual SSR testing: npm run build && npm run serve:ssr
 * 4. Production SSR builds working correctly
 */
describe('ThemeService - SSR Safety', () => {
  describe('Browser Context', () => {
    let service: ThemeService;
    let mockStorage: {
      getItem: jest.Mock;
      setItem: jest.Mock;
      removeItem: jest.Mock;
      clear: jest.Mock;
    };
    let mockMatchMedia: jest.Mock;
    let mockDocument: {
      documentElement: {
        classList: {
          add: jest.Mock;
          remove: jest.Mock;
          toggle: jest.Mock;
          contains: jest.Mock;
        };
      };
    };

    beforeEach(() => {
      mockStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      };

      mockMatchMedia = jest.fn((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
      }));

      mockDocument = {
        documentElement: {
          classList: {
            add: jest.fn(),
            remove: jest.fn(),
            toggle: jest.fn(),
            contains: jest.fn()
          }
        }
      };

      // Mock window.matchMedia for browser context
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia
      });

      configureBrowserTestingModule({
        providers: [
          ThemeService,
          { provide: LOCAL_STORAGE, useValue: mockStorage },
          { provide: DOCUMENT, useValue: mockDocument }
        ]
      });

      service = TestBed.inject(ThemeService);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should create service in browser', () => {
      expect(service).toBeTruthy();
    });

    it('should access matchMedia in browser context', () => {
      service.setTheme('system');
      // matchMedia should be called for system preference detection
      expect(mockMatchMedia).toHaveBeenCalled();
    });

    it('should apply theme classes to document in browser', () => {
      service.setTheme('dark');
      
      // Allow effect to run
      TestBed.flushEffects();
      
      expect(mockDocument.documentElement.classList.add).toHaveBeenCalled();
    });

    it('should save theme to localStorage in browser', (done) => {
      service.setTheme('dark');
      
      // Wait for debounced storage write
      setTimeout(() => {
        expect(mockStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
        done();
      }, 400);
    });

    it('should load theme from localStorage in browser', () => {
      // Reset TestBed and reconfigure with new storage mock
      TestBed.resetTestingModule();
      
      const newMockStorage = {
        getItem: jest.fn((key: string) => {
          if (key === 'theme') return 'dark';
          if (key === 'theme-auto-switch') return 'false';
          if (key === 'theme-use-system') return 'false'; // Must be false to use saved theme
          if (key === 'theme-high-contrast') return 'false';
          return null;
        }),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      };

      configureBrowserTestingModule({
        providers: [
          ThemeService,
          { provide: LOCAL_STORAGE, useValue: newMockStorage },
          { provide: DOCUMENT, useValue: mockDocument }
        ]
      });

      // Create new service instance to trigger initialization
      const newService = TestBed.inject(ThemeService);
      
      expect(newService.currentTheme()).toBe('dark');
    });

    it('should detect system color scheme preference', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
        onchange: null
      });

      service.setTheme('system');
      expect(service.isDarkMode()).toBe(true);
    });

    it('should handle high contrast preference in browser', () => {
      // Reset TestBed and reconfigure with new mocks
      TestBed.resetTestingModule();
      
      const highContrastMock = {
        matches: true,
        media: '(prefers-contrast: high)',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
        onchange: null
      };

      // New storage mock that returns null for high-contrast (allows system detection)
      const newMockStorage = {
        getItem: jest.fn((key: string) => {
          if (key === 'theme') return 'light';
          if (key === 'theme-auto-switch') return 'false';
          if (key === 'theme-use-system') return 'true';
          if (key === 'theme-high-contrast') return null; // null allows system preference detection
          return null;
        }),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      };

      const newMockMatchMedia = jest.fn((query: string) => {
        if (query === '(prefers-contrast: high)') return highContrastMock;
        return {
          matches: false,
          media: query,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          addListener: jest.fn(),
          removeListener: jest.fn(),
          dispatchEvent: jest.fn(),
          onchange: null
        };
      });

      // Update existing matchMedia mock implementation
      mockMatchMedia.mockImplementation((query: string) => {
        if (query === '(prefers-contrast: high)') return highContrastMock;
        return {
          matches: false,
          media: query,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          addListener: jest.fn(),
          removeListener: jest.fn(),
          dispatchEvent: jest.fn(),
          onchange: null
        };
      });

      configureBrowserTestingModule({
        providers: [
          ThemeService,
          { provide: LOCAL_STORAGE, useValue: newMockStorage },
          { provide: DOCUMENT, useValue: mockDocument }
        ]
      });

      // Create new service instance
      const newService = TestBed.inject(ThemeService);
      
      // High contrast should be detected from system preference
      expect(newService.highContrast()).toBe(true);
    });
  });
});
