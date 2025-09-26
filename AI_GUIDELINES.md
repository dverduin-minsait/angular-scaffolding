# AI Workspace Guidelines

Purpose: This file gives the minimal shared context the AI assistant must internalize before generating or modifying code in this repository.

## 1. Project Context
- Framework: Angular 20 (standalone, zoneless change detection via `provideZonelessChangeDetection`).
- Patterns: Signal-based state (prefer signals/computed over Subjects unless multicasting or external events). Avoid legacy `NgModule`s for new code.
- Goals: Accessibility (WCAG AA), minimal bundle size, robust & scalable architecture, strong automated test coverage, SSR + hydration, performance.
- Tooling: Jest (`jest-preset-angular`), Testing Library, Prettier, TypeScript ~5.9 strict mindset.

## 2. Architectural Principles
1. Feature-first layout: `src/app/features/<domain>` contains routed entry points + UI logic for that domain.
2. `src/app/core` holds cross-cutting infrastructure (tokens, error handlers, logging, http utilities). Keep it stable & small. Reuse the existing `BaseApiService` for HTTP integrations to ensure consistency (extend it rather than duplicating logic).
3. `src/app/shared` only for truly generic, stateless, reusable UI or pure utilities. If it knows business rules, it is NOT shared.
4. Use injection tokens (in `core/tokens`) to invert dependencies and keep features decoupled.
5. Lazy load every feature route (already enforced in `app.routes.ts`). New routes must continue this pattern.
6. Keep public surface minimal: prefer barrel `index.ts` only where it clarifies; avoid deep relative imports in consumers.

## 3. Signals & State Management
- Prefer Angular signals over RxJS for component-local reactive state.
- Use `computed` for derivations; avoid recalculating heavy logic inside templates.
- Use RxJS only for: HTTP streams, interop with external event sources, or multicasting across broader feature scopes.
- Avoid manual `subscribe` in components. If you MUST subscribe, ensure explicit `takeUntilDestroyed()` or use `toSignal()` bridging.
- No `async` pipe with signals (unnecessary); bind signals directly in templates: `{{counter()}}`.

## 4. Change Detection & Performance
- All new components should default to OnPush semantics (zoneless already reduces overhead). Use `changeDetection: ChangeDetectionStrategy.OnPush` if using component decorator options; otherwise rely on zoneless plus signals.
- Never perform expensive computations directly in templates; precompute with signals/computed or pure functions.
- Prefer route-level code-splitting and dynamic imports for heavier feature sets.
- Tree-shake: avoid importing entire libraries where a sub-path import exists.

## 5. Accessibility (a11y)
Non-negotiable baseline:
- Every interactive element has an accessible name (text, `aria-label`, or `aria-labelledby`).
- Use semantic HTML (`<button>`, `<nav>`, `<header>`, `<main>`). Avoid div-button anti-patterns.
- Focus management after navigation or dynamic content updates (set focus to primary heading or landmark when necessary).
- Color contrast >= WCAG AA. If unsure, choose higher contrast.
- Provide skip link to main content if layout introduces repetitive navigation.
- Form controls: associate labels explicitly; provide described-by for hints/errors.
- Decorative images must have empty alt or `aria-hidden="true"`.

## 6. Testing Standards
- Each new component/service/utility: at least one spec file with happy path + 1 edge case.
- Prefer Testing Library queries by role / label text first; resort to `data-testid` only if semantic queries not stable.
- Accessibility smoke test: at least assert critical roles / accessible names in complex components.
- Keep tests deterministic: avoid real timers or sleeps; use fakeAsync or jest timers as needed.
- Coverage: maintain or raise global coverage (see `jest.config.js`). Add coverage thresholds here if we formalize them later.

## 7. Error Handling & Logging
- Global errors captured by `provideBrowserGlobalErrorListeners()`; for feature-level recoverable errors prefer user-facing messaging (ARIA live region for async errors if relevant).
- Do not `console.log` in committed code except temporary debugging that will be removed. Use a future logging service abstraction when needed.

## 8. HTTP & Data
- Use `provideHttpClient(withFetch())`. Prefer strongly typed interfaces for DTOs.
- There is already a BaseApiService to extend for HTTP calls
- Transform/normalize data at the boundary (service layer) not in components.
- Avoid leaking raw HTTP observables into components; convert to signals with caching where appropriate.

## 9. File & Naming Conventions
- Components: `thing.component.ts` (class `ThingComponent`).
- Standalone route definitions: `<feature>.routes.ts` exporting constant `FEATURE_ROUTES`.
- Signals: suffix variable with `Signal` when exported (e.g., `userSignal`); inside a component local signals can drop suffix if obvious.
- Computed signals named meaningfully (e.g., `fullName` instead of `fullNameComputed`).
- Test files: `*.spec.ts` co-located with source.

## 10. Bundling & Size Discipline
- Periodically analyze bundle (future: add a script using `ng build --configuration production --stats-json`). Optimize heavy libraries (e.g., consider on-demand import or alternatives to large grids if not needed globally).
- Prefer native browser & Angular platform APIs over utility libraries for simple tasks.

## 11. SSR & Hydration
- Ensure code remains isomorphic: guard direct `window` / `document` usage (`isPlatformBrowser`) or behind injection tokens.
- Avoid animations on server (already disabled). Do not rely on animation side effects for logic.

## 12. Security & Privacy
- No secrets in the repo (environment values must come from runtime environment, not hard-coded).
- Sanitize or trust Angular's built-in security contexts—avoid bypassing DomSanitizer unless justified.

## 13. Commit & PR Etiquette
- Conventional Commit messages: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, `perf:`, `a11y:`.
- PR description must include: context, architectural impact, testing notes (including a11y), and any bundle size considerations.

## 14. Asking the AI for Changes
When requesting help:
Provide: feature scope + file paths + constraints (a11y, performance, SSR) + desired tests.
Example: "Add a dashboard filter component (signals, a11y labels, lazy loaded) per AI guidelines."

## 15. Do / Don’t Quick Reference
Do:
- Use signals & computed for UI state.
- Keep feature boundaries clear.
- Write minimal but meaningful tests.
- Optimize for accessibility & hydration.
Don’t:
- Introduce zone-based patterns.
- Overuse Subjects for local state.
- Add business logic to `shared`.
- Use direct DOM manipulation unless absolutely required.

## 16. Future Enhancements (Backlog Ideas)
- Add bundle analyzer step & size budget enforcement.
- Integrate jest-axe for automated a11y assertions.
- Expand ADR set (current: ADR-001 adopted Angular 20 standalone + zoneless + signals). New significant decisions must add an ADR in `docs/adr`.

---
Last updated: 2025-09-26
Maintain this file: update when architectural decisions change. Keep it concise (< ~300 lines). If it grows, extract deeper docs to `docs/` and link here.
