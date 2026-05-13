# ADR-009: Responsive Dashboard Grid with Container-Width Breakpoints
Status: Accepted  
Date: 2026-01-30  
Supersedes: (none)  
Superseded by: (none)

## Context
The application needs a dashboard feature that adapts to various screen sizes — from mobile devices to ultra-wide "control center" displays. Key requirements:
- Drag-and-drop widget placement on a CSS Grid.
- Responsive layout that adapts grid dimensions (columns/rows) per breakpoint tier.
- Keyboard accessibility for widget move and resize.
- Per-tier widget snapshots so each breakpoint preserves its own arrangement.
- Persistence of the full dashboard state (active layout + all tier snapshots).
- SSR compatibility: no direct `window`/`document` access.

The dashboard is a feature module under `src/app/features/dashboard/`.

## Decision
Implement a responsive dashboard grid using **container-width breakpoints** via `ResizeObserver`, with four tiers, route-scoped services, per-tier widget snapshots, and keyboard accessibility.

### Architecture

**Breakpoint Tiers:**

| Tier            | Min Width | Columns | Rows | Fallback Cell Size |
|-----------------|-----------|---------|------|--------------------|
| mobile          | 0         | 4       | 6    | 70px               |
| tablet          | 600px     | 8       | 8    | 80px               |
| desktop         | 1024px    | 12      | 8    | 92px               |
| controlCenter   | 1920px    | 20      | 10   | 80px               |

**Dynamic Cell Sizing:**
Cell size is computed as `Math.max(40, Math.floor(containerWidth / columns))`, falling back to `fallbackCellSize` when container width is 0 (e.g., during SSR).

**Services (route-scoped via component `providers`):**
- `DashboardBreakpointService` — Manages container width, resolves active tier, computes cell size.
- `DashboardLayoutService` — Manages grid layout, widgets, drag state, per-tier snapshots, collision detection.
- `DashboardPersistenceService` — Saves/loads `PersistedDashboardState` (layout + responsive snapshots) to localStorage or API.

**Key Patterns:**
- `ResizeObserver` with 150ms debounce on tier-change reactions.
- `afterNextRender()` for SSR-safe observer setup.
- Per-tier widget snapshots: switching tiers saves the current arrangement and restores the saved one for the new tier.
- Collision-aware `clampWidgetsToGrid()` shifts widgets down to avoid stacking when adapting to a smaller grid.
- No auto-save on initial load — only after user interaction.

## Options Considered
1. **Viewport media queries (`@media`)**
   - Rejected: Viewport width doesn't reflect the actual dashboard container size (sidebars, panels reduce available space). Container queries are the right abstraction.
2. **CSS Container Queries (`@container`)**
   - Rejected: Cannot drive JS-side grid dimension changes (columns/rows) from CSS alone. The grid structure must change programmatically.
3. **ResizeObserver with container-width breakpoints** (chosen)
   - JS-driven, allows full control over grid dimensions, cell sizing, and widget snapshotting per tier.

## Consequences
### Positive
- True container-responsive behavior regardless of viewport layout.
- Each breakpoint tier preserves its own widget arrangement — no destructive re-layout.
- Dynamic cell sizing fills available space without fixed pixel assumptions.
- Keyboard drag/resize meets WCAG AA requirements.
- Route-scoped services avoid stale singleton state across navigation.

### Negative / Trade-offs
- `ResizeObserver` requires SSR guard (`afterNextRender` + `isPlatformBrowser`).
- Per-tier snapshots increase persistence payload size.
- 150ms debounce adds slight latency during rapid resize.

## Security / Privacy Impact
N/A. Dashboard state is stored in localStorage (no sensitive data).

## Accessibility Impact
- Grid region has `role="region"` with translated `aria-label`.
- Widget headers are focusable (`tabindex="0"`) with keyboard handlers.
- Arrow keys move/resize widgets via `keyboardMove`/`keyboardResize` outputs.
- Resize handles have `aria-label` for screen readers.
- Breakpoint badge uses `aria-live="polite"` for tier change announcements.
- Deprecated `aria-grabbed` replaced with `aria-roledescription="draggable widget"`.

## Operational Impact
- No additional deployment requirements.
- Dashboard state persists in browser localStorage by default; API persistence available via `DASHBOARD_PERSISTENCE_STRATEGY` injection token.

## Testing Impact
- Component spec uses `.overrideComponent(DashboardComponent, { set: { providers: [] } })` to share TestBed-level service instances (since services are component-scoped).
- ngx-translate pipe configured via `TranslateService.setTranslation()` + `use()` in tests.
- `ResizeObserver` polyfilled in jsdom test environment.
- 88 tests across 5 spec files covering: breakpoint resolution, layout management, persistence, widget interactions, keyboard a11y, pointer drag/resize.

## Metrics / Validation
- All 4 tiers tested with explicit width values.
- Keyboard move/resize validated with collision-aware placement.
- Bundle impact: minimal (no new dependencies).

## References
- [ResizeObserver API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
- [WCAG 2.1 Keyboard Accessible](https://www.w3.org/WAI/WCAG21/Understanding/keyboard)
- ADR-001: Angular 21 Standalone + Zoneless + Signals
