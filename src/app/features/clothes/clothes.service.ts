import { computed, inject, Injectable } from "@angular/core";
import { TranslationService } from "../../core/services/translation.service";

export interface ClothingItem {
  id: number;
  name: string;
  brand: string;
  price: number;
  size: string;
  color: string;
  stock: number;
  season: string;
  category: string;
}
export interface ColDef {
  field?: keyof ClothingItem;
  headerName?: string;
  flex?: number;
  minWidth?: number;
  cellStyle?: any;
  valueFormatter?: (params: any) => string;
  cellRenderer?: (params: any) => string;
  sortable?: boolean;
  filter?: boolean;
  resizable?: boolean;
}

@Injectable()
export class ClothesService {
  private i18n = inject(TranslationService);
  getData() {
    const mockClothingData: ClothingItem[] = [
      { id: 1, name: 'Classic Cotton T-Shirt', brand: 'BasicWear', price: 25.99, size: 'M', color: 'white', stock: 45, season: 'Spring', category: 'T-Shirts' },
      { id: 2, name: 'Denim Jacket', brand: 'UrbanStyle', price: 89.99, size: 'L', color: 'blue', stock: 12, season: 'Fall', category: 'Jackets' },
      { id: 3, name: 'Summer Floral Dress', brand: 'FloralFashion', price: 65.50, size: 'S', color: 'pink', stock: 8, season: 'Summer', category: 'Dresses' },
      { id: 4, name: 'Wool Winter Coat', brand: 'WarmWear', price: 199.99, size: 'XL', color: 'black', stock: 5, season: 'Winter', category: 'Coats' },
      { id: 5, name: 'Casual Khaki Pants', brand: 'ComfortFit', price: 45.00, size: 'L', color: 'khaki', stock: 23, season: 'Spring', category: 'Pants' },
      { id: 6, name: 'Athletic Running Shorts', brand: 'SportMax', price: 32.75, size: 'M', color: 'navy', stock: 18, season: 'Summer', category: 'Shorts' },
      { id: 7, name: 'Elegant Evening Gown', brand: 'GlamourNight', price: 150.00, size: 'S', color: 'red', stock: 3, season: 'Winter', category: 'Dresses' },
      { id: 8, name: 'Cozy Knit Sweater', brand: 'KnitCraft', price: 75.25, size: 'M', color: 'gray', stock: 15, season: 'Fall', category: 'Sweaters' },
      { id: 9, name: 'Slim Fit Jeans', brand: 'DenimPro', price: 68.99, size: 'L', color: 'indigo', stock: 27, season: 'Spring', category: 'Jeans' },
      { id: 10, name: 'Lightweight Cardigan', brand: 'SoftLayers', price: 55.80, size: 'S', color: 'cream', stock: 11, season: 'Spring', category: 'Cardigans' },
      { id: 11, name: 'Waterproof Rain Jacket', brand: 'WeatherShield', price: 125.00, size: 'XL', color: 'yellow', stock: 9, season: 'Fall', category: 'Jackets' },
      { id: 12, name: 'Designer Silk Blouse', brand: 'LuxeFabric', price: 95.60, size: 'M', color: 'purple', stock: 6, season: 'Summer', category: 'Blouses' }
    ];
    return mockClothingData;
  }

  public readonly colDefs = computed<ColDef[]>(() =>{
    const translations =  this.i18n.translations();
    console.log('ClothesService.colDefs computed ran', translations);
    return [
      { 
        field: 'name', 
        headerName: this.i18n.instant('app.clothes.catalog.columns.name'),
        flex: 2,
        minWidth: 150,
        cellStyle: { fontWeight: '600' }
      },
      { 
        field: 'brand', 
        headerName: this.i18n.instant('app.clothes.catalog.columns.brand'),
        flex: 1,
        minWidth: 100,
        cellStyle: (params: any) => ({
          backgroundColor: 'var(--ag-header-background-color, #f0f8ff)',
          color: 'var(--ag-foreground-color, #0066cc)'
        })
      },
      { 
        field: 'price', 
        headerName: this.i18n.instant('app.clothes.catalog.columns.price'),
        flex: 1,
        minWidth: 100,
        valueFormatter: (params: any) => '$' + params.value.toFixed(2),
        cellStyle: { 
          fontWeight: '700',
          color: '#28a745'
        }
      },
      { 
        field: 'size', 
        headerName: this.i18n.instant('app.clothes.catalog.columns.size'),
        flex: 0.7,
        minWidth: 80,
        cellStyle: { textAlign: 'center' }
      },
      { 
        field: 'color', 
        headerName: this.i18n.instant('app.clothes.catalog.columns.color'),
        flex: 1,
        minWidth: 100,
        cellRenderer: (params: any) => {
          return `<div style="display: flex; align-items: center; gap: 6px;">
            <div style="width: 16px; height: 16px; background-color: ${params.value}; border-radius: 50%; border: 1px solid #ccc;"></div>
            <span>${params.value}</span>
          </div>`;
        }
      },
      { 
        field: 'stock', 
        headerName: this.i18n.instant('app.clothes.catalog.columns.stock'),
        flex: 0.8,
        minWidth: 80,
        cellStyle: (params: any) => ({
          textAlign: 'center',
          color: params.value < 10 ? '#dc3545' : 'var(--ag-foreground-color, #333)',
          fontWeight: params.value < 10 ? '700' : 'normal'
        })
      },
      { 
        field: 'category', 
        headerName: this.i18n.instant('app.clothes.catalog.columns.category'),
        flex: 1,
        minWidth: 120
      },
      { 
        field: 'season', 
        headerName: this.i18n.instant('app.clothes.catalog.columns.season'),
        flex: 1,
        minWidth: 100,
        cellStyle: (params: any) => {
          const seasonColors: Record<string, any> = {
            'Spring': { backgroundColor: '#d4edda', color: '#155724' },
            'Summer': { backgroundColor: '#fff3cd', color: '#856404' },
            'Fall': { backgroundColor: '#f8d7da', color: '#721c24' },
            'Winter': { backgroundColor: '#d1ecf1', color: '#0c5460' }
          };
          return seasonColors[params.value] || {};
        }
      }
    ];
  });
}