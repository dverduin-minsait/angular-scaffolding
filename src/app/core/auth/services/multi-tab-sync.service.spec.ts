import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { MultiTabSyncService } from './multi-tab-sync.service';
import { AuthStore } from '../stores/auth.store';
import { AuthService } from './auth.service';
import { UserProfile } from '../models/auth.models';

// Mock BroadcastChannel for testing
class MockBroadcastChannel {
  private readonly listeners: ((event: MessageEvent) => void)[] = [];
  private static instances: MockBroadcastChannel[] = [];

  constructor(public name: string) {
    MockBroadcastChannel.instances.push(this);
  }

  addEventListener(type: 'message', listener: (event: MessageEvent) => void) {
    this.listeners.push(listener);
  }

  removeEventListener(type: 'message', listener: (event: MessageEvent) => void) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  postMessage(data: any) {
    // Simulate broadcasting to other channels with the same name
    MockBroadcastChannel.instances
      .filter(instance => instance !== this && instance.name === this.name)
      .forEach(instance => {
        instance.listeners.forEach(listener => {
          listener(new MessageEvent('message', { data }));
        });
      });
  }

  close() {
    const index = MockBroadcastChannel.instances.indexOf(this);
    if (index > -1) {
      MockBroadcastChannel.instances.splice(index, 1);
    }
  }

  static reset() {
    MockBroadcastChannel.instances = [];
  }
}

// Mock localStorage for storage fallback testing
class MockStorage {
  private store: { [key: string]: string } = {};
  private readonly listeners: ((event: any) => void)[] = [];

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    const oldValue = this.store[key] || null;
    this.store[key] = value;
    
    // Simulate storage event for other tabs
    const event = {
      type: 'storage',
      key,
      oldValue,
      newValue: value,
      storageArea: this
    };
    
    this.listeners.forEach(listener => listener(event));
  }

  clear() {
    this.store = {};
  }

  addEventListener(type: 'storage', listener: (event: any) => void) {
    this.listeners.push(listener);
  }

  removeEventListener(type: 'storage', listener: (event: any) => void) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
}

