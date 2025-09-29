import { Injectable, signal, WritableSignal, computed } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClothesCrudAbstractComponent } from './clothes-crud-abstract.component';
import { ClothesApiService, ClothingItemApi } from '../../../core/api/clothes/clothes.service';
import { ModalService } from '../../../core/services/modal/modal.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { LOCAL_STORAGE } from '../../../core/tokens/local.storage.token';

// --- Mock Modal ---
class MockModalRef<T = any> {
  #closed: WritableSignal<{ data: T | undefined } | null> = signal(null);
  closed = this.#closed.asReadonly();
  close(data?: T) { this.#closed.set({ data }); }
}
class MockModalService {
  lastRef?: MockModalRef<any>;
  open(): MockModalRef<boolean> { this.lastRef = new MockModalRef<boolean>(); return this.lastRef; }
}

// --- Injectable Mock Clothes API (mimics signals surface used by template) ---
@Injectable()
class MockClothesApiService {
  private _items = signal<ClothingItemApi[]>([]);
  private _selected = signal<ClothingItemApi | null>(null);
  private _loading = signal({ isLoading: false, operation: undefined as any });
  private _error = signal<any>(null);

  // Expose like BaseApiService (signals invoked as functions)
  items = this._items.asReadonly();
  selectedItem = this._selected.asReadonly();
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();

  // Additional computed signals used by template
  availableItems = computed(() => this._items().filter(i => i.stock > 0));
  lowStockItems = computed(() => this._items().filter(i => i.stock > 0 && i.stock <= 5));
  totalValue = computed(() => this._items().reduce((sum, i) => sum + (i.price * i.stock), 0));

  refresh = jest.fn(() => of(this._items()));
  create = jest.fn((partial: Partial<ClothingItemApi>) => {
    const now = new Date().toISOString();
    const created: ClothingItemApi = {
      id: Math.floor(Math.random()*1000),
      name: partial.name as string, brand: partial.brand as string, price: partial.price as number,
      size: partial.size as string, color: partial.color as string, stock: partial.stock as number,
      season: partial.season as string, category: partial.category as string,
      description: partial.description as string, imageUrl: partial.imageUrl as string,
      createdAt: now, updatedAt: now
    };
    this._items.update(a => [...a, created]);
    return of(created);
  });
  update = jest.fn((id: number, partial: Partial<ClothingItemApi>) => {
    const existing = this._items().find(i => i.id === id)!;
    const updated = { ...existing, ...partial, id, updatedAt: new Date().toISOString() } as ClothingItemApi;
    this._items.update(a => a.map(i => i.id === id ? updated : i));
    if (this._selected()?.id === id) this._selected.set(updated);
    return of(updated);
  });
  delete = jest.fn((id: number) => {
    this._items.update(a => a.filter(i => i.id !== id));
    if (this._selected()?.id === id) this._selected.set(null);
    return of(void 0);
  });
  setSelectedItem = jest.fn((item: ClothingItemApi | null) => this._selected.set(item));

