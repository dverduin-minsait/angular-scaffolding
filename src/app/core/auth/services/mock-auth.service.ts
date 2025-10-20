import { Injectable } from '@angular/core';
import { UserProfile } from '../models/auth.models';

// Mock auth service for development - bypasses HTTP calls
@Injectable({ providedIn: 'root' })
export class MockAuthService {
  
  // Simulate different users for testing
  private mockUsers: UserProfile[] = [
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
      roles: ['user'],
      permissions: ['dashboard.view'] // removed clothes.view to test permission guard
    },
    {
      id: '3',
      username: 'editor', 
      displayName: 'Editor User',
      roles: ['editor'],
      permissions: ['dashboard.view', 'clothes.view', 'clothes.read', 'clothes.write']
    }
  ];

  // Get mock user by username
  getMockUser(username: string): UserProfile | null {
    return this.mockUsers.find(u => u.username === username) || null;
  }

  // Get default authenticated user for auto-login
  getDefaultUser(): UserProfile {
    return this.mockUsers[0]; // admin user - has all permissions
  }

  // Simulate login success
  simulateLogin(username: string, password: string): { success: boolean; user?: UserProfile; token?: string } {
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
}