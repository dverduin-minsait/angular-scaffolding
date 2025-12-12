# Testing Agent

## Role
Expert in writing and maintaining Jest tests for Angular 21 applications with Testing Library patterns.

## Responsibilities

- Write comprehensive unit and integration tests
- Ensure Jest (not Jasmine) patterns are used
- Maintain test coverage standards
- Test accessibility with jest-axe
- Create tests for components, services, directives, pipes, and stores
- Mock dependencies appropriately
- Test both success and error scenarios
- Ensure zoneless-compatible test setups

## Key Testing Files

### Configuration
- `jest.config.js` - Jest configuration
- `src/setup-jest.ts` - Jest setup file
- `src/jest-axe.d.ts` - TypeScript definitions for jest-axe

### Test Utilities
- `src/app/testing/i18n-testing.ts` - Translation test utilities
  - `provideStubTranslationService()` - Mock translation service
  - `TranslateStubPipe` - Stub translate pipe
  - `DEFAULT_TEST_TRANSLATIONS` - Common translations

### Coverage Reports
- `coverage/` - HTML coverage reports
- `coverage/lcov.info` - LCOV format for CI/CD

## Standard Test Patterns

### Component Test Template

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { provideStubTranslationService } from '../../testing/i18n-testing';
import { MyComponent } from './my.component';

describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent, TranslateModule.forRoot()],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        ...provideStubTranslationService({
          'app.title': 'Test Title',
          'app.button.save': 'Save'
        })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display translated title', () => {
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const titleElement = compiled.querySelector('h1');
    
    expect(titleElement?.textContent?.trim()).toBe('Test Title');
  });

  it('should handle button click', () => {
    fixture.detectChanges();
    
    const button = fixture.nativeElement.querySelector('button[aria-label="Save"]') as HTMLButtonElement;
    button?.click();
    fixture.detectChanges();
    
    expect(component.saved()).toBe(true);
  });
});
```

### Service Test Template

```typescript
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;
  let mockHttp: jest.Mocked<HttpClient>;

  beforeEach(() => {
    mockHttp = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    } as unknown as jest.Mocked<HttpClient>;

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        MyService,
        { provide: HttpClient, useValue: mockHttp }
      ]
    });

    service = TestBed.inject(MyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load data successfully', (done) => {
    const mockData = [{ id: 1, name: 'Test' }];
    mockHttp.get.mockReturnValue(of(mockData));

    service.loadData().subscribe(data => {
      expect(data).toEqual(mockData);
      expect(mockHttp.get).toHaveBeenCalledWith('/api/data');
      expect(mockHttp.get).toHaveBeenCalledTimes(1);
      done();
    });
  });

  it('should handle errors', (done) => {
    const error = new Error('Failed to load');
    mockHttp.get.mockReturnValue(throwError(() => error));

    service.loadData().subscribe({
      error: (err) => {
        expect(err).toBe(error);
        done();
      }
    });
  });
});
```

### EntityStore Test Template

```typescript
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { EntityStore } from '../../../core/store/entity-store';
import { CrudDataSource } from '../../../core/api/abstract-api.service';

interface TestEntity {
  id: number;
  name: string;
}

describe('EntityStore', () => {
  let store: EntityStore<TestEntity, number>;
  let mockDataSource: jest.Mocked<CrudDataSource<TestEntity, number>>;

  beforeEach(() => {
    mockDataSource = {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };

    store = new EntityStore(mockDataSource);
  });

  describe('loadAll', () => {
    it('should load items and update state', (done) => {
      const mockData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ];
      mockDataSource.getAll.mockReturnValue(of(mockData));

      store.loadAll().subscribe(() => {
        expect(store.items()).toEqual(mockData);
        expect(store.hasData()).toBe(true);
        expect(store.isEmpty()).toBe(false);
        expect(store.isReady()).toBe(true);
        expect(store.loading().isLoading).toBe(false);
        done();
      });
    });

    it('should handle errors', (done) => {
      const error = { message: 'Failed', code: '500', timestamp: Date.now() };
      mockDataSource.getAll.mockReturnValue(throwError(() => error));

      store.loadAll().subscribe({
        error: () => {
          expect(store.error()).toEqual(error);
          expect(store.isReady()).toBe(false);
          expect(store.loading().isLoading).toBe(false);
          done();
        }
      });
    });

    it('should set loading state', () => {
      mockDataSource.getAll.mockReturnValue(of([]));
      
      store.loadAll().subscribe();
      
      // Loading should be false after completion
      expect(store.loading().isLoading).toBe(false);
    });
  });

  describe('create', () => {
    it('should add new item to store', (done) => {
      const newItem = { id: 3, name: 'New Item' };
      mockDataSource.create.mockReturnValue(of(newItem));

      store.create({ name: 'New Item' }).subscribe(() => {
        expect(store.items()).toContainEqual(newItem);
        done();
      });
    });
  });

  describe('update', () => {
    it('should update existing item', (done) => {
      const existingItem = { id: 1, name: 'Original' };
      const updatedItem = { id: 1, name: 'Updated' };
      
      mockDataSource.getAll.mockReturnValue(of([existingItem]));
      mockDataSource.update.mockReturnValue(of(updatedItem));

      store.loadAll().subscribe(() => {
        store.update(1, { name: 'Updated' }).subscribe(() => {
          expect(store.items()[0]).toEqual(updatedItem);
          done();
        });
      });
    });
  });

  describe('delete', () => {
    it('should remove item from store', (done) => {
      const items = [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }];
      
      mockDataSource.getAll.mockReturnValue(of(items));
      mockDataSource.delete.mockReturnValue(of(undefined));

      store.loadAll().subscribe(() => {
        store.delete(1).subscribe(() => {
          expect(store.items()).toHaveLength(1);
          expect(store.items()[0].id).toBe(2);
          done();
        });
      });
    });
  });
});
```

### Directive Test Template

```typescript
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ButtonDirective } from './button.directive';

