import { axe, toHaveNoViolations } from 'jest-axe';
import { ComponentFixture } from '@angular/core/testing';

// Extend Jest with axe matchers
expect.extend(toHaveNoViolations as never);

/**
 * Enhanced accessibility testing utilities using axe-core
 * Provides comprehensive WCAG AA compliance testing
 */

export interface AxeTestOptions {
  /** Disable specific axe rules for this test */
  disabledRules?: string[];
  /** Only run specific axe rules */
  enabledRules?: string[];
  /** Accessibility level to test against */
  level?: 'A' | 'AA' | 'AAA';
  /** Include experimental rules */
  experimental?: boolean;
}

/**
 * Test component for accessibility violations using axe-core
 * 
 * @param fixture - Angular ComponentFixture to test
 * @param options - Configuration for axe testing (rules, level, etc.)
 * @returns Promise that resolves when accessibility test completes
 * 
 * @example
 * ```typescript
 * it('should be accessible', async () => {
 *   const fixture = TestBed.createComponent(MyComponent);
 *   fixture.detectChanges();
 *   
 *   await expectAccessible(fixture);
 * });
 * 
 * // Test with specific accessibility level
 * await expectAccessible(fixture, { level: 'AAA' });
 * 
 * // Disable problematic rules for specific test
 * await expectAccessible(fixture, { 
 *   disabledRules: ['color-contrast'] 
 * });
 * ```
 */
export async function expectAccessible<T>(
  fixture: ComponentFixture<T>,
  options: AxeTestOptions = {}
): Promise<void> {
  const {
    disabledRules = [],
    enabledRules,
    level = 'AA',
    experimental = false
  } = options;

  const element = fixture.nativeElement as HTMLElement;
  
  // Configure axe rules based on options
  const axeOptions: { rules: Record<string, { enabled: boolean }>; tags: string[] } = {
    rules: {},
    tags: [`wcag2${level.toLowerCase()}`, 'wcag21aa']
  };

  // Disable specified rules
  disabledRules.forEach(rule => {
    axeOptions.rules[rule] = { enabled: false };
  });

  // If enabled rules specified, disable all others
  if (enabledRules) {
    const allRules = await getAxeRules();
    allRules.forEach((rule: string) => {
      axeOptions.rules[rule] = { enabled: enabledRules.includes(rule) };
    });
  }

  // Add experimental rules if requested
  if (experimental) {
    axeOptions.tags.push('experimental');
  }

  const results = await axe(element, axeOptions);
  expect(results).toHaveNoViolations();
}

/**
 * Test specific accessibility aspects of a component
 */
export async function expectKeyboardAccessible<T>(
  fixture: ComponentFixture<T>
): Promise<void> {
  await expectAccessible(fixture, {
    enabledRules: [
      'keyboard',
      'focus-order-semantics', 
      'focusable-content',
      'tabindex'
    ]
  });
}

/**
 * Test color contrast compliance
 */
export async function expectGoodContrast<T>(
  fixture: ComponentFixture<T>
): Promise<void> {
  await expectAccessible(fixture, {
    enabledRules: [
      'color-contrast',
      'color-contrast-enhanced'
    ]
  });
}

/**
 * Test semantic structure (headings, landmarks, etc.)
 */
export async function expectSemanticStructure<T>(
  fixture: ComponentFixture<T>
): Promise<void> {
  await expectAccessible(fixture, {
    enabledRules: [
      'landmark-one-main',
      'landmark-complementary-is-top-level',
      'heading-order',
      'page-has-heading-one',
      'region'
    ]
  });
}

/**
 * Test form accessibility
 */
export async function expectAccessibleForm<T>(
  fixture: ComponentFixture<T>
): Promise<void> {
  await expectAccessible(fixture, {
    enabledRules: [
      'label',
      'form-field-multiple-labels',
      'duplicate-id-aria',
      'aria-required-attr',
      'aria-valid-attr-value',
      'aria-input-field-name'
    ]
  });
}

/**
 * Quick accessibility test suite for components
 * Runs common accessibility checks
 */
export async function expectFullAccessibility<T>(
  fixture: ComponentFixture<T>,
  options: AxeTestOptions = {}
): Promise<void> {
  // Run comprehensive accessibility test
  await expectAccessible(fixture, {
    level: 'AA',
    experimental: false,
    ...options
  });
  
  // Additional specific tests
  await expectKeyboardAccessible(fixture);
  await expectGoodContrast(fixture);
}

/**
 * Helper to get all available axe rules
 */
async function getAxeRules(): Promise<string[]> {
  const axeCore = await import('axe-core');
  return axeCore.default.getRules().map(rule => rule.ruleId);
}

/**
 * Create axe configuration for specific use cases
 */
export function createAxeConfig(options: AxeTestOptions = {}): { tags: string[]; rules: Record<string, { enabled: boolean }> } {
  const { level = 'AA', experimental = false } = options;
  
  return {
    tags: [
      `wcag2${level.toLowerCase()}`,
      'wcag21aa',
      ...(experimental ? ['experimental'] : [])
    ],
    rules: options.disabledRules?.reduce((acc, rule) => {
      acc[rule] = { enabled: false };
      return acc;
    }, {} as Record<string, { enabled: boolean }>) || {}
  };
}

// Legacy compatibility - maintain existing interface
export { accessibilityMatchers } from './accessibility-test-utils';