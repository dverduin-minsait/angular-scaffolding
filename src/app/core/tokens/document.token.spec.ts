import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { WINDOW_DOCUMENT } from './document.token';

describe('WINDOW_DOCUMENT Token', () => {
  let mockDocument: Partial<Document>;

  beforeEach(() => {
    mockDocument = {
      createElement: jest.fn(),
      querySelector: jest.fn(),
      getElementById: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };
  });

  describe('browser environment', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: DOCUMENT, useValue: mockDocument }
        ]
      });
    });

    it('should provide the document object in browser environment', () => {
      const windowDocument = TestBed.inject(WINDOW_DOCUMENT);
      
      expect(windowDocument).toBe(mockDocument);
    });

    it('should provide document with browser-specific methods', () => {
      const windowDocument = TestBed.inject(WINDOW_DOCUMENT);
      
      expect(typeof windowDocument.createElement).toBe('function');
      expect(typeof windowDocument.querySelector).toBe('function');
      expect(typeof windowDocument.getElementById).toBe('function');
    });
  });

  describe('server environment', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: DOCUMENT, useValue: mockDocument }
        ]
      });
    });

    it('should provide the document object in server environment', () => {
      const windowDocument = TestBed.inject(WINDOW_DOCUMENT);
      
      expect(windowDocument).toBe(mockDocument);
    });

    it('should handle server-side document gracefully', () => {
      const windowDocument = TestBed.inject(WINDOW_DOCUMENT);
      
      // Should still be the injected document from @angular/common
      expect(windowDocument).toBeDefined();
      expect(windowDocument).toBe(mockDocument);
    });
  });

  describe('token configuration', () => {
    it('should be provided in root', () => {
      // This test verifies the token is properly configured for dependency injection
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: DOCUMENT, useValue: mockDocument }
        ]
      });

      expect(() => TestBed.inject(WINDOW_DOCUMENT)).not.toThrow();
    });

    it('should have correct token description', () => {
      expect(WINDOW_DOCUMENT.toString()).toContain('WindowDocument');
    });
  });
});