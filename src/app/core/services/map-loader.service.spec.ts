import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MapLoaderService } from './map-loader.service';

describe('MapLoaderService', () => {
  describe('in browser context', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          MapLoaderService,
          { provide: PLATFORM_ID, useValue: 'browser' }
        ]
      });
    });

    it('should be created', () => {
      const service = TestBed.inject(MapLoaderService);
      expect(service).toBeTruthy();
    });

    it('should have initial load state with isLoaded false', () => {
      const service = TestBed.inject(MapLoaderService);
      const state = service.loadState();
      expect(state.isLoaded).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should load leaflet and return module', async () => {
      const service = TestBed.inject(MapLoaderService);
      const module = await service.loadLeaflet();
      expect(module).toBeTruthy();
      expect(typeof (module as Record<string, unknown>)['map']).toBe('function');
      expect(service.loadState().isLoaded).toBe(true);
    });

    it('should return cached module on second call', async () => {
      const service = TestBed.inject(MapLoaderService);
      const first = await service.loadLeaflet();
      const second = await service.loadLeaflet();
      expect(first).toBe(second);
    });

    it('should not call import() twice when called concurrently', async () => {
      const service = TestBed.inject(MapLoaderService);
      const [a, b] = await Promise.all([service.loadLeaflet(), service.loadLeaflet()]);
      expect(a).toBe(b);
    });
  });

  describe('in SSR context', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          MapLoaderService,
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });
    });

    it('should return null in SSR', async () => {
      const service = TestBed.inject(MapLoaderService);
      const module = await service.loadLeaflet();
      expect(module).toBeNull();
    });

    it('should not update load state in SSR', async () => {
      const service = TestBed.inject(MapLoaderService);
      await service.loadLeaflet();
      expect(service.loadState().isLoaded).toBe(false);
    });
  });
});
