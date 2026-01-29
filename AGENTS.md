# AGENTS.md

## 🎯 Document Purpose

Complete context for AI agents (Copilot, Cursor, Claude) and developers about Angular project architecture, conventions, and procedures.

## 📋 Project Summary

**Angular Architecture Blueprint** - Angular 21 reference application with modern patterns: standalone components, signals, zoneless change detection, SSR, WCAG AA accessibility, comprehensive testing, and i18n.

**Main Stack:** Angular 21 + TypeScript 5.9 + Vitest + AG Grid + ngx-translate + SCSS + Express SSR

## 🛠 Tech Stack

- **Angular 21.0.x** - Standalone + signals + zoneless
- **TypeScript 5.9** - Strict mode
- **RxJS 7.8** - HTTP/external events only
- **AG Grid 34.2** - Enterprise tables
- **ngx-translate 17.0** - Runtime i18n
- **Vitest** + Testing Library - Testing
- **SCSS** - Design tokens + 4 themes
- **Express 5.1** - SSR server

**Key Commands:**
```bash
npm install && npm run check:i18n
npm run dev          # Mock API + dev server
npm test             # Vitest
npm run build        # Production + SSR
```

## 🏗 Architecture

### Structure
```
src/app/
├── core/         # Auth, API, global services
├── features/     # Lazy modules (auth, dashboard, clothes)
├── shared/       # Reusable components
├── themes/       # 4 CSS themes (light/dark + warm variants)
└── testing/      # Test utilities
```

### Architectural principles
1. **Feature-first**: `src/app/features/<domain>` contains entry points + UI for that domain
2. **Core stability**: `src/app/core` for cross-cutting infrastructure (tokens, AbstractApiClient)
3. **Shared purity**: Only generic stateless UI. No business rules
4. **Injection tokens**: In `core/tokens` for dependency inversion
5. **Lazy loading**: All feature routes are lazy (mandatory)
6. **Barrel exports**: `index.ts` only where it clarifies, avoid deep relative imports

### Key patterns
- **Standalone + Signals + Zoneless**: `provideZonelessChangeDetection()`
- **Signals > RxJS**: Local state with signals, RxJS only for HTTP/external events
- **No async pipe**: Use signals directly `{{counter()}}`
- **CSS Custom Properties**: Dynamic theming
- **WCAG AA**: Mandatory accessibility
- **Testing Library**: Tests by role/text, maintained coverage

## 👥 Agents and responsibilities

### Automated  
- **AI (Copilot/Cursor)**: Code following patterns, DO NOT modify core architecture
- **Vitest + Testing Library**: Unit/integration tests with coverage reports, Vitest matchers
- **Prettier/TypeScript**: Formatting and automatic validation

## 📚 Sources of truth

