import { Component, inject, OnInit, signal, Signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BookStore } from './book.store';
import { BookApi } from './book.types';
import { GenericCrudComponent, CrudConfig, CrudEvents } from '../../shared/components/crud';
import { ButtonDirective } from '../../shared/directives';

/**
 * Demo Book CRUD Component
 * Demonstrates the Generic CRUD System
 * Following Angular 20 + signals + zoneless patterns from AGENTS.md
 */
@Component({
  selector: 'app-demo-book-crud',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    GenericCrudComponent,
    ButtonDirective,
    TranslateModule
  ],
  providers: [BookStore],
  templateUrl: './demo-book-crud.component.html',
  styleUrls: ['./demo-book-crud.component.scss']
})
export class DemoBookCrudComponent implements OnInit {
  protected readonly bookStore = inject(BookStore);
  private readonly fb = inject(FormBuilder);
  private readonly translateService = inject(TranslateService);

  // Forms
  filterForm: FormGroup;
  entityForm: FormGroup;

  // CRUD Configuration
  readonly crudConfig: Signal<CrudConfig<BookApi>> = signal({
    entityName: 'Book',
    pluralName: 'Books',
    columns: [
      {
        field: 'title',
        headerName: 'Title',
        flex: 2,
        minWidth: 200,
        sortable: true
      },
      {
        field: 'author',
        headerName: 'Author',
        flex: 1.5,
        minWidth: 150,
        sortable: true
      },
      {
        field: 'category',
        headerName: 'Category',
        flex: 1,
        minWidth: 120,
        sortable: true
      },
      {
        field: 'price',
        headerName: 'Price',
        flex: 0.8,
        minWidth: 100,
        sortable: true,
        valueFormatter: (value: unknown) => `$${Number(value).toFixed(2)}`
      },
      {
        field: 'rating',
        headerName: 'Rating',
        flex: 0.7,
        minWidth: 80,
        sortable: true,
        valueFormatter: (value: unknown) => `⭐ ${Number(value).toFixed(1)}`,
        cellStyle: (value: unknown) => ({
          color: Number(value) >= 4.0 ? '#28a745' : Number(value) >= 3.0 ? '#ffc107' : '#dc3545',
          fontWeight: '600'
        })
      },
      {
        field: 'inStock',
        headerName: 'Stock',
        flex: 0.8,
        minWidth: 100,
        sortable: true,
        valueFormatter: (value: unknown) => value ? '✅ In Stock' : '❌ Out of Stock',
        cellStyle: (value: unknown) => ({
          color: value ? '#28a745' : '#dc3545',
          fontWeight: '600'
        })
      },
      {
        field: 'publishedDate',
        headerName: 'Published',
        flex: 1,
        minWidth: 120,
        sortable: true,
        valueFormatter: (value: unknown) => 
          value ? new Date(value as string).getFullYear().toString() : ''
      }
    ],
    permissions: this.bookStore.permissions(),
    enableBulkOperations: true,
    enableExport: true,
    enableSearch: true,
    pageSize: 10
  });

  constructor() {
    this.filterForm = this.createFilterForm();
    this.entityForm = this.createEntityForm();
  }

  ngOnInit(): void {
    this.loadData();
  }

  // Computed signals
  isEditing = (): boolean => this.bookStore.selected() !== null;

  // Event handlers
  handleCrudEvent(event: CrudEvents<BookApi>): void {
    console.log('📚 Book CRUD event:', event);
    
    // You can handle specific events here
    if (event.onEntityCreated) {
      console.log('✅ Book created successfully');
    }
    if (event.onEntityUpdated) {
      console.log('✏️ Book updated successfully');  
    }
    if (event.onEntityDeleted) {
      console.log('🗑️ Book deleted successfully');
    }
  }

