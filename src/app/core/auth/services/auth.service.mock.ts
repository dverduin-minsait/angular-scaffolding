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
  initializeSession(): Promise<void> {
     
    console.log('[AuthServiceMock] initializeSession starting');
    
    const mockUser = this.getDefaultUser();
    const mockToken = `mock-token-${mockUser.id}-${Date.now()}`;
    
    this.store.setAuthenticated(mockUser, mockToken, 3600); // 1 hour
    
     
    console.log('[AuthServiceMock] Mock authentication completed', { 
      user: mockUser.username, 
      permissions: mockUser.permissions 
    });
    return Promise.resolve();
  }

  /** Mock login - validates against predefined users */
  login(credentials: LoginCredentials): Promise<void> {
     
    console.log('[AuthServiceMock] Mock login attempt', { username: credentials.username });
    
    const result = this.simulateLogin(credentials.username, credentials.password);
    if (result.success && result.user && result.token) {
      this.store.setAuthenticated(result.user, result.token, 3600);
       
      console.log('[AuthServiceMock] Mock login successful', { user: result.user.username });
      return Promise.resolve();
    } else {
       
      console.log('[AuthServiceMock] Mock login failed - invalid credentials');
      throw new Error('Invalid credentials');
    }
  }

  /** Mock logout - just clears the store */
  logout(): Promise<void> {
     
    console.log('[AuthServiceMock] Mock logout');
    this.store.clear();
    return Promise.resolve();
  }

  /** Mock refresh - returns current state */
  refreshAccessToken(): Promise<boolean> {
     
    console.log('[AuthServiceMock] Mock refresh token');
    return Promise.resolve(this.store.isAuthenticated());
  }

  /** Mock proactive refresh scheduling - no-op in mock */
  scheduleProactiveRefresh(): void {
     
    console.log('[AuthServiceMock] Mock proactive refresh scheduled (no-op)');
  }
}