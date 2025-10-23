export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  roles: string[];
  permissions: string[];
  // raw groups or ad claims from IIS/ADFS if needed
  groups?: string[];
  // original claims payload if you want to introspect later
  claims?: Record<string, unknown>;
}

export interface AuthSessionMeta {
  accessTokenExpiresAt: number; // epoch ms
  issuedAt: number;             // epoch ms
}

export interface AuthStateSnapshot {
  status: 'unknown' | 'unauthenticated' | 'authenticated' | 'refreshing';
  user: UserProfile | null;
  accessToken: string | null;
  meta?: AuthSessionMeta;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RefreshResponse {
  accessToken: string; // short lived
  expiresIn: number;   // seconds
  user?: UserProfile;  // optionally returned again (allow server optimization)
}

export type MeResponse = UserProfile & {
  // optionally include permissions/roles inline  
}

export type Permission = string;