  applyFilters(): void {
    if (this.filterForm.valid) {
      const filter: Partial<BookApi> & { minPrice?: number; maxPrice?: number } = {};
      
      // Type-safe filter building using form controls
      const titleControl = this.filterForm.get('title');
      const authorControl = this.filterForm.get('author');
      const categoryControl = this.filterForm.get('category');
      const inStockControl = this.filterForm.get('inStock');
      const minPriceControl = this.filterForm.get('minPrice');
      const maxPriceControl = this.filterForm.get('maxPrice');
      
      if (titleControl?.value && (titleControl.value as string).trim()) {
        filter.title = (titleControl.value as string).trim();
      }
      if (authorControl?.value && (authorControl.value as string).trim()) {
        filter.author = (authorControl.value as string).trim();
      }
      if (categoryControl?.value && (categoryControl.value as string).trim()) {
        filter.category = categoryControl.value as BookApi['category'];
      }
      if (inStockControl?.value !== '' && inStockControl?.value !== null) {
        filter.inStock = inStockControl?.value === 'true';
      }
      if (minPriceControl?.value && minPriceControl.value > 0) {
        filter.minPrice = minPriceControl.value as number;
      }
      if (maxPriceControl?.value && maxPriceControl.value > 0) {
        filter.maxPrice = maxPriceControl.value as number;
      }
      
      this.bookStore.setFilter(filter as Partial<BookApi>);
    }
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.bookStore.clearFilter();
  }

  saveEntity(): void {
    if (this.entityForm.valid) {
      // Build entity data from individual form controls for type safety
      const entityData: Partial<BookApi> = {
        title: this.entityForm.get('title')?.value as string,
        author: this.entityForm.get('author')?.value as string,
        isbn: this.entityForm.get('isbn')?.value as string,
        category: this.entityForm.get('category')?.value as BookApi['category'],
        price: this.entityForm.get('price')?.value as number,
        rating: this.entityForm.get('rating')?.value as number,
        publishedDate: this.entityForm.get('publishedDate')?.value as string,
        description: this.entityForm.get('description')?.value as string,
        inStock: this.entityForm.get('inStock')?.value as boolean
      };
      
      if (this.isEditing()) {
        const id = this.bookStore.selected()!.id;
        this.bookStore.update(id, entityData).subscribe({
          next: () => {
            console.log('✅ Book updated successfully');
            this.resetForm();
          },
          error: (error) => console.error('❌ Update failed:', error)
        });
      } else {
        this.bookStore.create(entityData).subscribe({
          next: () => {
            console.log('✅ Book created successfully');
            this.resetForm();
          },
          error: (error) => console.error('❌ Create failed:', error)
        });
      }
    }
  }

  cancelForm(): void {
    this.resetForm();
    this.bookStore.setSelected(null);
  }

  // Helper methods
  private loadData(): void {
    this.bookStore.refresh().subscribe({
      next: () => console.log('📚 Books loaded successfully'),
      error: (error) => console.error('❌ Failed to load books:', error)
    });
  }

  private resetForm(): void {
    this.entityForm.reset({
      title: '',
      author: '',
      isbn: '',
      category: '',
      price: 0,
      rating: 5.0,
      publishedDate: new Date().toISOString().split('T')[0],
      description: '',
      inStock: true
    });
  }

  private createFilterForm(): FormGroup {
    return this.fb.group({
      title: [''],
      author: [''],
      category: [''],
      inStock: [''],
      minPrice: [null],
      maxPrice: [null]
    });
  }

  private createEntityForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required.bind(null), Validators.minLength.bind(null, 2)]],
      author: ['', [Validators.required.bind(null), Validators.minLength.bind(null, 2)]],
      isbn: ['', [Validators.required.bind(null), Validators.pattern.bind(null, /^(?:\d{9}[\dX]|\d{13})$/)]],
      category: ['', Validators.required.bind(null)],
      price: [0, [Validators.required.bind(null), Validators.min.bind(null, 0)]],
      rating: [5.0, [Validators.required.bind(null), Validators.min.bind(null, 1), Validators.max.bind(null, 5)]],
      publishedDate: [new Date().toISOString().split('T')[0], Validators.required.bind(null)],
      description: [''],
      inStock: [true]
    });
  }

  protected isFieldInvalid(fieldName: string): boolean {
    const field = this.entityForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  protected getFieldError(fieldName: string): string {
    const field = this.entityForm.get(fieldName);
    if (!field || !field.errors) {
      return '';
    }

    const errors = field.errors;
    if (errors['required']) {
      return `demoBooks.form.errors.${fieldName}.required`;
    }
    if (errors['minlength']) {
      return `demoBooks.form.errors.${fieldName}.minLength`;
    }
    if (errors['pattern']) {
      return `demoBooks.form.errors.${fieldName}.pattern`;
    }
    if (errors['min']) {
      return `demoBooks.form.errors.${fieldName}.min`;
    }
    if (errors['max']) {
      return `demoBooks.form.errors.${fieldName}.max`;
    }
    
    return `demoBooks.form.errors.${fieldName}.required`;
  }
}