/// <reference types="jest" />
/// <reference types="jest-axe" />

// Extend global expect for axe matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R;
    }
  }
}

export {};