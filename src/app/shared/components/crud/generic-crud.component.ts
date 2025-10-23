import { 
  Component, signal, computed, inject, TemplateRef, ViewChild, Injector, effect, input, output, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  CrudEntity, CrudConfig, CrudDataSource, CrudEvents, CrudFilterContext, CrudEntityFormContext
} from './types';
import { ResponsiveGridComponent, ResponsiveGridConfig } from '../responsive-grid/responsive-grid.component';
import { ButtonDirective } from '../../directives';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ModalService } from '../../../core/services/modal/modal.service';

/**
 * Generic CRUD component with projection support for filters and forms
 * Follows Angular 20 + signals + zoneless patterns from AGENTS.md
 * 
 * Usage:
 * <app-generic-crud 
 *   [config]="crudConfig" 
 *   [dataSource]="entityStore"
 *   (events)="handleCrudEvent($event)">
 *   
 *   <!-- Project custom filter form using global form styles -->
 *   <form crud-filters [formGroup]="filterForm" (ngSubmit)="applyFilters()" class="crud-form">
 *     <div class="field-grid">
 *       <div class="form-field">
 *         <label class="form-label" for="name">Name</label>
 *         <input id="name" class="form-control" formControlName="name" placeholder="Search by name...">
 *       </div>
 *     </div>
 *     <div class="form-actions">
 *       <button type="submit" appButton variant="secondary">Filter</button>
 *     </div>
 *   </form>
 *   
 *   <!-- Project custom entity form using global form styles -->
 *   <form crud-entity-form [formGroup]="entityForm" (ngSubmit)="saveEntity()" class="crud-form">
 *     <div class="field-grid">
 *       <div class="form-field">
 *         <label class="form-label" for="name">Name</label>
 *         <input id="name" class="form-control" formControlName="name" placeholder="Name" required>
 *       </div>
 *       <div class="form-field">
 *         <label class="form-label" for="price">Price</label>
 *         <input id="price" class="form-control" type="number" formControlName="price" placeholder="Price" required>
 *       </div>
 *     </div>
 *     <div class="form-actions">
 *       <button type="submit" appButton variant="primary">{{isEditing() ? 'Update' : 'Create'}}</button>
 *       <button type="button" appButton variant="secondary" (click)="cancelEdit()">Cancel</button>
 *     </div>
 *   </form>
 * </app-generic-crud>
 * 
 * Note: Projected content should use global form styles:
 * - .form-field for field containers
 * - .form-label for labels
 * - .form-control for inputs/selects/textareas
 * - .field-grid for responsive form layouts
 * - appButton directive for buttons
 */
