import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from './auth.service';
import { AuthStore } from '../stores/auth.store';
import { LoginCredentials, UserProfile, RefreshResponse, MeResponse } from '../models/auth.models';
import { ENVIRONMENT } from '../../../../environments/environment';

type HttpClientMock = {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

describe('AuthService', () => {
  let service: AuthService;
  let store: AuthStore;
  let httpClient: HttpClientMock;

  const mockUser: UserProfile = {
    id: '1',
    username: 'testuser',
    displayName: 'Test User',
    email: 'test@example.com',
    roles: ['user'],
    permissions: ['dashboard.view']
  };

  const mockRefreshResponse: RefreshResponse = {
    accessToken: 'new-access-token',
    expiresIn: 3600,
    user: mockUser
  };

  const mockLoginResponse = {
    ...mockRefreshResponse,
    user: mockUser
  };

  beforeEach(async () => {
    const httpClientMock = {
      get: vi.fn(),
      post: vi.fn()
    };

    await TestBed.configureTestingModule({
      providers: [
        AuthService,
        AuthStore,
        provideZonelessChangeDetection(),
        { provide: HttpClient, useValue: httpClientMock }
      ]
    }).compileComponents();

    service = TestBed.inject(AuthService);
    store = TestBed.inject(AuthStore);
    httpClient = TestBed.inject(HttpClient) as unknown as HttpClientMock;
  });

  describe('initializeSession', () => {
    it('should initialize session via refresh when refresh token is valid', async () => {
      const storeSpy = vi.spyOn(store, 'setAuthenticated');
      httpClient.post.mockReturnValue(of(mockRefreshResponse));

      await service.initializeSession();

      expect(httpClient.post).toHaveBeenCalledWith(`${ENVIRONMENT.API_URL}/auth/refresh`, {});
      expect(storeSpy).toHaveBeenCalledWith(mockUser, 'new-access-token', 3600);
    });

    it('should initialize session via SSO when refresh fails but /me succeeds', async () => {
      const storeSpy = vi.spyOn(store, 'setAuthenticated');
      httpClient.post
        .mockReturnValueOnce(throwError(() => new Error('No refresh token'))) // refresh fails
        .mockReturnValueOnce(of(mockRefreshResponse)); // second refresh after /me succeeds
      httpClient.get.mockReturnValue(of(mockUser as MeResponse));

      await service.initializeSession();

      expect(httpClient.get).toHaveBeenCalledWith(`${ENVIRONMENT.API_URL}/auth/me`);
      expect(httpClient.post).toHaveBeenCalledWith(`${ENVIRONMENT.API_URL}/auth/refresh`, {});
      expect(storeSpy).toHaveBeenCalledWith(mockUser, 'new-access-token', 3600);
    });

    it('should set unauthenticated when both refresh and SSO fail', async () => {
      const storeSpy = vi.spyOn(store, 'setUnauthenticated');
      httpClient.post.mockReturnValue(throwError(() => new Error('Refresh failed')));
      httpClient.get.mockReturnValue(throwError(() => new Error('Me failed')));

      await service.initializeSession();

      expect(storeSpy).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      const storeSpy = vi.spyOn(store, 'setUnauthenticated');
      httpClient.post.mockImplementation(() => {
        throw new Error('Network error');
      });

      await service.initializeSession();

      expect(storeSpy).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'password'
      };
      const storeSpy = vi.spyOn(store, 'setAuthenticated');
      httpClient.post.mockReturnValue(of(mockLoginResponse));

      await service.login(credentials);

      expect(httpClient.post).toHaveBeenCalledWith(
        `${ENVIRONMENT.API_URL}/auth/login`,
        credentials
      );
      expect(storeSpy).toHaveBeenCalledWith(mockUser, 'new-access-token', 3600);
    });

    it('should propagate login errors', async () => {
      const credentials: LoginCredentials = {
        username: 'invalid',
        password: 'invalid'
      };
      httpClient.post.mockReturnValue(throwError(() => new Error('Invalid credentials')));

      await expect(service.login(credentials)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should logout successfully and clear store', async () => {
      const storeSpy = vi.spyOn(store, 'clear');
      httpClient.post.mockReturnValue(of({}));

      await service.logout();

      expect(httpClient.post).toHaveBeenCalledWith(`${ENVIRONMENT.API_URL}/auth/logout`, {});
      expect(storeSpy).toHaveBeenCalled();
    });

    it('should clear store even if logout request fails', async () => {
      const storeSpy = vi.spyOn(store, 'clear');
      httpClient.post.mockReturnValue(throwError(() => new Error('Server error')));

      await service.logout();

      expect(storeSpy).toHaveBeenCalled();
    });
  });

  describe('refreshAccessToken', () => {
    beforeEach(() => {
      // Set initial authenticated state
      store.setAuthenticated(mockUser, 'old-token', 3600);
    });

    it('should refresh access token successfully', async () => {
      const storeSpy = vi.spyOn(store, 'setAuthenticated');
      httpClient.post.mockReturnValue(of(mockRefreshResponse));

      const result = await service.refreshAccessToken();

      expect(result).toBe(true);
      expect(storeSpy).toHaveBeenCalledWith(mockUser, 'new-access-token', 3600);
    });

    it('should handle refresh failure and set unauthenticated', async () => {
      const storeSpy = vi.spyOn(store, 'setUnauthenticated');
      httpClient.post.mockReturnValue(throwError(() => new Error('Refresh failed')));

      const result = await service.refreshAccessToken();

      expect(result).toBe(false);
      expect(storeSpy).toHaveBeenCalled();
    });

    it('should debounce concurrent refresh calls', async () => {
      httpClient.post.mockReturnValue(of(mockRefreshResponse));

      // Call refresh multiple times concurrently
      const promises = [
        service.refreshAccessToken(),
        service.refreshAccessToken(),
        service.refreshAccessToken()
      ];

      const results = await Promise.all(promises);

      // All should succeed
      expect(results).toEqual([true, true, true]);
      // But HTTP call should only happen once due to debouncing
      expect(httpClient.post).toHaveBeenCalledTimes(1);
    });

    it('should fetch user from /me if not included in refresh response', async () => {
      const refreshResponseWithoutUser: RefreshResponse = {
        accessToken: 'new-token',
        expiresIn: 3600
      };
      
      // Clear the existing user from store to force /me call
      store.clear();
      store.setRefreshing();
      
      const storeSpy = vi.spyOn(store, 'setAuthenticated');
      
      httpClient.post.mockReturnValue(of(refreshResponseWithoutUser));
      httpClient.get.mockReturnValue(of(mockUser as MeResponse));

      const result = await service.refreshAccessToken();

      expect(result).toBe(true);
      expect(httpClient.get).toHaveBeenCalledWith(`${ENVIRONMENT.API_URL}/auth/me`);
      expect(storeSpy).toHaveBeenCalledWith(mockUser, 'new-token', 3600);
    });

    it('should set unauthenticated if refresh succeeds but user fetch fails', async () => {
      const refreshResponseWithoutUser: RefreshResponse = {
        accessToken: 'new-token',
        expiresIn: 3600
      };
      
      // Clear the existing user from store to force /me call
      store.clear();
      store.setRefreshing();
      
      const storeSpy = vi.spyOn(store, 'setUnauthenticated');
      
      httpClient.post.mockReturnValue(of(refreshResponseWithoutUser));
      httpClient.get.mockReturnValue(throwError(() => new Error('Me failed')));

      const result = await service.refreshAccessToken();

      expect(result).toBe(false);
      expect(storeSpy).toHaveBeenCalled();
    });
  });

  describe('scheduleProactiveRefresh', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should schedule refresh before token expires', () => {
      const refreshSpy = vi.spyOn(service, 'refreshAccessToken').mockResolvedValue(true);
      
      // Set authenticated with token expiring in 60 seconds
      store.setAuthenticated(mockUser, 'token', 60);
      
      service.scheduleProactiveRefresh();

      // Fast-forward time to just before refresh should trigger (60s - 45s lead = 15s)
      vi.advanceTimersByTime(14000);
      expect(refreshSpy).not.toHaveBeenCalled();

      // Advance past the refresh point
      vi.advanceTimersByTime(2000);
      expect(refreshSpy).toHaveBeenCalled();
    });

    it('should not schedule refresh when not authenticated', () => {
      const refreshSpy = vi.spyOn(service, 'refreshAccessToken').mockResolvedValue(true);
      
      service.scheduleProactiveRefresh();

      vi.advanceTimersByTime(60000);
      expect(refreshSpy).not.toHaveBeenCalled();
    });

    it('should reschedule when token is refreshed', () => {
      const refreshSpy = vi.spyOn(service, 'refreshAccessToken').mockResolvedValue(true);
      
      // Initial token with 60s expiry
      store.setAuthenticated(mockUser, 'token1', 60);
      service.scheduleProactiveRefresh();

      // Update token with new expiry
      store.setAuthenticated(mockUser, 'token2', 120);

      // Original timer should be cleared and new one scheduled
      vi.advanceTimersByTime(16000); // Original would have triggered at 15s
      expect(refreshSpy).not.toHaveBeenCalled();

      // New timer should trigger at 75s (120s - 45s lead)
      vi.advanceTimersByTime(60000); // Total 76s
      expect(refreshSpy).toHaveBeenCalled();
    });
  });
});