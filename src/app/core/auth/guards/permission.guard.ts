import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from '../stores/auth.store';

// Factory to create a permission-based canMatch guard.
// Usage in route data: canMatch: [permissionGuard(['report.view'])]
export function permissionGuard(required: string | string[]): CanMatchFn {
  return () => {
    const store = inject(AuthStore);
    const router = inject(Router);
    const requiredList = Array.isArray(required) ? required : [required];
    const user = store.user();
    const status = store.status();

    // eslint-disable-next-line no-console
    console.log('[PermissionGuard] evaluating', { 
      required: requiredList, 
      status, 
      isAuth: store.isAuthenticated(), 
      user: user?.username 
    });

    // First check: must be authenticated
    if (status !== 'authenticated' || !store.isAuthenticated()) {
      // eslint-disable-next-line no-console
      console.log('[PermissionGuard] not authenticated (status:', status, ') -> redirect login');
      router.navigate(['/auth/login']);
      return false;
    }
    
    // Second check: user must exist
    if (!user) {
      // eslint-disable-next-line no-console
      console.log('[PermissionGuard] user null after auth -> redirect login');
      router.navigate(['/auth/login']);
      return false;
    }
    
    // Third check: user must have required permissions
    const hasAllPermissions = requiredList.every(p => user.permissions.includes(p));
    if (!hasAllPermissions) {
      // eslint-disable-next-line no-console
      console.log('[PermissionGuard] missing permissions -> forbidden', { 
        required: requiredList, 
        userPerms: user.permissions 
      });
      router.navigate(['/forbidden']);
      return false;
    }
    
    // eslint-disable-next-line no-console
    console.log('[PermissionGuard] permission check passed');
    return true;
  };
}
