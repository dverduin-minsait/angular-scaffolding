import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { GridLoaderService } from './grid-loader.service';
import { DeviceService } from './device.service';
import { ThemeService } from './theme.service';

describe('GridLoaderService', () => {
  let service: GridLoaderService;
  let mockThemeService: {
    isDarkMode: ReturnType<typeof signal>;
  };
  let mockDeviceService: {
    supportsGrids: jest.Mock;
  };

  beforeEach(() => {
    mockThemeService = {
      isDarkMode: signal(false)
    };

    mockDeviceService = {
      supportsGrids: jest.fn().mockReturnValue(true)
    };

    TestBed.configureTestingModule({
      providers: [
        GridLoaderService,
        { provide: ThemeService, useValue: mockThemeService },
        { provide: DeviceService, useValue: mockDeviceService },
        { provide: DOCUMENT, useValue: document },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(GridLoaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Theme Integration', () => {
    it('should return correct theme class for light theme', () => {
      mockThemeService.isDarkMode.set(false);
      const themeClass = service.getThemeClass();
      expect(themeClass).toBe('ag-theme-alpine');
    });

    it('should return correct theme class for dark theme', () => {
      mockThemeService.isDarkMode.set(true);
      const themeClass = service.getThemeClass();
      expect(themeClass).toBe('ag-theme-alpine-dark');
    });

    it('should respond to theme changes', () => {
      // Initial state
      expect(service.getThemeClass()).toBe('ag-theme-alpine');
      
      // Change to dark theme
      mockThemeService.isDarkMode.set(true);
      expect(service.getThemeClass()).toBe('ag-theme-alpine-dark');
      
      // Change back to light theme
      mockThemeService.isDarkMode.set(false);
      expect(service.getThemeClass()).toBe('ag-theme-alpine');
    });
  });

  describe('Load State Management', () => {
    it('should provide load state observable', () => {
      expect(service.loadState$).toBeDefined();
      
      service.loadState$.subscribe(state => {
        expect(state).toHaveProperty('isLoading');
        expect(state).toHaveProperty('isLoaded');
        expect(state).toHaveProperty('error');
      });
    });

    it('should provide load state getters', () => {
      expect(typeof service.isLoaded).toBe('boolean');
      expect(typeof service.isLoading).toBe('boolean');
      expect(service.loadError === null || service.loadError instanceof Error).toBeTruthy();
    });
  });

  describe('Device Integration', () => {
    it('should respect device capabilities for grid loading', async () => {
      mockDeviceService.supportsGrids.mockReturnValue(false);
      
      const result = await service.loadGridModule();
      expect(result).toBeNull();
      expect(mockDeviceService.supportsGrids).toHaveBeenCalled();
    });

    it('should attempt to load grid on supported devices', () => {
      mockDeviceService.supportsGrids.mockReturnValue(true);
      
      // Should not throw when checking if grids are supported
      expect(() => service.preload()).not.toThrow();
      expect(mockDeviceService.supportsGrids).toHaveBeenCalled();
    });
  });
});