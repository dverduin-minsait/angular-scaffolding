import { 
  UserProfile, 
  AuthSessionMeta, 
  AuthStateSnapshot, 
  LoginCredentials, 
  RefreshResponse, 
  MeResponse 
} from './auth.models';

describe('Auth Models', () => {
  describe('UserProfile', () => {
    it('should define correct structure for a basic user', () => {
      const user: UserProfile = {
        id: '123',
        username: 'testuser',
        displayName: 'Test User',
        roles: ['user'],
        permissions: ['read']
      };

      expect(user.id).toBe('123');
      expect(user.username).toBe('testuser');
      expect(user.displayName).toBe('Test User');
      expect(user.roles).toEqual(['user']);
      expect(user.permissions).toEqual(['read']);
      expect(user.email).toBeUndefined();
      expect(user.groups).toBeUndefined();
      expect(user.claims).toBeUndefined();
    });

    it('should support optional email field', () => {
      const user: UserProfile = {
        id: '123',
        username: 'testuser',
        displayName: 'Test User',
        email: 'test@example.com',
        roles: ['user'],
        permissions: ['read']
      };

      expect(user.email).toBe('test@example.com');
    });

    it('should support optional groups field', () => {
      const user: UserProfile = {
        id: '123',
        username: 'testuser',
        displayName: 'Test User',
        roles: ['user'],
        permissions: ['read'],
        groups: ['developers', 'qa-team']
      };

      expect(user.groups).toEqual(['developers', 'qa-team']);
    });

    it('should support optional claims field', () => {
      const user: UserProfile = {
        id: '123',
        username: 'testuser',
        displayName: 'Test User',
        roles: ['user'],
        permissions: ['read'],
        claims: { 
          'custom-claim': 'value',
          'department': 'engineering',
          'level': 3
        }
      };

      expect(user.claims).toEqual({
        'custom-claim': 'value',
        'department': 'engineering',
        'level': 3
      });
    });

    it('should support complex user with all fields', () => {
      const user: UserProfile = {
        id: 'admin-001',
        username: 'admin',
        displayName: 'System Administrator',
        email: 'admin@company.com',
        roles: ['admin', 'manager'],
        permissions: ['read', 'write', 'delete', 'manage-users'],
        groups: ['administrators', 'managers'],
        claims: {
          'department': 'IT',
          'clearance-level': 'high',
          'last-login': '2025-10-20T10:00:00Z'
        }
      };

      expect(user).toMatchObject({
        id: 'admin-001',
        username: 'admin',
        displayName: 'System Administrator',
        email: 'admin@company.com',
        roles: ['admin', 'manager'],
        permissions: ['read', 'write', 'delete', 'manage-users'],
        groups: ['administrators', 'managers'],
        claims: {
          'department': 'IT',
          'clearance-level': 'high',
          'last-login': '2025-10-20T10:00:00Z'
        }
      });
    });
  });

  describe('AuthSessionMeta', () => {
    it('should define correct structure for session metadata', () => {
      const now = Date.now();
      const meta: AuthSessionMeta = {
        accessTokenExpiresAt: now + 3600000, // 1 hour from now
        issuedAt: now
      };

      expect(meta.accessTokenExpiresAt).toBe(now + 3600000);
      expect(meta.issuedAt).toBe(now);
      expect(typeof meta.accessTokenExpiresAt).toBe('number');
      expect(typeof meta.issuedAt).toBe('number');
    });

    it('should handle past and future timestamps', () => {
      const pastTime = Date.now() - 1000;
      const futureTime = Date.now() + 5000;
      
      const meta: AuthSessionMeta = {
        accessTokenExpiresAt: futureTime,
        issuedAt: pastTime
      };

      expect(meta.issuedAt).toBeLessThan(meta.accessTokenExpiresAt);
      expect(meta.issuedAt).toBeLessThan(Date.now());
      expect(meta.accessTokenExpiresAt).toBeGreaterThan(Date.now());
    });
  });

  describe('AuthStateSnapshot', () => {
    it('should define unknown state correctly', () => {
      const state: AuthStateSnapshot = {
        status: 'unknown',
        user: null,
        accessToken: null
      };

      expect(state.status).toBe('unknown');
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.meta).toBeUndefined();
    });

    it('should define unauthenticated state correctly', () => {
      const state: AuthStateSnapshot = {
        status: 'unauthenticated',
        user: null,
        accessToken: null
      };

      expect(state.status).toBe('unauthenticated');
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
    });

    it('should define authenticated state correctly', () => {
      const user: UserProfile = {
        id: '1',
        username: 'test',
        displayName: 'Test User',
        roles: ['user'],
        permissions: ['read']
      };

      const meta: AuthSessionMeta = {
        accessTokenExpiresAt: Date.now() + 3600000,
        issuedAt: Date.now()
      };

      const state: AuthStateSnapshot = {
        status: 'authenticated',
        user,
        accessToken: 'token123',
        meta
      };

      expect(state.status).toBe('authenticated');
      expect(state.user).toBe(user);
      expect(state.accessToken).toBe('token123');
      expect(state.meta).toBe(meta);
    });

    it('should define refreshing state correctly', () => {
      const user: UserProfile = {
        id: '1',
        username: 'test',
        displayName: 'Test User',
        roles: ['user'],
        permissions: ['read']
      };

      const state: AuthStateSnapshot = {
        status: 'refreshing',
        user,
        accessToken: 'old-token',
        meta: {
          accessTokenExpiresAt: Date.now() - 1000, // expired
          issuedAt: Date.now() - 3600000
        }
      };

      expect(state.status).toBe('refreshing');
      expect(state.user).toBe(user);
      expect(state.accessToken).toBe('old-token');
      expect(state.meta).toBeDefined();
    });

    it('should support all valid status values', () => {
      const validStatuses: AuthStateSnapshot['status'][] = [
        'unknown',
        'unauthenticated', 
        'authenticated',
        'refreshing'
      ];

      validStatuses.forEach(status => {
        const state: AuthStateSnapshot = {
          status,
          user: null,
          accessToken: null
        };
        expect(state.status).toBe(status);
      });
    });
  });

  describe('LoginCredentials', () => {
    it('should define correct structure for login credentials', () => {
      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'securepassword123'
      };

      expect(credentials.username).toBe('testuser');
      expect(credentials.password).toBe('securepassword123');
    });

    it('should support various username formats', () => {
      const emailCredentials: LoginCredentials = {
        username: 'user@example.com',
        password: 'password'
      };

      const domainCredentials: LoginCredentials = {
        username: 'DOMAIN\\username',
        password: 'password'
      };

      expect(emailCredentials.username).toBe('user@example.com');
      expect(domainCredentials.username).toBe('DOMAIN\\username');
    });
  });

  describe('RefreshResponse', () => {
    it('should define correct structure without optional user', () => {
      const response: RefreshResponse = {
        accessToken: 'new-access-token',
        expiresIn: 3600
      };

      expect(response.accessToken).toBe('new-access-token');
      expect(response.expiresIn).toBe(3600);
      expect(response.user).toBeUndefined();
    });

    it('should define correct structure with optional user', () => {
      const user: UserProfile = {
        id: '1',
        username: 'test',
        displayName: 'Test User',
        roles: ['user'],
        permissions: ['read']
      };

      const response: RefreshResponse = {
        accessToken: 'new-access-token',
        expiresIn: 3600,
        user
      };

      expect(response.accessToken).toBe('new-access-token');
      expect(response.expiresIn).toBe(3600);
      expect(response.user).toBe(user);
    });

    it('should handle different expiry times', () => {
      const shortLivedResponse: RefreshResponse = {
        accessToken: 'short-token',
        expiresIn: 300 // 5 minutes
      };

      const longLivedResponse: RefreshResponse = {
        accessToken: 'long-token',
        expiresIn: 86400 // 24 hours
      };

      expect(shortLivedResponse.expiresIn).toBe(300);
      expect(longLivedResponse.expiresIn).toBe(86400);
    });
  });

  describe('MeResponse', () => {
    it('should extend UserProfile correctly', () => {
      const meResponse: MeResponse = {
        id: '123',
        username: 'currentuser',
        displayName: 'Current User',
        email: 'current@example.com',
        roles: ['user', 'editor'],
        permissions: ['read', 'write']
      };

      // Should have all UserProfile properties
      expect(meResponse.id).toBe('123');
      expect(meResponse.username).toBe('currentuser');
      expect(meResponse.displayName).toBe('Current User');
      expect(meResponse.email).toBe('current@example.com');
      expect(meResponse.roles).toEqual(['user', 'editor']);
      expect(meResponse.permissions).toEqual(['read', 'write']);

      // Should be assignable to UserProfile
      const userProfile: UserProfile = meResponse;
      expect(userProfile).toBe(meResponse);
    });

    it('should support all optional UserProfile fields', () => {
      const fullMeResponse: MeResponse = {
        id: '456',
        username: 'fulluser',
        displayName: 'Full User',
        email: 'full@example.com',
        roles: ['admin'],
        permissions: ['read', 'write', 'delete'],
        groups: ['admins', 'developers'],
        claims: {
          'department': 'engineering',
          'level': 'senior'
        }
      };

      expect(fullMeResponse.groups).toEqual(['admins', 'developers']);
      expect(fullMeResponse.claims).toEqual({
        'department': 'engineering',
        'level': 'senior'
      });
    });
  });

  describe('Type compatibility', () => {
    it('should allow MeResponse to be used as UserProfile', () => {
      const meResponse: MeResponse = {
        id: '1',
        username: 'test',
        displayName: 'Test User',
        roles: ['user'],
        permissions: ['read']
      };

      // This should compile without errors
      const userProfile: UserProfile = meResponse;
      expect(userProfile).toBe(meResponse);
    });

    it('should allow RefreshResponse with user to provide UserProfile', () => {
      const user: UserProfile = {
        id: '1',
        username: 'test',
        displayName: 'Test User',
        roles: ['user'],
        permissions: ['read']
      };

      const refreshResponse: RefreshResponse = {
        accessToken: 'token',
        expiresIn: 3600,
        user
      };

      if (refreshResponse.user) {
        const extractedUser: UserProfile = refreshResponse.user;
        expect(extractedUser).toBe(user);
      }
    });
  });
});