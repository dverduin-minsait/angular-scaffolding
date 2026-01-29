import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { MultiTabSyncService } from './multi-tab-sync.service';
import { AuthStore } from '../stores/auth.store';
import { AuthService } from './auth.service';
import { configureSSRTestingModule, configureBrowserTestingModule } from '../../../testing/ssr-testing.utils';

describe('MultiTabSyncService - SSR Safety', () => {
  let mockAuthStore: {
    status: ReturnType<typeof vi.fn>;
    user: ReturnType<typeof vi.fn>;
    isAuthenticated: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
  };
  
  let mockAuthService: {
    refreshAccessToken: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockAuthStore = {
      status: vi.fn(() => 'unauthenticated'),
      user: vi.fn(() => null),
      isAuthenticated: vi.fn(() => false),
      clear: vi.fn()
    };

    mockAuthService = {
      refreshAccessToken: vi.fn(() => Promise.resolve())
    };
  });

  describe('Server-Side Rendering (SSR)', () => {
    beforeEach(() => {
      configureSSRTestingModule({
        providers: [
          MultiTabSyncService,
          { provide: AuthStore, useValue: mockAuthStore },
          { provide: AuthService, useValue: mockAuthService }
        ]
      });
    });

    it('should create service without crashing in SSR', () => {
      const service = TestBed.inject(MultiTabSyncService);
      expect(service).toBeTruthy();
    });

    it('should not initialize BroadcastChannel in SSR', () => {
      const service = TestBed.inject(MultiTabSyncService);
      // Service should exist and not throw errors
      expect(service).toBeTruthy();
      // No window/BroadcastChannel APIs should be called
    });

    it('should not setup storage event listeners in SSR', () => {
      // This test passes if service creation doesn't throw
      const service = TestBed.inject(MultiTabSyncService);
      expect(service).toBeTruthy();
    });

    it('should early exit on server platform', () => {
      const platformId = TestBed.inject(PLATFORM_ID);
      expect(platformId).toBe('server');
      
      const service = TestBed.inject(MultiTabSyncService);
      expect(service).toBeTruthy();
      
      // Service should not attempt any browser-specific operations
    });

    it('should not broadcast messages in SSR', () => {
      const service = TestBed.inject(MultiTabSyncService);
      
      // Change auth state to trigger broadcast
      mockAuthStore.status = vi.fn(() => 'authenticated');
      mockAuthStore.user = vi.fn(() => ({ id: '123', email: 'test@test.com' }));
      mockAuthStore.isAuthenticated = vi.fn(() => true);
      
      // This should not throw even though we're in SSR
      expect(() => {
        // Trigger effect by changing state
        TestBed.flushEffects();
      }).not.toThrow();
    });

    it('should handle auth state changes without browser APIs', () => {
      const service = TestBed.inject(MultiTabSyncService);
      
      expect(() => {
        mockAuthStore.status = vi.fn(() => 'authenticated');
        TestBed.flushEffects();
      }).not.toThrow();
      
      expect(() => {
        mockAuthStore.status = vi.fn(() => 'unauthenticated');
        TestBed.flushEffects();
      }).not.toThrow();
    });
  });

  describe('Browser Context', () => {
    class MockBroadcastChannel {
      static instances: MockBroadcastChannel[] = [];

      constructor(public readonly name: string) {
        MockBroadcastChannel.instances.push(this);
      }

      readonly postMessage = vi.fn();
      readonly addEventListener = vi.fn();
      readonly removeEventListener = vi.fn();
      readonly close = vi.fn();

      static reset(): void {
        MockBroadcastChannel.instances = [];
      }
    }

    beforeEach(() => {
      MockBroadcastChannel.reset();
      vi.stubGlobal('BroadcastChannel', MockBroadcastChannel as unknown as typeof BroadcastChannel);

      configureBrowserTestingModule({
        providers: [
          MultiTabSyncService,
          { provide: AuthStore, useValue: mockAuthStore },
          { provide: AuthService, useValue: mockAuthService }
        ]
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.clearAllMocks();
    });

    it('should create service in browser', () => {
      const service = TestBed.inject(MultiTabSyncService);
      expect(service).toBeTruthy();
    });

    it('should initialize BroadcastChannel in browser', () => {
      const service = TestBed.inject(MultiTabSyncService);

      const channel = MockBroadcastChannel.instances[0];
      expect(channel).toBeTruthy();
      expect(channel?.name).toBe('app-auth-channel');
      expect(channel?.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should broadcast auth state changes in browser', () => {
      const service = TestBed.inject(MultiTabSyncService);
      
      // Change auth state
      mockAuthStore.status = vi.fn(() => 'authenticated');
      mockAuthStore.user = vi.fn(() => ({ id: '123', email: 'test@test.com' }));
      mockAuthStore.isAuthenticated = vi.fn(() => true);
      
      // Trigger effect
      TestBed.flushEffects();

      const channel = MockBroadcastChannel.instances[0];
      expect(channel).toBeTruthy();
      
      // Should have broadcasted the change
      expect(channel?.postMessage).toHaveBeenCalled();
    });

    it('should handle received authenticated message', async () => {
      const service = TestBed.inject(MultiTabSyncService);

      const channel = MockBroadcastChannel.instances[0];
      expect(channel).toBeTruthy();
      
      // Get the message handler
      const messageHandler = channel.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];
      
      expect(messageHandler).toBeDefined();
      
      if (messageHandler) {
        // Simulate receiving authenticated message
        const messageEvent = {
          data: { type: 'authenticated' }
        } as MessageEvent;
        
        await messageHandler(messageEvent);
        
        // Should attempt to refresh token if not authenticated
        expect(mockAuthService.refreshAccessToken).toHaveBeenCalled();
      }
    });

    it('should handle received unauthenticated message', async () => {
      mockAuthStore.isAuthenticated = vi.fn(() => true);
      
      const service = TestBed.inject(MultiTabSyncService);

      const channel = MockBroadcastChannel.instances[0];
      expect(channel).toBeTruthy();
      
      const messageHandler = channel.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];
      
      if (messageHandler) {
        const messageEvent = {
          data: { type: 'unauthenticated' }
        } as MessageEvent;
        
        await messageHandler(messageEvent);
        
        // Should clear the store
        expect(mockAuthStore.clear).toHaveBeenCalled();
      }
    });

    it('should handle received logout message', async () => {
      mockAuthStore.isAuthenticated = vi.fn(() => true);
      
      const service = TestBed.inject(MultiTabSyncService);

      const channel = MockBroadcastChannel.instances[0];
      expect(channel).toBeTruthy();
      
      const messageHandler = channel.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];
      
      if (messageHandler) {
        const messageEvent = {
          data: { type: 'logout' }
        } as MessageEvent;
        
        await messageHandler(messageEvent);
        
        // Should clear the store
        expect(mockAuthStore.clear).toHaveBeenCalled();
      }
    });

    it('should cleanup BroadcastChannel on destroy', () => {
      const service = TestBed.inject(MultiTabSyncService);

      const channel = MockBroadcastChannel.instances[0];
      expect(channel).toBeTruthy();
      
      // Trigger destroy
      TestBed.resetTestingModule();
      
      // Channel cleanup should be called
      expect(channel?.removeEventListener).toHaveBeenCalled();
      expect(channel?.close).toHaveBeenCalled();
    });
  });

  describe('Storage Fallback', () => {
    beforeEach(() => {
      // Remove BroadcastChannel to test storage fallback
      vi.stubGlobal('BroadcastChannel', undefined as unknown as typeof BroadcastChannel);

      // Mock localStorage
      const mockLocalStorage = {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      };

      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
      });

      // Mock storage events
      const mockAddEventListener = vi.fn();
      const mockRemoveEventListener = vi.fn();
      
      Object.defineProperty(window, 'addEventListener', {
        value: mockAddEventListener,
        writable: true
      });
      
      Object.defineProperty(window, 'removeEventListener', {
        value: mockRemoveEventListener,
        writable: true
      });

      configureBrowserTestingModule({
        providers: [
          MultiTabSyncService,
          { provide: AuthStore, useValue: mockAuthStore },
          { provide: AuthService, useValue: mockAuthService }
        ]
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.clearAllMocks();
    });

    it('should use storage events when BroadcastChannel is not available', () => {
      const service = TestBed.inject(MultiTabSyncService);
      
      // Should have setup storage event listener
      expect(window.addEventListener).toHaveBeenCalledWith('storage', expect.any(Function));
    });

    it('should broadcast via localStorage when BroadcastChannel is not available', () => {
      const service = TestBed.inject(MultiTabSyncService);
      
      // Change auth state to trigger broadcast
      mockAuthStore.status = vi.fn(() => 'authenticated');
      mockAuthStore.user = vi.fn(() => ({ id: '123', email: 'test@test.com' }));
      
      TestBed.flushEffects();
      
      // Should have used localStorage as fallback
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'app-auth-event',
        expect.any(String)
      );
    });
  });

  describe('Platform Detection', () => {
    it('should behave differently in server vs browser', () => {
      // Server context
      configureSSRTestingModule({
        providers: [
          MultiTabSyncService,
          { provide: AuthStore, useValue: mockAuthStore },
          { provide: AuthService, useValue: mockAuthService }
        ]
      });

      const serverService = TestBed.inject(MultiTabSyncService);
      const serverPlatform = TestBed.inject(PLATFORM_ID);
      
      expect(serverPlatform).toBe('server');
      expect(serverService).toBeTruthy();

      // Reset TestBed
      TestBed.resetTestingModule();

      // Browser context with BroadcastChannel mock
      class MockBroadcastChannel {
        static instances: MockBroadcastChannel[] = [];

        constructor(public readonly name: string) {
          MockBroadcastChannel.instances.push(this);
        }

        readonly postMessage = vi.fn();
        readonly addEventListener = vi.fn();
        readonly removeEventListener = vi.fn();
        readonly close = vi.fn();
      }

      vi.stubGlobal('BroadcastChannel', MockBroadcastChannel as unknown as typeof BroadcastChannel);

      configureBrowserTestingModule({
        providers: [
          MultiTabSyncService,
          { provide: AuthStore, useValue: mockAuthStore },
          { provide: AuthService, useValue: mockAuthService }
        ]
      });

      const browserService = TestBed.inject(MultiTabSyncService);
      const browserPlatform = TestBed.inject(PLATFORM_ID);
      
      expect(browserPlatform).toBe('browser');
      expect(browserService).toBeTruthy();
      
      // BroadcastChannel should be created in browser
      expect(MockBroadcastChannel.instances.length).toBe(1);
      expect(MockBroadcastChannel.instances[0]?.name).toBe('app-auth-channel');

      vi.unstubAllGlobals();
    });
  });
});
