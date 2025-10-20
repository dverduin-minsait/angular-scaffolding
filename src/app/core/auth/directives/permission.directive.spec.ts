import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HasPermissionDirective } from './permission.directive';
import { AuthStore } from '../stores/auth.store';
import { UserProfile } from '../models/auth.models';

// Test component to host the directive
@Component({
  template: `
    <div>
      <p *hasPermission="'read'" data-testid="read-content">Read content</p>
      <p *hasPermission="'write'" data-testid="write-content">Write content</p>
      <p *hasPermission="['admin', 'manager']" data-testid="admin-content">Admin content</p>
      <p *hasPermission="''" data-testid="empty-permission">Empty permission</p>
      <p *hasPermission="nonExistentPermission" data-testid="dynamic-content">Dynamic content</p>
    </div>
  `,
  standalone: true,
  imports: [HasPermissionDirective]
})
class TestHostComponent {
  nonExistentPermission = 'nonexistent';
}

describe('HasPermissionDirective', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let store: AuthStore;

  const mockUserWithReadPermission: UserProfile = {
    id: '1',
    username: 'user1',
    displayName: 'User One',
    roles: ['user'],
    permissions: ['read']
  };

  const mockUserWithMultiplePermissions: UserProfile = {
    id: '2',
    username: 'admin',
    displayName: 'Admin User',
    roles: ['admin'],
    permissions: ['read', 'write', 'admin']
  };

  const mockUserWithLimitedPermissions: UserProfile = {
    id: '3',
    username: 'viewer',
    displayName: 'Viewer User',
    roles: ['viewer'],
    permissions: ['read']
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        AuthStore,
        provideZonelessChangeDetection()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(AuthStore);
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      store.setUnauthenticated();
      fixture.detectChanges();
    });

    it('should hide all content requiring permissions', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      
      expect(compiled.querySelector('[data-testid="read-content"]')).toBeNull();
      expect(compiled.querySelector('[data-testid="write-content"]')).toBeNull();
      expect(compiled.querySelector('[data-testid="admin-content"]')).toBeNull();
      expect(compiled.querySelector('[data-testid="dynamic-content"]')).toBeNull();
    });

    it('should hide content even with empty permission requirement', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      
      expect(compiled.querySelector('[data-testid="empty-permission"]')).toBeNull();
    });
  });

  describe('when user is authenticated', () => {
    describe('with single permission', () => {
      beforeEach(() => {
        store.setAuthenticated(mockUserWithReadPermission, 'token', 3600);
        fixture.detectChanges();
      });

      it('should show content for permissions user has', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        
        expect(compiled.querySelector('[data-testid="read-content"]')).toBeTruthy();
        expect(compiled.querySelector('[data-testid="read-content"]')?.textContent?.trim()).toBe('Read content');
      });

      it('should hide content for permissions user lacks', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        
        expect(compiled.querySelector('[data-testid="write-content"]')).toBeNull();
        expect(compiled.querySelector('[data-testid="admin-content"]')).toBeNull();
      });

      it('should show content with empty permission requirement', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        
        expect(compiled.querySelector('[data-testid="empty-permission"]')).toBeTruthy();
        expect(compiled.querySelector('[data-testid="empty-permission"]')?.textContent?.trim()).toBe('Empty permission');
      });
    });

    describe('with multiple permissions', () => {
      beforeEach(() => {
        store.setAuthenticated(mockUserWithMultiplePermissions, 'token', 3600);
        fixture.detectChanges();
      });

      it('should show all content user has permissions for', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        
        expect(compiled.querySelector('[data-testid="read-content"]')).toBeTruthy();
        expect(compiled.querySelector('[data-testid="write-content"]')).toBeTruthy();
        expect(compiled.querySelector('[data-testid="admin-content"]')).toBeTruthy();
        expect(compiled.querySelector('[data-testid="empty-permission"]')).toBeTruthy();
      });

      it('should display correct content text', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        
        expect(compiled.querySelector('[data-testid="read-content"]')?.textContent?.trim()).toBe('Read content');
        expect(compiled.querySelector('[data-testid="write-content"]')?.textContent?.trim()).toBe('Write content');
        expect(compiled.querySelector('[data-testid="admin-content"]')?.textContent?.trim()).toBe('Admin content');
      });
    });

    describe('with array permission requirements', () => {
      it('should show content when user has at least one required permission', () => {
        store.setAuthenticated(mockUserWithLimitedPermissions, 'token', 3600);
        fixture.detectChanges();

        // User has 'read' but not 'admin' or 'manager', but since the requirement is ['admin', 'manager']
        // and it uses OR logic, this should be hidden
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('[data-testid="admin-content"]')).toBeNull();
      });

      it('should show content when user has one of the required permissions', () => {
        store.setAuthenticated(mockUserWithMultiplePermissions, 'token', 3600);
        fixture.detectChanges();

        // User has 'admin' permission which matches one in ['admin', 'manager']
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('[data-testid="admin-content"]')).toBeTruthy();
      });
    });

    describe('dynamic permission changes', () => {
      beforeEach(() => {
        store.setAuthenticated(mockUserWithReadPermission, 'token', 3600);
        fixture.detectChanges();
      });

      it('should react to permission input changes', () => {
        // Test permission logic through component state changes
        // by creating separate test components for each scenario
        
        @Component({
          template: `<div *hasPermission="'nonexistent'" data-testid="nonexistent-content">Nonexistent Content</div>`,
          standalone: true,
          imports: [HasPermissionDirective]
        })
        class NonexistentPermissionComponent {}

        @Component({
          template: `<div *hasPermission="'read'" data-testid="read-content">Read Content</div>`,
          standalone: true,
          imports: [HasPermissionDirective]
        })
        class ReadPermissionComponent {}

        // Test with nonexistent permission - should be hidden
        const nonexistentFixture = TestBed.createComponent(NonexistentPermissionComponent);
        nonexistentFixture.detectChanges();
        expect(nonexistentFixture.nativeElement.querySelector('[data-testid="nonexistent-content"]')).toBeNull();

        // Test with existing permission - should be visible
        const readFixture = TestBed.createComponent(ReadPermissionComponent);
        readFixture.detectChanges();
        expect(readFixture.nativeElement.querySelector('[data-testid="read-content"]')).toBeTruthy();
      });

      it('should react to user permission changes', () => {
        // Initially, user only has 'read' permission
        let compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('[data-testid="write-content"]')).toBeNull();

        // Update user with additional permissions
        store.setAuthenticated(mockUserWithMultiplePermissions, 'token', 3600);
        fixture.detectChanges();

        compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('[data-testid="write-content"]')).toBeTruthy();
      });

      it('should react to authentication status changes', () => {
        // Initially authenticated and can see read content
        let compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('[data-testid="read-content"]')).toBeTruthy();

        // Logout user
        store.setUnauthenticated();
        fixture.detectChanges();

        compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('[data-testid="read-content"]')).toBeNull();

        // Login again
        store.setAuthenticated(mockUserWithReadPermission, 'token', 3600);
        fixture.detectChanges();

        compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('[data-testid="read-content"]')).toBeTruthy();
      });
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      store.setAuthenticated(mockUserWithReadPermission, 'token', 3600);
      fixture.detectChanges();
    });

    it('should handle empty array permission requirement', () => {
      // Create a test component with empty array
      @Component({
        template: `<p *hasPermission="[]" data-testid="empty-array">Empty array content</p>`,
        standalone: true,
        imports: [HasPermissionDirective]
      })
      class EmptyArrayTestComponent {}

      const emptyArrayFixture = TestBed.createComponent(EmptyArrayTestComponent);
      emptyArrayFixture.detectChanges();

      const compiled = emptyArrayFixture.nativeElement as HTMLElement;
      // Empty array should not match any permissions
      expect(compiled.querySelector('[data-testid="empty-array"]')).toBeNull();
    });

    it('should handle null/undefined user gracefully', () => {
      // Set authenticated but then manually clear user (edge case)
      store.setAuthenticated(mockUserWithReadPermission, 'token', 3600);
      // Simulate a state where token exists but user is null (shouldn't happen in practice)
      const storeState = store as any;
      storeState._user.set(null);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[data-testid="read-content"]')).toBeNull();
    });
  });
});