import { Injectable, inject } from '@angular/core';
import { AuthStore } from '../stores/auth.store';
import { LoginCredentials } from '../models/auth.models';
import { MockAuthService } from './mock-auth.service';

// Mock AuthService for development - provides instant authentication without HTTP calls
@Injectable({ providedIn: 'root' })
export class AuthServiceMock {
  private readonly store = inject(AuthStore);
  private readonly mockAuth = inject(MockAuthService);

  /** Mock session initialization - instantly authenticates with default user */
  async initializeSession(): Promise<void> {
    // eslint-disable-next-line no-console
    console.log('[AuthServiceMock] initializeSession starting');
    
    const mockUser = this.mockAuth.getDefaultUser();
    const mockToken = `mock-token-${mockUser.id}-${Date.now()}`;
    
    this.store.setAuthenticated(mockUser, mockToken, 3600); // 1 hour
    
    // eslint-disable-next-line no-console
    console.log('[AuthServiceMock] Mock authentication completed', { 
      user: mockUser.username, 
      permissions: mockUser.permissions 
    });
  }

  /** Mock login - validates against predefined users */
  async login(credentials: LoginCredentials): Promise<void> {
    // eslint-disable-next-line no-console
    console.log('[AuthServiceMock] Mock login attempt', { username: credentials.username });
    
    const result = this.mockAuth.simulateLogin(credentials.username, credentials.password);
    if (result.success && result.user && result.token) {
      this.store.setAuthenticated(result.user, result.token, 3600);
      // eslint-disable-next-line no-console
      console.log('[AuthServiceMock] Mock login successful', { user: result.user.username });
    } else {
      // eslint-disable-next-line no-console
      console.log('[AuthServiceMock] Mock login failed - invalid credentials');
      throw new Error('Invalid credentials');
    }
  }

  /** Mock logout - just clears the store */
  async logout(): Promise<void> {
    // eslint-disable-next-line no-console
    console.log('[AuthServiceMock] Mock logout');
    this.store.clear();
  }

  /** Mock refresh - returns current state */
  async refreshAccessToken(): Promise<boolean> {
    // eslint-disable-next-line no-console
    console.log('[AuthServiceMock] Mock refresh token');
    return this.store.isAuthenticated();
  }

  /** Mock proactive refresh scheduling - no-op in mock */
  scheduleProactiveRefresh(): void {
    // eslint-disable-next-line no-console
    console.log('[AuthServiceMock] Mock proactive refresh scheduled (no-op)');
  }
}