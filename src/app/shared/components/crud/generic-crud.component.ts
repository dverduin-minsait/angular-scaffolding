import { 
  Component, signal, computed, inject, ChangeDetectionStrategy, input, output, effect, Signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { 
  CrudEntity, CrudConfig, CrudEvents, CrudColumnDef
} from './types';
import { EntityStore } from '../../../core/store/entity-store';
import { ResponsiveGridComponent, ResponsiveGridConfig } from '../responsive-grid/responsive-grid.component';
import { ButtonDirective } from '../../directives';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ModalService } from '../../../core/services/modal/modal.service';
import { GenericCrudService } from './generic-crud.service';

/**
 * Simplified generic CRUD component with content projection
 * Follows Angular 20 + signals + zoneless patterns from AGENTS.md
 * 
 * Usage:
 * <app-generic-crud 
 *   [config]="crudConfig" 
 *   [store]="entityStore"
 *   [canCreate]="true"
 *   [canEdit]="true"
 *   [canDelete]="true"
 *   (events)="handleCrudEvent($event)">
 *   
 *   <!-- Project custom filter form -->
 *   <div crud-filters>
 *     <!-- Your filter form here -->
 *   </div>
 *   
 *   <!-- Project custom entity form -->
 *   <div crud-entity-form>
 *     <!-- Your entity form here -->
 *   </div>
 * </app-generic-crud>
 */