  // Utility for tests
  seed(items: ClothingItemApi[]) { this._items.set(items); }
}

// --- Test Data ---
const seedItem: ClothingItemApi = {
  id: 1,
  name: 'Seed Shirt',
  brand: 'BrandX',
  price: 10,
  size: 'M',
  color: 'Blue',
  stock: 5,
  season: 'Spring',
  category: 'Tops',
  description: 'A shirt',
  imageUrl: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

function fillValidForm(c: ClothesCrudAbstractComponent) {
  c.itemForm.setValue({
    name: 'New Pants', brand: 'BrandY', price: 25.5, size: 'L', color: 'Black', stock: 3,
    season: 'Winter', category: 'Bottoms', description: 'Warm pants', imageUrl: ''
  });
}

describe('ClothesCrudAbstractComponent (behavior)', () => {
  let fixture: ComponentFixture<ClothesCrudAbstractComponent>;
  let component: ClothesCrudAbstractComponent;
  let api: MockClothesApiService;
  let modal: MockModalService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClothesCrudAbstractComponent, HttpClientTestingModule],
      providers: [
        { provide: ClothesApiService, useClass: MockClothesApiService },
        { provide: ModalService, useClass: MockModalService },
        {
          provide: LOCAL_STORAGE,
          useValue: {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ClothesCrudAbstractComponent);
    component = fixture.componentInstance;
    api = TestBed.inject(ClothesApiService) as unknown as MockClothesApiService;
    modal = TestBed.inject(ModalService) as unknown as MockModalService;
    api.seed([seedItem]);
    fixture.detectChanges();
  });

  it('initial state: form invalid & not editing', () => {
    expect(component.itemForm.valid).toBe(false);
    expect(component.isEditing()).toBe(false);
    expect(component.selectedItem()).toBeNull();
  });

  it('validation messaging after touch', () => {
    const name = component.itemForm.get('name');
    name?.markAsTouched();
    name?.setValue('');
    expect(component.nameError()).toBe('Name is required');
    name?.setValue('A');
    name?.markAsDirty();
    expect(component.nameError()).toBe('Name must be at least 2 characters');
    name?.setValue('Ok');
    expect(component.nameError()).toBe('');
  });

  it('create flow resets form & stays not editing', () => {
    fillValidForm(component);
    component.onSubmit();
    expect(api.create).toHaveBeenCalled();
    expect(component.itemForm.get('name')?.value).toBe('');
    expect(component.isEditing()).toBe(false);
  });

  it('enter edit from row click and update item', () => {
    component.onRowClicked({ data: seedItem });
    expect(component.isEditing()).toBe(true);
    component.itemForm.get('name')?.setValue('Updated Name');
    component.onSubmit();
    expect(api.update).toHaveBeenCalledWith(seedItem.id, expect.objectContaining({ name: 'Updated Name' }));
    expect(component.isEditing()).toBe(false);
  });

  it('cancelEdit clears selection and form', () => {
    component.editItem(seedItem);
    component.cancelEdit();
    expect(component.isEditing()).toBe(false);
    expect(component.itemForm.get('name')?.value).toBe('');
  });

  it('toggleColumn updates visibility signal', () => {
  const prev = component.columnVisibility()['price'];
    component.toggleColumn('price');
  expect(component.columnVisibility()['price']).toBe(!prev);
  });

  it('formatPrice utility', () => {
    expect(component.formatPrice(10)).toBe('$10.00');
    expect(component.formatPrice(null as any)).toBe('$0.00');
  });

  it('delete confirms and removes item', async () => {
    component.deleteItem(seedItem.id);
    // Close with confirmation
    modal.lastRef?.close(true);
    // Wait a macrotask to allow effect inside deleteItem to run
    await new Promise(res => setTimeout(res, 0));
    expect(api.delete).toHaveBeenCalledWith(seedItem.id);
  });

  it('delete cancelled does not remove item', async () => {
    component.deleteItem(seedItem.id);
    modal.lastRef?.close(false);
    await Promise.resolve();
    expect(api.delete).not.toHaveBeenCalled();
  });

  it('clearSelection syncs with service', () => {
    component.editItem(seedItem);
    component.clearSelection();
    expect(component.selectedItem()).toBeNull();
    expect(api.selectedItem()).toBeNull();
  });

  it('isFieldInvalid logic', () => {
    const price = component.itemForm.get('price');
    price?.setValue(-1); // untouched invalid
    expect(component.isFieldInvalid('price')).toBe(false);
    price?.markAsTouched();
    expect(component.isFieldInvalid('price')).toBe(true);
  });

  it('brand & stock error helpers', () => {
    const brand = component.itemForm.get('brand');
    brand?.markAsTouched();
    brand?.setValue('');
    expect(component.brandError()).toBe('Brand is required');
    brand?.setValue('A');
    expect(component.brandError()).toBe('Brand must be at least 2 characters');

    const stock = component.itemForm.get('stock');
    stock?.markAsTouched();
    stock?.setValue(-5);
    expect(component.stockError()).toBe('Stock cannot be negative');
  });

  it('price error helper', () => {
    const price = component.itemForm.get('price');
    price?.markAsTouched();
    price?.setValue(0);
    expect(component.priceError()).toBe('Price must be greater than 0');
    price?.setValue(1);
    expect(component.priceError()).toBe('');
  });
});

