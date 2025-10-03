import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ClothesCatalogComponent } from './clothes-catalog.component';
import { TranslateStubPipe, provideStubTranslationService } from '../../testing/i18n-testing';
import { DeviceService } from '../../core/services/device.service';
import { ClothesService } from './clothes.service';
import { PLATFORM_ID } from '@angular/core';
import { ResponsiveGridComponent } from '../../shared/components/responsive-grid/responsive-grid.component';
import { Component, Input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

// Mock ResponsiveGridComponent
@Component({
  selector: 'app-responsive-grid',
  template: '<div class="mock-responsive-grid" [attr.data-testid]="\'responsive-grid\'"></div>',
  standalone: true
})
class MockResponsiveGridComponent {
  @Input() dataConfig: any;
  @Input() config: any;
}

describe('ClothesCatalogComponent', () => {
  let component: ClothesCatalogComponent;
  let fixture: ComponentFixture<ClothesCatalogComponent>;
  let mockDeviceService: {
    isMobile: ReturnType<typeof signal>;
    isDesktop: ReturnType<typeof signal>;
    isMedium: ReturnType<typeof signal>;
  };
  let clothesService: ClothesService;

  // Create signals outside of beforeEach to maintain reference
  const isMobileSignal = signal(false);
  const isDesktopSignal = signal(true);
  const isMediumSignal = signal(false);

  beforeEach(async () => {
    mockDeviceService = {
      isMobile: isMobileSignal,
      isDesktop: isDesktopSignal,
      isMedium: isMediumSignal
    };

    await TestBed.configureTestingModule({
      imports: [ClothesCatalogComponent, MockResponsiveGridComponent, TranslateStubPipe],
      providers: [
        { provide: DeviceService, useValue: mockDeviceService },
        { provide: PLATFORM_ID, useValue: 'browser' },
        ClothesService,
        ...provideStubTranslationService({
          'app.clothes.catalog.title': 'Clothes Catalog',
          'app.clothes.catalog.mobile.colorLabel': 'Color:',
          'app.clothes.catalog.mobile.stockLabel': 'Stock:',
          'app.clothes.catalog.loading': 'Loading clothes catalog...'
        })
      ]
    })
    .overrideComponent(ClothesCatalogComponent, {
      remove: { imports: [ResponsiveGridComponent, TranslatePipe] },
      add: { imports: [MockResponsiveGridComponent, TranslateStubPipe] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClothesCatalogComponent);
    component = fixture.componentInstance;
    clothesService = TestBed.inject(ClothesService);
    
    // Reset signals to default values
    isMobileSignal.set(false);
    isDesktopSignal.set(true);
    isMediumSignal.set(false);
    
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty clothing data', () => {
      expect(component.clothingData()).toEqual([]);
    });

    it('should have correct data config structure', () => {
      const dataConfig = component.dataConfig();
      expect(dataConfig).toBeDefined();
      expect(dataConfig.dataSource).toEqual([]);
      expect(dataConfig.preloadGrid).toBe(true);
    });

    it('should have correct grid config structure', () => {
      const gridConfig = component.gridConfig();
      expect(gridConfig).toBeDefined();
      expect(gridConfig.columnDefs).toBeDefined();
      expect(gridConfig.mobileView).toBe('cards');
      expect(gridConfig.showLoadingSpinner).toBe(true);
  // Component now stores translation key; template / grid is responsible for translating
  expect(gridConfig.loadingMessage).toBe('app.clothes.catalog.loading');
      expect(gridConfig.showErrorMessage).toBe(true);
      expect(gridConfig.retryOnError).toBe(true);
    });
  });

  describe('Data Loading', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should load clothing data on ngOnInit', () => {
      component.ngOnInit();
      
      // Fast-forward the setTimeout
      jest.advanceTimersByTime(500);
      
      expect(component.clothingData()).toHaveLength(12);
    });

    it('should load correct clothing items', () => {
      component.ngOnInit();
      jest.advanceTimersByTime(500);
      
      const data = component.clothingData();
      
      // Check first item
      expect(data[0]).toEqual({
        id: 1,
        name: 'Classic Cotton T-Shirt',
        brand: 'BasicWear',
        price: 25.99,
        size: 'M',
        color: 'white',
        stock: 45,
        season: 'Spring',
        category: 'T-Shirts'
      });

      // Check that we have variety in the data
      const brands = data.map(item => item.brand);
      expect(new Set(brands).size).toBeGreaterThan(5); // Multiple brands
      
      const seasons = data.map(item => item.season);
      expect(seasons).toContain('Spring');
      expect(seasons).toContain('Summer');
      expect(seasons).toContain('Fall');
      expect(seasons).toContain('Winter');
    });
  });

  describe('Service Integration', () => {
    it('should get column definitions from ClothesService', () => {
      const columnDefs = clothesService.colDefs();
      expect(columnDefs).toHaveLength(8);
      expect(columnDefs[0].field).toBe('name');
      expect(columnDefs[1].field).toBe('brand');
      expect(columnDefs[2].field).toBe('price');
      expect(columnDefs[3].field).toBe('size');
      expect(columnDefs[4].field).toBe('color');
      expect(columnDefs[5].field).toBe('stock');
      expect(columnDefs[6].field).toBe('category');
      expect(columnDefs[7].field).toBe('season');
    });

    it('should get data from ClothesService', () => {
      const data = clothesService.getData();
      expect(data).toHaveLength(12);
      expect(data[0].name).toBe('Classic Cotton T-Shirt');
    });
  });

  describe('Template Rendering', () => {
    it('should render page title', () => {
      fixture.detectChanges();
      const title = fixture.nativeElement.querySelector('h1');
      expect(title?.textContent?.trim()).toBe('Clothes Catalog'); // translation default
    });

    it('should render responsive grid component', () => {
      fixture.detectChanges();
      const responsiveGrid = fixture.nativeElement.querySelector('[data-testid="responsive-grid"]');
      expect(responsiveGrid).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic markup', () => {
      fixture.detectChanges();
      
      const title = fixture.nativeElement.querySelector('h1');
      expect(title).toBeTruthy();
      
      const responsiveGrid = fixture.nativeElement.querySelector('[data-testid="responsive-grid"]');
      expect(responsiveGrid).toBeTruthy();
    });
  });
});