@Component({
  selector: 'app-generic-crud',
  standalone: true,
  imports: [CommonModule, ResponsiveGridComponent, ButtonDirective, TranslatePipe],
  providers: [GenericCrudService],
  templateUrl: './generic-crud.component.html',
  styleUrls: ['./generic-crud.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenericCrudComponent<T extends CrudEntity> {
  // Inputs
  readonly config = input.required<CrudConfig<T>>();
  readonly store = input.required<EntityStore<T>>();
  readonly dataSignal = input<Signal<T[]> | null>(null); // Optional override for store data
  readonly canCreate = input<boolean>(true);
  readonly canEdit = input<boolean>(true);
  readonly canDelete = input<boolean>(true);

  // Outputs
  readonly events = output<CrudEvents<T>>();
  readonly errorOccurred = output<{ operation: string; error: Error }>();

  private readonly modal = inject(ModalService);
  private readonly translate = inject(TranslateService);
  private readonly crudService = inject(GenericCrudService);

  // Local state
  private readonly _formMode = signal<'create' | 'edit' | null>(null);
  private readonly _columnVisibility = signal<Record<string, boolean>>({});

  // Computed signals
  readonly formMode = this._formMode.asReadonly();
  readonly isCreating = computed(() => this._formMode() === 'create');
  readonly isEditing = computed(() => this._formMode() === 'edit');
  readonly isFormActive = computed(() => this._formMode() !== null);

  // Data source - uses dataSignal if provided, otherwise store items
  readonly displayItems = computed(() => {
    const customData = this.dataSignal();
    return customData ? customData() : this.store().items();
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
        (params: { value: unknown }) => col.valueFormatter!(params.value as T[keyof T]) : 
        undefined,
      cellStyle: col.cellStyle ? 
        (params: { value: unknown }) => col.cellStyle!(params.value as T[keyof T]) : 
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

  constructor() {
    // Load preferences and initialize column visibility when config changes
    // Effect automatically cleans up when component is destroyed
    effect(() => {
      const config = this.config();
      void this.loadColumnPreferences(config);
    });

    // Save preferences when column visibility changes
    // Effect automatically cleans up when component is destroyed
    effect(() => {
      const visibility = this._columnVisibility();
      const config = this.config();
      
      // Only save if we have a non-empty visibility state (to avoid saving during initialization)
      if (Object.keys(visibility).length > 0) {
        void this.saveColumnPreferences(config.entityName, visibility);
      }
    });
  }

  // Public API methods
  selectEntity(entity: T | undefined): void {
    if (!entity) return;
    
    this.store().setSelected(entity);
    this.events.emit({ entitySelected: entity });
    
    // Automatically enter edit mode when selecting an entity (if edit permission exists)
    if (this.canEdit()) {
      this._formMode.set('edit');
    }
  }

  clearSelection(): void {
    this.store().setSelected(null);
    this._formMode.set(null);
  }

  startCreate(): void {
    if (!this.canCreate()) return;
    this.clearSelection();
    this._formMode.set('create');
  }

  startEdit(entity?: T): void {
    if (!this.canEdit()) return;
    const targetEntity = entity || this.store().selected();
    if (!targetEntity) return;
    
    this.selectEntity(targetEntity);
    this._formMode.set('edit');
  }

  cancelForm(): void {
    this._formMode.set(null);
  }

  refreshData(): void {
    this.store().refresh().subscribe({
      error: (error) => {
        this.errorOccurred.emit({ 
          operation: 'refresh', 
          error: error instanceof Error ? error : new Error(String(error))
        });
      }
    });
  }

  toggleColumn(field: string): void {
    this._columnVisibility.update(v => ({ ...v, [field]: !v[field] }));
  }

  async confirmDelete(entity: T): Promise<void> {
    const confirmModal = await this.modal.confirm({
      title: this.translate.instant('app.crud.dialog.delete.title', { entity: this.config().entityName }) as string,
      message: this.translate.instant('app.crud.dialog.delete.message', { entity: this.config().entityName.toLowerCase() }) as string,
      confirmLabel: this.translate.instant('app.crud.dialog.delete.confirmLabel') as string,
      cancelLabel: this.translate.instant('app.crud.dialog.delete.cancelLabel') as string,
      detailed: true
    });

    if(confirmModal.confirmed) {
      this.deleteEntity(entity.id);
    }
  }

  // Helper methods for templates
  formatCellValue(value: unknown, column: CrudColumnDef<T, keyof T>): string {
    if (column.valueFormatter) {
      return column.valueFormatter(value as T[keyof T]);
    }
    
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return JSON.stringify(value);
  }

  getColumnVisibility(field: keyof T): boolean {
    return this._columnVisibility()[String(field)] !== false;
  }

  getColumnKey(field: keyof T): string {
    return String(field);
  }

  onGridReady(_api: unknown): void {
    // Grid ready - no action needed
  }

  // Private helper methods
  private deleteEntity(id: string | number): void {
    this.store().delete(id).subscribe({
      next: () => {
        // EntityStore automatically unselects deleted entities
        this.events.emit({ entityDeleted: id });
      },
      error: (error) => {
        this.errorOccurred.emit({ 
          operation: 'delete', 
          error: error instanceof Error ? error : new Error(String(error))
        });
      }
    });
  }

  private async loadColumnPreferences(config: CrudConfig<T>): Promise<void> {
    try {
      const preferences = await firstValueFrom(this.crudService.loadPreferences(config.entityName));
      
      if (preferences?.columnVisibility) {
        // Merge saved preferences with default visibility from config
        const visibility: Record<string, boolean> = {};
        config.columns.forEach(col => {
          const fieldKey = col.field as string;
          // Use saved preference if available, otherwise use config default
          visibility[fieldKey] = preferences.columnVisibility[fieldKey] ?? (col.visible !== false);
        });
        this._columnVisibility.set(visibility);
      } else {
        // No saved preferences, use defaults from config
        const visibility: Record<string, boolean> = {};
        config.columns.forEach(col => {
          visibility[col.field as string] = col.visible !== false;
        });
        this._columnVisibility.set(visibility);
      }
    } catch {
      // Fallback to default visibility on error (silent failure)
      const visibility: Record<string, boolean> = {};
      config.columns.forEach(col => {
        visibility[col.field as string] = col.visible !== false;
      });
      this._columnVisibility.set(visibility);
    }
  }

  private async saveColumnPreferences(entityName: string, visibility: Record<string, boolean>): Promise<void> {
    try {
      await firstValueFrom(this.crudService.savePreferences(entityName, {
        columnVisibility: visibility
      }));
    } catch {
      // Silent failure - preferences will be lost but won't disrupt user experience
    }
  }
}
