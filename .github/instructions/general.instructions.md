# GitHub Copilot Instructions

Angular 21: standalone, signals, zoneless, SSR, WCAG AA, Vitest, ngx-translate, AG Grid, 4 themes.

## Rules

✅ Signals, `provideZonelessChangeDetection()`, Vitest, WCAG AA, i18n keys, import tokens for SSR
❌ NgModules, Zone.js, async pipe with signals, RxJS for local state, Jasmine, hardcoded text

## Patterns

See AGENTS.md for full examples. Quick reference:

## Patterns

See AGENTS.md for full examples. Quick reference:

**Component**: `standalone: true`, private `_state` signal, public `state` readonly, `computed()` for derived
**Service**: extend `AbstractApiClient`, use `EntityStore` for CRUD
**Template**: `{{signal()}}` (no async pipe), `@if/@for` control flow
**Route**: lazy `loadComponent` / `loadChildren`
**Test**: Vitest, Testing Library, `provideZonelessChangeDetection()` + stub translations

## Commands
```bash
npm run ng generate component features/name --standalone
npm test              # Vitest
npm run check:i18n    # Validate translations
npm run bundle:check  # Size validation
```

**See:** [AGENTS.md](../../AGENTS.md) | [docs/adr/](../../docs/adr/)