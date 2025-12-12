# ADR-003: Unified Modal Service on Angular CDK Dialog (Accessibility, Theming, SSR-Friendly)
Status: Proposed  
Date: 2025-09-29  
Supersedes: None  
Superseded by: None

## Context
The application needs a consistent, accessible, and easily themeable modal / dialog mechanism that:
- Works with Angular 21 standalone + zoneless change detection + signals (ADR-001)
- Avoids heavyweight UI libraries (Material, PrimeNG, etc.) at this stage to keep bundle size lean
- Supports SSR / hydration without Zone.js side effects
- Provides deterministic focus management & ARIA semantics for accessibility
- Integrates with design tokens / CSS variables and emerging theme variants (ADR-002)
- Allows runtime functional patterns (confirm flows, chained dialogs) with minimal boilerplate
- Enables testing (unit + component tests) without brittle DOM timing hacks
- Provides adaptive styling (size variants, semantic tone accents, scroll management) while staying framework-agnostic

Problems with naïve / ad hoc approaches:
- Scattered usages of `Dialog` or manual overlays with inconsistent ARIA labels & close behavior
- Repeated logic for: disabling escape/backdrop close, auto-close timers, focus restore, scroll handling
- Inconsistent result semantics (close vs cancel vs dismiss) leading to fragile calling code
- Harder testability (each component reimplements dialog conventions)
- No centralized mitigation for memory leaks (event listeners, timers)

Alternatives considered:
1. Angular Material `MatDialog` (Rejected: pulls in wider Material layer + styling system not yet adopted; increases bundle & theme coupling)
2. PrimeNG / Other UI library dialogs (Rejected: larger dependency surface, mixed patterns, stylistic divergence from design tokens approach)
3. Direct CDK Dialog usage per feature (Rejected: duplication of accessibility + life‑cycle patterns; risk of divergence)
4. Custom lightweight service atop CDK (Chosen: minimal abstraction, centralizes concerns, keeps optionality for future library adoption)

## Decision
Adopt a custom `ModalService` built over Angular CDK Dialog providing:
- Typed `open()` with enriched `OpenModalOptions` (size, tone, singletonKey, auto close, accessible labels)
- A `ModalRef` wrapper exposing a Promise-like `result()` plus a signal (`closed`) and explicit `close / cancel / dismiss` semantics
- A convenience `confirm()` API returning either boolean or detailed structured result
- Automatic ARIA wiring (`ariaLabel`, `ariaLabelledBy`, `ariaDescribedBy`, `ariaModal`)
- Centralized feature flags: disable escape / backdrop closing; singleton reuse; auto close timers
- Post-open enhancement applying `data-size`, `data-tone`, overflow detection, and scroll state class
- Theming hooks via CSS classes (`app-modal-panel`, `app-modal-backdrop`) and data attributes consumed by `_modal.scss`
- Cleanup orchestration (timers, resize observers) for SSR safety and leak avoidance

## Options Considered
1. Keep using CDK Dialog ad hoc – Rejected: duplication, inconsistent a11y & semantics
2. Adopt Angular Material – Rejected: premature commitment to component library, larger bundle
3. Use PrimeNG / third-party – Rejected: heavier CSS/JS, theming mismatch with CSS tokens strategy
4. Build minimal abstraction (Chosen) – Leverages CDK’s a11y + overlay primitives; adds only app-specific semantics

## Consequences
### Positive
- Consistent user & screen reader experience (predictable ARIA + focus restore)
- Declarative theming + semantic tones without extra component contracts
- Reduced boilerplate & clearer intent (callers await structured result)
- Signals integration gives reactive consumers (e.g., multi-step flows) fine-grained updates
- Enhanced testability (unit tests can await `result()` deterministically)
- Extensible surface (future: stacked modals policy, global before-close guards)
### Negative / Trade-offs
- A custom abstraction needs maintenance & documentation (Mitigation: concise surface area, ADR + examples)
- Potential drift from future Material adoption if later required (Mitigation: wrapper isolates; could re-implement on different backend)
- Slight upfront complexity vs naïve usage (Mitigation: developer education + reusable confirm pattern)

## Security / Privacy Impact
None direct. Centralization reduces risk of leaking references (leaked timers / observers cleaned systematically).

## Accessibility Impact
- Enforces ARIA role, modal semantics, labeling conventions
- Prevents modals without accessible name/description
- Scroll state class allows tailoring focus styles for long content
- Future improvement: trap focus fallback & inert background (CDK handles baseline)

## Operational Impact
No deployment changes. Simplifies future logging of dialog usage if instrumentation is added centrally.

## Testing Impact
- Dedicated tests for `ModalService` cover: singleton reuse, confirm mapping, auto close, size/tone attributes
- Feature tests rely on stable `result()` Promise & signals instead of DOM polling
- Simplifies mocking (service can be stubbed with in-memory implementation if needed)

## Metrics / Validation
- Bundle diff: watch that the abstraction itself stays minimal (< few hundred LOC, no heavy deps)
- A11y audits: zero dialogs lacking name/description in automated checks
- Test stability: no flakiness tied to modal timing in CI (track if emerges)
- Adoption: all new feature dialogs routed via `ModalService` (can grep for direct `Dialog.open` usage)

## Future Evolution / Revisit Triggers
- Need for nested / stacked modals with focus layering
- Adding animation variants (enter/exit) or orchestrated transitions
- Requirement for global “unsaved changes” guard integration
- Potential migration to a design system library; evaluate swapping backend implementation beneath same API

## References
- Source: `src/app/core/services/modal/modal.service.ts`
- Styles: `src/app/themes/_modal.scss`
- ADR-001 (Signals & zoneless) – reactivity + perf basis
- ADR-002 (Theming foundation) – CSS variable + tone alignment
- Angular CDK Dialog documentation
