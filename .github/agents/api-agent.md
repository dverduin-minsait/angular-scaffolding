# API and State Management Agent

HTTP services extend AbstractApiClient (don't modify). Use EntityStore for CRUD with signals. Signal-based state: private writable, public readonly. Type everything.

## Patterns

**ApiService**: extend AbstractApiClient, set baseUrl + resourceName, add custom methods
**Store**: extend EntityStore (auto-provides items/selected/loading/error signals), add domain logic
**Component**: inject store, use store.items() / store.loading() / store.error(), call store.loadAll()/create()/update()/delete() with takeUntilDestroyed()

AbstractApiClient provides CRUD out of box. Don't call http directly.

## Error Handling

### API Error Interface

```typescript
export interface ApiError {
  message: string;
  code: string;
  details?: unknown;
  timestamp: number;
}
```

### Handling Errors in Components

```typescript
// Using EntityStore error signal
@if (store.error()) {
  <div class="error-message">
    <strong>Error:</strong> {{ store.error().message }}
    <button type="button" (click)="retry()">Retry</button>
  </div>
}

retry(): void {
  this.store.loadAll()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe();
}
```

### Custom Error Handling

```typescript
this.apiService.getById(id)
  .pipe(
    takeUntilDestroyed(this.destroyRef),
    catchError((error: ApiError) => {
      // Custom error handling
      if (error.code === '404') {
        this.router.navigate(['/not-found']);
      } else {
        this.showErrorNotification(error.message);
      }
      return EMPTY;
    })
  )
  .subscribe();
```

## Mock API Development

### db.json Structure

```json
{
  "books": [
    {
      "id": 1,
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "isbn": "978-0-7432-7356-5",
      "publishedYear": 1925,
      "available": true
    }
  ],
  "users": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com"
    }
  ]
}
```

### Running Mock API

```bash
# Start json-server on port 3000
npm run api

# Or with dev server
npm run dev
```

### Environment Configuration

```typescript
// environment.mock.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  useMockData: true
};

// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.production.com',
  useMockData: false
};
```

## HTTP Best Practices

### Type Safety

```typescript
// ✅ CORRECT - Strongly typed
interface CreateBookRequest {
  title: string;
  author: string;
  isbn: string;
  publishedYear: number;
}

interface BookResponse {
  id: number;
  title: string;
  author: string;
  createdAt: string;
}

create(payload: CreateBookRequest): Observable<BookResponse> {
  return this.http.post<BookResponse>(`${this.baseUrl}/books`, payload);
}

// ❌ WRONG - Untyped
create(payload: any): Observable<any> {
  return this.http.post(`${this.baseUrl}/books`, payload);
}
```

### Request Parameters

```typescript
// Query parameters
searchBooks(query: string, page: number = 1): Observable<Book[]> {
  return this.http.get<Book[]>(`${this.baseUrl}/books`, {
    params: {
      q: query,
      page: page.toString(),
      limit: '10'
    }
  });
}

// Path parameters
getBookByIsbn(isbn: string): Observable<Book> {
  return this.http.get<Book>(`${this.baseUrl}/books/isbn/${isbn}`);
}

// Request body
updateBook(id: number, updates: Partial<Book>): Observable<Book> {
  return this.http.patch<Book>(`${this.baseUrl}/books/${id}`, updates);
}
```

### Headers and Interceptors

```typescript
// Custom headers
uploadCover(bookId: number, file: File): Observable<Book> {
  const formData = new FormData();
  formData.append('cover', file);

  return this.http.post<Book>(
    `${this.baseUrl}/books/${bookId}/cover`,
    formData,
    {
      headers: {
        // Don't set Content-Type for FormData
      },
      reportProgress: true
    }
  );
}

// Auth token typically handled by interceptor
// See src/app/core/auth/ for auth patterns
```

## State Management Patterns

### Local Component State

```typescript
export class BookFormComponent {
  // Private writable signal
  private readonly _formState = signal<FormState>({
    isDirty: false,
    isSubmitting: false,
    errors: []
  });

  // Public readonly signal
  readonly formState = this._formState.asReadonly();

  // Computed signals
  readonly canSubmit = computed(() => 
    this.formState().isDirty && !this.formState().isSubmitting
  );

  updateFormState(updates: Partial<FormState>): void {
    this._formState.update(state => ({ ...state, ...updates }));
  }
}
```

### Global State with EntityStore

```typescript
// Use EntityStore for CRUD operations
readonly store = inject(BookStore);

// Access state via signals
readonly books = this.store.items;
readonly isLoading = computed(() => this.store.loading().isLoading);
readonly hasError = computed(() => this.store.error() !== null);
```

### Derived State

```typescript
export class BookListComponent {
  readonly store = inject(BookStore);
  readonly searchQuery = signal('');

  // Computed filtered list
  readonly filteredBooks = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const books = this.store.items();
    
    if (!query) return books;
    
    return books.filter(book =>
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query)
    );
  });

  // Computed statistics
  readonly stats = computed(() => {
    const books = this.store.items();
    return {
      total: books.length,
      available: books.filter(b => b.available).length,
      unavailable: books.filter(b => !b.available).length
    };
  });
}
```

## RxJS Patterns

### When to Use RxJS

✅ Use RxJS for:
- HTTP requests
- WebSocket streams
- External event streams
- Complex async operations with operators

❌ Don't use RxJS for:
- Local component state (use signals)
- Derived values (use computed signals)
- Simple transformations

### Subscription Management

```typescript
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, inject } from '@angular/core';

export class MyComponent {
  private readonly destroyRef = inject(DestroyRef);

  // ✅ CORRECT - Auto cleanup
  loadData(): void {
    this.apiService.getData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => this._data.set(data));
  }

  // ✅ ALSO CORRECT - toSignal
  readonly data = toSignal(
    this.apiService.getData(),
    { initialValue: [] }
  );
}
```

### Common RxJS Operators

```typescript
import { map, filter, debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';

// Search with debounce
searchInput$ = new Subject<string>();

searchResults$ = this.searchInput$.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(query => 
    this.apiService.search(query).pipe(
      catchError(() => of([]))
    )
  ),
  takeUntilDestroyed()
);

// Transform response
getFormattedBooks(): Observable<FormattedBook[]> {
  return this.apiService.getAll().pipe(
    map(books => books.map(book => ({
      ...book,
      displayName: `${book.title} by ${book.author}`,
      year: book.publishedYear.toString()
    })))
  );
}
```

## Testing API Services

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { BookApiService, Book } from './book-api.service';

describe('BookApiService', () => {
  let service: BookApiService;
  let mockHttp: Pick<HttpClient, 'get' | 'post' | 'put' | 'patch' | 'delete'>;
  let getSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getSpy = vi.fn();
    mockHttp = {
      get: getSpy,
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        BookApiService,
        { provide: HttpClient, useValue: mockHttp }
      ]
    });

    service = TestBed.inject(BookApiService);
  });

  it('should fetch all books', async () => {
    const mockBooks: Book[] = [
      { id: 1, title: 'Book 1', author: 'Author 1', isbn: '123', publishedYear: 2020, available: true }
    ];
    getSpy.mockReturnValue(of(mockBooks));

    const books = await firstValueFrom(service.getAll());
    expect(books).toEqual(mockBooks);
    expect(mockHttp.get).toHaveBeenCalledWith('http://localhost:3000/books');
  });

  it('should handle errors', async () => {
    const error = { status: 500, message: 'Server error' };
    getSpy.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(service.getAll())).rejects.toEqual(error);
  });
});
```

## Common Patterns

### Pagination

```typescript
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

