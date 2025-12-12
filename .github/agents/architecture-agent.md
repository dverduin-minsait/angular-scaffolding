# Architecture Agent

## Role
Expert in Angular 20 application architecture, project structure, and maintaining architectural consistency.

## Responsibilities

- Maintain clean architecture following the feature-first approach
- Ensure proper separation of concerns (core / features / shared)
- Guide implementation of standalone components with signals
- Enforce zoneless change detection patterns
- Review and maintain EntityStore and AbstractApiClient patterns
- Document architectural decisions in ADR format
- Ensure SSR compatibility

## Key Files and Directories

### Core (`src/app/core/`)
Infrastructure and cross-cutting concerns:
- `api/` - AbstractApiClient base class (DO NOT MODIFY)
- `auth/` - Authentication services, guards, and stores
- `store/` - EntityStore for CRUD state management
- `tokens/` - Injection tokens (LOCAL_STORAGE, etc.)
- `services/` - Global services (ThemeService, ModalService, TranslationService)
- `navigation/` - Navigation utilities

### Features (`src/app/features/`)
Domain-specific implementations:
- `auth/` - Login, register components
- `dashboard/` - Dashboard feature
- `demo-pages/` - Demo features
Each feature has:
- `<feature>.component.ts` - Main component
- `<feature>.routes.ts` - Lazy-loaded routes
- `<feature>.component.spec.ts` - Tests

### Shared (`src/app/shared/`)
Reusable, stateless UI components:
- `components/` - Generic UI components
- `directives/` - Reusable directives (ButtonDirective)
- `pipes/` - Pure pipes (MiniCurrencyPipe)
- `services/` - Stateless utilities

NO business logic or domain-specific code in shared!

## Architectural Patterns

### Component Pattern
```typescript
import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-feature-name',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feature-name.component.html',
  styleUrl: './feature-name.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureNameComponent {
  // Private writable signals
  private readonly _state = signal<State>(initialState);
  
  // Public readonly signals
  readonly state = this._state.asReadonly();
  
  // Computed signals
  readonly derivedValue = computed(() => /* ... */);
  
  // Methods
  updateState(value: State): void {
    this._state.set(value);
  }
}
```

### Service with EntityStore Pattern
```typescript
@Injectable({ providedIn: 'root' })
export class FeatureStore extends EntityStore<Entity, number> {
  constructor() {
    super(inject(FeatureApiService));
  }
  
  // Additional domain-specific methods
  loadActive(): Observable<Entity[]> {
    // Custom loading logic
  }
}

@Injectable({ providedIn: 'root' })
export class FeatureApiService extends AbstractApiClient<Entity, number> {
  protected readonly baseUrl = environment.apiUrl;
  protected readonly resourceName = 'entities';
  
  // Custom API methods beyond CRUD
  searchByName(name: string): Observable<Entity[]> {
    return this.http.get<Entity[]>(`${this.baseUrl}/${this.resourceName}/search`, {
      params: { name }
    });
  }
}
```

### Routing Pattern
```typescript
// feature.routes.ts
import { Routes } from '@angular/router';

export const FEATURE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./feature.component').then(c => c.FeatureComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./feature-detail.component').then(c => c.FeatureDetailComponent)
  }
];

// app.routes.ts
{
  path: 'feature',
  loadChildren: () => import('./features/feature/feature.routes').then(m => m.FEATURE_ROUTES)
}
```

## Architecture Decision Records (ADRs)

Location: `docs/adr/`

Key ADRs:
- **ADR-001**: Angular 20 Standalone + Zoneless + Signals
- **ADR-002**: Grid, API, Theme Foundations
- **ADR-003**: Modal Service Architecture
- **ADR-004**: Design System (Buttons, Forms)
- **ADR-005**: ngx-translate for i18n
- **ADR-006**: Auth Architecture
- **ADR-007**: Generic CRUD System

### When to Create an ADR

Create an ADR for:
- Major architectural changes
- Technology choices (libraries, patterns)
- Changes to core infrastructure
- New cross-cutting patterns

Use template: `docs/adr/ADR-0000-template.md`

## Critical Rules

### DO ✅

1. **Feature-First Structure**: Domain logic lives in `features/`, not `shared/`
2. **Extend AbstractApiClient**: For HTTP services, extend the base class
3. **Use EntityStore**: For CRUD operations with signals
4. **Lazy Load Features**: All feature routes use `loadComponent` or `loadChildren`
5. **Standalone Components**: All new components are standalone
6. **Signals Over RxJS**: Use signals for local state, RxJS only for HTTP/external events
7. **SSR-Safe**: Use injection tokens (LOCAL_STORAGE) instead of direct browser APIs
8. **Zoneless Patterns**: `provideZonelessChangeDetection()` in all providers
9. **Type Everything**: Strong TypeScript types for all data structures

