import { Component, OnInit, signal, computed, inject, Injector, runInInjectionContext, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ClothingItemApi } from '../../../core/api/clothes/clothes';
import { ResponsiveGridComponent, ResponsiveGridConfig } from '../../../shared/components';
import { GridDataConfig } from '../../../core/services';
import { MiniCurrencyPipe } from '../../../shared/pipes/mini-currency.pipe';
import { effect } from '@angular/core';
import { ModalService } from '../../../core/services/modal/modal.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../core/services/modal/confirm-dialog.component';
import { ButtonDirective } from '../../../shared/directives';
import { ClothesStore } from '../../../core/store/clothes/clothes.store';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '@ngx-translate/core';

// AG Grid interface definitions for type safety
interface AgGridValueFormatterParams {
  value: unknown;
}

interface AgGridCellStyleParams {
  value: unknown;
}

interface AgGridRowData {
  data?: ClothingItemApi;
}

interface AgGridReadyParams {
  api: AgGridApi; // AG Grid API instance
}

interface AgGridApi {
  getColumn(field: string): AgGridColumn | null;
  setColumnVisible(field: string, visible: boolean): void;
}

interface AgGridColumn {
  isVisible(): boolean;
}

interface AgGridRowClickedEvent {
  data?: ClothingItemApi;
}

interface ClothingFormData {
  name: string;
  brand: string;
  price: number;
  stock: number;
  category: string;
  season: string;
}

