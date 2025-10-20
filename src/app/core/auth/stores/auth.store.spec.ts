import { TestBed } from '@angular/core/testing';
import { AuthStore } from './auth.store';

describe('AuthStore', () => {
  let store: AuthStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AuthStore] });
    store = TestBed.inject(AuthStore);
  });

  it('starts unknown', () => {
    expect(store.status()).toBe('unknown');
  });

  it('can set authenticated and compute expiry delta', () => {
    store.setAuthenticated({ id: '1', username: 'u', displayName: 'User', roles: [], permissions: [] }, 'token', 60);
    expect(store.isAuthenticated()).toBe(true);
    expect(store.msUntilExpiry()).toBeGreaterThan(50_000);
  });

  it('clears on logout', () => {
    store.setAuthenticated({ id: '1', username: 'u', displayName: 'User', roles: [], permissions: [] }, 'token', 60);
    store.clear();
    expect(store.isAuthenticated()).toBe(false);
  });
});