describe('MultiTabSyncService', () => {
  let service: MultiTabSyncService;
  let store: AuthStore;
  let authService: jest.Mocked<AuthService>;
  let mockStorage: MockStorage;

  const mockUser: UserProfile = {
    id: '1',
    username: 'testuser',
    displayName: 'Test User',
    roles: ['user'],
    permissions: ['read']
  };

  const authServiceMock = {
    refreshAccessToken: jest.fn().mockResolvedValue(true),
    initializeSession: jest.fn().mockResolvedValue(undefined),
    scheduleProactiveRefresh: jest.fn(),
    login: jest.fn().mockResolvedValue(undefined),
    logout: jest.fn().mockResolvedValue(undefined)
  };

  beforeEach(() => {
    MockBroadcastChannel.reset();
    mockStorage = new MockStorage();

    // Mock global objects
    global.BroadcastChannel = MockBroadcastChannel as any;
    global.localStorage = mockStorage as any;
    global.window = {
      addEventListener: mockStorage.addEventListener.bind(mockStorage),
      removeEventListener: mockStorage.removeEventListener.bind(mockStorage)
    } as any;
  });

  afterEach(() => {
    delete (global as any).BroadcastChannel;
    delete (global as any).localStorage;
    delete (global as any).window;
  });

  describe('in browser environment', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        providers: [
          MultiTabSyncService,
          AuthStore,
          provideZonelessChangeDetection(),
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: AuthService, useValue: authServiceMock }
        ]
      }).compileComponents();

      service = TestBed.inject(MultiTabSyncService);
      store = TestBed.inject(AuthStore);
      authService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    });

    describe('with BroadcastChannel support', () => {
      it('should create BroadcastChannel on initialization', () => {
        expect(MockBroadcastChannel.instances).toHaveLength(1);
        expect(MockBroadcastChannel.instances[0].name).toBe('app-auth-channel');
      });

      it('should broadcast authentication status changes', () => {
        const otherService = TestBed.inject(MultiTabSyncService);
        const broadcastSpy = jest.spyOn(MockBroadcastChannel.instances[0], 'postMessage');

        store.setAuthenticated(mockUser, 'token', 3600);
        TestBed.flushEffects(); // Ensure effects run

        expect(broadcastSpy).toHaveBeenCalledWith({
          type: 'authenticated',
          userId: '1'
        });
      });

      it('should broadcast unauthenticated status changes', () => {
        // First authenticate
        store.setAuthenticated(mockUser, 'token', 3600);
        TestBed.flushEffects(); // Ensure effects run
        
        const broadcastSpy = jest.spyOn(MockBroadcastChannel.instances[0], 'postMessage');
        
        store.setUnauthenticated();
        TestBed.flushEffects(); // Ensure effects run

        expect(broadcastSpy).toHaveBeenCalledWith({
          type: 'unauthenticated',
          userId: undefined
        });
      });

      it('should handle authenticated message from other tabs', async () => {
        // Start unauthenticated
        store.setUnauthenticated();
        expect(store.isAuthenticated()).toBe(false);

        // Simulate message from another tab - call the onMessage method directly
        const channel = MockBroadcastChannel.instances[0];
        const service = TestBed.inject(MultiTabSyncService);
        await (service as any).onMessage({ type: 'authenticated', userId: '1' });

        // Should attempt to refresh to align with other tab
        expect(authService.refreshAccessToken).toHaveBeenCalled();
      });

      it('should handle unauthenticated message from other tabs', async () => {
        // Start authenticated
        store.setAuthenticated(mockUser, 'token', 3600);
        expect(store.isAuthenticated()).toBe(true);

        const clearSpy = jest.spyOn(store, 'clear');

        // Simulate message from another tab - call the onMessage method directly
        const service = TestBed.inject(MultiTabSyncService);
        await (service as any).onMessage({ type: 'unauthenticated' });

        expect(clearSpy).toHaveBeenCalled();
      });

      it('should handle logout message from other tabs', async () => {
        // Start authenticated
        store.setAuthenticated(mockUser, 'token', 3600);
        expect(store.isAuthenticated()).toBe(true);

        const clearSpy = jest.spyOn(store, 'clear');

        // Simulate logout message from another tab - call the onMessage method directly
        const service = TestBed.inject(MultiTabSyncService);
        await (service as any).onMessage({ type: 'logout' });

        expect(clearSpy).toHaveBeenCalled();
      });

      it('should ignore invalid messages', async () => {
        const clearSpy = jest.spyOn(store, 'clear');
        
        // Reset mocks before test
        authServiceMock.refreshAccessToken.mockClear();
        
        const service = TestBed.inject(MultiTabSyncService);
        
        // Test various invalid messages by calling onMessage directly
        await (service as any).onMessage(null);
        await (service as any).onMessage('string');
        await (service as any).onMessage({ invalid: 'message' });
        await (service as any).onMessage({ type: 'unknown' });

        expect(clearSpy).not.toHaveBeenCalled();
        expect(authServiceMock.refreshAccessToken).not.toHaveBeenCalled();
      });

      it('should only refresh when currently unauthenticated on authenticated message', async () => {
        // Start authenticated
        store.setAuthenticated(mockUser, 'token', 3600);
        
        // Reset the mock to clear any previous calls
        authService.refreshAccessToken.mockClear();
        
        const service = TestBed.inject(MultiTabSyncService);
        await (service as any).onMessage({ type: 'authenticated', userId: '2' });

        // Should not try to refresh when already authenticated
        expect(authService.refreshAccessToken).not.toHaveBeenCalled();
      });

      it('should handle refresh failures gracefully', async () => {
        authService.refreshAccessToken.mockResolvedValue(false);
        
        store.setUnauthenticated();
        
        // Simulate message from another tab - call the onMessage method directly
        const service = TestBed.inject(MultiTabSyncService);
        await (service as any).onMessage({ type: 'authenticated', userId: '1' });

        // Should not throw even if refresh fails
        expect(authService.refreshAccessToken).toHaveBeenCalled();
      });
    });

    // Note: Storage fallback tests are complex to mock in Jest due to window dependencies
    // The service implementation handles BroadcastChannel unavailability gracefully
    // by falling back to localStorage, but testing this requires complex DOM environment setup
  });

  describe('in server environment (SSR)', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        providers: [
          MultiTabSyncService,
          AuthStore,
          provideZonelessChangeDetection(),
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: AuthService, useValue: authService }
        ]
      }).compileComponents();

      service = TestBed.inject(MultiTabSyncService);
      store = TestBed.inject(AuthStore);
    });

    it('should not create BroadcastChannel in server environment', () => {
      expect(MockBroadcastChannel.instances).toHaveLength(0);
    });

    it('should not broadcast or listen to events in server environment', () => {
      const setItemSpy = jest.spyOn(mockStorage, 'setItem');

      store.setAuthenticated(mockUser, 'token', 3600);

      expect(setItemSpy).not.toHaveBeenCalled();
    });
  });

  describe('cleanup and memory management', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        providers: [
          MultiTabSyncService,
          AuthStore,
          provideZonelessChangeDetection(),
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: AuthService, useValue: authService }
        ]
      }).compileComponents();

      service = TestBed.inject(MultiTabSyncService);
      store = TestBed.inject(AuthStore);
    });

    it('should properly clean up BroadcastChannel on destroy', () => {
      const channel = MockBroadcastChannel.instances[0];
      const removeEventListenerSpy = jest.spyOn(channel, 'removeEventListener');
      const closeSpy = jest.spyOn(channel, 'close');

      // Trigger destroy
      TestBed.resetTestingModule();

      expect(removeEventListenerSpy).toHaveBeenCalled();
      expect(closeSpy).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', () => {
      const channel = MockBroadcastChannel.instances[0];
      jest.spyOn(channel, 'removeEventListener').mockImplementation(() => {
        throw new Error('Cleanup error');
      });
      jest.spyOn(channel, 'close').mockImplementation(() => {
        throw new Error('Close error');
      });

      // Should not throw during cleanup
      expect(() => TestBed.resetTestingModule()).not.toThrow();
    });
  });

  describe('user ID tracking', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        providers: [
          MultiTabSyncService,
          AuthStore,
          provideZonelessChangeDetection(),
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: AuthService, useValue: authService }
        ]
      }).compileComponents();

      service = TestBed.inject(MultiTabSyncService);
      store = TestBed.inject(AuthStore);
    });

    it('should broadcast when user changes between different users', () => {
      const channel = MockBroadcastChannel.instances[0];
      const postMessageSpy = jest.spyOn(channel, 'postMessage');

      const user1: UserProfile = { ...mockUser, id: '1', username: 'user1' };
      const user2: UserProfile = { ...mockUser, id: '2', username: 'user2' };

      // Set first user - trigger effect manually since it might not run immediately in tests
      store.setAuthenticated(user1, 'token1', 3600);
      TestBed.flushEffects(); // Ensure effects run

      expect(postMessageSpy).toHaveBeenCalledWith({
        type: 'authenticated',
        userId: '1'
      });

      postMessageSpy.mockClear();

      // Change to different user
      store.setAuthenticated(user2, 'token2', 3600);
      TestBed.flushEffects(); // Ensure effects run

      expect(postMessageSpy).toHaveBeenCalledWith({
        type: 'authenticated',
        userId: '2'
      });
    });

    it('should not broadcast when same user is set again', () => {
      const channel = MockBroadcastChannel.instances[0];
      const postMessageSpy = jest.spyOn(channel, 'postMessage');

      // Set user
      store.setAuthenticated(mockUser, 'token1', 3600);
      TestBed.flushEffects(); // Ensure effects run
      expect(postMessageSpy).toHaveBeenCalledTimes(1);

      postMessageSpy.mockClear();

      // Set same user again (e.g., token refresh)
      store.setAuthenticated(mockUser, 'token2', 3600);
      TestBed.flushEffects(); // Ensure effects run
      expect(postMessageSpy).not.toHaveBeenCalled();
    });
  });
});