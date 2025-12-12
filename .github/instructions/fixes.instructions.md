# Fixes Instructions

## Common Issues and Solutions

This document provides solutions to common issues and anti-patterns in the Angular 20 project.

## Zoneless Change Detection Issues

### Problem: UI Not Updating After State Change

```typescript
// ❌ WRONG - Mutating state directly
this.items.push(newItem);  // Signal doesn't detect mutation

// ✅ CORRECT - Use signal update methods
this._items.update(items => [...items, newItem]);
// or
this._items.set([...this._items(), newItem]);
```

### Problem: Using setTimeout Without Signals

```typescript
// ❌ WRONG - setTimeout doesn't trigger change detection
setTimeout(() => {
  this.loading = true;  // Won't update UI in zoneless
}, 1000);

// ✅ CORRECT - Use signals
private readonly _loading = signal(false);
readonly loading = this._loading.asReadonly();

setTimeout(() => {
  this._loading.set(true);  // Signal triggers update
}, 1000);
```

### Problem: Manual Change Detection

```typescript
// ❌ WRONG - Using ChangeDetectorRef in zoneless
constructor(private cdr: ChangeDetectorRef) {}
this.cdr.markForCheck();

// ✅ CORRECT - Use signals
private readonly _value = signal<string>('');
readonly value = this._value.asReadonly();
```

## Signal Patterns

### Problem: Directly Exposing Writable Signals

```typescript
// ❌ WRONG - Exposing writable signal publicly
public readonly items = signal<Item[]>([]);

// ✅ CORRECT - Private writable, public readonly
private readonly _items = signal<Item[]>([]);
readonly items = this._items.asReadonly();

updateItems(newItems: Item[]): void {
  this._items.set(newItems);
}
```

### Problem: Not Using Computed Signals

```typescript
// ❌ WRONG - Duplicating derived state
getFilteredItems(): Item[] {
  return this.items().filter(item => item.active);
}

// ✅ CORRECT - Use computed signal
readonly filteredItems = computed(() => 
  this.items().filter(item => item.active)
);
```

### Problem: Signal Naming Convention

```typescript
// ❌ WRONG - Unclear naming
readonly userSignal = signal<User | null>(null);
readonly computedFullName = computed(() => ...);

// ✅ CORRECT - Clear, concise names
readonly user = signal<User | null>(null);
readonly fullName = computed(() => ...);  // Don't suffix with 'Computed'
```

## RxJS and Subscriptions

### Problem: Memory Leaks from Unmanaged Subscriptions

```typescript
// ❌ WRONG - Subscription leak
ngOnInit(): void {
  this.dataService.getData().subscribe(data => {
    this.data = data;
  });
}

// ✅ CORRECT - Use takeUntilDestroyed
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

private readonly destroyRef = inject(DestroyRef);

ngOnInit(): void {
  this.dataService.getData()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(data => this._data.set(data));
}

// ✅ BETTER - Use toSignal
readonly data = toSignal(this.dataService.getData(), { initialValue: [] });
```

### Problem: Using RxJS for Local State

```typescript
// ❌ WRONG - BehaviorSubject for component state
private readonly _count$ = new BehaviorSubject<number>(0);
readonly count$ = this._count$.asObservable();

// ✅ CORRECT - Use signals
private readonly _count = signal(0);
readonly count = this._count.asReadonly();
```

### Problem: Using Async Pipe with Signals

```typescript
// ❌ WRONG - Async pipe with signals
<div>{{ count() | async }}</div>

// ✅ CORRECT - Direct signal binding
<div>{{ count() }}</div>
```

## SSR (Server-Side Rendering) Issues

### Problem: Direct Access to Browser APIs

```typescript
// ❌ WRONG - Direct window/localStorage access
const theme = localStorage.getItem('theme');
window.addEventListener('resize', handler);

// ✅ CORRECT - Use injection tokens
import { LOCAL_STORAGE } from '../core/tokens/local.storage.token';

private readonly storage = inject(LOCAL_STORAGE);
const theme = this.storage.getItem('theme');  // SSR-safe
```

### Problem: Using isPlatformBrowser Incorrectly

