import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BookStore } from './book.store';
import { BookApi } from './book.types';
import { 
  GenericCrudComponent, 
  CrudConfig, 
  CrudEvents,
  textColumn,
  priceColumn,
  ratingColumn,
  booleanColumn,
  dateColumn
} from '../../shared/components/crud';
import { ButtonDirective } from '../../shared/directives';

/**
 * Simplified Demo Book CRUD Component
 * Demonstrates the simplified Generic CRUD System
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

  // Forms
  filterForm: FormGroup;
  entityForm: FormGroup;

  // Local filtering signals
  private readonly _titleFilter = signal<string>('');
  private readonly _authorFilter = signal<string>('');
  
  // Filtered data - this replaces the store's filteredItems
  protected readonly filteredBooks = computed(() => {
    const books = this.bookStore.items();
    const titleFilter = this._titleFilter().toLowerCase().trim();
    const authorFilter = this._authorFilter().toLowerCase().trim();
    
    if (!titleFilter && !authorFilter) return books;
    
    return books.filter(book => {
      const titleMatch = !titleFilter || book.title.toLowerCase().includes(titleFilter);
      const authorMatch = !authorFilter || book.author.toLowerCase().includes(authorFilter);
      return titleMatch && authorMatch;
    });
  });

  // CRUD Configuration - using column helpers for cleaner code
  readonly crudConfig = signal<CrudConfig<BookApi>>({
    entityName: 'Book',
    columns: [
      textColumn<BookApi>('title', 'Title', { flex: 2, minWidth: 200 }),
      textColumn<BookApi>('author', 'Author', { flex: 1.5, minWidth: 150 }),
      textColumn<BookApi>('category', 'Category', { flex: 1, minWidth: 120 }),
      priceColumn<BookApi>('price', 'Price', '$', { flex: 0.8, minWidth: 100 }),
      ratingColumn<BookApi>('rating', 'Rating', 5, { flex: 0.7, minWidth: 80 }),
      booleanColumn<BookApi>('inStock', 'Stock', '✅ In Stock', '❌ Out of Stock', { flex: 0.8, minWidth: 100 }),
      dateColumn<BookApi>('publishedDate', 'Published', 'year', { flex: 1, minWidth: 120 })
    ]
  });

  // Computed for form mode
  readonly isEditing = computed(() => this.bookStore.selected() !== null);

  constructor() {
    this.filterForm = this.createFilterForm();
    this.entityForm = this.createEntityForm();
  }

  ngOnInit(): void {
    this.loadData();
  }

  // Event handlers
  handleCrudEvent(event: CrudEvents<BookApi>): void {
    if (event.entityCreated) {
      this.resetForm();
    }
    if (event.entityUpdated) {
      this.resetForm();
    }
    if (event.entitySelected) {
      this.populateFormForEdit(event.entitySelected);
    }
  }

  // Form handlers for projected content
  applyFilters(): void {
    if (this.filterForm.valid) {
      const titleValue = this.filterForm.get('title')?.value as string;
      const authorValue = this.filterForm.get('author')?.value as string;
      
      // Update local filter signals instead of using store search
      this._titleFilter.set(titleValue || '');
      this._authorFilter.set(authorValue || '');
    }
  }

  clearFilters(): void {
    this.filterForm.reset();
    this._titleFilter.set('');
    this._authorFilter.set('');
  }

  saveEntity(): void {
    if (this.entityForm.valid) {
      const entityData: Partial<BookApi> = this.buildEntityFromForm();
      
      if (this.isEditing()) {
        const id = this.bookStore.selected()!.id;
        this.bookStore.update(id, entityData).subscribe({
          error: (error) => console.error('❌ Update failed:', error)
        });
      } else {
        this.bookStore.create(entityData).subscribe({
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
      error: (error) => console.error('❌ Failed to load books:', error)
    });
  }

  private populateFormForEdit(book: BookApi): void {
    this.entityForm.patchValue({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      price: book.price,
      rating: book.rating,
      publishedDate: book.publishedDate,
      description: book.description,
      inStock: book.inStock
    });
  }

  private buildEntityFromForm(): Partial<BookApi> {
    return {
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
      category: ['']
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