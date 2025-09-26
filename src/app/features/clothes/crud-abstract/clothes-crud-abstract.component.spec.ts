import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClothesCrudAbstractComponent } from './clothes-crud-abstract.component';
import { ClothesApiService } from '../../../core/api/clothes/clothes.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { GridLoaderService } from '../../../core/services/grid-loader.service';
import { signal } from '@angular/core';

// Minimal mock grid module
const createGridSpy = jest.fn();

class MockGridLoaderService {
  getThemeClass() { return 'ag-theme-alpine'; }
  loadGridModule() {
    return Promise.resolve({
      AgGridAngular: class {},
      createGrid: (...args: any[]) => {
        createGridSpy();
        return { destroy: () => {}, setGridOption: () => {}, api: { setGridOption: () => {}, sizeColumnsToFit: () => {}, isDestroyed: () => false, getColumn: () => ({ isVisible: () => true }) } };
      }
    });
  }
  loadState$ = signal({ isLoading: false, isLoaded: true, error: null }).asReadonly();
}

describe('ClothesCrudAbstractComponent (grid stability)', () => {
  let fixture: ComponentFixture<ClothesCrudAbstractComponent>;
  let component: ClothesCrudAbstractComponent;
  // Note: Component has its own provider for ClothesApiService, so TestBed.inject
  // would return a DIFFERENT instance. We'll access the component's instance directly.
  let componentService: ClothesApiService;

  beforeEach(async () => {
    jest.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [ClothesCrudAbstractComponent, HttpClientTestingModule],
      providers: [
        ClothesApiService,
        { provide: GridLoaderService, useClass: MockGridLoaderService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ClothesCrudAbstractComponent);
    component = fixture.componentInstance;
    // Access the service instance actually used by the component
    componentService = (component as any).clothesService as ClothesApiService;

    // Seed data directly into the component's service signal to trigger grid creation
    (componentService as any)._items.set([
      { id: 1, name: 'Seed Shirt', brand: 'Test', price: 10, size: 'M', color: 'blue', stock: 5, season: 'Spring', category: 'Tops', description: '', imageUrl: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ]);

    fixture.detectChanges();

    // Flush microtasks and timers for deferred grid setup (safeSetTimeout)
    await Promise.resolve();
    jest.runAllTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should create grid only once across multiple form interactions', async () => {
  // Initial grid creation after timers flush
  expect(createGridSpy).toHaveBeenCalledTimes(1);

    // Simulate form typing
    const nameControl = component.itemForm.get('name');
    nameControl?.setValue('Test 1');
    fixture.detectChanges();
    nameControl?.setValue('Test 2');
    fixture.detectChanges();
    jest.runOnlyPendingTimers();

    // Toggle a column visibility
    component.toggleColumn('price');
    fixture.detectChanges();
    jest.runOnlyPendingTimers();

    // No new grid instance should be created
    expect(createGridSpy).toHaveBeenCalledTimes(1);
  });
});
