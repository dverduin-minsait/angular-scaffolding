import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { DashboardPersistenceService, DASHBOARD_PERSISTENCE_STRATEGY } from './dashboard-persistence.service';
import { LOCAL_STORAGE, StorageService } from '../../../core/tokens/local.storage.token';
import { PersistedDashboardState } from '../models/dashboard-grid.model';

describe('DashboardPersistenceService', () => {
  const mockState: PersistedDashboardState = {
    layout: {
      id: 'test',
      name: 'Test Layout',
      columns: 12,
      rows: 8,
      widgets: [
        { id: 'w1', title: 'Widget 1', type: 'stat', position: { col: 0, row: 0 }, size: { cols: 2, rows: 2 } }
      ]
    },
    responsiveLayouts: {
      id: 'test',
      name: 'Test Layout',
      breakpointLayouts: [
        { tier: 'desktop', widgets: [
          { id: 'w1', title: 'Widget 1', type: 'stat', position: { col: 0, row: 0 }, size: { cols: 2, rows: 2 } }
        ]}
      ]
    }
  };

  describe('localStorage strategy', () => {
    let service: DashboardPersistenceService;
    let mockStorage: StorageService;

    beforeEach(() => {
      mockStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      };

      TestBed.configureTestingModule({
        providers: [
          DashboardPersistenceService,
          provideHttpClient(),
          { provide: LOCAL_STORAGE, useValue: mockStorage },
          { provide: DASHBOARD_PERSISTENCE_STRATEGY, useValue: 'localStorage' }
        ]
      });

      service = TestBed.inject(DashboardPersistenceService);
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should save layout to localStorage', async () => {
      await service.save(mockState);

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'dashboard-state',
        JSON.stringify(mockState)
      );
      expect(service.saving()).toBe(false);
      expect(service.lastSaved()).not.toBeNull();
      expect(service.error()).toBeNull();
    });

    it('should load layout from localStorage', async () => {
      (mockStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockState));

      const result = await service.load();

      expect(mockStorage.getItem).toHaveBeenCalledWith('dashboard-state');
      expect(result).toEqual(mockState);
    });

    it('should return null when no layout saved', async () => {
      (mockStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);

      const result = await service.load();

      expect(result).toBeNull();
    });

    it('should handle save errors gracefully', async () => {
      (mockStorage.setItem as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('Storage full');
      });

      await service.save(mockState);

      expect(service.error()).toBe('Storage full');
      expect(service.saving()).toBe(false);
    });

    it('should handle load errors gracefully', async () => {
      (mockStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('Corrupted data');
      });

      const result = await service.load();

      expect(result).toBeNull();
      expect(service.error()).toBe('Corrupted data');
    });

    it('should track saving state', async () => {
      expect(service.saving()).toBe(false);

      const savePromise = service.save(mockState);
      // After await completes:
      await savePromise;

      expect(service.saving()).toBe(false);
    });
  });

  describe('api strategy', () => {
    let service: DashboardPersistenceService;
    let httpMock: HttpTestingController;
    let mockStorage: StorageService;

    beforeEach(() => {
      mockStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      };

      TestBed.configureTestingModule({
        providers: [
          DashboardPersistenceService,
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: LOCAL_STORAGE, useValue: mockStorage },
          { provide: DASHBOARD_PERSISTENCE_STRATEGY, useValue: 'api' }
        ]
      });

      service = TestBed.inject(DashboardPersistenceService);
      httpMock = TestBed.inject(HttpTestingController);
    });

    it('should save layout via API', async () => {
      const savePromise = service.save(mockState);

      const req = httpMock.expectOne(`/api/dashboard-layouts/${mockState.layout.id}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockState);
      req.flush(mockState);

      await savePromise;

      expect(service.lastSaved()).not.toBeNull();
      expect(service.error()).toBeNull();
    });

    it('should load layout via API', async () => {
      const loadPromise = service.load();

      const req = httpMock.expectOne('/api/dashboard-layouts/default');
      expect(req.request.method).toBe('GET');
      req.flush(mockState);

      const result = await loadPromise;

      expect(result).toEqual(mockState);
    });
  });
});
