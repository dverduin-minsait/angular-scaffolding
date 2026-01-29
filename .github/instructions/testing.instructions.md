# Testing Instructions

## Testing Framework

This project uses **Vitest** (not Jasmine) with Angular Testing Library patterns.

## Test File Structure

All test files should be co-located with their source files and follow the naming convention:
- Components: `component-name.component.spec.ts`
- Services: `service-name.service.spec.ts`
- Directives: `directive-name.directive.spec.ts`
- Pipes: `pipe-name.pipe.spec.ts`
- Accessibility tests: `component-name.accessibility.spec.ts`

## Standard Test Setup Pattern

```typescript
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { provideStubTranslationService } from '../testing/i18n-testing';

describe('ComponentName', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentName, TranslateModule.forRoot()],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        ...provideStubTranslationService({
          'app.title': 'Test Title',
          'app.button.save': 'Save'
        })
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ComponentName);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
```

## Vitest Matchers (NOT Jasmine)

Use Vitest syntax, not Jasmine:

```typescript
import { vi } from 'vitest';

// ✅ CORRECT - Vitest
expect(value).toBe(expected);
expect(array).toHaveLength(3);
expect(fn).toHaveBeenCalledWith(arg);
expect(fn).toHaveBeenCalledTimes(2);
const mockFn = vi.fn();
const spy = vi.spyOn(service, 'method');
vi.useFakeTimers();
vi.advanceTimersByTime(1000);

// ❌ WRONG - Jasmine (do NOT use)
expect(value).toEqual(jasmine.any(Type));
jasmine.createSpy();
jasmine.clock();
```

## Mock Services with Vitest

```typescript
import { vi, type Mocked } from 'vitest';

describe('ServiceTest', () => {
  let service: MyService;
  let mockHttp: Mocked<{ get: (url: string) => unknown; post: (url: string, body: unknown) => unknown }>;

  beforeEach(() => {
    mockHttp = {
      get: vi.fn(),
      post: vi.fn()
    } as unknown as typeof mockHttp;

    TestBed.configureTestingModule({
      providers: [
        MyService,
        { provide: HttpClient, useValue: mockHttp }
      ]
    });

    service = TestBed.inject(MyService);
  });

  it('should call API with correct params', () => {
    mockHttp.get.mockReturnValue(of([{ id: 1 }]));
    
    service.loadData();
    
    expect(mockHttp.get).toHaveBeenCalledWith('/api/data');
    expect(mockHttp.get).toHaveBeenCalledTimes(1);
  });
});
```

## Translation Testing

Always use `provideStubTranslationService` for i18n tests:

```typescript
import { provideStubTranslationService } from '../testing/i18n-testing';

describe('Component with translations', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent, TranslateModule.forRoot()],
      providers: [
        ...provideStubTranslationService({
          'app.welcome': 'Welcome User',
          'app.button.submit': 'Submit Form'
        })
      ]
    }).compileComponents();
  });

  it('should display translated text', () => {
    const fixture = TestBed.createComponent(MyComponent);
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Welcome User');
  });
});
```

## Testing Signals

```typescript
it('should update signal state', () => {
  const fixture = TestBed.createComponent(MyComponent);
  const component = fixture.componentInstance;
  
  // Read signal value
  expect(component.count()).toBe(0);
  
  // Trigger action that updates signal
  component.increment();
  
  // Signal updates immediately (zoneless)
  expect(component.count()).toBe(1);
  
  // Trigger change detection for template updates
  fixture.detectChanges();
  
  const compiled = fixture.nativeElement as HTMLElement;
  expect(compiled.textContent).toContain('1');
});
```

## Testing with EntityStore

```typescript
import { EntityStore } from '../core/store/entity-store';
import { firstValueFrom, of, throwError } from 'rxjs';
import { vi } from 'vitest';

describe('Component with EntityStore', () => {
  let store: EntityStore<MyEntity, number>;
  let mockDataSource: CrudDataSource<MyEntity, number>;

  beforeEach(() => {
    mockDataSource = {
      getAll: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    } as unknown as CrudDataSource<MyEntity, number>;

    store = new EntityStore(mockDataSource);
  });

  it('should load items and update state', async () => {
    const mockData = [{ id: 1, name: 'Test' }];
    mockDataSource.getAll.mockReturnValue(of(mockData));

    await firstValueFrom(store.loadAll());
    expect(store.items()).toEqual(mockData);
    expect(store.hasData()).toBe(true);
    expect(store.isReady()).toBe(true);
  });

  it('should handle errors', async () => {
    const error = { message: 'Failed', code: '500', timestamp: Date.now() };
    mockDataSource.getAll.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(store.loadAll())).rejects.toEqual(error);
    expect(store.error()).toEqual(error);
    expect(store.isReady()).toBe(false);
  });
});
```

## SSR-Safe Testing

When testing code that uses browser APIs:

