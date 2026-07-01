import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, signal } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LeafletMapComponent } from './leaflet-map.component';
import { MapLoaderService } from '../../../../core/services/map-loader.service';
import { provideStubTranslationService } from '../../../../testing/i18n-testing';
import { TranslateModule } from '@ngx-translate/core';
import { Territory, MapPoi } from '../models/map.models';

const mockTerritories: Territory[] = [
  {
    id: 1, name: 'Northern Region', code: 'NR', population: 3200000,
    area_km2: 85000, capital: 'Northbridge', density: 37.6, gdp_per_capita: 32000,
    color: '#3b82f6', bounds: [[42.0, -8.5], [44.5, -4.0]],
    geojson: { type: 'Polygon', coordinates: [[[-8.5, 42.0], [-4.0, 42.0], [-4.0, 44.5], [-8.5, 44.5], [-8.5, 42.0]]] }
  }
];

const mockPois: MapPoi[] = [
  { id: 1, name: 'Northbridge', type: 'capital', territoryId: 1, lat: 43.2, lng: -6.3, population: 850000, founded: 1203, description: 'Capital' }
];

describe('LeafletMapComponent', () => {
  describe('in SSR context (server platform)', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [LeafletMapComponent, TranslateModule.forRoot({ fallbackLang: 'en' })],
        providers: [
          provideZonelessChangeDetection(),
          { provide: PLATFORM_ID, useValue: 'server' },
          {
            provide: MapLoaderService,
            useValue: {
              loadLeaflet: vi.fn().mockResolvedValue(null),
              loadState: signal({ isLoading: false, isLoaded: false, error: null }).asReadonly()
            }
          },
          ...provideStubTranslationService({
            'map.ariaLabel': 'Interactive territory map',
            'map.loading': 'Loading map...'
          })
        ]
      }).compileComponents();
    });

    it('should create the component', () => {
      const fixture = TestBed.createComponent(LeafletMapComponent);
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render the map container div', () => {
      const fixture = TestBed.createComponent(LeafletMapComponent);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const container = el.querySelector('[role="application"]');
      expect(container).toBeTruthy();
    });

    it('should not call loadLeaflet in SSR', () => {
      const loaderService = TestBed.inject(MapLoaderService);
      const fixture = TestBed.createComponent(LeafletMapComponent);
      fixture.detectChanges();
      expect(loaderService.loadLeaflet).not.toHaveBeenCalled();
    });
  });

  describe('in browser context with failed leaflet load', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [LeafletMapComponent, TranslateModule.forRoot({ fallbackLang: 'en' })],
        providers: [
          provideZonelessChangeDetection(),
          { provide: PLATFORM_ID, useValue: 'browser' },
          {
            provide: MapLoaderService,
            useValue: {
              loadLeaflet: vi.fn().mockResolvedValue(null),
              loadState: signal({ isLoading: false, isLoaded: false, error: null }).asReadonly()
            }
          },
          ...provideStubTranslationService({
            'map.ariaLabel': 'Interactive territory map',
            'map.loading': 'Loading map...',
            'map.errors.leafletLoad': 'Failed to load map library'
          })
        ]
      }).compileComponents();
    });

    it('should show error message when leaflet fails to load', async () => {
      const fixture = TestBed.createComponent(LeafletMapComponent);
      fixture.componentRef.setInput('territories', mockTerritories);
      fixture.componentRef.setInput('pois', mockPois);
      fixture.detectChanges();
      // Wait for the async init
      await fixture.whenStable();
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const errorEl = el.querySelector('[role="alert"]');
      expect(errorEl).toBeTruthy();
    });
  });

  describe('accepts inputs', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [LeafletMapComponent, TranslateModule.forRoot({ fallbackLang: 'en' })],
        providers: [
          provideZonelessChangeDetection(),
          { provide: PLATFORM_ID, useValue: 'server' },
          {
            provide: MapLoaderService,
            useValue: {
              loadLeaflet: vi.fn().mockResolvedValue(null),
              loadState: signal({ isLoading: false, isLoaded: false, error: null }).asReadonly()
            }
          },
          ...provideStubTranslationService({
            'map.ariaLabel': 'Interactive territory map',
            'map.loading': 'Loading map...'
          })
        ]
      }).compileComponents();
    });

    it('should accept territories input', () => {
      const fixture = TestBed.createComponent(LeafletMapComponent);
      fixture.componentRef.setInput('territories', mockTerritories);
      fixture.detectChanges();
      expect(fixture.componentInstance.territories()).toEqual(mockTerritories);
    });

    it('should accept pois input', () => {
      const fixture = TestBed.createComponent(LeafletMapComponent);
      fixture.componentRef.setInput('pois', mockPois);
      fixture.detectChanges();
      expect(fixture.componentInstance.pois()).toEqual(mockPois);
    });

    it('should default showTerritories to true', () => {
      const fixture = TestBed.createComponent(LeafletMapComponent);
      fixture.detectChanges();
      expect(fixture.componentInstance.showTerritories()).toBe(true);
    });

    it('should default showPois to true', () => {
      const fixture = TestBed.createComponent(LeafletMapComponent);
      fixture.detectChanges();
      expect(fixture.componentInstance.showPois()).toBe(true);
    });
  });
});