getBooksPaginated(page: number = 1, pageSize: number = 10): Observable<PaginatedResponse<Book>> {
  return this.http.get<PaginatedResponse<Book>>(`${this.baseUrl}/books`, {
    params: {
      _page: page.toString(),
      _limit: pageSize.toString()
    }
  });
}
```

### Bulk Operations

```typescript
bulkDelete(ids: number[]): Observable<void> {
  return this.http.request<void>('DELETE', `${this.baseUrl}/books`, {
    body: { ids }
  });
}

bulkUpdate(updates: Array<{ id: number; changes: Partial<Book> }>): Observable<Book[]> {
  return this.http.patch<Book[]>(`${this.baseUrl}/books/bulk`, updates);
}
```

### File Upload

```typescript
uploadCover(bookId: number, file: File): Observable<Book> {
  const formData = new FormData();
  formData.append('cover', file);

  return this.http.post<Book>(
    `${this.baseUrl}/books/${bookId}/cover`,
    formData
  );
}
```

## Checklist

Before committing API/store code:
- [ ] Extends AbstractApiClient for HTTP services
- [ ] Uses EntityStore for CRUD state management
- [ ] Strong TypeScript types for all API contracts
- [ ] Proper error handling with ApiError interface
- [ ] Uses `takeUntilDestroyed()` for subscriptions
- [ ] Signals for reactive state
- [ ] Tests included for services and stores
- [ ] Mock data in db.json for development
- [ ] Environment configuration for API URLs
- [ ] Loading and error states handled in UI
