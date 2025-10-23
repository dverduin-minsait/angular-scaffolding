import { Component, OnInit, inject, PLATFORM_ID, signal, Signal, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DeviceService, GridDataConfig } from '../../core/services';
import { ResponsiveGridComponent, ResponsiveGridConfig } from '../../shared/components';
import { ClothesService, ClothingItem } from './clothes.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-clothes-catalog',
  standalone: true,
  imports: [CommonModule, ResponsiveGridComponent, TranslatePipe],
  providers: [ClothesService],
  templateUrl: './clothes-catalog.component.html',
  styleUrls: ['./clothes-catalog.component.scss']
})
export class ClothesCatalogComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  protected deviceService = inject(DeviceService);
  private readonly clothesService = inject(ClothesService);

  // Signals for state management  
  clothingData = signal<ClothingItem[]>([]);

  // Grid Data Configuration - reactive to data changes
  dataConfig: Signal<GridDataConfig<ClothingItem>> = computed(() => ({
    dataSource: this.clothingData(),
    preloadGrid: true
  }));

  // Responsive Grid Configuration
  gridConfig: Signal<ResponsiveGridConfig> = computed(() => ({
    columnDefs: this.clothesService.colDefs(),
    mobileView: 'cards',
    showLoadingSpinner: true,
    loadingMessage: 'app.clothes.catalog.loading',
    showErrorMessage: true,
    retryOnError: true
  }));

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadClothingData();
    }
  }

  private loadClothingData(): void {
    // Simulate async data loading (as it would come from an API)
    setTimeout(() => {
      const data = this.clothesService.getData();
      this.clothingData.set(data);
      // dataConfig automatically updates due to computed()
    }, 300);
  }
}