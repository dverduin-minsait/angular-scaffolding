# GitHub Copilot Instructions

**Angular 21**: standalone, signals, zoneless, SSR, WCAG AA, Jest, ngx-translate, AG Grid, 4 themes.

## Rules
- ✅ Signals, `provideZonelessChangeDetection()`, Jest, WCAG AA, i18n keys
- ❌ NgModules, Zone.js, async pipe with signals, RxJS for local state, Jasmine, hardcoded text

## Component Pattern
```typescript
import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-name',
  standalone: true,
  template: `<button type="button" aria-label="Action" (click)="action()">{{text()}}</button>`
})
export class NameComponent {
  private readonly _state = signal<T>(initial);
  readonly state = this._state.asReadonly();
  protected readonly text = computed(() => this.state().loading ? 'Loading' : 'Submit');
}
```

## Service Pattern
```typescript
import { Injectable, signal } from '@angular/core';
import { AbstractApiClient } from '../core/api/abstract-api.service';

@Injectable({ providedIn: 'root' })
export class DataService extends AbstractApiClient {
  private readonly _data = signal<T[]>([]);
  readonly data = this._data.asReadonly();
  
  load(): void {
    this.getList<T>('/api/endpoint')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => this._data.set(data));
  }
}
```

## Test Pattern
```typescript
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideStubTranslationService } from '../testing/i18n-testing';

describe('Component', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Component, TranslateModule.forRoot()],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        ...provideStubTranslationService({ 'key': 'Value' })
      ]
    }).compileComponents();
  });

  it('works', () => {
    const fixture = TestBed.createComponent(Component);
    const spy = jest.fn();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Value');
  });
});
```

## Structure
```
src/app/
├── core/          # API, auth, global services (DON'T modify AbstractApiClient)
├── features/      # Lazy routes: <name>.component.ts/spec.ts/scss + <name>.routes.ts
├── shared/        # Stateless UI only (NO business logic)
└── themes/        # CSS custom properties: var(--color-primary)
```

## Accessibility (Mandatory)
```typescript
template: `
  <nav role="navigation" aria-label="Main">
    <button type="button" aria-label="Menu" [attr.aria-expanded]="open()">
      {{label()}}
    </button>
  </nav>
`
```
- Semantic HTML, ARIA labels, roles, keyboard nav, contrast ≥4.5:1

## SSR Guard
```typescript
// For browser APIs, use LOCAL_STORAGE injection token (SSR-safe)
import { LOCAL_STORAGE } from '../core/tokens/local.storage.token';

const storage = inject(LOCAL_STORAGE);
storage.getItem('key'); // Works in both browser and SSR

```

## Commands
```bash
npm run ng generate component features/name --standalone
npm test              # Jest with coverage
npm run check:i18n    # Validate translations
npm run bundle:check  # Size validation
```

**See:** [AGENTS.md](../../AGENTS.md) | [docs/adr/](../../docs/adr/)