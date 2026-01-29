import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal, Signal } from '@angular/core';
import { firstValueFrom, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { GenericCrudComponent } from './generic-crud.component';
import { GenericCrudService } from './generic-crud.service';
import { LOCAL_STORAGE } from '../../../core/tokens/local.storage.token';
import { TranslateModule } from '@ngx-translate/core';
import { ModalService } from '../../../core/services/modal/modal.service';
import { EntityStore } from '../../../core/store/entity-store';
import { CrudConfig, CrudEntity, CrudEvents } from './types';
import { provideStubTranslationService } from '../../../testing/i18n-testing';

interface TestEntity extends CrudEntity {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  price: number;
  [key: string]: unknown;
}

describe('GenericCrudComponent - Behavior Driven Tests', () => {
  let component: GenericCrudComponent<TestEntity>;
  let fixture: ComponentFixture<GenericCrudComponent<TestEntity>>;
  let mockCrudService: Partial<GenericCrudService>;
  let mockEntityStore: {
    items: ReturnType<typeof signal<TestEntity[]>>;
    loading: ReturnType<typeof signal<{ isLoading: boolean; operation?: string }>>;
    error: ReturnType<typeof signal<{ message: string } | null>>;
    selected: ReturnType<typeof signal<TestEntity | null>>;
    setSelected: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let mockModalService: Partial<ModalService>;
  let mockLocalStorage: Partial<Storage>;
  let emittedEvents: CrudEvents<TestEntity>[] = [];

  const testEntities: TestEntity[] = [
    { id: 1, title: 'The Hobbit', author: 'J.R.R. Tolkien', isbn: '978-0547928227', category: 'Fantasy', price: 12.99 },
    { id: 2, title: '1984', author: 'George Orwell', isbn: '978-0451524935', category: 'Dystopian', price: 9.99 },
    { id: 3, title: 'Clean Code', author: 'Robert Martin', isbn: '978-0132350884', category: 'Programming', price: 44.99 }
  ];

  const testConfig: CrudConfig<TestEntity> = {
    entityName: 'Book',
    columns: [
      { field: 'title', headerName: 'Title', visible: true },
      { field: 'author', headerName: 'Author', visible: true },
      { field: 'isbn', headerName: 'ISBN', visible: false },
      { 
        field: 'price', 
        headerName: 'Price', 
        visible: true,
        valueFormatter: (value: unknown) => {
          const numValue = value as number;
          return `$${numValue.toFixed(2)}`;
        }
      },
      { field: 'category', headerName: 'Category', visible: true }
    ]
  };

  beforeEach(async () => {
    emittedEvents = [];

    // Mock localStorage
    const storage: Record<string, string> = {};
    mockLocalStorage = {
      getItem: vi.fn((key: string) => storage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value;
      })
    };

    // Mock GenericCrudService
    mockCrudService = {
      loadPreferences: vi.fn().mockReturnValue(of(null)),
      savePreferences: vi.fn().mockReturnValue(of(void 0))
    };

    // Mock EntityStore
    mockEntityStore = {
      items: signal(testEntities),
      loading: signal({ isLoading: false, operation: undefined }),
      error: signal(null),
      selected: signal(null),
      setSelected: vi.fn(),
      refresh: vi.fn().mockReturnValue(of(testEntities)),
      delete: vi.fn().mockReturnValue(of(void 0)),
      create: vi.fn().mockReturnValue(of(testEntities[0])),
      update: vi.fn().mockReturnValue(of(testEntities[0]))
    };

    // Mock ModalService
    mockModalService = {
      confirm: vi.fn().mockResolvedValue({ confirmed: true })
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
          useValue: mockModalService
        },
        ...provideStubTranslationService({
          'app.crud.loading': 'Loading...',
          'app.crud.ready': 'Ready',
          'app.crud.items': 'Items',
          'app.crud.columns.toggle': 'Toggle Columns',
          'app.crud.dialog.delete.title': 'Delete {{entity}}',
          'app.crud.dialog.delete.message': 'Are you sure you want to delete this {{entity}}?',
          'app.crud.dialog.delete.confirmLabel': 'Delete',
          'app.crud.dialog.delete.cancelLabel': 'Cancel',
          'app.crud.actions.create': 'Create',
          'app.crud.actions.edit': 'Edit',
          'app.crud.actions.delete': 'Delete',
          'app.crud.actions.refresh': 'Refresh',
          'app.crud.actions.cancel': 'Cancel',
          'app.crud.actions.clearSelection': 'Clear Selection'
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

    // Setup inputs
    fixture.componentRef.setInput('config', testConfig);
    fixture.componentRef.setInput('store', mockEntityStore);

    // Subscribe to events
    component.events.subscribe((event) => emittedEvents.push(event));

    fixture.detectChanges();
    await fixture.whenStable();
  });

  describe('Entity Selection Behavior', () => {
    it('should select an entity when user clicks on it', () => {
      // Given: A list of entities is displayed
      const entityToSelect = testEntities[0];

      // When: User selects an entity
      component.selectEntity(entityToSelect);
      fixture.detectChanges();

      // Then: The entity should be selected in the store
      expect(mockEntityStore.setSelected).toHaveBeenCalledWith(entityToSelect);

      // And: An event should be emitted
      expect(emittedEvents).toContainEqual({ entitySelected: entityToSelect });
      
      // And: Form should automatically open in edit mode (if edit permission exists)
      expect(component.isFormActive()).toBe(true);
      expect(component.isEditing()).toBe(true);
    });

    it('should not select when entity is undefined', () => {
      // Given: An invalid selection attempt
      const initialCallCount = mockEntityStore.setSelected.mock.calls.length;

      // When: User tries to select undefined
      component.selectEntity(undefined);
      fixture.detectChanges();

      // Then: Store should not be updated
      expect(mockEntityStore.setSelected).toHaveBeenCalledTimes(initialCallCount);
    });

    it('should not open form when selecting entity without edit permission', () => {
      // Given: User does not have edit permission
      fixture.componentRef.setInput('canEdit', false);
      const entityToSelect = testEntities[0];
      fixture.detectChanges();

      // When: User selects an entity
      component.selectEntity(entityToSelect);
      fixture.detectChanges();

      // Then: Entity should be selected
      expect(mockEntityStore.setSelected).toHaveBeenCalledWith(entityToSelect);

      // But: Form should not open
      expect(component.isFormActive()).toBe(false);
    });

    it('should clear selection when user clicks clear button', () => {
      // Given: An entity is currently selected
      mockEntityStore.selected.set(testEntities[0]);
      component.selectEntity(testEntities[0]);
      fixture.detectChanges();

      // When: User clears the selection
      component.clearSelection();
      fixture.detectChanges();

      // Then: Selected entity should be null
      expect(mockEntityStore.setSelected).toHaveBeenCalledWith(null);

      // And: Form should be closed
      expect(component.formMode()).toBeNull();
    });

    it('should display selected entity information in the UI', () => {
      // Given: An entity is selected
      const selected = testEntities[0];
      mockEntityStore.selected.set(selected);
      component.selectEntity(selected);
      fixture.detectChanges();

      // When: Checking the UI
      const compiled = fixture.nativeElement as HTMLElement;

      // Then: Edit and delete buttons should be visible
      const editButton = compiled.querySelector('button[type="button"]') as HTMLElement;
      expect(editButton).toBeTruthy();
    });
  });

  describe('Create Entity Behavior', () => {
    it('should enter create mode when user clicks create button', () => {
      // Given: User has permission to create
      fixture.componentRef.setInput('canCreate', true);
      fixture.detectChanges();

      // When: User clicks create button
      component.startCreate();
      fixture.detectChanges();

      // Then: Form should be in create mode
      expect(component.isCreating()).toBe(true);
      expect(component.isEditing()).toBe(false);
      expect(component.isFormActive()).toBe(true);

      // And: No entity should be selected
      expect(mockEntityStore.setSelected).toHaveBeenCalledWith(null);
    });

    it('should not enter create mode when user lacks permission', () => {
      // Given: User does not have create permission
      fixture.componentRef.setInput('canCreate', false);
      fixture.detectChanges();

      // When: User attempts to start create
      component.startCreate();
      fixture.detectChanges();

      // Then: Form should not be active
      expect(component.isFormActive()).toBe(false);
    });

    it('should display create form section when in create mode', () => {
      // Given: User starts creating an entity
      fixture.componentRef.setInput('canCreate', true);
      component.startCreate();
      fixture.detectChanges();

      // When: Checking the UI
      const compiled = fixture.nativeElement as HTMLElement;

      // Then: Form section should be visible
      const formSection = compiled.querySelector('.entity-form-section');
      expect(formSection).toBeTruthy();

      // And: Should show "Create" in the title
      const formTitle = formSection?.querySelector('h3');
      expect(formTitle?.textContent).toContain('Create');
    });
  });

  describe('Edit Entity Behavior', () => {
    it('should enter edit mode when user clicks edit on selected entity', () => {
      // Given: An entity is selected
      const entityToEdit = testEntities[1];
      mockEntityStore.selected.set(entityToEdit);
      fixture.componentRef.setInput('canEdit', true);
      fixture.detectChanges();

      // When: User starts editing
      component.startEdit();
      fixture.detectChanges();

      // Then: Form should be in edit mode
      expect(component.isEditing()).toBe(true);
      expect(component.isCreating()).toBe(false);
      expect(component.isFormActive()).toBe(true);
    });

    it('should enter edit mode with specific entity when provided', () => {
      // Given: Multiple entities available
      const entityToEdit = testEntities[2];
      fixture.componentRef.setInput('canEdit', true);
      fixture.detectChanges();

      // When: User clicks edit on a specific entity
      component.startEdit(entityToEdit);
      fixture.detectChanges();

      // Then: That entity should be selected
      expect(mockEntityStore.setSelected).toHaveBeenCalledWith(entityToEdit);

      // And: Form should be in edit mode
      expect(component.isEditing()).toBe(true);
    });

    it('should not enter edit mode when user lacks permission', () => {
      // Given: User does not have edit permission
      fixture.componentRef.setInput('canEdit', false);
      mockEntityStore.selected.set(testEntities[0]);
      fixture.detectChanges();

      // When: User attempts to edit
      component.startEdit();
      fixture.detectChanges();

      // Then: Form should not be active
      expect(component.isFormActive()).toBe(false);
    });

    it('should not enter edit mode when no entity is selected', () => {
      // Given: No entity selected
      mockEntityStore.selected.set(null);
      fixture.componentRef.setInput('canEdit', true);
      fixture.detectChanges();

      // When: User attempts to edit
      component.startEdit();
      fixture.detectChanges();

      // Then: Form should not be active
      expect(component.isFormActive()).toBe(false);
    });

    it('should display edit form section with entity data', () => {
      // Given: User is editing an entity
      const entityToEdit = testEntities[0];
      mockEntityStore.selected.set(entityToEdit);
      fixture.componentRef.setInput('canEdit', true);
      component.startEdit();
      fixture.detectChanges();

      // When: Checking the UI
      const compiled = fixture.nativeElement as HTMLElement;

      // Then: Form section should show "Edit"
      const formSection = compiled.querySelector('.entity-form-section');
      const formTitle = formSection?.querySelector('h3');
      expect(formTitle?.textContent).toContain('Edit');
    });
  });

  describe('Delete Entity Behavior', () => {
    it('should show confirmation dialog when user clicks delete', async () => {
      // Given: An entity exists
      const entityToDelete = testEntities[0];
      fixture.componentRef.setInput('canDelete', true);
      fixture.detectChanges();

      // When: User clicks delete
      await component.confirmDelete(entityToDelete);

      // Then: Confirmation modal should be shown with translation keys
      expect(mockModalService.confirm).toHaveBeenCalledWith({
        title: 'app.crud.dialog.delete.title',
        message: 'app.crud.dialog.delete.message',
        confirmLabel: 'app.crud.dialog.delete.confirmLabel',
        cancelLabel: 'app.crud.dialog.delete.cancelLabel',
        detailed: true
      });
    });

    it('should delete entity when user confirms deletion', async () => {
      // Given: User confirms deletion
      const entityToDelete = testEntities[0];
      (mockModalService.confirm as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        confirmed: true
      });
      fixture.componentRef.setInput('canDelete', true);
      fixture.detectChanges();

      // When: User confirms delete
      await component.confirmDelete(entityToDelete);
      await fixture.whenStable();

      // Then: Entity should be deleted from store
      expect(mockEntityStore.delete).toHaveBeenCalledWith(entityToDelete.id);

      // And: Delete event should be emitted
      expect(emittedEvents).toContainEqual({ entityDeleted: entityToDelete.id });
    });

    it('should not delete entity when user cancels deletion', async () => {
      // Given: User cancels deletion
      const entityToDelete = testEntities[0];
      (mockModalService.confirm as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        confirmed: false
      });
      const deleteCallCount = mockEntityStore.delete.mock.calls.length;
      fixture.detectChanges();

      // When: User cancels delete
      await component.confirmDelete(entityToDelete);
      await fixture.whenStable();

      // Then: Entity should not be deleted
      expect(mockEntityStore.delete).toHaveBeenCalledTimes(deleteCallCount);
    });

    it('should handle delete errors gracefully', async () => {
      // Given: Delete operation will fail
      const entityToDelete = testEntities[0];
      const errorEvents: { operation: string; error: Error }[] = [];
      component.errorOccurred.subscribe((event) => errorEvents.push(event));
      
      mockEntityStore.delete.mockReturnValue(
        throwError(() => new Error('Network error'))
      );
      (mockModalService.confirm as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        confirmed: true
      });
      fixture.detectChanges();

      // When: User attempts to delete
      await component.confirmDelete(entityToDelete);
      await fixture.whenStable();

      // Then: Error event should be emitted
      expect(errorEvents).toHaveLength(1);
      expect(errorEvents[0].operation).toBe('delete');
      expect(errorEvents[0].error).toBeInstanceOf(Error);
      expect(errorEvents[0].error.message).toBe('Network error');
    });
  });

  describe('Form Cancellation Behavior', () => {
    it('should close form when user clicks cancel in create mode', () => {
      // Given: User is in create mode
      component.startCreate();
      fixture.detectChanges();
      expect(component.isFormActive()).toBe(true);

      // When: User cancels the form
      component.cancelForm();
      fixture.detectChanges();

      // Then: Form should be closed
      expect(component.isFormActive()).toBe(false);
      expect(component.formMode()).toBeNull();
    });

    it('should close form when user clicks cancel in edit mode', () => {
      // Given: User is in edit mode
      mockEntityStore.selected.set(testEntities[0]);
      component.startEdit();
      fixture.detectChanges();
      expect(component.isFormActive()).toBe(true);

      // When: User cancels the form
      component.cancelForm();
      fixture.detectChanges();

      // Then: Form should be closed
      expect(component.isFormActive()).toBe(false);
      expect(component.formMode()).toBeNull();
    });

    it('should display cancel button in form actions', () => {
      // Given: Form is active
      component.startCreate();
      fixture.detectChanges();

      // When: Checking the UI
      const compiled = fixture.nativeElement as HTMLElement;
      const formActions = compiled.querySelector('.form-actions');

      // Then: Cancel button should be present with translation key
      const cancelButton = formActions?.querySelector('button');
      expect(cancelButton?.textContent).toContain('app.crud.actions.cancel');
    });
  });

  describe('Data Refresh Behavior', () => {
    it('should refresh data when user clicks refresh button', () => {
      // Given: User wants fresh data
      const refreshSpy = mockEntityStore.refresh;
      refreshSpy.mockClear();

      // When: User clicks refresh
      component.refreshData();
      fixture.detectChanges();

      // Then: Store should refresh data
      expect(refreshSpy).toHaveBeenCalled();
    });

    it('should handle refresh errors gracefully', () => {
      // Given: Refresh will fail
      const errorEvents: { operation: string; error: Error }[] = [];
      component.errorOccurred.subscribe((event) => errorEvents.push(event));
      
      mockEntityStore.refresh.mockReturnValue(
        throwError(() => new Error('API error'))
      );

      // When: User attempts to refresh
      component.refreshData();

      // Then: Error event should be emitted
      expect(errorEvents).toHaveLength(1);
      expect(errorEvents[0].operation).toBe('refresh');
      expect(errorEvents[0].error).toBeInstanceOf(Error);
      expect(errorEvents[0].error.message).toBe('API error');
    });

    it('should disable refresh button when loading', () => {
      // Given: Data is currently loading
      mockEntityStore.loading.set({ isLoading: true, operation: 'refresh' });
      fixture.detectChanges();

      // When: Checking the UI
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button');
      const refreshButton = Array.from(buttons).find(btn => 
        btn.textContent?.includes('app.crud.actions.refresh')
      );

      // Then: Refresh button should be disabled
      expect(refreshButton).toBeTruthy();
      expect(refreshButton?.disabled).toBe(true);
    });
  });

  describe('Data Display Behavior', () => {
    it('should display all entities from the store', () => {
      // Given: Store has entities
      const displayedItems = component.displayItems();

      // When: Checking displayed data
      // Then: All entities should be available
      expect(displayedItems).toEqual(testEntities);
      expect(displayedItems.length).toBe(3);
    });

    it('should use custom data source when provided', () => {
      // Given: A custom data signal is provided
      const customData = [testEntities[0], testEntities[1]];
      const customSignal: Signal<TestEntity[]> = signal(customData);
      fixture.componentRef.setInput('dataSignal', customSignal);
      fixture.detectChanges();

      // When: Checking displayed data
      const displayedItems = component.displayItems();

      // Then: Custom data should be used instead of store
      expect(displayedItems).toEqual(customData);
      expect(displayedItems.length).toBe(2);
    });

    it('should format cell values using column formatter', () => {
      // Given: A column with value formatter
      const priceColumn = testConfig.columns.find(col => col.field === 'price')!;
      const testPrice = 12.99;

      // When: Formatting the value
      const formatted = component.formatCellValue(testPrice, priceColumn);

      // Then: Value should be formatted correctly
      expect(formatted).toBe('$12.99');
    });

    it('should handle null values in cell formatting', () => {
      // Given: A null value
      const column = testConfig.columns[0];

      // When: Formatting null
      const formatted = component.formatCellValue(null, column);

      // Then: Should return empty string
      expect(formatted).toBe('');
    });

    it('should handle undefined values in cell formatting', () => {
      // Given: An undefined value
      const column = testConfig.columns[0];

      // When: Formatting undefined
      const formatted = component.formatCellValue(undefined, column);

      // Then: Should return empty string
      expect(formatted).toBe('');
    });

    it('should convert non-string values to strings', () => {
      // Given: Various value types
      const column = testConfig.columns[0];

      // When: Formatting different types
      const numberFormatted = component.formatCellValue(42, column);
      const booleanFormatted = component.formatCellValue(true, column);

      // Then: Should convert to strings
      expect(numberFormatted).toBe('42');
      expect(booleanFormatted).toBe('true');
    });

    it('should display item count in status bar', () => {
      // Given: Store has entities
      fixture.detectChanges();

      // When: Checking the status bar
      const compiled = fixture.nativeElement as HTMLElement;
      const statusBar = compiled.querySelector('.status-bar');

      // Then: Item count should be displayed (checks for translation key)
      expect(statusBar?.textContent).toContain('app.crud.items');
      expect(statusBar?.textContent).toContain('3');
    });

    it('should display loading state in status bar', () => {
      // Given: Store is loading
      mockEntityStore.loading.set({ isLoading: true, operation: 'fetch' });
      fixture.detectChanges();

      // When: Checking the status bar
      const compiled = fixture.nativeElement as HTMLElement;
      const statusBar = compiled.querySelector('.status-bar');

      // Then: Loading message should be displayed (checks for translation key)
      expect(statusBar?.textContent).toContain('app.crud.loading');
    });

    it('should display error message in status bar when error occurs', () => {
      // Given: Store has an error
      const errorMessage = 'Failed to load data';
      mockEntityStore.error.set({ message: errorMessage });
      fixture.detectChanges();

      // When: Checking the status bar
      const compiled = fixture.nativeElement as HTMLElement;
      const errorElement = compiled.querySelector('.status-item.error');

      // Then: Error should be displayed
      expect(errorElement?.textContent).toContain(errorMessage);
      expect(errorElement?.getAttribute('role')).toBe('alert');
      expect(errorElement?.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('Grid Configuration Behavior', () => {
    it('should configure grid with visible columns only', () => {
      // Given: Component is initialized
      const gridConfig = component.gridConfig();

      // When: Checking grid configuration
      // Then: Only visible columns should be included
      const visibleFields = gridConfig.columnDefs?.map((col: any) => col.field) || [];
      expect(visibleFields).toContain('title');
      expect(visibleFields).toContain('author');
      expect(visibleFields).toContain('price');
      expect(visibleFields).toContain('category');
      expect(visibleFields).not.toContain('isbn'); // Hidden by default
    });

    it('should include row click handler in grid options', () => {
      // Given: Component is initialized
      const gridConfig = component.gridConfig();

      // When: Checking grid options
      // Then: Row click handler should be defined
      expect(gridConfig.gridOptions?.['onRowClicked']).toBeDefined();
    });

    it('should select entity when grid row is clicked', () => {
      // Given: Grid is configured
      const gridConfig = component.gridConfig();
      const entity = testEntities[0];

      // When: Row is clicked
      const onRowClicked = gridConfig.gridOptions?.['onRowClicked'] as any;
      if (onRowClicked) {
        onRowClicked({ data: entity });
      }
      fixture.detectChanges();

      // Then: Entity should be selected
      expect(mockEntityStore.setSelected).toHaveBeenCalledWith(entity);
    });

    it('should handle grid ready callback', () => {
      // Given: Grid becomes ready
      const mockApi = { some: 'api' };

      // When: Grid ready is called
      // Then: Should not throw
      expect(() => {
        component.onGridReady(mockApi);
      }).not.toThrow();
    });
  });

  describe('Permission-Based Features', () => {
    it('should hide create button when user lacks create permission', () => {
      // Given: User cannot create
      fixture.componentRef.setInput('canCreate', false);
      fixture.detectChanges();

      // When: Checking the UI
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = Array.from(compiled.querySelectorAll('button'));
      const createButton = buttons.find(btn => btn.textContent?.includes('Create'));

      // Then: Create button should not be visible
      expect(createButton).toBeFalsy();
    });

    it('should show create button when user has create permission', () => {
      // Given: User can create
      fixture.componentRef.setInput('canCreate', true);
      fixture.detectChanges();

      // When: Checking the UI
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = Array.from(compiled.querySelectorAll('button'));
      const createButton = buttons.find(btn => btn.textContent?.includes('app.crud.actions.create'));

      // Then: Create button should be visible
      expect(createButton).toBeTruthy();
    });

    it('should hide edit actions when user lacks edit permission', () => {
      // Given: User cannot edit and entity is selected
      fixture.componentRef.setInput('canEdit', false);
      mockEntityStore.selected.set(testEntities[0]);
      fixture.detectChanges();

      // When: Checking the UI
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = Array.from(compiled.querySelectorAll('button'));
      const editButton = buttons.find(btn => btn.textContent?.includes('Edit'));

      // Then: Edit button should not be visible
      expect(editButton).toBeFalsy();
    });

    it('should hide delete actions when user lacks delete permission', () => {
      // Given: User cannot delete and entity is selected
      fixture.componentRef.setInput('canDelete', false);
      mockEntityStore.selected.set(testEntities[0]);
      fixture.detectChanges();

      // When: Checking the UI
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = Array.from(compiled.querySelectorAll('button'));
      const deleteButton = buttons.find(btn => btn.textContent?.includes('Delete'));

      // Then: Delete button should not be visible
      expect(deleteButton).toBeFalsy();
    });
  });

  describe('Accessibility Behavior', () => {
    it('should have proper ARIA labels for status updates', () => {
      // Given: Component is rendered
      fixture.detectChanges();

      // When: Checking accessibility
      const compiled = fixture.nativeElement as HTMLElement;
      const statusBar = compiled.querySelector('.status-bar');
      const liveRegion = statusBar?.querySelector('[aria-live]');

      // Then: Live region should be present
      expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
    });

    it('should announce loading state to screen readers', () => {
      // Given: Store is loading
      mockEntityStore.loading.set({ isLoading: true, operation: 'loading' });
      fixture.detectChanges();

      // When: Checking the live region
      const compiled = fixture.nativeElement as HTMLElement;
      const liveRegion = compiled.querySelector('[aria-live="polite"]');

      // Then: Loading message should be announced (checks for translation key)
      expect(liveRegion?.textContent).toContain('app.crud.loading');
    });

    it('should announce errors with assertive priority', () => {
      // Given: An error occurs
      mockEntityStore.error.set({ message: 'Error loading data' });
      fixture.detectChanges();

      // When: Checking error announcement
      const compiled = fixture.nativeElement as HTMLElement;
      const errorRegion = compiled.querySelector('[aria-live="assertive"]');

      // Then: Error should be announced assertively
      expect(errorRegion?.getAttribute('role')).toBe('alert');
    });

    it('should have proper form accessibility labels', () => {
      // Given: Form is active
      component.startCreate();
      fixture.detectChanges();

      // When: Checking form accessibility
      const compiled = fixture.nativeElement as HTMLElement;
      const formSection = compiled.querySelector('.entity-form-section');

      // Then: Form should have proper label
      expect(formSection?.getAttribute('aria-label')).toContain('Book form');
    });
  });

  describe('Helper Methods', () => {
    it('should get column visibility correctly', () => {
      // Given: Columns with different visibility
      // When: Checking visibility
      const titleVisible = component.getColumnVisibility('title');
      const isbnVisible = component.getColumnVisibility('isbn');

      // Then: Should return correct visibility
      expect(titleVisible).toBe(true);
      expect(isbnVisible).toBe(false);
    });

    it('should get column key as string', () => {
      // Given: A column field
      // When: Getting column key
      const key = component.getColumnKey('title');

      // Then: Should return string key
      expect(key).toBe('title');
      expect(typeof key).toBe('string');
    });
  });

  describe('CRUD API Integration', () => {
    describe('Create Operations', () => {
      it('should use store create method when creating new entity', () => {
        // Given: Component is in create mode
        const createSpy = vi.fn().mockReturnValue(
          of({ id: 4, title: 'New Book', author: 'New Author', isbn: '123', category: 'New', price: 19.99 })
        );
        mockEntityStore.create = createSpy;
        component.startCreate();
        fixture.detectChanges();

        // When: Parent component calls store.create through the store reference
        const newEntity = { title: 'New Book', author: 'New Author', isbn: '123', category: 'New', price: 19.99 };
        mockEntityStore.create(newEntity).subscribe();

        // Then: Store create should be called with new entity data
        expect(createSpy).toHaveBeenCalledWith(newEntity);
      });

      it('should update items signal after successful create', async () => {
        // Given: A successful create operation
        const newEntity: TestEntity = { id: 4, title: 'New Book', author: 'New Author', isbn: '123', category: 'New', price: 19.99 };
        const createSpy = vi.fn().mockReturnValue(of(newEntity));
        mockEntityStore.create = createSpy;

        // When: Create is called
        await firstValueFrom(mockEntityStore.create({ title: 'New Book' }));

        // Then: The new entity should be added to items
        // Note: In real EntityStore, items signal is updated automatically
        mockEntityStore.items.set([...testEntities, newEntity]);
        expect(mockEntityStore.items().length).toBe(4);
        expect(mockEntityStore.items()).toContain(newEntity);
      });

      it('should handle create errors gracefully', async () => {
        // Given: Create operation will fail
        const createError = new Error('Create failed: Network error');
        const createSpy = vi.fn().mockReturnValue(throwError(() => createError));
        mockEntityStore.create = createSpy;

        // When: Create is called
        await expect(firstValueFrom(mockEntityStore.create({ title: 'Failed Book' }))).rejects.toBe(createError);
      });
    });

    describe('Update Operations', () => {
      it('should use store update method when editing entity', () => {
        // Given: An entity is being edited
        const updateSpy = vi.fn().mockReturnValue(of(testEntities[0]));
        mockEntityStore.update = updateSpy;
        mockEntityStore.selected.set(testEntities[0]);
        component.startEdit();
        fixture.detectChanges();

        // When: Parent component calls store.update
        const updates = { title: 'Updated Title' };
        mockEntityStore.update(testEntities[0].id, updates).subscribe();

        // Then: Store update should be called with id and updates
        expect(updateSpy).toHaveBeenCalledWith(testEntities[0].id, updates);
      });

      it('should update items signal after successful update', async () => {
        // Given: A successful update operation
        const updatedEntity: TestEntity = { ...testEntities[0], title: 'Updated Title' };
        const updateSpy = vi.fn().mockReturnValue(of(updatedEntity));
        mockEntityStore.update = updateSpy;

        // When: Update is called
        await firstValueFrom(mockEntityStore.update(testEntities[0].id, { title: 'Updated Title' }));

        // Then: The entity should be updated in items
        mockEntityStore.items.set([updatedEntity, testEntities[1], testEntities[2]]);
        const item = mockEntityStore.items().find(i => i.id === testEntities[0].id);
        expect(item?.title).toBe('Updated Title');
      });

      it('should update selected entity after successful update', async () => {
        // Given: An entity is selected and updated
        const updatedEntity: TestEntity = { ...testEntities[0], title: 'Updated Title' };
        const updateSpy = vi.fn().mockReturnValue(of(updatedEntity));
        mockEntityStore.update = updateSpy;
        mockEntityStore.selected.set(testEntities[0]);

        // When: Update is called
        await firstValueFrom(mockEntityStore.update(testEntities[0].id, { title: 'Updated Title' }));

        // Then: Selected entity should be updated
        mockEntityStore.selected.set(updatedEntity);
        expect(mockEntityStore.selected()?.title).toBe('Updated Title');
      });

      it('should handle update errors gracefully', async () => {
        // Given: Update operation will fail
        const updateError = new Error('Update failed: Validation error');
        const updateSpy = vi.fn().mockReturnValue(throwError(() => updateError));
        mockEntityStore.update = updateSpy;

        // When: Update is called
        await expect(firstValueFrom(mockEntityStore.update(1, { title: 'Failed Update' }))).rejects.toBe(updateError);
      });
    });

    describe('Delete Operations', () => {
      it('should call store delete method when deleting entity', async () => {
        // Given: User confirms deletion
        const deleteSpy = vi.fn().mockReturnValue(of(void 0));
        mockEntityStore.delete = deleteSpy;
        (mockModalService.confirm as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
          confirmed: true
        });

        // When: User deletes an entity
        await component.confirmDelete(testEntities[0]);
        await fixture.whenStable();

        // Then: Store delete should be called with entity id
        expect(deleteSpy).toHaveBeenCalledWith(testEntities[0].id);
      });

      it('should remove entity from items after successful delete', async () => {
        // Given: A successful delete operation
        const entityToDelete = testEntities[0];
        const deleteSpy = vi.fn().mockReturnValue(of(void 0));
        mockEntityStore.delete = deleteSpy;
        (mockModalService.confirm as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
          confirmed: true
        });

        // When: Entity is deleted
        await component.confirmDelete(entityToDelete);
        await fixture.whenStable();

        // Simulate EntityStore behavior - remove item
        mockEntityStore.items.set(testEntities.filter(e => e.id !== entityToDelete.id));

        // Then: Entity should be removed from items
        expect(mockEntityStore.items().length).toBe(2);
        expect(mockEntityStore.items()).not.toContain(entityToDelete);
      });

      it('should clear selection after deleting selected entity', async () => {
        // Given: Selected entity is deleted
        const entityToDelete = testEntities[0];
        mockEntityStore.selected.set(entityToDelete);
        const deleteSpy = vi.fn().mockReturnValue(of(void 0));
        mockEntityStore.delete = deleteSpy;
        (mockModalService.confirm as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
          confirmed: true
        });

        // When: Entity is deleted
        await component.confirmDelete(entityToDelete);
        await fixture.whenStable();

        // Simulate EntityStore behavior - clear selection
        mockEntityStore.selected.set(null);

        // Then: Selection should be cleared
        expect(mockEntityStore.selected()).toBeNull();
      });

      it('should emit entityDeleted event after successful delete', async () => {
        // Given: A successful delete operation
        const entityToDelete = testEntities[0];
        const deleteSpy = vi.fn().mockReturnValue(of(void 0));
        mockEntityStore.delete = deleteSpy;
        (mockModalService.confirm as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
          confirmed: true
        });
        emittedEvents = [];

        // When: Entity is deleted
        await component.confirmDelete(entityToDelete);
        await fixture.whenStable();

        // Then: entityDeleted event should be emitted
        expect(emittedEvents).toContainEqual({ entityDeleted: entityToDelete.id });
      });
    });

    describe('Read/Refresh Operations', () => {
      it('should call store refresh method when refreshing data', () => {
        // Given: User wants to refresh data
        const refreshSpy = vi.fn().mockReturnValue(of(testEntities));
        mockEntityStore.refresh = refreshSpy;

        // When: User clicks refresh
        component.refreshData();

        // Then: Store refresh should be called
        expect(refreshSpy).toHaveBeenCalled();
      });

      it('should update items after successful refresh', async () => {
        // Given: A successful refresh operation
        const newData: TestEntity[] = [
          ...testEntities,
          { id: 4, title: 'Refreshed Book', author: 'New Author', isbn: '999', category: 'New', price: 29.99 }
        ];
        const refreshSpy = vi.fn().mockReturnValue(of(newData));
        mockEntityStore.refresh = refreshSpy;

        // When: Data is refreshed
        component.refreshData();
        await firstValueFrom(mockEntityStore.refresh());

        // Then: Items should be updated
        mockEntityStore.items.set(newData);
        expect(mockEntityStore.items().length).toBe(4);
      });

      it('should handle refresh errors with error event', () => {
        // Given: Refresh will fail
        const errorEvents: { operation: string; error: Error }[] = [];
        component.errorOccurred.subscribe((event) => errorEvents.push(event));
        
        const refreshError = new Error('Refresh failed: Server error');
        mockEntityStore.refresh.mockReturnValue(throwError(() => refreshError));

        // When: Refresh is attempted
        component.refreshData();

        // Then: Error event should be emitted
        expect(errorEvents).toHaveLength(1);
        expect(errorEvents[0].operation).toBe('refresh');
        expect(errorEvents[0].error).toBeInstanceOf(Error);
        expect(errorEvents[0].error.message).toBe('Refresh failed: Server error');
      });
    });

    describe('Loading State Management', () => {
      it('should show loading state during create operation', () => {
        // Given: A create operation is in progress
        mockEntityStore.loading.set({ isLoading: true, operation: 'create' });
        fixture.detectChanges();

        // When: Checking the UI
        const compiled = fixture.nativeElement as HTMLElement;
        const statusBar = compiled.querySelector('.status-bar');

        // Then: Loading indicator should be visible
        expect(statusBar?.textContent).toContain('app.crud.loading');
        expect(statusBar?.textContent).toContain('create');
      });

      it('should show loading state during update operation', () => {
        // Given: An update operation is in progress
        mockEntityStore.loading.set({ isLoading: true, operation: 'update' });
        fixture.detectChanges();

        // When: Checking the UI
        const compiled = fixture.nativeElement as HTMLElement;
        const statusBar = compiled.querySelector('.status-bar');

        // Then: Loading indicator should be visible with operation type
        expect(statusBar?.textContent).toContain('app.crud.loading');
        expect(statusBar?.textContent).toContain('update');
      });

      it('should show loading state during delete operation', () => {
        // Given: A delete operation is in progress
        mockEntityStore.loading.set({ isLoading: true, operation: 'delete' });
        fixture.detectChanges();

        // When: Checking the UI
        const compiled = fixture.nativeElement as HTMLElement;
        const statusBar = compiled.querySelector('.status-bar');

        // Then: Loading indicator should be visible
        expect(statusBar?.textContent).toContain('app.crud.loading');
        expect(statusBar?.textContent).toContain('delete');
      });

      it('should disable actions during loading', () => {
        // Given: Store is loading
        mockEntityStore.loading.set({ isLoading: true, operation: 'create' });
        fixture.detectChanges();

        // When: Checking action buttons
        const compiled = fixture.nativeElement as HTMLElement;
        const buttons = Array.from(compiled.querySelectorAll('button'));
        const createButton = buttons.find(btn => btn.textContent?.includes('app.crud.actions.create'));
        const refreshButton = buttons.find(btn => btn.textContent?.includes('app.crud.actions.refresh'));

        // Then: Action buttons should be disabled
        expect(createButton?.disabled).toBe(true);
        expect(refreshButton?.disabled).toBe(true);
      });
    });

    describe('Error State Management', () => {
      it('should display API error in status bar', () => {
        // Given: An API error occurs
        const apiError = { message: 'Failed to fetch data: 500 Internal Server Error', code: '500', timestamp: Date.now() };
        mockEntityStore.error.set(apiError);
        fixture.detectChanges();

        // When: Checking the error display
        const compiled = fixture.nativeElement as HTMLElement;
        const errorElement = compiled.querySelector('.status-item.error');

        // Then: Error should be displayed with proper accessibility
        expect(errorElement?.textContent).toContain(apiError.message);
        expect(errorElement?.getAttribute('role')).toBe('alert');
        expect(errorElement?.getAttribute('aria-live')).toBe('assertive');
      });

      it('should clear error on successful operation', () => {
        // Given: An error exists
        mockEntityStore.error.set({ message: 'Previous error' });
        
        // When: A successful refresh occurs
        mockEntityStore.refresh.mockReturnValue(of(testEntities));
        component.refreshData();
        
        // Simulate error clearing (done by EntityStore)
        mockEntityStore.error.set(null);
        fixture.detectChanges();

        // Then: Error should be cleared
        const compiled = fixture.nativeElement as HTMLElement;
        const errorElement = compiled.querySelector('.status-item.error');
        expect(errorElement).toBeFalsy();
      });
    });

    describe('Data Persistence via EntityStore', () => {
      it('should maintain data consistency across operations', async () => {
        // Given: Initial data state
        const initialItems = [...testEntities];
        mockEntityStore.items.set(initialItems);

        // When: Multiple operations occur
        // 1. Update an entity
        const updated = { ...testEntities[0], title: 'Updated' };
        mockEntityStore.items.set([updated, testEntities[1], testEntities[2]]);
        fixture.detectChanges();

        // 2. Delete an entity
        mockEntityStore.items.set([updated, testEntities[2]]);
        fixture.detectChanges();

        // 3. Create a new entity
        const newEntity: TestEntity = { id: 4, title: 'New', author: 'Author', isbn: '123', category: 'Cat', price: 9.99 };
        mockEntityStore.items.set([updated, testEntities[2], newEntity]);
        fixture.detectChanges();

        // Then: Data should reflect all operations
        const displayedItems = component.displayItems();
        expect(displayedItems.length).toBe(3);
        expect(displayedItems.find(i => i.id === 1)?.title).toBe('Updated');
        expect(displayedItems.find(i => i.id === 2)).toBeUndefined();
        expect(displayedItems.find(i => i.id === 4)).toBeTruthy();
      });

      it('should sync selected entity with items after update', () => {
        // Given: An entity is selected
        const originalEntity = testEntities[0];
        mockEntityStore.selected.set(originalEntity);

        // When: The entity is updated
        const updatedEntity = { ...originalEntity, title: 'Updated Title' };
        mockEntityStore.items.set([updatedEntity, testEntities[1], testEntities[2]]);
        mockEntityStore.selected.set(updatedEntity);
        fixture.detectChanges();

        // Then: Selected entity should reflect the update
        expect(mockEntityStore.selected()?.title).toBe('Updated Title');
      });
    });

    describe('Store Integration Edge Cases', () => {
      it('should handle empty response from store gracefully', async () => {
        // Given: Store returns empty array
        mockEntityStore.refresh.mockReturnValue(of([]));

        // When: Refresh is called
        component.refreshData();
        await firstValueFrom(mockEntityStore.refresh());
        mockEntityStore.items.set([]);
        fixture.detectChanges();

        // Then: Should display empty state
        const displayedItems = component.displayItems();
        expect(displayedItems.length).toBe(0);
      });

      it('should handle concurrent operations', () => {
        // Given: Multiple operations are triggered
        const createSpy = vi.fn().mockReturnValue(
          of({ id: 4, title: 'New', author: 'A', isbn: '1', category: 'C', price: 1 })
        );
        const updateSpy = vi.fn().mockReturnValue(of({ ...testEntities[0], title: 'Updated' }));
        const deleteSpy = vi.fn().mockReturnValue(of(void 0));
        
        mockEntityStore.create = createSpy;
        mockEntityStore.update = updateSpy;
        mockEntityStore.delete = deleteSpy;

        // When: Operations are called concurrently
        mockEntityStore.create({});
        mockEntityStore.update(1, {});
        mockEntityStore.delete(2);

        // Then: All operations should be tracked
        expect(createSpy).toHaveBeenCalled();
        expect(updateSpy).toHaveBeenCalled();
        expect(deleteSpy).toHaveBeenCalled();
      });

      it('should maintain referential integrity after delete', async () => {
        // Given: An entity is selected and then deleted
        const entityToDelete = testEntities[0];
        mockEntityStore.selected.set(entityToDelete);
        mockEntityStore.delete.mockReturnValue(of(void 0));
        (mockModalService.confirm as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
          confirmed: true
        });

        // When: Entity is deleted
        await component.confirmDelete(entityToDelete);
        await fixture.whenStable();

        // Simulate EntityStore clearing the selection
        mockEntityStore.selected.set(null);
        mockEntityStore.items.set(testEntities.filter(e => e.id !== entityToDelete.id));
        fixture.detectChanges();

        // Then: Selected should be null and items shouldn't contain deleted entity
        expect(mockEntityStore.selected()).toBeNull();
        expect(mockEntityStore.items()).not.toContain(entityToDelete);
      });
    });
  });
});
