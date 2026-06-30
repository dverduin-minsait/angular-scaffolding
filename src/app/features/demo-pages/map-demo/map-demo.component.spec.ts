import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { MapDemoComponent } from './map-demo.component';
import { MapDataService } from './services/map-data.service';
import { MapLoaderService } from '../../../core/services/map-loader.service';
import { provideStubTranslationService } from '../../../testing/i18n-testing';
import { Territory, MapPoi } from './models/map.models';

const TEST_TRANSLATIONS: Record<string, string> = {
  'map.title': 'Map Demo',
  'map.subtitle': 'Territory data layers',
  'map.loading': 'Loading map...',
  'map.ariaLabel': 'Interactive territory map',
  'map.layers.title': 'Data Layers',
  'map.layers.territories.label': 'Territories',
  'map.layers.territories.ariaLabel': 'Toggle territory layer',
  'map.layers.pois.label': 'Cities & Capitals',
  'map.layers.pois.ariaLabel': 'Toggle cities and capitals layer',
  'map.stats.title': 'Statistics',
  'map.stats.regions': 'Regions',
  'map.stats.totalPopulation': 'Total Population',
  'map.stats.capitals': 'Capitals',
  'map.stats.pois': 'Points of Interest',
  'map.legend.title': 'Legend',
  'map.legend.ariaLabel': 'Map legend',
  'map.legend.capital': 'Regional Capital',
  'map.legend.city': 'City',
  'map.legend.territory': 'Territory Polygon',
  'map.sidebar.ariaLabel': 'Map controls and statistics'
};

const mockTerritories: Territory[] = [
  {
    id: 1, name: 'Northern Region', code: 'NR', population: 3200000,
    area_km2: 85000, capital: 'Northbridge', density: 37.6, gdp_per_capita: 32000,
    color: '#3b82f6', bounds: [[42.0, -8.5], [44.5, -4.0]],
    geojson: { type: 'Polygon', coordinates: [[[-8.5, 42.0], [-4.0, 42.0], [-4.0, 44.5], [-8.5, 44.5], [-8.5, 42.0]]] }
  },
  {
    id: 2, name: 'Eastern Region', code: 'ER', population: 5800000,
    area_km2: 62000, capital: 'Eastport', density: 93.5, gdp_per_capita: 41000,
    color: '#10b981', bounds: [[40.0, -1.0], [43.5, 3.5]],
    geojson: { type: 'Polygon', coordinates: [[[-1.0, 40.0], [3.5, 40.0], [3.5, 43.5], [-1.0, 43.5], [-1.0, 40.0]]] }
  }
];

const mockPois: MapPoi[] = [
  { id: 1, name: 'Northbridge', type: 'capital', territoryId: 1, lat: 43.2, lng: -6.3, population: 850000, founded: 1203, description: 'Capital' },
  { id: 2, name: 'Eastport', type: 'capital', territoryId: 2, lat: 41.4, lng: 2.2, population: 1600000, founded: 801, description: 'Capital' },
  { id: 3, name: 'Small Town', type: 'city', territoryId: 1, lat: 43.0, lng: -6.0, population: 50000, founded: 1400, description: 'City' }
];

function buildMockMapDataService(): Partial<MapDataService> {
  return {
    territories: signal<Territory[]>(mockTerritories).asReadonly(),
    pois: signal<MapPoi[]>(mockPois).asReadonly(),
    loading: signal(false).asReadonly(),
    error: signal<string | null>(null).asReadonly(),
    loadTerritories: vi.fn(),
    loadPois: vi.fn()
  };
}

function buildMockMapLoaderService(): Partial<MapLoaderService> {
  return {
    loadLeaflet: vi.fn().mockResolvedValue(null),
    loadState: signal({ isLoading: false, isLoaded: false, error: null }).asReadonly()
  };
}

describe('MapDemoComponent', () => {
  let mockDataService: Partial<MapDataService>;

  beforeEach(async () => {
    mockDataService = buildMockMapDataService();

    await TestBed.configureTestingModule({
      imports: [MapDemoComponent, TranslateModule.forRoot({ fallbackLang: 'en' })],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        { provide: MapLoaderService, useValue: buildMockMapLoaderService() },
        ...provideStubTranslationService(TEST_TRANSLATIONS)
      ]
    })
      .overrideComponent(MapDemoComponent, {
        set: { providers: [{ provide: MapDataService, useValue: mockDataService }] }
      })
      .compileComponents();

    // Load translations into ngx-translate so TranslatePipe resolves values
    const translateService = TestBed.inject(TranslateService);
    translateService.setTranslation('en', TEST_TRANSLATIONS);
    translateService.use('en');
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(MapDemoComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should call loadTerritories and loadPois on init', () => {
    const fixture = TestBed.createComponent(MapDemoComponent);
    fixture.detectChanges();
    expect(mockDataService.loadTerritories).toHaveBeenCalledTimes(1);
    expect(mockDataService.loadPois).toHaveBeenCalledTimes(1);
  });

  it('should display the page title', () => {
    const fixture = TestBed.createComponent(MapDemoComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Map Demo');
  });

  it('should render both layer checkboxes', () => {
    const fixture = TestBed.createComponent(MapDemoComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const checkboxes = el.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(2);
  });

  it('should show territory count in statistics', () => {
    const fixture = TestBed.createComponent(MapDemoComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('2'); // 2 territories
  });

  it('should compute totalPopulation correctly', () => {
    const fixture = TestBed.createComponent(MapDemoComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    // Access computed via the public template-visible property
    expect((component as unknown as { totalPopulation: () => number }).totalPopulation()).toBe(9000000);
  });

  it('should compute capitalCount correctly', () => {
    const fixture = TestBed.createComponent(MapDemoComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect((component as unknown as { capitalCount: () => number }).capitalCount()).toBe(2);
  });

  it('should toggle showTerritories signal when checkbox is clicked', () => {
    const fixture = TestBed.createComponent(MapDemoComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const checkboxes = el.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    expect(checkboxes[0].checked).toBe(true);
    checkboxes[0].click();
    fixture.detectChanges();
    expect(checkboxes[0].checked).toBe(false);
  });

  it('should toggle showPois signal when second checkbox is clicked', () => {
    const fixture = TestBed.createComponent(MapDemoComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const checkboxes = el.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    expect(checkboxes[1].checked).toBe(true);
    checkboxes[1].click();
    fixture.detectChanges();
    expect(checkboxes[1].checked).toBe(false);
  });

  it('should have proper aria-label on main element', () => {
    const fixture = TestBed.createComponent(MapDemoComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const main = el.querySelector('main');
    expect(main?.getAttribute('aria-labelledby')).toBe('map-demo-title');
  });
});
