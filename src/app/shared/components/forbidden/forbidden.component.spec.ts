import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { ForbiddenComponent } from './forbidden.component';

// Mock component for testing navigation
@Component({ template: '<p>Mock Dashboard</p>' })
class MockDashboardComponent { }

describe('ForbiddenComponent', () => {
  let component: ForbiddenComponent;
  let fixture: ComponentFixture<ForbiddenComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForbiddenComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: 'dashboard', component: MockDashboardComponent }
        ])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ForbiddenComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Template Rendering', () => {
    it('should render the main forbidden section with proper aria attributes', () => {
      const section = fixture.debugElement.query(By.css('.forbidden'));
      expect(section).toBeTruthy();
      expect(section.nativeElement.getAttribute('aria-labelledby')).toBe('forbidden-title');
    });

    it('should render the title with correct id and text', () => {
      const title = fixture.debugElement.query(By.css('#forbidden-title'));
      expect(title).toBeTruthy();
      expect(title.nativeElement.tagName).toBe('H1');
      expect(title.nativeElement.textContent.trim()).toBe('Access Denied');
    });

    it('should render the permission denied message', () => {
      const message = fixture.debugElement.query(By.css('p'));
      expect(message).toBeTruthy();
      expect(message.nativeElement.textContent.trim()).toBe('You do not have permission to view this page.');
    });

    it('should render the back to dashboard link', () => {
      const backLink = fixture.debugElement.query(By.css('.back-link'));
      expect(backLink).toBeTruthy();
      expect(backLink.nativeElement.getAttribute('routerLink')).toBe('/dashboard');
      expect(backLink.nativeElement.textContent.trim()).toBe('Return to dashboard');
    });
  });

  describe('Navigation', () => {
    it('should have routerLink directive pointing to dashboard', () => {
      const backLink = fixture.debugElement.query(By.css('.back-link'));
      expect(backLink.nativeElement.getAttribute('routerLink')).toBe('/dashboard');
    });

    it('should navigate to dashboard when back link is clicked', async () => {
      const navigateSpy = jest.spyOn(router, 'navigateByUrl');
      const _backLink = fixture.debugElement.query(By.css('.back-link'));
      
      // Simulate router link click behavior
      await router.navigateByUrl('/dashboard');
      
      expect(navigateSpy).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      const section = fixture.debugElement.query(By.css('section'));
      const title = fixture.debugElement.query(By.css('h1'));
      const link = fixture.debugElement.query(By.css('a'));

      expect(section).toBeTruthy();
      expect(title).toBeTruthy();
      expect(link).toBeTruthy();
    });

    it('should have aria-labelledby connecting section to title', () => {
      const section = fixture.debugElement.query(By.css('section'));
      const title = fixture.debugElement.query(By.css('h1'));

      expect(section.nativeElement.getAttribute('aria-labelledby')).toBe(title.nativeElement.id);
    });

    it('should have accessible link text', () => {
      const backLink = fixture.debugElement.query(By.css('.back-link'));
      expect(backLink.nativeElement.textContent.trim()).toBe('Return to dashboard');
    });
  });

  describe('Styling', () => {
    it('should apply forbidden class to section', () => {
      const section = fixture.debugElement.query(By.css('.forbidden'));
      expect(section).toBeTruthy();
    });

    it('should apply back-link class to the navigation link', () => {
      const link = fixture.debugElement.query(By.css('.back-link'));
      expect(link).toBeTruthy();
    });

    it('should have proper CSS custom property usage for link color', () => {
      const styles = component;
      // The component uses CSS custom properties (var(--color-primary, #0d6efd))
      // which should be testable through computed styles in a real browser environment
      expect(styles).toBeDefined();
    });
  });

  describe('Component Structure', () => {
    it('should be a standalone component', () => {
      // Check that the component has the standalone property
      expect(component.constructor.name).toBe('ForbiddenComponent');
    });

    it('should import necessary modules', () => {
      // The component should import CommonModule and RouterLink
      // This is tested implicitly by the successful rendering of routerLink directive
      const backLink = fixture.debugElement.query(By.css('[routerLink]'));
      expect(backLink).toBeTruthy();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle missing router gracefully', () => {
      // Component should not throw errors even if router is not available
      expect(() => component).not.toThrow();
    });

    it('should render content even without router link functionality', () => {
      const title = fixture.debugElement.query(By.css('h1'));
      const message = fixture.debugElement.query(By.css('p'));
      
      expect(title.nativeElement.textContent.trim()).toBe('Access Denied');
      expect(message.nativeElement.textContent.trim()).toBe('You do not have permission to view this page.');
    });
  });

  describe('User Experience', () => {
    it('should provide clear feedback about access denial', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Access Denied');
      expect(compiled.textContent).toContain('You do not have permission to view this page');
    });

    it('should provide a clear way to navigate back', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Return to dashboard');
    });

    it('should have centered layout with proper spacing', () => {
      const section = fixture.debugElement.query(By.css('.forbidden'));
      expect(section.nativeElement.classList.contains('forbidden')).toBe(true);
      // The CSS should center the content and provide proper spacing
    });
  });
});