```typescript
// ❌ WRONG - Checking platform in property initialization
export class MyComponent {
  isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
}

// ✅ CORRECT - Check in lifecycle hooks or methods
export class MyComponent {
  private readonly platformId = inject(PLATFORM_ID);
  
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Browser-only code
    }
  }
}
```

### Problem: Document/Window Access in Constructor

```typescript
// ❌ WRONG - Accessing DOM in constructor
constructor() {
  document.body.classList.add('loaded');
}

// ✅ CORRECT - Use afterNextRender or isPlatformBrowser
import { afterNextRender } from '@angular/core';

constructor() {
  afterNextRender(() => {
    document.body.classList.add('loaded');
  });
}
```

## EntityStore and State Management

### Problem: Not Handling Loading States

```typescript
// ❌ WRONG - No loading indicator
loadData(): void {
  this.store.loadAll().subscribe();
}

// ✅ CORRECT - Use store loading signals
loadData(): void {
  this.store.loadAll().subscribe();
}

// In template
@if (store.loading().isLoading) {
  <div>Loading...</div>
}
```

### Problem: Not Handling Errors

```typescript
// ❌ WRONG - Ignoring errors
this.store.create(item).subscribe();

// ✅ CORRECT - Handle errors
this.store.create(item).subscribe({
  next: () => console.log('Created successfully'),
  error: (error) => {
    console.error('Creation failed:', error);
    // Show user-friendly error message
  }
});

// Or use store error signal
@if (store.error()) {
  <div class="error">{{ store.error().message }}</div>
}
```

### Problem: Direct API Calls Instead of Using EntityStore

```typescript
// ❌ WRONG - Bypassing store
export class MyComponent {
  items = signal<Item[]>([]);
  
  ngOnInit(): void {
    this.http.get<Item[]>('/api/items').subscribe(items => {
      this.items.set(items);
    });
  }
}

// ✅ CORRECT - Use EntityStore
export class MyComponent {
  readonly store = inject(ItemStore);
  
  ngOnInit(): void {
    this.store.loadAll().subscribe();
  }
}
```

## HTTP and API

### Problem: Not Extending AbstractApiClient

```typescript
// ❌ WRONG - Reimplementing HTTP logic
@Injectable({ providedIn: 'root' })
export class ItemService {
  private http = inject(HttpClient);
  
  getItems(): Observable<Item[]> {
    return this.http.get<Item[]>('/api/items').pipe(
      catchError(error => {
        console.error(error);
        return throwError(() => error);
      })
    );
  }
}

// ✅ CORRECT - Extend AbstractApiClient
@Injectable({ providedIn: 'root' })
export class ItemApiService extends AbstractApiClient<Item, number> {
  protected readonly baseUrl = environment.apiUrl;
  protected readonly resourceName = 'items';
  
  // CRUD methods inherited, custom error handling included
}
```

### Problem: Not Typing HTTP Responses

```typescript
// ❌ WRONG - Untyped response
this.http.get('/api/users').subscribe(data => {
  console.log(data.name);  // No type safety
});

// ✅ CORRECT - Typed response
interface User {
  id: number;
  name: string;
  email: string;
}

this.http.get<User[]>('/api/users').subscribe(users => {
  console.log(users[0].name);  // Type safe
});
```

## Testing Issues

### Problem: Using Jasmine Syntax with Jest

```typescript
// ❌ WRONG - Jasmine syntax
const spy = jasmine.createSpy('myMethod');
jasmine.clock().tick(1000);

// ✅ CORRECT - Jest syntax
const spy = jest.fn();
jest.advanceTimersByTime(1000);
```

### Problem: Not Providing Zoneless Change Detection in Tests

```typescript
// ❌ WRONG - Missing zoneless provider
TestBed.configureTestingModule({
  imports: [MyComponent]
});

// ✅ CORRECT - Include zoneless provider
TestBed.configureTestingModule({
  imports: [MyComponent],
  providers: [provideZonelessChangeDetection()]
});
```

### Problem: Not Using Translation Test Utilities

