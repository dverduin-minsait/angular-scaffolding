import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MapDataService } from './map-data.service';
import { Territory, MapPoi } from '../models/map.models';
import { ENVIRONMENT } from '../../../../../environments/environment';

const mockTerritories: Territory[] = [
  {
    id: 1,
    name: 'Northern Region',
    code: 'NR',
    population: 3200000,
    area_km2: 85000,
    capital: 'Northbridge',
    density: 37.6,
    gdp_per_capita: 32000,
    color: '#3b82f6',
    bounds: [[42.0, -8.5], [44.5, -4.0]],
    geojson: {
      type: 'Polygon',
      coordinates: [[[-8.5, 42.0], [-4.0, 42.0], [-4.0, 44.5], [-8.5, 44.5], [-8.5, 42.0]]]
    }
  }
];

const mockPois: MapPoi[] = [
  {
    id: 1,
    name: 'Northbridge',
    type: 'capital',
    territoryId: 1,
    lat: 43.2,
    lng: -6.3,
    population: 850000,
    founded: 1203,
    description: 'Cultural capital'
  }
];

describe('MapDataService', () => {
  let service: MapDataService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        MapDataService
      ]
    });
    service = TestBed.inject(MapDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have empty territories initially', () => {
    expect(service.territories()).toEqual([]);
  });

  it('should have empty pois initially', () => {
    expect(service.pois()).toEqual([]);
  });

  it('should load territories from the API', () => {
    service.loadTerritories();

    const req = httpTesting.expectOne(`${ENVIRONMENT.API_URL}/territories`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTerritories);

    expect(service.territories()).toEqual(mockTerritories);
    expect(service.loading()).toBe(false);
  });

  it('should load POIs from the API', () => {
    service.loadPois();

    const req = httpTesting.expectOne(`${ENVIRONMENT.API_URL}/map-pois`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPois);

    expect(service.pois()).toEqual(mockPois);
    expect(service.loading()).toBe(false);
  });

  it('should set error signal when territories request fails', () => {
    service.loadTerritories();

    const req = httpTesting.expectOne(`${ENVIRONMENT.API_URL}/territories`);
    req.error(new ProgressEvent('Network error'));

    expect(service.error()).toBe('map.errors.territoriesLoad');
    expect(service.loading()).toBe(false);
  });

  it('should set error signal when POIs request fails', () => {
    service.loadPois();

    const req = httpTesting.expectOne(`${ENVIRONMENT.API_URL}/map-pois`);
    req.error(new ProgressEvent('Network error'));

    expect(service.error()).toBe('map.errors.poisLoad');
    expect(service.loading()).toBe(false);
  });
});
