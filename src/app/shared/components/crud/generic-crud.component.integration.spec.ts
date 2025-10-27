import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { GenericCrudComponent } from './generic-crud.component';
import { GenericCrudService, CrudPreferences } from './generic-crud.service';
import { LOCAL_STORAGE } from '../../../core/tokens/local.storage.token';
import { TranslateModule } from '@ngx-translate/core';
import { ModalService } from '../../../core/services/modal/modal.service';
import { EntityStore } from '../../../core/store/entity-store';
import { CrudConfig, CrudEntity } from './types';
import { provideStubTranslationService } from '../../../testing/i18n-testing';

interface TestEntity extends CrudEntity {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  [key: string]: unknown; // Index signature for CrudEntity
}

describe('GenericCrudComponent - localStorage Integration', () => {
  let component: GenericCrudComponent<TestEntity>;
  let fixture: ComponentFixture<GenericCrudComponent<TestEntity>>;
  let mockCrudService: Partial<GenericCrudService>;
  let mockEntityStore: Partial<EntityStore<TestEntity>>;
  let mockLocalStorage: Partial<Storage>;

  const testConfig: CrudConfig<TestEntity> = {
    entityName: 'Book',
    columns: [
      { field: 'title', headerName: 'Title', visible: true },
      { field: 'author', headerName: 'Author', visible: true },
      { field: 'isbn', headerName: 'ISBN', visible: false }, // Default hidden
      { field: 'category', headerName: 'Category', visible: true }
    ]
  };

  beforeEach(async () => {
    // Mock localStorage
    const storage: Record<string, string> = {};
    mockLocalStorage = {
      getItem: jest.fn((key: string) => storage[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        storage[key] = value;
      })
    };

    // Mock GenericCrudService
    mockCrudService = {
      loadPreferences: jest.fn(),
      savePreferences: jest.fn().mockReturnValue(of(void 0))
    };

    // Mock EntityStore
    mockEntityStore = {
      items: signal([]),
      loading: signal({ isLoading: false, operation: undefined }),
      error: signal(null),
      selected: signal(null),
      setSelected: jest.fn(),
      refresh: jest.fn().mockReturnValue(of([])),
      delete: jest.fn().mockReturnValue(of(void 0))
    };

    await TestBed.configureTestingModule({
      imports: [
        GenericCrudComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: LOCAL_STORAGE,
          useValue: mockLocalStorage
        },
        {
          provide: ModalService,
          useValue: {
            confirm: jest.fn().mockResolvedValue({ confirmed: true })
          }
        },
        ...provideStubTranslationService({
          'app.crud.loading': 'Loading...',
          'app.crud.ready': 'Ready',
          'app.crud.items': 'Items',
          'app.crud.columns.toggle': 'Toggle Columns'
        })
      ]
    }).overrideComponent(GenericCrudComponent, {
      set: {
        providers: [
          {
            provide: GenericCrudService,
            useValue: mockCrudService
          }
        ]
      }
    }).compileComponents();

    fixture = TestBed.createComponent(GenericCrudComponent<TestEntity>);
    component = fixture.componentInstance;
  });

  it('should load saved column preferences on initialization', async () => {
    const savedPreferences: CrudPreferences = {
      columnVisibility: {
        title: true,
        author: false, // User hid this column
        isbn: true,    // User showed this column (was hidden by default)
        category: true
      }
    };

    // Mock service to return saved preferences
    (mockCrudService.loadPreferences as jest.Mock).mockReturnValue(of(savedPreferences));

    // Set component inputs
    fixture.componentRef.setInput('config', testConfig);
    fixture.componentRef.setInput('store', mockEntityStore);

    fixture.detectChanges();
    await fixture.whenStable();

    // Verify preferences were loaded
    expect(mockCrudService.loadPreferences).toHaveBeenCalledWith('Book');

    // Verify column visibility reflects saved preferences
    expect(component.getColumnVisibility('title')).toBe(true);
    expect(component.getColumnVisibility('author')).toBe(false); // User preference
    expect(component.getColumnVisibility('isbn')).toBe(true);    // User preference
    expect(component.getColumnVisibility('category')).toBe(true);
  });

  it('should use default column visibility when no preferences exist', async () => {
    // Mock service to return no saved preferences
    (mockCrudService.loadPreferences as jest.Mock).mockReturnValue(of(null));

    // Set component inputs
    fixture.componentRef.setInput('config', testConfig);
    fixture.componentRef.setInput('store', mockEntityStore);

    fixture.detectChanges();
    await fixture.whenStable();

    // Verify default visibility is used (from config)
    expect(component.getColumnVisibility('title')).toBe(true);
    expect(component.getColumnVisibility('author')).toBe(true);
    expect(component.getColumnVisibility('isbn')).toBe(false); // Default hidden
    expect(component.getColumnVisibility('category')).toBe(true);
  });

  it('should save preferences when column visibility changes', async () => {
    // Mock service to return no initial preferences
    (mockCrudService.loadPreferences as jest.Mock).mockReturnValue(of(null));

    // Set component inputs
    fixture.componentRef.setInput('config', testConfig);
    fixture.componentRef.setInput('store', mockEntityStore);

    fixture.detectChanges();
    await fixture.whenStable();

    // Toggle a column
    component.toggleColumn('author');
    fixture.detectChanges();

    // Verify preferences were saved
    expect(mockCrudService.savePreferences).toHaveBeenCalledWith('Book', {
      columnVisibility: {
        title: true,
        author: false, // Toggled
        isbn: false,
        category: true
      }
    });
  });

  it('should handle service errors gracefully', async () => {
    // Mock service to throw error
    (mockCrudService.loadPreferences as jest.Mock).mockReturnValue(
      throwError(() => new Error('Storage error'))
    );

    // Set component inputs
    fixture.componentRef.setInput('config', testConfig);
    fixture.componentRef.setInput('store', mockEntityStore);

    // Should not throw error
    expect(() => {
      fixture.detectChanges();
    }).not.toThrow();

    await fixture.whenStable();

    // Should fall back to default visibility
    expect(component.getColumnVisibility('title')).toBe(true);
    expect(component.getColumnVisibility('isbn')).toBe(false);
  });

  it('should render column toggle controls in template', async () => {
    // Mock service to return no preferences
    (mockCrudService.loadPreferences as jest.Mock).mockReturnValue(of(null));

    // Set component inputs
    fixture.componentRef.setInput('config', testConfig);
    fixture.componentRef.setInput('store', mockEntityStore);

    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const columnToggles = compiled.querySelectorAll('.col-toggle input[type="checkbox"]');

    // Should have one toggle per column
    expect(columnToggles.length).toBe(testConfig.columns.length);

    // Check default states
    const titleToggle = compiled.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(titleToggle.checked).toBe(true); // Title should be visible by default
  });

  it('should update visible columns when toggling', async () => {
    // Mock service to return no preferences
    (mockCrudService.loadPreferences as jest.Mock).mockReturnValue(of(null));

    // Set component inputs
    fixture.componentRef.setInput('config', testConfig);
    fixture.componentRef.setInput('store', mockEntityStore);

    fixture.detectChanges();
    await fixture.whenStable();

    const initialVisibleColumns = component.visibleColumns();
    expect(initialVisibleColumns.length).toBe(3); // title, author, category (isbn is hidden)

    // Toggle ISBN column to make it visible
    component.toggleColumn('isbn');
    fixture.detectChanges();

    const updatedVisibleColumns = component.visibleColumns();
    expect(updatedVisibleColumns.length).toBe(4); // All columns now visible
    expect(updatedVisibleColumns.some(col => col.field === 'isbn')).toBe(true);
  });
});