```typescript
// ❌ WRONG - Complex translation setup
TestBed.configureTestingModule({
  imports: [
    MyComponent,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: () => new CustomLoader()
      }
    })
  ]
});

// ✅ CORRECT - Use provideStubTranslationService
import { provideStubTranslationService } from '../testing/i18n-testing';

TestBed.configureTestingModule({
  imports: [MyComponent, TranslateModule.forRoot()],
  providers: [
    ...provideStubTranslationService({
      'app.title': 'Test Title'
    })
  ]
});
```

## Accessibility Issues

### Problem: Missing ARIA Labels

```typescript
// ❌ WRONG - No accessible name
<button (click)="delete()">
  <i class="icon-trash"></i>
</button>

// ✅ CORRECT - Proper ARIA label
<button 
  type="button"
  aria-label="Delete item"
  (click)="delete()">
  <i class="icon-trash" aria-hidden="true"></i>
</button>
```

### Problem: Missing Button Type

```typescript
// ❌ WRONG - Missing type (defaults to submit)
<button (click)="onClick()">Click me</button>

// ✅ CORRECT - Explicit type
<button type="button" (click)="onClick()">Click me</button>
```

### Problem: Using Divs as Buttons

```typescript
// ❌ WRONG - Div pretending to be button
<div (click)="submit()" class="button">Submit</div>

// ✅ CORRECT - Semantic button element
<button type="button" (click)="submit()">Submit</button>
```

### Problem: Missing Form Labels

```typescript
// ❌ WRONG - Input without label
<input type="text" name="username">

// ✅ CORRECT - Proper label association
<label for="username">Username</label>
<input type="text" id="username" name="username">

// ✅ ALSO CORRECT - Nested label
<label>
  Username
  <input type="text" name="username">
</label>
```

## Internationalization (i18n)

### Problem: Hardcoded Text

```typescript
// ❌ WRONG - Hardcoded strings
<h1>Welcome to Dashboard</h1>
<button>Save Changes</button>

// ✅ CORRECT - Translation keys
<h1>{{ 'app.dashboard.welcome' | translate }}</h1>
<button>{{ 'app.actions.save' | translate }}</button>
```

### Problem: Missing Translation Keys

```typescript
// ❌ WRONG - Key not in all language files
// en.json: { "app.title": "My App" }
// es.json: { }  // Missing key!

// ✅ CORRECT - Run validation
// npm run check:i18n
// Ensures all keys exist in all language files
```

## Routing Issues

### Problem: Not Using Lazy Loading

```typescript
// ❌ WRONG - Eager loading feature
{
  path: 'dashboard',
  component: DashboardComponent
}

// ✅ CORRECT - Lazy loading
{
  path: 'dashboard',
  loadComponent: () => import('./features/dashboard/dashboard.component')
    .then(m => m.DashboardComponent)
}

// ✅ CORRECT - Lazy loading children
{
  path: 'admin',
  loadChildren: () => import('./features/admin/admin.routes')
    .then(m => m.ADMIN_ROUTES)
}
```

### Problem: Not Using Route Constants

```typescript
// ❌ WRONG - Magic strings
this.router.navigate(['/dashboard/items/123']);

// ✅ CORRECT - Named routes export
// dashboard.routes.ts
export const DASHBOARD_ROUTES: Routes = [ /*...*/ ];

// Use in navigation
this.router.navigate(['/dashboard', 'items', id]);
```

## Performance Issues

### Problem: Unnecessary Change Detection Cycles

```typescript
// ❌ WRONG - Method called in template
<div>{{ getFilteredItems() }}</div>

getFilteredItems(): Item[] {
  return this.items().filter(item => item.active);
}

// ✅ CORRECT - Use computed signal
readonly filteredItems = computed(() =>
  this.items().filter(item => item.active)
);

<div>{{ filteredItems() }}</div>
```

### Problem: Large Bundle Size

```typescript
// ❌ WRONG - Importing entire library
import * as _ from 'lodash';

// ✅ CORRECT - Import specific functions
import { debounce } from 'lodash-es';
// or use native alternatives when possible
```

## TypeScript Issues

### Problem: Using `any`

```typescript
// ❌ WRONG - Using any
function processData(data: any): any {
  return data.items;
}

// ✅ CORRECT - Proper typing
interface ApiResponse {
  items: Item[];
  total: number;
}

function processData(data: ApiResponse): Item[] {
  return data.items;
}
```