@Component({
  selector: 'app-clothes-crud-abstract',
  standalone: true,
  providers: [ClothesStore],
  imports: [CommonModule, ReactiveFormsModule, ResponsiveGridComponent, MiniCurrencyPipe, ButtonDirective, TranslatePipe],
  templateUrl: './clothes-crud-abstract.component.html',
  styleUrls: ['./clothes-crud-abstract.component.scss']
})
export class ClothesCrudAbstractComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected clothesStore = inject(ClothesStore);
  private readonly modal = inject(ModalService);
  private readonly i18n = inject(TranslationService);
  // Capture injector so we can safely create runtime effects in methods regardless of caller context (aids testability)
  private readonly injector = inject(Injector);

  // Form for adding/editing items
  itemForm: FormGroup;
  private gridApi: AgGridApi | null = null;
  
  // Reactive column definitions (mirrors catalog strategy, reacts to translation changes if run-time language switches)
  private readonly columnDefs = computed(() => {
    // Establish reactive dependency on translation signal
    this.i18n.translations();
    return [
      { field: 'id', headerName: this.i18n.instant('app.clothes.crud.columns.id'), flex: 0.5, minWidth: 70 },
      { field: 'name', headerName: this.i18n.instant('app.clothes.crud.columns.name'), flex: 1.5, minWidth: 140 },
      { field: 'brand', headerName: this.i18n.instant('app.clothes.crud.columns.brand'), flex: 1, minWidth: 110 },
      { field: 'price', headerName: this.i18n.instant('app.clothes.crud.columns.price'), flex: 0.8, minWidth: 100, valueFormatter: (p: AgGridValueFormatterParams) => (typeof p.value === 'number' && !isNaN(p.value)) ? '$' + p.value.toFixed(2) : '$0.00' },
      { field: 'stock', headerName: this.i18n.instant('app.clothes.crud.columns.stock'), flex: 0.6, minWidth: 90, cellStyle: (p: AgGridCellStyleParams) => ({ fontWeight: (p.value as number) <= 5 ? '600' : '400', color: (p.value as number) <= 5 ? 'var(--danger, #dc3545)' : 'inherit', textAlign: 'center' }) },
      { field: 'category', headerName: this.i18n.instant('app.clothes.crud.columns.category'), flex: 1, minWidth: 120 },
      { field: 'season', headerName: this.i18n.instant('app.clothes.crud.columns.season'), flex: 0.8, minWidth: 100 },
      { field: 'updatedAt', headerName: this.i18n.instant('app.clothes.crud.columns.updatedAt'), flex: 1, minWidth: 140, valueFormatter: (p: AgGridValueFormatterParams) => p.value ? new Date(p.value as string).toLocaleDateString() : '' }
    ];
  });

  gridConfig: Signal<ResponsiveGridConfig> = computed(() => ({
    columnDefs: this.columnDefs(),
    mobileView: 'cards',
    loadingMessage: 'app.clothes.crud.loadingShort',
    retryOnError: true,
    showErrorMessage: true,
    gridOptions: {
      getRowId: (p: AgGridRowData) => p?.data ? String(p.data.id) : undefined,
      onRowClicked: (event: AgGridRowClickedEvent) => this.onRowClicked(event)
    }
  }));
  
  // Stable data config (avoid recreating object each CD cycle)
  // Keep a minimal dataConfig (still required by component) but prefer direct signal path
  dataConfig: GridDataConfig<ClothingItemApi> = {
    dataSource: [],
    preloadGrid: true
  };
  
  // Local state signals
  selectedItem = signal<ClothingItemApi | null>(null);
  isEditing = computed(() => this.selectedItem() !== null);
  // Column visibility (re-added after manual edit removal)
  columnVisibility = signal<Record<string, boolean>>({
    id: true,
    name: true,
    brand: true,
    price: true,
    stock: true,
    category: true,
    season: true,
    updatedAt: true
  });

  private readonly columnVisibilityEffect = effect(() => {
    const vis = this.columnVisibility();
    if (!this.gridApi) return;
    Object.entries(vis).forEach(([field, visible]) => {
      if(!this.gridApi) return;
      const col = this.gridApi.getColumn(field);
      if (col && col.isVisible && col.isVisible() !== visible) {
        this.gridApi.setColumnVisible(field, visible);
      }
    });
  });

  constructor() {
    /* eslint-disable @typescript-eslint/unbound-method */
    this.itemForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      brand: ['', [Validators.required, Validators.minLength(2)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      size: [''],
      color: [''],
      stock: [0, [Validators.required, Validators.min(0)]],
      season: [''],
      category: [''],
      description: [''],
      imageUrl: ['']
    });
    /* eslint-enable @typescript-eslint/unbound-method */
  }

  ngOnInit(): void {
    this.refreshData();
  }

  refreshData(): void {
    this.clothesStore.refresh().subscribe({
      next: () => console.log('[clothes] data loaded'),
      error: (error) => console.error('[clothes] load error:', error)
    });
  }

  onSubmit(): void {
    if (this.itemForm.valid) {
      const formData = this.itemForm.value as ClothingFormData;
      
      const now = new Date().toISOString();
      const itemData: Partial<ClothingItemApi> = {
        ...formData,
        updatedAt: now,
        ...(this.isEditing() ? {} : { createdAt: now })
      };

      if (this.isEditing()) {
        const id = this.selectedItem()!.id;
        this.clothesStore.update(id, itemData).subscribe({
          next: (updated) => {
            console.log('[clothes] item updated:', updated);
            this.resetForm();
            this.clearSelection();
          },
          error: (error) => console.error('[clothes] update error:', error)
        });
      } else {
        this.clothesStore.create(itemData).subscribe({
          next: (created) => {
            console.log('[clothes] item created:', created);
            this.resetForm();
          },
          error: (error) => console.error('[clothes] create error:', error)
        });
      }
    }
  }

  selectItem(item: ClothingItemApi): void {
    this.selectedItem.set(item);
    this.clothesStore.setSelected(item);
  }

  editItem(item: ClothingItemApi): void {
    this.selectItem(item);
    
    this.itemForm.patchValue({
      name: item.name,
      brand: item.brand,
      price: item.price,
      size: item.size,
      color: item.color,
      stock: item.stock,
      season: item.season,
      category: item.category,
      description: item.description || '',
      imageUrl: item.imageUrl || ''
    });
  }

  deleteItem(id: number): void {
    const ref = this.modal.open(ConfirmDialogComponent, {
      data: { title: 'app.clothes.crud.dialog.delete.title', message: 'app.clothes.crud.dialog.delete.message' } satisfies ConfirmDialogData,
      labelledBy: 'confirmDialogTitle',
      describedBy: 'confirmDialogDesc',
      disableEscapeClose: false,
      disableBackdropClose: false
    });
    // Observe signal after microtask inside a guaranteed injection context
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const closed = ref.closed();
        if (closed?.data === true) {
          this.clothesStore.delete(id).subscribe({
            next: () => {
              console.log('[clothes] item deleted');
              if (this.selectedItem()?.id === id) this.clearSelection();
            },
            error: (error) => console.error('[clothes] delete error:', error)
          });
        }
      });
    });
  }

  // Manual test opener for modal service (not tied to CRUD action)
  openTestModal(): void {
    this.modal.open(ConfirmDialogComponent, {
      data: { title: 'app.clothes.crud.dialog.test.title', message: 'app.clothes.crud.dialog.test.message' },
      labelledBy: 'confirmDialogTitle',
      describedBy: 'confirmDialogDesc'
    });
  }

  resetForm(): void {
    this.itemForm.reset({
      name: '',
      brand: '',
      price: 0,
      size: '',
      color: '',
      stock: 0,
      season: '',
      category: '',
      description: '',
      imageUrl: ''
    });
  }

  cancelEdit(): void {
    this.clearSelection();
    this.resetForm();
  }

  clearSelection(): void {
    this.selectedItem.set(null);
    this.clothesStore.setSelected(null);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.itemForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Accessible error helpers replicating register form pattern
  private getControl(name: string): AbstractControl | null { return this.itemForm.get(name); }

  nameError(): string {
    const c = this.getControl('name');
    if (c?.invalid && (c.dirty || c.touched)) {
  if (c.errors?.['required']) return this.i18n.instant('app.clothes.crud.form.errors.name.required');
  if (c.errors?.['minlength']) return this.i18n.instant('app.clothes.crud.form.errors.name.min');
    }
    return '';
  }
  brandError(): string {
    const c = this.getControl('brand');
    if (c?.invalid && (c.dirty || c.touched)) {
  if (c.errors?.['required']) return this.i18n.instant('app.clothes.crud.form.errors.brand.required');
  if (c.errors?.['minlength']) return this.i18n.instant('app.clothes.crud.form.errors.brand.min');
    }
    return '';
  }
  priceError(): string {
    const c = this.getControl('price');
    if (c?.invalid && (c.dirty || c.touched)) {
  if (c.errors?.['required']) return this.i18n.instant('app.clothes.crud.form.errors.price.required');
  if (c.errors?.['min']) return this.i18n.instant('app.clothes.crud.form.errors.price.min');
    }
    return '';
  }
  stockError(): string {
    const c = this.getControl('stock');
    if (c?.invalid && (c.dirty || c.touched)) {
  if (c.errors?.['required']) return this.i18n.instant('app.clothes.crud.form.errors.stock.required');
  if (c.errors?.['min']) return this.i18n.instant('app.clothes.crud.form.errors.stock.min');
    }
    return '';
  }

  onGridReady(params: AgGridReadyParams): void {
    this.gridApi = params.api;
  }

  onRowClicked(event: AgGridRowClickedEvent): void {
    if (event?.data) {
      this.editItem(event.data);
    }
  }

  // Formatting helpers
  formatPrice = (value: number | null | undefined): string => {
    if (typeof value === 'number' && !isNaN(value)) return '$' + value.toFixed(2);
    return '$0.00';
  };

  toggleColumn(field: string): void {
    this.columnVisibility.update(v => ({ ...v, [field]: !v[field] }));
  }

  get columnKeys(): string[] { return Object.keys(this.columnVisibility()); }

  trackByFn(index: number, key: string): string { return key; }
}