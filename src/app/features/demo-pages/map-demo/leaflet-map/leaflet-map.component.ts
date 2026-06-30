import {
  Component,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  inject,
  input,
  PLATFORM_ID,
  ElementRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectionStrategy,
  signal
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { MapLoaderService, LeafletModule } from '../../../../core/services/map-loader.service';
import { Territory, MapPoi } from '../models/map.models';

// No static `import * as L from 'leaflet'` — Leaflet is loaded dynamically
// via MapLoaderService so it is excluded from the initial bundle.

@Component({
  selector: 'app-leaflet-map',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './leaflet-map.component.html',
  styleUrl: './leaflet-map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeafletMapComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainerRef!: ElementRef<HTMLDivElement>;

  readonly territories = input<Territory[]>([]);
  readonly pois = input<MapPoi[]>([]);
  readonly showTerritories = input<boolean>(true);
  readonly showPois = input<boolean>(true);

  private readonly platformId = inject(PLATFORM_ID);
  private readonly mapLoader = inject(MapLoaderService);

  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);

  // Typed as unknown to avoid any static Leaflet import leaking into the bundle
  private mapInstance: unknown = null;
  private territoryLayerGroup: unknown = null;
  private poiLayerGroup: unknown = null;
  private L: LeafletModule | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.isLoading.set(false);
    }
  }

  async ngAfterViewInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    await this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.mapInstance || !this.L) {
      return;
    }
    if (changes['territories'] || changes['showTerritories']) {
      this.renderTerritories();
    }
    if (changes['pois'] || changes['showPois']) {
      this.renderPois();
    }
  }

  ngOnDestroy(): void {
    if (this.mapInstance && this.L) {
      (this.mapInstance as ReturnType<LeafletModule['map']>).remove();
      this.mapInstance = null;
    }
  }

  private async initMap(): Promise<void> {
    this.isLoading.set(true);
    const L = await this.mapLoader.loadLeaflet();

    if (!L) {
      this.loadError.set('map.errors.leafletLoad');
      this.isLoading.set(false);
      return;
    }

    this.L = L;
    const container = this.mapContainerRef.nativeElement;

    // Create map centered on the Iberian Peninsula as a reasonable default
    const map = L.map(container, {
      center: [40.4, -3.7],
      zoom: 5,
      zoomControl: true
    });

    // Base tile layer (OpenStreetMap — no API key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    this.mapInstance = map;
    this.territoryLayerGroup = L.layerGroup().addTo(map);
    this.poiLayerGroup = L.layerGroup().addTo(map);

    this.isLoading.set(false);
    this.renderTerritories();
    this.renderPois();
  }

  private renderTerritories(): void {
    if (!this.L || !this.mapInstance || !this.territoryLayerGroup) {
      return;
    }
    const L = this.L;
    const group = this.territoryLayerGroup as ReturnType<LeafletModule['layerGroup']>;
    group.clearLayers();

    if (!this.showTerritories()) {
      return;
    }

    for (const territory of this.territories()) {
      const coords = territory.geojson.coordinates[0];
      // GeoJSON uses [lng, lat]; Leaflet uses [lat, lng]
      const latLngs = coords.map(([lng, lat]: number[]) => L.latLng(lat, lng));

      const polygon = L.polygon(latLngs, {
        color: territory.color,
        fillColor: territory.color,
        fillOpacity: 0.25,
        weight: 2
      });

      const populationFormatted = territory.population.toLocaleString();
      const densityFormatted = territory.density.toFixed(1);
      polygon.bindPopup(`
        <div class="map-popup">
          <h3 class="map-popup__title">${territory.name}</h3>
          <dl class="map-popup__data">
            <dt>Capital</dt><dd>${territory.capital}</dd>
            <dt>Population</dt><dd>${populationFormatted}</dd>
            <dt>Density</dt><dd>${densityFormatted} /km²</dd>
            <dt>GDP per capita</dt><dd>€${territory.gdp_per_capita.toLocaleString()}</dd>
          </dl>
        </div>
      `);

      group.addLayer(polygon);
    }
  }

  private renderPois(): void {
    if (!this.L || !this.mapInstance || !this.poiLayerGroup) {
      return;
    }
    const L = this.L;
    const group = this.poiLayerGroup as ReturnType<LeafletModule['layerGroup']>;
    group.clearLayers();

    if (!this.showPois()) {
      return;
    }

    for (const poi of this.pois()) {
      const isCapital = poi.type === 'capital';
      const marker = L.circleMarker([poi.lat, poi.lng], {
        radius: isCapital ? 10 : 7,
        color: isCapital ? '#1e40af' : '#374151',
        fillColor: isCapital ? '#3b82f6' : '#6b7280',
        fillOpacity: 0.85,
        weight: 2
      });

      const populationFormatted = poi.population.toLocaleString();
      marker.bindPopup(`
        <div class="map-popup">
          <h3 class="map-popup__title">${poi.name}</h3>
          <dl class="map-popup__data">
            <dt>Type</dt><dd>${isCapital ? 'Regional Capital' : 'City'}</dd>
            <dt>Population</dt><dd>${populationFormatted}</dd>
            <dt>Founded</dt><dd>${poi.founded}</dd>
            <dt>About</dt><dd>${poi.description}</dd>
          </dl>
        </div>
      `);

      group.addLayer(marker);
    }
  }
}
