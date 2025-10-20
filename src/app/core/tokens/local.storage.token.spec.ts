import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { LOCAL_STORAGE, localStorageProvider, StorageService } from './local.storage.token';

describe('LOCAL_STORAGE Token', () => {
  let storageService: StorageService;

  describe('browser environment', () => {
    let mockLocalStorage: Partial<Storage>;

    beforeEach(() => {
      // Mock localStorage for browser environment
      mockLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        length: 0,
        key: jest.fn()
      };

      // Mock the global localStorage
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
      });

      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          localStorageProvider
        ]
      });

      storageService = TestBed.inject(LOCAL_STORAGE);
    });

    it('should provide localStorage functionality in browser', () => {
      expect(storageService).toBeDefined();
      expect(typeof storageService.getItem).toBe('function');
      expect(typeof storageService.setItem).toBe('function');
      expect(typeof storageService.removeItem).toBe('function');
      expect(typeof storageService.clear).toBe('function');
    });

    it('should call localStorage.getItem when getItem is called', () => {
      const testKey = 'test-key';
      const expectedValue = 'test-value';
      
      (mockLocalStorage.getItem as jest.Mock).mockReturnValue(expectedValue);
      
      const result = storageService.getItem(testKey);
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(testKey);
      expect(result).toBe(expectedValue);
    });

    it('should call localStorage.setItem when setItem is called', () => {
      const testKey = 'test-key';
      const testValue = 'test-value';
      
      storageService.setItem(testKey, testValue);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(testKey, testValue);
    });

    it('should call localStorage.removeItem when removeItem is called', () => {
      const testKey = 'test-key';
      
      storageService.removeItem(testKey);
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(testKey);
    });

    it('should call localStorage.clear when clear is called', () => {
      storageService.clear();
      
      expect(mockLocalStorage.clear).toHaveBeenCalledTimes(1);
    });

    it('should return null when localStorage.getItem returns null', () => {
      const testKey = 'non-existent-key';
      
      (mockLocalStorage.getItem as jest.Mock).mockReturnValue(null);
      
      const result = storageService.getItem(testKey);
      
      expect(result).toBeNull();
    });
  });

  describe('server environment', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'server' },
          localStorageProvider
        ]
      });

      storageService = TestBed.inject(LOCAL_STORAGE);
    });

    it('should provide no-op storage functionality in server environment', () => {
      expect(storageService).toBeDefined();
      expect(typeof storageService.getItem).toBe('function');
      expect(typeof storageService.setItem).toBe('function');
      expect(typeof storageService.removeItem).toBe('function');
      expect(typeof storageService.clear).toBe('function');
    });

    it('should return null for getItem in server environment', () => {
      const result = storageService.getItem('any-key');
      
      expect(result).toBeNull();
    });

    it('should handle setItem gracefully in server environment', () => {
      expect(() => {
        storageService.setItem('test-key', 'test-value');
      }).not.toThrow();
    });

    it('should handle removeItem gracefully in server environment', () => {
      expect(() => {
        storageService.removeItem('test-key');
      }).not.toThrow();
    });

    it('should handle clear gracefully in server environment', () => {
      expect(() => {
        storageService.clear();
      }).not.toThrow();
    });
  });

  describe('token configuration', () => {
    it('should have correct token description', () => {
      expect(LOCAL_STORAGE.toString()).toContain('LOCAL_STORAGE');
    });

    it('should provide the service without throwing', () => {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          localStorageProvider
        ]
      });

      expect(() => TestBed.inject(LOCAL_STORAGE)).not.toThrow();
    });
  });

  describe('StorageService interface', () => {
    it('should implement all required methods', () => {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          localStorageProvider
        ]
      });

      const service = TestBed.inject(LOCAL_STORAGE);

      // Verify interface compliance
      expect(service).toHaveProperty('getItem');
      expect(service).toHaveProperty('setItem');
      expect(service).toHaveProperty('removeItem');
      expect(service).toHaveProperty('clear');
    });
  });
});