@Component({
  selector: 'app-generic-crud',
  standalone: true,
  imports: [CommonModule, ResponsiveGridComponent, ButtonDirective, TranslatePipe],
  templateUrl: './generic-crud.component.html',
  styleUrls: ['./generic-crud.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenericCrudComponent<T extends CrudEntity> {
  readonly config = input.required<CrudConfig<T>>();
  readonly dataSource = input.required<CrudDataSource<T>>();
  readonly events = output<CrudEvents<T>>();

  @ViewChild('filterContent', { read: TemplateRef }) filterContent?: TemplateRef<unknown>;
  @ViewChild('entityFormContent', { read: TemplateRef }) entityFormContent?: TemplateRef<unknown>;

  private readonly modal = inject(ModalService);
  private readonly injector = inject(Injector);
  private readonly translate = inject(TranslateService);

  // Local state signals
  private readonly _selectedEntity = signal<T | null>(null);
  private readonly _currentFilter = signal<Partial<T>>({});
  private readonly _formMode = signal<'create' | 'edit' | null>(null);
  private readonly _columnVisibility = signal<Record<string, boolean>>({});

  // Readonly signals
  readonly selectedEntity = this._selectedEntity.asReadonly();
  readonly currentFilter = this._currentFilter.asReadonly();
  readonly formMode = this._formMode.asReadonly();
  readonly columnVisibility = this._columnVisibility.asReadonly();

  // Computed signals
  readonly isCreating = computed(() => this._formMode() === 'create');
  readonly isEditing = computed(() => this._formMode() === 'edit');
  readonly isFormActive = computed(() => this._formMode() !== null);

  readonly filteredItems = computed(() => {
    const items = this.dataSource().items();
    const filter = this._currentFilter();
    
    if (Object.keys(filter).length === 0) return items;
    
    return items.filter(item => 
      Object.entries(filter).every(([key, value]) => {
        if (value === undefined || value === null || value === '') return true;
        const itemValue = item[key as keyof T];
        
        if (typeof value === 'string' && typeof itemValue === 'string') {
          return itemValue.toLowerCase().includes(value.toLowerCase());
        }
        
        return itemValue === value;
      })
    );
  });

  readonly visibleColumns = computed(() => 
    this.config().columns.filter(col => 
      this._columnVisibility()[col.field as string] !== false
    )
  );

  readonly gridConfig = computed((): ResponsiveGridConfig => ({
    columnDefs: this.visibleColumns().map(col => ({
      field: col.field as string,
      headerName: col.headerName,
      flex: col.flex || 1,
      minWidth: col.minWidth || 100,
      valueFormatter: col.valueFormatter ? 
        (params: { value: unknown }) => col.valueFormatter!(params.value) : 
        undefined,
      cellStyle: col.cellStyle ? 
        (params: { value: unknown }) => col.cellStyle!(params.value) : 
        undefined
    })),
    mobileView: 'cards',
    loadingMessage: 'app.crud.loading',
    retryOnError: true,
    showErrorMessage: true,
    gridOptions: {
      getRowId: (params: { data?: T }) => params?.data ? String(params.data.id) : undefined,
      onRowClicked: (event: { data?: T }) => this.selectEntity(event?.data)
    }
  }));

  readonly gridDataConfig = {
    dataSource: [] as T[],
    preloadGrid: true
  };

  readonly formTitle = computed(() => 
    this._formMode() === 'create' 
      ? `Create ${this.config().entityName}`
      : `Edit ${this.config().entityName}`
  );

  readonly formSectionLabel = computed(() => 
    `${this.formTitle()} form`
  );

  // Filter context for projected filter forms
  readonly filterContext: CrudFilterContext<T> = {
    applyFilter: (filter: Partial<T>) => this.applyFilter(filter),
    clearFilter: () => this.clearFilters(),
    currentFilter: this._currentFilter.asReadonly()
  };

  // Entity form context for projected entity forms  
  readonly entityFormContext: CrudEntityFormContext<T> = {
    mode: computed(() => this._formMode() as 'create' | 'edit'),
    entity: this._selectedEntity.asReadonly(),
    onSubmit: (entity: Partial<T>) => this.handleEntitySubmit(entity),
    onCancel: () => this.cancelForm(),
    isLoading: computed(() => this.dataSource().loading().isLoading),
    errors: computed(() => null) // TODO: Implement validation errors
  };

  constructor() {
    // Initialize column visibility
    effect(() => {
      const visibility: Record<string, boolean> = {};
      this.config().columns.forEach(col => {
        visibility[col.field as string] = col.visible !== false;
      });
      this._columnVisibility.set(visibility);
    });
  }

  // Public API methods
  selectEntity(entity: T | undefined): void {
    if (!entity) return;
    
    this._selectedEntity.set(entity);
    this.dataSource().setSelected(entity);
    this.events.emit({ onEntitySelected: (e: T) => e === entity });
  }

  clearSelection(): void {
    this._selectedEntity.set(null);
    this.dataSource().setSelected(null);
    this._formMode.set(null);
  }

  startCreate(): void {
    this.clearSelection();
    this._formMode.set('create');
  }

  startEdit(entity: T): void {
    this.selectEntity(entity);
    this._formMode.set('edit');
  }

  cancelForm(): void {
    this._formMode.set(null);
    if (!this.isEditing()) {
      this.clearSelection();
    }
  }

  refreshData(): void {
    this.dataSource().refresh().subscribe({
      next: () => console.log(`[${this.config().entityName}] data refreshed`),
      error: (error) => console.error(`[${this.config().entityName}] refresh error:`, error)
    });
  }

  applyFilter(filter: Partial<T>): void {
    this._currentFilter.set(filter);
    this.events.emit({ onFilterChanged: () => filter });
  }

  clearFilters(): void {
    this._currentFilter.set({});
    this.events.emit({ onFilterChanged: () => ({}) });
  }

  toggleColumn(field: string): void {
    this._columnVisibility.update(v => ({ ...v, [field]: !v[field] }));
  }

  async confirmDelete(id: string | number): Promise<void> {
    const confirmModal = await this.modal.confirm({
      title: this.translate.instant('app.crud.dialog.delete.title', { entity: this.config().entityName }) as string,
      message: this.translate.instant('app.crud.dialog.delete.message', { entity: this.config().entityName.toLowerCase() }) as string,
      confirmLabel: this.translate.instant('app.crud.dialog.delete.confirmLabel') as string,
      cancelLabel: this.translate.instant('app.crud.dialog.delete.cancelLabel') as string,
      detailed: true
    });

    if(confirmModal.confirmed) {
      this.deleteEntity(id);
      return;
    }
  }

  // Private helper methods
  private deleteEntity(id: string | number): void {
    this.dataSource().delete(id).subscribe({
      next: () => {
        console.log(`[${this.config().entityName}] entity deleted`);
        if (this._selectedEntity()?.id === id) {
          this.clearSelection();
        }
        this.events.emit({ onEntityDeleted: () => id });
      },
      error: (error) => console.error(`[${this.config().entityName}] delete error:`, error)
    });
  }

  private handleEntitySubmit(entity: Partial<T>): void {
    if (this._formMode() === 'create') {
      this.createEntity(entity);
    } else if (this._formMode() === 'edit' && this._selectedEntity()) {
      this.updateEntity(this._selectedEntity()!.id, entity);
    }
  }

  private createEntity(entity: Partial<T>): void {
    this.dataSource().create(entity).subscribe({
      next: (created) => {
        console.log(`[${this.config().entityName}] entity created:`, created);
        this.cancelForm();
        this.events.emit({ onEntityCreated: () => created });
      },
      error: (error) => console.error(`[${this.config().entityName}] create error:`, error)
    });
  }

  private updateEntity(id: string | number, entity: Partial<T>): void {
    this.dataSource().update(id, entity).subscribe({
      next: (updated) => {
        console.log(`[${this.config().entityName}] entity updated:`, updated);
        this.cancelForm();
        this.events.emit({ onEntityUpdated: () => updated });
      },
      error: (error) => console.error(`[${this.config().entityName}] update error:`, error)
    });
  }

  protected formatCellValue(value: unknown, column: { valueFormatter?: (val: unknown) => string }): string {
    if (column.valueFormatter) {
      return column.valueFormatter(value);
    }
    
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return JSON.stringify(value);
  }

  hasFilterContent(): boolean {
    // In a real implementation, this would check if filter content is projected
    // For now, return true if filters are enabled in config
    return this.config().enableSearch !== false;
  }

  hasEntityFormContent(): boolean {
    // In a real implementation, this would check if entity form content is projected
    // For now, return true if create or update permissions exist
    return this.config().permissions.create || this.config().permissions.update;
  }

  onGridReady(api: unknown): void {
    // Handle grid ready event - could expose API for advanced grid operations
    console.log(`[${this.config().entityName}] grid ready:`, api);
  }

  getColumnVisibility(field: keyof T): boolean {
    return this._columnVisibility()[String(field)] !== false;
  }

  getColumnKey(field: keyof T): string {
    return String(field);
  }
}