@Component({
  standalone: true,
  imports: [ButtonDirective],
  template: `<button appButton [variant]="variant" [size]="size">Test</button>`
})
class TestComponent {
  variant: 'primary' | 'secondary' = 'primary';
  size: 'sm' | 'md' | 'lg' = 'md';
}

describe('ButtonDirective', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent, ButtonDirective]
    }).compileComponents();
  });

  it('should apply base btn class', () => {
    const fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();
    
    const button = fixture.nativeElement.querySelector('button');
    expect(button?.classList.contains('btn')).toBe(true);
  });

  it('should apply variant classes', () => {
    const fixture = TestBed.createComponent(TestComponent);
    fixture.componentInstance.variant = 'secondary';
    fixture.detectChanges();
    
    const button = fixture.nativeElement.querySelector('button');
    expect(button?.classList.contains('btn--secondary')).toBe(true);
  });

  it('should apply size classes', () => {
    const fixture = TestBed.createComponent(TestComponent);
    fixture.componentInstance.size = 'lg';
    fixture.detectChanges();
    
    const button = fixture.nativeElement.querySelector('button');
    expect(button?.classList.contains('btn--lg')).toBe(true);
  });
});
```

### Pipe Test Template

```typescript
import { MiniCurrencyPipe } from './mini-currency.pipe';

describe('MiniCurrencyPipe', () => {
  let pipe: MiniCurrencyPipe;

  beforeEach(() => {
    pipe = new MiniCurrencyPipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should format number with default currency symbol', () => {
    expect(pipe.transform(123.45)).toBe('$123.45');
  });

  it('should format number with custom currency symbol', () => {
    expect(pipe.transform(123.45, '€')).toBe('€123.45');
  });

  it('should format number with custom fraction digits', () => {
    expect(pipe.transform(123.456, '$', 3)).toBe('$123.456');
  });

  it('should handle string numbers', () => {
    expect(pipe.transform('123.45')).toBe('$123.45');
  });

  it('should handle invalid input', () => {
    expect(pipe.transform('invalid')).toBe('$0.00');
    expect(pipe.transform(null)).toBe('$0.00');
    expect(pipe.transform(undefined)).toBe('$0.00');
  });

  it('should handle zero', () => {
    expect(pipe.transform(0)).toBe('$0.00');
  });
});
```

## Accessibility Testing

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('MyComponent Accessibility', () => {
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
  });

  it('should have no accessibility violations', async () => {
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });

  it('should have proper ARIA labels on buttons', () => {
    fixture.detectChanges();
    
    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons.forEach((button: HTMLButtonElement) => {
      const hasAriaLabel = button.getAttribute('aria-label');
      const hasAriaLabelledBy = button.getAttribute('aria-labelledby');
      const hasTextContent = button.textContent?.trim();
      
      expect(
        hasAriaLabel || hasAriaLabelledBy || hasTextContent
      ).toBeTruthy();
    });
  });

  it('should have type attribute on buttons', () => {
    fixture.detectChanges();
    
    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons.forEach((button: HTMLButtonElement) => {
      expect(button.getAttribute('type')).toBeTruthy();
    });
  });
});
```

## SSR-Safe Testing

```typescript
import { LOCAL_STORAGE } from '../../core/tokens/local.storage.token';
import { StorageService } from '../../core/tokens/local.storage.token';

describe('SSR-safe Component', () => {
  let mockStorage: jest.Mocked<StorageService>;

  beforeEach(async () => {
    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [MyComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: LOCAL_STORAGE, useValue: mockStorage }
      ]
    }).compileComponents();
  });

  it('should use storage token', () => {
    mockStorage.getItem.mockReturnValue('stored-value');
    
    const fixture = TestBed.createComponent(MyComponent);
    fixture.detectChanges();
    
    expect(mockStorage.getItem).toHaveBeenCalledWith('key');
  });

  it('should handle SSR environment (no storage)', () => {
    mockStorage.getItem.mockReturnValue(null);
    
    const fixture = TestBed.createComponent(MyComponent);
    fixture.detectChanges();
    
    // Component should handle null gracefully
    expect(fixture.componentInstance).toBeTruthy();
  });
});
```

## Modal Service Testing

