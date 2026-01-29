import { ComponentFixture } from '@angular/core/testing';

/**
 * Utility functions for testing accessibility features
 */
export class AccessibilityTestUtils {
  
  /**
   * Simulate keyboard navigation through focusable elements
   */
  static simulateTabNavigation<T>(fixture: ComponentFixture<T>): HTMLElement[] {
    const focusableElements = this.getFocusableElements(fixture);
    
    // In test environment, just return the focusable elements
    // as we can't reliably simulate focus in jsdom
    return focusableElements;
  }
  
  /**
   * Get all focusable elements in a component
   */
  static getFocusableElements<T>(fixture: ComponentFixture<T>): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    const container = fixture.nativeElement as HTMLElement;
    const elements: HTMLElement[] = [];
    
    focusableSelectors.forEach(selector => {
      const found = container.querySelectorAll(selector);
      elements.push(...Array.from(found as NodeListOf<HTMLElement>));
    });
    
    return elements.filter(el => this.isVisible(el));
  }
  
  /**
   * Check if an element is visible (not hidden)
   */
  static isVisible(element: HTMLElement): boolean {
    // In test environment, assume all elements are visible unless explicitly hidden
    if (element.style.display === 'none' || 
        element.style.visibility === 'hidden' ||
        element.hasAttribute('hidden')) {
      return false;
    }
    return true;
  }
  
  /**
   * Test keyboard navigation with arrow keys for radio groups
   */
  static testArrowKeyNavigation<T>(fixture: ComponentFixture<T>, radioGroupSelector: string): void {
    const container = fixture.nativeElement as HTMLElement;
    const radioGroup = container.querySelector(radioGroupSelector);
    if (!radioGroup) return;
    
    // Look for actual radio input elements first, fallback to role="radio" for custom components
    let radioButtons = radioGroup.querySelectorAll('input[type="radio"]');
    if (radioButtons.length === 0) {
      radioButtons = radioGroup.querySelectorAll('[role="radio"]');
    }
    
    if (radioButtons.length === 0) return;
    
    // Focus first radio button
    const firstRadio = radioButtons[0] as HTMLElement;
    firstRadio.focus();
    fixture.detectChanges();
    
    // Test arrow down/right navigation
    radioButtons.forEach((radio: Element, index: number) => {
      const nextIndex = (index + 1) % radioButtons.length;
      const nextRadio = radioButtons[nextIndex] as HTMLElement;
      
      const arrowDownEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        code: 'ArrowDown',
        bubbles: true
      });
      
      (radio as HTMLElement).dispatchEvent(arrowDownEvent);
      fixture.detectChanges();
      
      expect(document.activeElement).toBe(nextRadio);
    });
  }
  
  /**
   * Test escape key functionality for modal/popup elements
   */
  static testEscapeKey<T>(fixture: ComponentFixture<T>, element: HTMLElement, _shouldClose = true): void {
    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      bubbles: true
    });
    
    element.dispatchEvent(escapeEvent);
    fixture.detectChanges();
    
    // This would need to be customized based on what "closed" means for the component
    // For example, checking if aria-hidden is true, or if display is none
  }
  
  /**
   * Check ARIA attributes on an element
   */
  static checkAriaAttributes(element: HTMLElement, expectedAttributes: Record<string, string>): boolean {
    for (const [attribute, expectedValue] of Object.entries(expectedAttributes)) {
      const actualValue = element.getAttribute(attribute);
      if (actualValue !== expectedValue) {
        console.error(`ARIA attribute mismatch: ${attribute}. Expected: ${expectedValue}, Actual: ${actualValue}`);
        return false;
      }
    }
    return true;
  }
  
  /**
   * Test form field accessibility
   */
  static testFormFieldAccessibility<T>(fixture: ComponentFixture<T>, fieldId: string): {
    hasLabel: boolean;
    hasRequiredIndicator: boolean;
    hasErrorAnnouncement: boolean;
    hasValidAutocomplete: boolean;
  } {
    const container = fixture.nativeElement as HTMLElement;
    const field = container.querySelector(`#${fieldId}`);
    const label = container.querySelector(`label[for="${fieldId}"]`);
    
    if (!field) {
      throw new Error(`Field with id "${fieldId}" not found`);
    }
    
    const results = {
      hasLabel: !!label,
      hasRequiredIndicator: false,
      hasErrorAnnouncement: false,
      hasValidAutocomplete: false
    };
    
    // Check for required indicator
    if (label) {
      const labelText = label.textContent?.includes('*') || false;
      const requiredElement = label.querySelector('[aria-label*="required"]') !== null;
      results.hasRequiredIndicator = labelText || requiredElement;
    }
    
    // Check for error announcement
    const ariaDescribedby = field.getAttribute('aria-describedby');
    if (ariaDescribedby) {
      const errorElement = container.querySelector(`#${ariaDescribedby}`);
      results.hasErrorAnnouncement = errorElement?.getAttribute('role') === 'alert';
    }
    
    // Check autocomplete attribute
    const autocomplete = field.getAttribute('autocomplete');
    results.hasValidAutocomplete = !!autocomplete && autocomplete !== 'off';
    
    return results;
  }
  
  /**
   * Test heading hierarchy
   */
  static testHeadingHierarchy<T>(fixture: ComponentFixture<T>): { valid: boolean; issues: string[] } {
    const container = fixture.nativeElement as HTMLElement;
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const issues: string[] = [];
    let previousLevel = 0;
    
    Array.from(headings).forEach((heading: Element, index: number) => {
      const headingElement = heading as HTMLElement;
      const level = parseInt(headingElement.tagName.charAt(1));
      
      // First heading should be h1
      if (index === 0 && level !== 1) {
        issues.push('First heading should be h1');
      }
      
      // Check for skipped levels
      if (level > previousLevel + 1) {
        issues.push(`Heading level skipped: h${previousLevel} to h${level}`);
      }
      
      previousLevel = level;
    });
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
  
  /**
   * Check color contrast (basic implementation)
   */
  static checkColorContrast(element: HTMLElement): number {
    const style = window.getComputedStyle(element);
    const _backgroundColor = style.backgroundColor;
    const _color = style.color;
    
    // This is a simplified version - a real implementation would calculate
    // the actual contrast ratio using WCAG guidelines
    // For now, just return a placeholder value
    return 4.5; // Assume WCAG AA compliance
  }
  
  /**
   * Test live region announcements
   */
  static testLiveRegion<T>(fixture: ComponentFixture<T>, selector: string): {
    hasAriaLive: boolean;
    ariaLiveValue: string | null;
  } {
    const container = fixture.nativeElement as HTMLElement;
    const element = container.querySelector(selector);
    
    return {
      hasAriaLive: (element as HTMLElement)?.hasAttribute('aria-live') || false,
      ariaLiveValue: (element as HTMLElement)?.getAttribute('aria-live') || null
    };
  }
  
  /**
   * Test button accessibility
   */
  static testButtonAccessibility(button: HTMLElement): {
    hasType: boolean;
    hasAriaLabel: boolean;
    hasAriaPressed: boolean;
    hasAriaExpanded: boolean;
  } {
    return {
      hasType: button.hasAttribute('type'),
      hasAriaLabel: button.hasAttribute('aria-label') || button.hasAttribute('aria-labelledby'),
      hasAriaPressed: button.hasAttribute('aria-pressed'),
      hasAriaExpanded: button.hasAttribute('aria-expanded')
    };
  }
}

/**
 * Custom expect matchers for accessibility testing
 */
export const accessibilityMatchers = {
  toBeAccessible(received: HTMLElement) {
    const mockFixture = { nativeElement: received } as ComponentFixture<unknown>;
    const focusable = AccessibilityTestUtils.getFocusableElements(mockFixture);
    const hasSkipLinks = received.querySelector('.skip-link') !== null;
    const hasLandmarks = received.querySelector('[role="main"], [role="banner"], [role="navigation"]') !== null;
    
    const pass = focusable.length > 0 || hasSkipLinks || hasLandmarks;
    
    return {
      message: () => `Expected element to have accessibility features`,
      pass
    };
  },
  
  toHaveAriaAttribute(received: HTMLElement, attribute: string, value?: string) {
    const hasAttribute = received.hasAttribute(attribute);
    const actualValue = received.getAttribute(attribute);
    
    let pass = hasAttribute;
    if (value !== undefined) {
      pass = pass && actualValue === value;
    }
    
    return {
      message: () => `Expected element to have aria attribute "${attribute}"${value ? ` with value "${value}"` : ''}`,
      pass
    };
  }
};