import { Injectable, inject } from '@angular/core';
import { AuthStore } from '../stores/auth.store';
import { LoginCredentials, UserProfile } from '../models/auth.models';

// Mock AuthService for development - provides instant authentication without HTTP calls
@Injectable({ providedIn: 'root' })
export class AuthServiceMock {
  private readonly store = inject(AuthStore);

  // Mock users data - moved from separate MockAuthService
  private readonly mockUsers: UserProfile[] = [
    {
      id: '1',
      username: 'admin',
      displayName: 'Admin User',
      email: 'admin@example.com',
      roles: ['admin'],
      permissions: ['dashboard.view', 'clothes.view', 'clothes.read', 'clothes.write', 'clothes.delete', 'users.manage']
    },
    {
      id: '2', 
      username: 'viewer',
      displayName: 'View Only User',
      email: 'viewer@example.com',
      roles: ['user'],
      permissions: ['dashboard.view'] // limited permissions to test permission guard
    },
    {
      id: '3',
      username: 'editor', 
      displayName: 'Editor User',
      email: 'editor@example.com',
      roles: ['editor'],
      permissions: ['dashboard.view', 'clothes.view', 'clothes.read', 'clothes.write']
    }
  ];

  // Helper methods - moved from MockAuthService
  private getMockUser(username: string): UserProfile | null {
    return this.mockUsers.find(u => u.username === username) || null;
  }

  private getDefaultUser(): UserProfile {
    return this.mockUsers[0]; // admin user - has all permissions
  }

  private simulateLogin(username: string, password: string): { success: boolean; user?: UserProfile; token?: string } {
    // Simple mock validation
    if (password === 'password' || password === 'admin' || password === username) {
      const user = this.getMockUser(username);
      if (user) {
        return { 
          success: true, 
          user, 
          token: `mock-token-${user.id}-${Date.now()}` 
        };
      }
    }
    return { success: false };
  }

  /** Mock session initialization - instantly authenticates with default user */
  async initializeSession(): Promise<void> {
    // eslint-disable-next-line no-console
    console.log('[AuthServiceMock] initializeSession starting');
    
    const mockUser = this.getDefaultUser();
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
    
    const result = this.simulateLogin(credentials.username, credentials.password);
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