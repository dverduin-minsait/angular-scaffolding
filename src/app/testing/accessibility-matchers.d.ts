declare global {
  namespace jest {
    interface Matchers<R> {
      toBeAccessible(): R;
      toHaveAriaAttribute(attribute: string, value?: string): R;
    }
  }
}

export {};