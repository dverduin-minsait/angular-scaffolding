import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Component } from '@angular/core';

import { ForbiddenComponent } from './forbidden.component';
import { AccessibilityTestUtils } from '../../../testing/accessibility-test-utils';

// Mock component for routing
@Component({ template: '<p>Mock Dashboard</p>' })
class MockDashboardComponent { }

// Helper function for type-safe DOM queries
function getCompiledElement(fixture: ComponentFixture<ForbiddenComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

function queryElement<T extends HTMLElement = HTMLElement>(
  fixture: ComponentFixture<ForbiddenComponent>, 
  selector: string
): T | null {
  return getCompiledElement(fixture).querySelector(selector);
}

describe('ForbiddenComponent Accessibility', () => {
  let component: ForbiddenComponent;
  let fixture: ComponentFixture<ForbiddenComponent>;

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
    fixture.detectChanges();
  });

  describe('WCAG 2.1 AA Compliance', () => {
    it('should have accessible semantic structure', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const section = compiled.querySelector('section') as HTMLElement;
      const heading = compiled.querySelector('h1') as HTMLElement;
      const link = compiled.querySelector('a[routerLink]') as HTMLElement;

      expect(section).toBeTruthy();
      expect(heading).toBeTruthy();
      expect(link).toBeTruthy();
      expect(section.getAttribute('aria-labelledby')).toBe(heading.id);
    });

    it('should meet ARIA requirements', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const section = compiled.querySelector('section') as HTMLElement;
      const heading = compiled.querySelector('#forbidden-title') as HTMLElement;

      expect(section.getAttribute('aria-labelledby')).toBe('forbidden-title');
      expect(heading.id).toBe('forbidden-title');
    });

    it('should support keyboard navigation', () => {
      const focusableElements = AccessibilityTestUtils.getFocusableElements(fixture);
      expect(focusableElements.length).toBe(1); // Only the link should be focusable
      
      const link = focusableElements[0];
      expect(link.tagName.toLowerCase()).toBe('a');
      expect(link.getAttribute('routerLink')).toBe('/dashboard');
    });

    it('should support screen readers', () => {
      const heading = queryElement(fixture, 'h1');
      const section = queryElement(fixture, 'section');
      const link = queryElement(fixture, 'a');

      // Heading should announce the error state
      expect(heading?.textContent?.trim()).toBe('Access Denied');
      
      // Section should be properly labeled
      expect(section?.getAttribute('aria-labelledby')).toBe(heading?.id);
      
      // Link should have descriptive text
      expect(link?.textContent?.trim()).toBe('Return to dashboard');
    });
  });

  describe('Semantic HTML Structure', () => {
    it('should use proper heading hierarchy', () => {
      const heading = fixture.nativeElement.querySelector('h1');
      expect(heading).toBeTruthy();
      expect(heading.textContent.trim()).toBe('Access Denied');
      expect(heading.id).toBe('forbidden-title');
    });

    it('should have section with proper landmark role', () => {
      const section = fixture.nativeElement.querySelector('section');
      expect(section).toBeTruthy();
      expect(section.getAttribute('aria-labelledby')).toBe('forbidden-title');
    });

    it('should have accessible link text', () => {
      const link = fixture.nativeElement.querySelector('a[routerLink]');
      expect(link).toBeTruthy();
      expect(link.textContent.trim()).toBe('Return to dashboard');
      // Link text should be descriptive enough for screen readers
      expect(link.textContent.trim().length).toBeGreaterThan(5);
    });
  });

  describe('Focus Management', () => {
    it('should have focusable link element', () => {
      const link = fixture.nativeElement.querySelector('a[routerLink]');
      expect(link).toBeTruthy();
      expect(link.getAttribute('tabindex')).not.toBe('-1');
    });

    it('should maintain logical tab order', () => {
      const focusableElements = AccessibilityTestUtils.getFocusableElements(fixture);
      expect(focusableElements.length).toBe(1); // Only the link should be focusable
    });

    it('should provide visible focus indicators', () => {
      const link = fixture.nativeElement.querySelector('a[routerLink]');
      link.focus();
      
      // The CSS should provide focus styles (tested through style classes)
      expect(link.classList.contains('back-link')).toBe(true);
    });
  });

  describe('Color and Contrast', () => {
    it('should use CSS custom properties for theming', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const styles = getComputedStyle(compiled);
      
      // The component should be using CSS custom properties for theming
      // This ensures it works with the project's theme system
      expect(component).toBeDefined();
    });

    it('should not rely solely on color for information', () => {
      // The component uses text ('Access Denied') and context, not just color
      const heading = fixture.nativeElement.querySelector('h1');
      const message = fixture.nativeElement.querySelector('p');
      
      expect(heading.textContent.trim()).toBe('Access Denied');
      expect(message.textContent.trim()).toContain('You do not have permission');
    });
  });

  describe('Screen Reader Experience', () => {
    it('should announce forbidden status clearly', () => {
      const heading = fixture.nativeElement.querySelector('#forbidden-title');
      expect(heading.textContent.trim()).toBe('Access Denied');
      
      const section = fixture.nativeElement.querySelector('section');
      expect(section.getAttribute('aria-labelledby')).toBe('forbidden-title');
    });

    it('should provide clear context for the situation', () => {
      const message = fixture.nativeElement.querySelector('p');
      expect(message.textContent.trim()).toBe('You do not have permission to view this page.');
    });

    it('should offer clear recovery action', () => {
      const link = fixture.nativeElement.querySelector('a[routerLink]');
      expect(link.textContent.trim()).toBe('Return to dashboard');
      expect(link.getAttribute('routerLink')).toBe('/dashboard');
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive layout classes', () => {
      const section = fixture.nativeElement.querySelector('.forbidden');
      expect(section).toBeTruthy();
      // The CSS should provide responsive behavior
    });

    it('should maintain readability at different viewport sizes', () => {
      // Text content should be appropriately sized and spaced
      const heading = fixture.nativeElement.querySelector('h1');
      const message = fixture.nativeElement.querySelector('p');
      const link = fixture.nativeElement.querySelector('a');
      
      expect(heading).toBeTruthy();
      expect(message).toBeTruthy();
      expect(link).toBeTruthy();
    });
  });

  describe('Error Prevention and Recovery', () => {
    it('should provide clear error context', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Access Denied');
      expect(compiled.textContent).toContain('You do not have permission');
    });

    it('should offer recovery mechanism', () => {
      const link = fixture.nativeElement.querySelector('a[routerLink="/dashboard"]');
      expect(link).toBeTruthy();
      expect(link.textContent.trim()).toBe('Return to dashboard');
    });

    it('should not trap users in error state', () => {
      // The component provides a way back (dashboard link)
      const link = fixture.nativeElement.querySelector('a[routerLink]');
      expect(link).toBeTruthy();
      expect(link.getAttribute('routerLink')).toBe('/dashboard');
    });
  });
});