- **[README.md](README.md)**: Quick start + general information
- **[docs/adr/](docs/adr/)**: Architectural decisions (ADR-001 to ADR-006)
- **[package.json](package.json)**: Scripts and dependencies
- **[vitest.config.ts](vitest.config.ts)**: Testing configuration + coverage
- **src/environments/**: APIs per environment + mock with db.json
- **src/themes/**: CSS design tokens + ThemeService
- **public/i18n/**: Translations + validator tools/check-i18n.mjs

## 🔧 Development procedures and standards

### Naming conventions
- **Components**: `thing.component.ts` (class `ThingComponent`)
- **Standalone routes**: `<feature>.routes.ts` exporting `FEATURE_ROUTES`
- **Exported signals**: suffix `Signal` (`userSignal`)
- **Computed signals**: meaningful names (`fullName` not `fullNameComputed`)
- **Tests**: `*.spec.ts` co-located with source

### Create a component
```bash
npm run ng generate component features/my-feature/my-component --standalone
```

```typescript
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="my-component">
      <button 
        type="button" 
        aria-label="Submit form"
        (click)="handleSubmit()">
        {{buttonText()}}
      </button>
    </div>
  `,
  styleUrl: './my-component.component.scss'
})
export class MyComponentComponent {
  protected readonly state = signal(initialValue);
  protected readonly buttonText = computed(() => 
    this.state().loading ? 'Loading...' : 'Submit'
  );
  
  handleSubmit(): void {
    this.state.update(s => ({...s, loading: true}));
  }
}
```

### Create a service
```typescript
import { Injectable, signal } from '@angular/core';
import { AbstractApiClient } from '../core/api/abstract-api.service';

@Injectable({ providedIn: 'root' })
export class MyService extends AbstractApiClient {
  private readonly _state = signal(initialState);
  readonly state = this._state.asReadonly();
  
  updateState(newValue: StateType): void {
    this._state.set(newValue);
  }
}
```

### Tests with Vitest + Testing Library
```typescript
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { vi } from 'vitest';
import { LOCAL_STORAGE } from '../core/tokens/local.storage.token';
import { provideStubTranslationService } from '../testing/i18n-testing';

describe('MyComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent, TranslateModule.forRoot({ fallbackLang: 'en' })],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: '', component: MockComponent }]),
        {
          provide: LOCAL_STORAGE,
          useValue: { getItem: vi.fn(), setItem: vi.fn() }
        },
        ...provideStubTranslationService({ 'my.key': 'My Value' })
      ]
    }).compileComponents();
  });

  it('should handle user interaction', () => {
    const fixture = TestBed.createComponent(MyComponent);
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button[aria-label="Submit form"]');
    
    button?.click();
    fixture.detectChanges();
    
    expect(compiled.textContent).toContain('Loading...');
  });

  it('should call service method with correct parameters', () => {
    const mockService = { update: vi.fn() };
    // Vitest spies and mocks for isolated testing
    const updateSpy = vi.spyOn(mockService, 'update');
    
    // Component logic
    
    expect(updateSpy).toHaveBeenCalledWith(expectedValue);
    expect(updateSpy).toHaveBeenCalledTimes(1);
  });
});
```

### Commits and PRs
- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `a11y:`
- **PR Description**: context + architectural impact + testing + a11y + bundle size

## ⚠️ Best practices and limitations

### DO ✅
- **Signals + computed**: For reactive UI state
- **AbstractApiClient**: Extend for HTTP, don't duplicate logic
- **`isPlatformBrowser`**: For browser-specific code in SSR
- **`takeUntilDestroyed()`**: If you MUST subscribe manually
- **Semantic HTML**: `<button>`, `<nav>`, `<main>`, aria-labels
- **Testing Library + Vitest**: Queries by role/text before `data-testid`, Vitest matchers
- **Vitest spies/mocks**: For isolated unit testing (`vi.fn()`, `vi.spyOn()`)
- **Tree shaking**: Specific imports `import { x } from 'lib/x'`

### DON'T ❌
- **Zone.js patterns**: `NgZone`, `setTimeout` without fakeAsync
- **NgModules**: For new code (standalone only)
- **Business logic in shared**: Only generic stateless UI
- **`console.log`**: In committed code (only temporary debug)
- **Direct DOM manipulation**: Avoid except justified cases
- **Async pipe with signals**: Use `{{signal()}}` directly
- **Manual subscribe**: Without `takeUntilDestroyed()` or `toSignal()`
- **Jasmine patterns**: We use Vitest, not Jasmine (`vi.fn()` not `jasmine.createSpy()`)

### Technical limitations
- **Zoneless**: Don't rely on automatic detection, use signals
- **SSR**: Guard `window`/`document` with `isPlatformBrowser`
- **Bundle limits**: 500kB initial, 1MB max (defined in angular.json)
- **A11y mandatory**: WCAG AA, contrast >= 4.5:1
- **i18n runtime**: ngx-translate, not Angular i18n static

### Special cases
- **HTTP**: Use `provideHttpClient(withFetch())` + typed interfaces
- **Errors**: Global via `provideBrowserGlobalErrorListeners()`
- **Theme switching**: CSS custom properties, no dynamic classes
- **Security**: No hardcoded secrets, use DomSanitizer context

## ❓ FAQ / notes / recommendations

### Frequently asked questions

**Why signals instead of RxJS for local state?**
Better performance with zoneless, simpler API, native template integration, automatic change detection.

**Why AG Grid instead of Angular Material Table?**
Enterprise features (advanced filters, sorting, grouping), better performance with large datasets, more customization options.

**Why ngx-translate instead of Angular i18n?**
Runtime switching without rebuild, better for dynamic SPA applications, more flexible for dynamic content.

**How to debug zoneless issues?**
Verify all reactive state uses signals, don't rely on automatic detection, use Angular DevTools for signals.

**How does the theme system work?**
4 themes: light (blue), dark (blue), light2 (orange/warm), dark2 (orange/warm). Automatic switching via CSS custom properties, system preference support and custom themes.

### Productivity tips
- Use ADRs to document important architectural decisions
- Run tests in watch mode during development
- Use `npm run dev` for development with mock API
- Validate i18n with `npm run check:i18n` before commits
- Configure IDE with Prettier for automatic formatting
- Use Angular DevTools for signals debugging

### Known errors / debugging
- **Flaky tests**: Verify use of `fakeAsync` for timers, Vitest fake timers with `vi.useFakeTimers()`
- **CSS variables not working**: Verify theme is initialized in ThemeService
- **SSR hydration issues**: Guard side effects in browser-only guards
- **Theme not switching**: Verify CSS custom properties are defined
- **i18n keys missing**: Run `npm run check:i18n` to validate
- **Vitest mocking issues**: Use `vi.mock()` for modules, `vi.fn()` for functions, `vi.spyOn()` for methods

### Asking AI for help
**Recommended format**: "Add [component] ([scope], [constraints], [tests]) following AI guidelines in AGENTS.md"
**Example**: "Add dashboard filter (signals, a11y labels, lazy loaded) with tests"

### Useful links
- [Angular Signals Guide](https://angular.dev/guide/signals)
- [AG Grid Angular Integration](https://ag-grid.com/angular-data-grid/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Testing Library Angular](https://testing-library.com/docs/angular-testing-library/intro/)
- [ngx-translate Documentation](https://github.com/ngx-translate/core)

---

**Last updated**: 14/10/2025
**Maintenance**: Update when important architectural decisions change. Keep concise and focused on practical information for agents and developers.