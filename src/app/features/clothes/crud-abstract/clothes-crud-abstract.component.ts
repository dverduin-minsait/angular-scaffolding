import { Component, OnInit, signal, computed, inject, Injector, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ClothesApiService, ClothingItemApi } from '../../../core/api/clothes/clothes.service';
import { ResponsiveGridComponent, ResponsiveGridConfig } from '../../../shared/components/responsive-grid/responsive-grid.component';
import { GridDataConfig } from '../../../core/services/grid-data.service';
import { MiniCurrencyPipe } from '../../../shared/pipes/mini-currency.pipe';
import { effect } from '@angular/core';
import { ModalService } from '../../../core/services/modal/modal.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../core/services/modal/confirm-dialog.component';
import { ButtonDirective } from '../../../shared/directives';

@Component({
  selector: 'app-clothes-crud-abstract',
  standalone: true,
  // Removed providers override so tests can supply a mock ClothesApiService
  imports: [CommonModule, ReactiveFormsModule, ResponsiveGridComponent, MiniCurrencyPipe, ButtonDirective],
  templateUrl: './clothes-crud-abstract.component.html',
  styleUrls: ['./clothes-crud-abstract.component.scss']
})
export class ClothesCrudAbstractComponent implements OnInit {
  private fb = inject(FormBuilder);
  protected clothesService = inject(ClothesApiService);
  private modal = inject(ModalService);
  // Capture injector so we can safely create runtime effects in methods regardless of caller context (aids testability)
  private injector = inject(Injector);

  // Form for adding/editing items
  itemForm: FormGroup;
  private gridApi: any;
  
  // Grid configuration (desktop) & responsive config
  readonly columnDefs = [
    { field: 'id', headerName: 'ID', flex: 0.5, minWidth: 70 },
    { field: 'name', headerName: 'Name', flex: 1.5, minWidth: 140 },
    { field: 'brand', headerName: 'Brand', flex: 1, minWidth: 110 },
    { field: 'price', headerName: 'Price', flex: 0.8, minWidth: 100, valueFormatter: (p: any) => (typeof p.value === 'number' && !isNaN(p.value)) ? '$' + p.value.toFixed(2) : '$0.00' },
    { field: 'stock', headerName: 'Stock', flex: 0.6, minWidth: 90, cellStyle: (p: any) => ({ fontWeight: p.value <= 5 ? '600' : '400', color: p.value <= 5 ? 'var(--danger, #dc3545)' : 'inherit', textAlign: 'center' }) },
    { field: 'category', headerName: 'Category', flex: 1, minWidth: 120 },
    { field: 'season', headerName: 'Season', flex: 0.8, minWidth: 100 },
    { field: 'updatedAt', headerName: 'Updated', flex: 1, minWidth: 140, valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString() : '' }
  ];

  gridConfig: ResponsiveGridConfig = {
    columnDefs: this.columnDefs,
    mobileView: 'cards',
    loadingMessage: 'Loading clothes...',
    retryOnError: true,
    showErrorMessage: true,
    gridOptions: {
      suppressPropertyNamesCheck: true,
      getRowId: (p: any) => p?.data ? String(p.data.id) : undefined,
      onRowClicked: (event: any) => this.onRowClicked(event)
    }
  };
  
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

  private columnVisibilityEffect = effect(() => {
    const vis = this.columnVisibility();
    if (!this.gridApi) return;
    Object.entries(vis).forEach(([field, visible]) => {
      const col = this.gridApi.getColumn(field);
      if (col && col.isVisible && col.isVisible() !== visible) {
        this.gridApi.setColumnVisible(field, visible);
      }
    });
  });

  constructor() {
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
  }

  ngOnInit() {
    this.refreshData();
  }

  refreshData(): void {
    this.clothesService.refresh().subscribe({
      next: () => console.log('✅ Data loaded successfully'),
      error: (error) => console.error('❌ Error loading data:', error)
    });
  }

  onSubmit(): void {
    if (this.itemForm.valid) {
      const formData = this.itemForm.value;
      
      const now = new Date().toISOString();
      const itemData = {
        ...formData,
        updatedAt: now,
        ...(this.isEditing() ? {} : { createdAt: now })
      };

      if (this.isEditing()) {
        const id = this.selectedItem()!.id;
        this.clothesService.update(id, itemData).subscribe({
          next: (updated) => {
            console.log('✅ Item updated successfully:', updated);
            this.resetForm();
            this.clearSelection();
          },
          error: (error) => console.error('❌ Error updating item:', error)
        });
      } else {
        this.clothesService.create(itemData).subscribe({
          next: (created) => {
            console.log('✅ Item created successfully:', created);
            this.resetForm();
          },
          error: (error) => console.error('❌ Error creating item:', error)
        });
      }
    }
  }

  selectItem(item: ClothingItemApi): void {
    this.selectedItem.set(item);
    this.clothesService.setSelectedItem(item);
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
      data: { title: 'Delete Item', message: 'Are you sure you want to delete this item?' } satisfies ConfirmDialogData,
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
          this.clothesService.delete(id).subscribe({
            next: () => {
              console.log('✅ Item deleted successfully');
              if (this.selectedItem()?.id === id) this.clearSelection();
            },
            error: (error) => console.error('❌ Error deleting item:', error)
          });
        }
      });
    });
  }

  // Manual test opener for modal service (not tied to CRUD action)
  openTestModal(): void {
    this.modal.open(ConfirmDialogComponent, {
      data: { title: 'Test Modal', message: 'This is a manual test modal.' },
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
    this.clothesService.setSelectedItem(null);
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
      if (c.errors?.['required']) return 'Name is required';
      if (c.errors?.['minlength']) return 'Name must be at least 2 characters';
    }
    return '';
  }
  brandError(): string {
    const c = this.getControl('brand');
    if (c?.invalid && (c.dirty || c.touched)) {
      if (c.errors?.['required']) return 'Brand is required';
      if (c.errors?.['minlength']) return 'Brand must be at least 2 characters';
    }
    return '';
  }
  priceError(): string {
    const c = this.getControl('price');
    if (c?.invalid && (c.dirty || c.touched)) {
      if (c.errors?.['required']) return 'Price is required';
      if (c.errors?.['min']) return 'Price must be greater than 0';
    }
    return '';
  }
  stockError(): string {
    const c = this.getControl('stock');
    if (c?.invalid && (c.dirty || c.touched)) {
      if (c.errors?.['required']) return 'Stock is required';
      if (c.errors?.['min']) return 'Stock cannot be negative';
    }
    return '';
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
  }

  onRowClicked(event: any) {
    if (event?.data) {
      this.editItem(event.data as ClothingItemApi);
    }
  }

  // Formatting helpers
  formatPrice = (value: number | null | undefined): string => {
    if (typeof value === 'number' && !isNaN(value)) return '$' + value.toFixed(2);
    return '$0.00';
  };

  toggleColumn(field: string) {
    this.columnVisibility.update(v => ({ ...v, [field]: !v[field] }));
  }

  get columnKeys(): string[] { return Object.keys(this.columnVisibility()); }

  trackByFn(index: number, key: string): string { return key; }
}