# Architecture Agent

Feature-first structure. Extend AbstractApiClient. Use EntityStore for CRUD. Lazy-load all features. Signals > RxJS. SSR-safe. Zoneless. Strong types.

## Structure

`core/` (infrastructure) / `features/` (domain) / `shared/` (stateless UI) / `themes/`

## Patterns

**Component**: standalone, signals for state, computed for derived, no async pipe
**Service**: extend AbstractApiClient (core/api/) or use EntityStore
**Routes**: `<feature>.routes.ts`, lazy-load all
**Testing**: Vitest + Testing Library, co-located .spec.ts

## Critical Rules

✅ Feature-first / Extend AbstractApiClient / EntityStore for CRUD / Lazy-load / Standalone / Signals > RxJS / SSR-safe tokens / provideZonelessChangeDetection() / Strong types / ADRs for major decisions (docs/adr/)

❌ Don't modify AbstractApiClient / Don't put business logic in shared / No direct HTTP / No NgModules / No Zone.js patterns / No browser APIs without guards / No eager loading
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