```typescript
import { LOCAL_STORAGE } from '../core/tokens/local.storage.token';

describe('SSR-safe component', () => {
  let mockStorage: StorageService;

  beforeEach(async () => {
    mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    } as unknown as StorageService;

    await TestBed.configureTestingModule({
      imports: [MyComponent],
      providers: [
        { provide: LOCAL_STORAGE, useValue: mockStorage }
      ]
    }).compileComponents();
  });

  it('should use storage token', () => {
    mockStorage.getItem.mockReturnValue('theme-dark');
    
    const fixture = TestBed.createComponent(MyComponent);
    fixture.detectChanges();
    
    expect(mockStorage.getItem).toHaveBeenCalledWith('theme');
  });
});
```

## Accessibility Testing

```typescript
import { axe, toHaveNoViolations } from 'vitest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const fixture = TestBed.createComponent(MyComponent);
    fixture.detectChanges();
    
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });

  it('should have proper ARIA labels', () => {
    const fixture = TestBed.createComponent(MyComponent);
    fixture.detectChanges();
    
    const button = fixture.nativeElement.querySelector('button');
    expect(button?.getAttribute('aria-label')).toBe('Submit form');
    expect(button?.getAttribute('type')).toBe('button');
  });
});
```

## Testing Modal Service

```typescript
import { ModalService } from '../core/services/modal/modal.service';

describe('Component with modals', () => {
  let modalService: ModalService;

  beforeEach(() => {
    modalService = {
      open: vi.fn(),
      confirm: vi.fn()
    } as unknown as ModalService;

    TestBed.configureTestingModule({
      providers: [
        { provide: ModalService, useValue: modalService }
      ]
    });
  });

  it('should open modal with correct config', () => {
    const component = TestBed.createComponent(MyComponent).componentInstance;
    
    component.openDialog();
    
    expect(modalService.open).toHaveBeenCalledWith(
      DialogComponent,
      expect.objectContaining({
        size: 'md',
        ariaLabel: 'Confirmation dialog'
      })
    );
  });
});
```

## Coverage Requirements

- Maintain test coverage as shown in `coverage/` directory
- All new components, services, directives, and pipes must have tests
- Aim for high coverage on business logic and state management
- Run tests with: `npm test`
- Check coverage: `npm run coverage`

## Common Testing Patterns

### Testing Router Navigation

```typescript
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { vi } from 'vitest';

it('should navigate on button click', () => {
  const router = TestBed.inject(Router);
  const navigateSpy = vi.spyOn(router, 'navigate');
  
  const fixture = TestBed.createComponent(MyComponent);
  const button = fixture.nativeElement.querySelector('button');
  button?.click();
  
  expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
});
```

### Testing Async Operations

```typescript
import { vi } from 'vitest';

it('should handle async data loading', async () => {
  const mockData = { id: 1, name: 'Test' };
  service.getData.mockReturnValue(of(mockData));
  
  component.loadData();
  
  // For signals + RxJS timers
  vi.useFakeTimers();
  await vi.runAllTimersAsync();
  vi.useRealTimers();

  expect(component.data()).toEqual(mockData);
});
```

### Testing Form Interactions

```typescript
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

it('should update form value', () => {
  const fixture = TestBed.createComponent(MyFormComponent);
  fixture.detectChanges();
  
  const input = fixture.nativeElement.querySelector('input[name="username"]') as HTMLInputElement;
  input.value = 'testuser';
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
  
  expect(fixture.componentInstance.form.get('username')?.value).toBe('testuser');
});
```

## Key Differences from Jasmine

| Jasmine | Vitest |
|---------|-------|
| `jasmine.createSpy()` | `vi.fn()` |
| `jasmine.createSpyObj()` | Manual object with `vi.fn()` |
| `spyOn(obj, 'method')` | `vi.spyOn(obj, 'method')` |
| `jasmine.clock()` | `vi.useFakeTimers()` |
| `jasmine.clock().tick()` | `vi.advanceTimersByTime()` |
| `jasmine.any(Type)` | `expect.any(Type)` |

## Test Debugging

```typescript
// Enable console output in tests
it('should debug', () => {
  console.log(component.state());
  console.log(fixture.nativeElement.innerHTML);
});

// Debug a single test file
// Run: npx vitest path/to/file.spec.ts --runInBand
```

## DO ✅

- Use Vitest matchers and mocking functions
- Test user-facing behavior, not implementation details
- Use `provideStubTranslationService` for i18n
- Mock external dependencies (HTTP, storage, etc.)
- Test accessibility with vitest-axe
- Use signals for reactive state testing
- Call `fixture.detectChanges()` after state changes

## DON'T ❌

- Use Jasmine syntax (spies, clock, etc.)
- Test private methods directly
- Rely on timing without `done()` callback or `fakeAsync`
- Skip accessibility tests
- Use `async/await` without proper test completion
- Forget to provide necessary dependencies in TestBed
