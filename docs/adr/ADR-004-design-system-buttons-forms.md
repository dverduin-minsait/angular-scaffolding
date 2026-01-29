# ADR-004: Hybrid Design System for Buttons & Form Controls

Date: 2025-09-29
Status: Accepted

## Context
Multiple duplicated button and form input styles existed across features (`auth`, `clothes`, `theme-demo`). Variants (`btn-primary`, `btn-secondary`, `btn-ghost`) were ad-hoc, reimplemented with SCSS mixins or local overrides, making consistency, theming, and a11y maintenance harder. Project guidelines emphasize:
- Centralized theming via CSS custom properties.
- Accessibility (focus rings, high contrast, clear states).
- Zoned-less Angular + signals, minimal runtime overhead.

## Decision
Adopt a hybrid design system layer composed of:
1. Design Tokens (`src/styles/_tokens.scss`): semantic custom properties bridging existing theme variables to component-level tokens (e.g. `--btn-*`, `--fc-*`).
2. Global Component Partials (`styles/components/_button.scss`, `_form.scss`): single source of baseline structural + variant CSS for `.btn` and `.form-control` families.
3. Attribute Directive (`ButtonDirective`): typed API for variants & sizes (`variant: primary|secondary|ghost|danger`; `size: sm|md|lg`) applied via `appButton` to native `<button>` / `<a>` elements.
4. Reuse of existing theme service classes (`html.light-theme`, `html.dark-theme`, `.high-contrast`) without redefining palette values.
5. Incremental adoption (legacy local button rules removed where updated; future cleanup continues via grep for `btn-primary`).

## Rationale
- Tokens decouple semantic meaning from raw palette variables, enabling future theming (e.g. add compact size or elevated visual treatment) without rewriting templates.
- Directive enforces valid variant names at compile time, eliminating silent drift.
- Keeps native elements (no wrapper components) → preserves semantics, reduces DOM, ensures predictable SSR/hydration.
- High contrast adjustments centralized (e.g. thicker focus ring) by leveraging existing `.high-contrast` class toggle in `ThemeService`.

## Alternatives Considered
| Option | Why Rejected as Primary |
|--------|-------------------------|
| Pure global classes only | Lacked type safety and easy enforcement of allowed variants. |
| SCSS mixins per component | Risk of CSS bloat & divergence; harder runtime theming. |
| Wrapper `<app-button>` component | Unnecessary abstraction; increased template verbosity. |
| Full utility-first approach | Would introduce large class surface and cognitive overhead given current scale. |

## Implementation Summary
- Added `ButtonDirective` (`src/app/shared/directives/button.directive.ts`).
- Added tokens and partials under `src/styles/` mirroring design system folder plan.
- Updated `styles.scss` to import tokens + components.
- Replaced legacy usages in `login`, `register`, `clothes` CRUD, `theme-controls`, `interactive-demo`, and modal confirm dialog.
- Updated related specs to assert new `.btn` + `.btn--{variant}` classes.

## Accessibility Considerations
- Focus states use `:focus-visible` with tokenized ring thickness/color; high contrast can override.
- Disabled state uses opacity + `cursor: not-allowed` but keeps sufficient contrast for text.
- Error styling relies on aria attributes (`aria-invalid`, `role="alert"`) & classes (`.form-error`).
- Maintains native button semantics; anchors styled as buttons require confirm use-case review if role="button" needed (future improvement).

## Migration Guidelines
1. Replace any `btn-primary`, `btn-secondary`, `btn-ghost`, `btn-danger` classes with `<button appButton variant="...">`.
2. Replace `form-input` or ad-hoc input styling with `class="form-control"` plus existing aria attributes.
3. Remove local SCSS that duplicates variant/background/padding once migrated.
4. For dynamic variant changes, bind `[variant]="expr"` (directive effect handles class swap).

## Testing & Verification
- Added directive unit test ensuring variant & size classes apply.
- Updated existing form/button tests to reference new class patterns.
- Focus/disabled visual checks performed manually in both light & dark themes.

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Partial adoption leaves legacy classes | Track via grep `btn-primary` in CI (future lint rule). |
| Variant expansion becomes ad-hoc | Extend directive union types & document in this ADR. |
| High contrast not sufficiently distinct | Future iteration: introduce alternate tokens (e.g. `--btn-focus-ring` override). |

## Future Enhancements
- Add `FormControlStateDirective` to auto-manage `aria-invalid` & described-by wiring.
- Introduce loading state (`[loading]`) & optional icon slot directive.
- Add Vitest a11y (vitest-axe) smoke tests for button & form scenarios (implemented; see a11y specs and global matcher setup).
- Themed size scale (compact vs. comfortable) via body class + size tokens.
- Potential dark/high-contrast tune of error highlight using dual outline technique (color + shape).

## Status & Ownership
Owned by UI Architecture & Design System initiative. Changes requiring new variants must update this ADR.

---
