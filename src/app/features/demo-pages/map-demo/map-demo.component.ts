import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { MapDataService } from './services/map-data.service';
import { LeafletMapComponent } from './leaflet-map/leaflet-map.component';

@Component({
  selector: 'app-map-demo',
  standalone: true,
  imports: [TranslatePipe, LeafletMapComponent, DecimalPipe],
  providers: [MapDataService],
  templateUrl: './map-demo.component.html',
  styleUrl: './map-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapDemoComponent implements OnInit {
  private readonly mapData = inject(MapDataService);

  readonly territories = this.mapData.territories;
  readonly pois = this.mapData.pois;
  readonly loading = this.mapData.loading;
  readonly error = this.mapData.error;

  protected readonly showTerritories = signal(true);
  protected readonly showPois = signal(true);

  protected readonly totalPopulation = computed(() =>
    this.territories().reduce((acc, t) => acc + t.population, 0)
  );

  protected readonly capitalCount = computed(
    () => this.pois().filter(p => p.type === 'capital').length
  );

  ngOnInit(): void {
    this.mapData.loadTerritories();
    this.mapData.loadPois();
  }

  protected toggleTerritories(): void {
    this.showTerritories.update(v => !v);
  }

  protected togglePois(): void {
    this.showPois.update(v => !v);
  }
}