### Problem: Not Using Strict Null Checks

```typescript
// ❌ WRONG - Assuming value exists
function getName(user: User): string {
  return user.name.toUpperCase();  // Error if user.name is null
}

// ✅ CORRECT - Handle null/undefined
function getName(user: User | null): string {
  return user?.name?.toUpperCase() ?? 'Unknown';
}
```

## Modal Service Issues

### Problem: Not Using Singleton Key

```typescript
// ❌ WRONG - Multiple modals can open
openSettings(): void {
  this.modalService.open(SettingsComponent);
}

// ✅ CORRECT - Use singleton key to prevent duplicates
openSettings(): void {
  this.modalService.open(SettingsComponent, {
    singletonKey: 'settings-modal'
  });
}
```

### Problem: Not Providing Accessible Labels

```typescript
// ❌ WRONG - No accessible name
this.modalService.open(DialogComponent);

// ✅ CORRECT - Provide ARIA label
this.modalService.open(DialogComponent, {
  ariaLabel: 'Confirmation dialog',
  size: 'md'
});

// ✅ BETTER - Use labelledBy with heading ID
// In dialog template: <h2 id="dialog-title">Confirm Action</h2>
this.modalService.open(DialogComponent, {
  labelledBy: 'dialog-title'
});
```

## Component Architecture

### Problem: Business Logic in Shared Components

```typescript
// ❌ WRONG - Domain logic in shared
// src/app/shared/components/user-card/
export class UserCardComponent {
  loadUserData(): void {
    this.userService.getUser(this.userId).subscribe(...);
  }
}

// ✅ CORRECT - Shared components are stateless
// src/app/shared/components/card/
export class CardComponent {
  @Input() title!: string;
  @Input() content!: string;
  @Output() action = output<void>();
}

// Domain logic stays in features
// src/app/features/users/user-detail/
export class UserDetailComponent {
  readonly user = this.userStore.selected;
}
```

### Problem: Modifying Core Services

```typescript
// ❌ WRONG - Editing AbstractApiClient
// Don't modify core/api/abstract-api.service.ts

// ✅ CORRECT - Extend it
export class CustomApiClient<T> extends AbstractApiClient<T> {
  // Add custom methods
  searchByName(name: string): Observable<T[]> {
    return this.http.get<T[]>(`${this.baseUrl}/${this.resourceName}/search`, {
      params: { name }
    });
  }
}
```

## General Best Practices

### Use Dependency Injection

```typescript
// ❌ WRONG - Creating instances manually
const service = new MyService(new HttpClient());

// ✅ CORRECT - Use inject function
private readonly service = inject(MyService);
```

### Avoid Console Logs in Production

```typescript
// ❌ WRONG - Console logs committed
console.log('User data:', user);

// ✅ CORRECT - Remove or use proper logging
// Temporary debugging only (remove before commit)

// For production logging, use a logging service
this.logger.debug('User data loaded', { userId: user.id });
```

### Keep Components Focused

```typescript
// ❌ WRONG - Component doing too much
export class DashboardComponent {
  // HTTP calls, business logic, routing, state management all in one
}

// ✅ CORRECT - Single responsibility
export class DashboardComponent {
  readonly store = inject(DashboardStore);  // State
  readonly router = inject(Router);          // Navigation
  
  // Component only handles presentation
}
```

## Quick Reference: Common Fixes

| Problem | Solution |
|---------|----------|
| UI not updating | Use signals, not direct mutation |
| Memory leak | Use `takeUntilDestroyed()` |
| SSR error | Use `LOCAL_STORAGE` token, `isPlatformBrowser` |
| Type errors | Add proper TypeScript interfaces |
| Test failures | Use Jest syntax, not Jasmine |
| Missing translations | Run `npm run check:i18n` |
| Accessibility violations | Add ARIA labels, use semantic HTML |
| Large bundle | Use lazy loading, tree-shakeable imports |
| Async pipe error | Use signals directly `{{ value() }}` |
| Button not accessible | Add `type="button"` and `aria-label` |