```typescript
import { ModalService, ModalRef } from '../../core/services/modal/modal.service';

describe('Component with Modal', () => {
  let mockModalService: jest.Mocked<Partial<ModalService>>;
  let mockModalRef: jest.Mocked<Partial<ModalRef<any>>>;

  beforeEach(async () => {
    mockModalRef = {
      result: jest.fn().mockResolvedValue({ reason: 'close', data: true }),
      close: jest.fn(),
      cancel: jest.fn(),
      dismiss: jest.fn(),
      isSettled: jest.fn().mockReturnValue(false)
    };

    mockModalService = {
      open: jest.fn().mockReturnValue(mockModalRef),
      confirm: jest.fn().mockResolvedValue(true)
    };

    await TestBed.configureTestingModule({
      imports: [MyComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ModalService, useValue: mockModalService }
      ]
    }).compileComponents();
  });

  it('should open modal with correct config', () => {
    const fixture = TestBed.createComponent(MyComponent);
    const component = fixture.componentInstance;
    
    component.openDialog();
    
    expect(mockModalService.open).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        size: 'md',
        ariaLabel: 'Confirmation dialog'
      })
    );
  });

  it('should handle modal result', async () => {
    const fixture = TestBed.createComponent(MyComponent);
    const component = fixture.componentInstance;
    
    await component.openDialog();
    
    expect(component.dialogResult()).toBe(true);
  });
});
```

## Jest-Specific Patterns

### Mocking Functions

```typescript
// Create mock function
const mockFn = jest.fn();

// Mock return value
mockFn.mockReturnValue('value');
mockFn.mockReturnValueOnce('first').mockReturnValueOnce('second');

// Mock resolved promise
mockFn.mockResolvedValue('async value');

// Mock rejected promise
mockFn.mockRejectedValue(new Error('Failed'));

// Assertions
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
expect(mockFn).toHaveBeenCalledTimes(3);
expect(mockFn).not.toHaveBeenCalled();
```

### Spying on Methods

```typescript
const service = TestBed.inject(MyService);

// Create spy
const spy = jest.spyOn(service, 'method');

// Mock implementation
spy.mockImplementation(() => 'mocked');

// Restore original
spy.mockRestore();

// Assertions
expect(spy).toHaveBeenCalled();
```

### Fake Timers

```typescript
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('should handle setTimeout', () => {
  const callback = jest.fn();
  setTimeout(callback, 1000);
  
  expect(callback).not.toHaveBeenCalled();
  
  jest.advanceTimersByTime(1000);
  
  expect(callback).toHaveBeenCalled();
});

it('should handle setInterval', () => {
  const callback = jest.fn();
  setInterval(callback, 100);
  
  jest.advanceTimersByTime(250);
  
  expect(callback).toHaveBeenCalledTimes(2);
});
```

## Coverage Requirements

### Running Coverage

```bash
npm run coverage
```

### Coverage Targets
- Statements: >80%
- Branches: >75%
- Functions: >80%
- Lines: >80%

### Viewing Reports
- HTML: `coverage/lcov-report/index.html`
- LCOV: `coverage/lcov.info`

## Common Testing Mistakes

### ❌ Using Jasmine Syntax
```typescript
// WRONG
jasmine.createSpy()
jasmine.clock()
spyOn(obj, 'method').and.returnValue()
```

### ✅ Use Jest Syntax
```typescript
// CORRECT
jest.fn()
jest.useFakeTimers()
jest.spyOn(obj, 'method').mockReturnValue()
```

### ❌ Not Calling detectChanges
```typescript
// WRONG
fixture.detectChanges();
// Test immediately without change detection
```

### ✅ Call detectChanges Appropriately
```typescript
// CORRECT
fixture.detectChanges();
// Now test DOM
```

### ❌ Testing Implementation Details
```typescript
// WRONG
expect(component._privateMethod()).toBe(true);
```

### ✅ Test Public API and Behavior
```typescript
// CORRECT
component.publicMethod();
expect(component.result()).toBe(expected);
```

## Test Organization

### Describe Blocks

```typescript
describe('ComponentName', () => {
  describe('initialization', () => {
    it('should create', () => { });
    it('should set default values', () => { });
  });

  describe('user interactions', () => {
    it('should handle button click', () => { });
    it('should update form value', () => { });
  });

  describe('data loading', () => {
    it('should load items on init', () => { });
    it('should handle loading errors', () => { });
  });

  describe('accessibility', () => {
    it('should have no violations', async () => { });
    it('should have ARIA labels', () => { });
  });
});
```

## Quick Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run coverage

# Run specific test file
npx jest my.component.spec.ts

# Run tests matching pattern
npx jest --testNamePattern="should load data"
```

## Test Checklist

Before committing tests:
- [ ] Uses Jest syntax (not Jasmine)
- [ ] Includes `provideZonelessChangeDetection()`
- [ ] Uses `provideStubTranslationService()` for i18n
- [ ] Mocks external dependencies
- [ ] Tests success and error scenarios
- [ ] Includes accessibility tests
- [ ] Has meaningful test descriptions
- [ ] Calls `fixture.detectChanges()` appropriately
- [ ] Uses `done()` callback for async tests
- [ ] No hardcoded delays or timeouts
- [ ] Cleans up resources in `afterEach`
