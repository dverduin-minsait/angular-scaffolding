import 'vitest';

declare module 'vitest' {
  interface Assertion<T = any> {
    toBeAccessible(): T;
    toHaveAriaAttribute(attribute: string, value?: string): T;
  }

  interface AsymmetricMatchersContaining {
    toBeAccessible(): unknown;
    toHaveAriaAttribute(attribute: string, value?: string): unknown;
  }
}