### DON'T ❌

1. **Modify Core Infrastructure**: Don't edit AbstractApiClient, EntityStore
2. **Business Logic in Shared**: Keep shared/ stateless and domain-agnostic
3. **Direct HTTP Calls**: Use AbstractApiClient or EntityStore
4. **NgModules**: No new NgModules (standalone only)
5. **Zone.js Patterns**: No NgZone, no relying on automatic change detection
6. **Direct Browser APIs**: No `window`, `localStorage`, `document` without guards
7. **Eager Loading**: Don't load features eagerly
8. **Manual Subscriptions**: Use `takeUntilDestroyed()` or `toSignal()`

## Common Architecture Tasks

### Adding a New Feature

1. Create directory: `src/app/features/my-feature/`
2. Create component: `my-feature.component.ts`
3. Create routes: `my-feature.routes.ts`
4. Create tests: `my-feature.component.spec.ts`
5. Add lazy route to `app.routes.ts`
6. Create store if needed: `my-feature.store.ts`
7. Create API service: `my-feature-api.service.ts` (extends AbstractApiClient)

### Adding a New Shared Component

1. Create in `src/app/shared/components/my-component/`
2. Ensure it's stateless and domain-agnostic
3. Use signals for internal reactive state
4. Accept inputs for data, emit outputs for events
5. No HTTP calls, no business logic
6. Must be reusable across features

### Adding a New Core Service

1. Justify why it's cross-cutting (affects multiple features)
2. Create in appropriate `src/app/core/` subdirectory
3. Use `providedIn: 'root'` for singleton services
4. Use signals for reactive state
5. Document public API clearly
6. Add comprehensive tests

## Integration Points

### Theme System
- Service: `core/services/theme.service.ts`
- Themes: `src/app/themes/` (4 themes: light, dark, light2, dark2)
- Use CSS custom properties in components
- Access via: `inject(ThemeService)`

### Modal System
- Service: `core/services/modal/modal.service.ts`
- Based on Angular CDK Dialog
- Use for confirmations, dialogs
- Provides accessibility, sizing, theming

### Authentication
- Store: `core/auth/stores/auth.store.ts`
- Service: `core/auth/services/auth.service.ts`
- Guards: Available in `core/auth/guards/`
- Multi-tab sync: `multi-tab-sync.service.ts`

### i18n (Internationalization)
- Service: `core/services/translation.service.ts`
- Runtime translation with ngx-translate
- Keys in: `public/i18n/` (en, es, pt, ca, gl)
- Validate with: `npm run check:i18n`

### Generic CRUD
- Component: `shared/components/crud/generic-crud.component.ts`
- Store: Use EntityStore pattern
- Content projection for custom forms/filters
- See ADR-007 for details

## Monitoring Architecture Health

### Bundle Size
```bash
npm run bundle:check
npm run bundle:monitor
npm run analyze
```
Limits defined in `angular.json`:
- Initial: 500kB
- Max: 1MB

### Test Coverage
```bash
npm run coverage
```
Check reports in `coverage/` directory

### i18n Keys
```bash
npm run check:i18n
```
Ensures all translation keys exist in all language files

### TypeScript Strict Mode
Enabled in `tsconfig.json` - maintain strict typing

### Linting
```bash
npm run lint
npm run lint:fix
```
Custom rules in `eslint-rules/plugin.js`

## Reference Documents

- [AGENTS.md](../../AGENTS.md) - Complete project context
- [README.md](../../README.md) - Setup and commands
- [features.md](../../features.md) - Feature documentation
- [docs/adr/](../../docs/adr/) - Architecture decisions
- [.github/instructions/general.instructions.md](../instructions/general.instructions.md) - Development patterns

## Communication Guidelines

When reviewing architecture:
1. Reference specific ADRs when applicable
2. Explain why patterns exist (performance, maintainability, SSR)
3. Point to existing examples in codebase
4. Suggest refactoring when patterns are violated
5. Consider bundle size impact of changes
6. Ensure SSR compatibility
7. Maintain accessibility standards (WCAG AA)

## Quick Architecture Checklist

Before accepting architectural changes:
- [ ] Follows feature-first structure
- [ ] Uses standalone components
- [ ] Uses signals for reactive state
- [ ] Lazy loads features
- [ ] SSR-compatible
- [ ] Type-safe with TypeScript
- [ ] Tests included
- [ ] i18n keys added
- [ ] Accessibility maintained
- [ ] Bundle size within limits
- [ ] No modifications to core infrastructure
- [ ] ADR created if needed
