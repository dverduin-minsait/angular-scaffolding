# ADR-002: Grid Library (AG Grid), BaseApiService Abstraction, and CSS Variable Theming Service
Status: Proposed  
Date: 2025-09-26  
Supersedes: None  
Superseded by: None

## Context
The application requires:
- Consistent, high-performance data grid capabilities (sorting, filtering, virtualization, accessibility)
- A standardized approach to API interaction with loading/error/caching patterns (already partially implemented as `BaseApiService`)
- A scalable, runtime-themable design system (light/dark/brand variants) leveraging SSR-safe, low-cost styling changes

Ad hoc approaches risk:
- Multiple grid libraries or custom table reimplementations increasing bundle size and maintenance cost
- Divergent HTTP access patterns (duplicated error handling/loading logic)
- Hard-to-maintain SCSS overrides without run-time theme switching or design token centralization

## Decision
1. Adopt AG Grid (Community edition) as the canonical grid solution for all complex tabular data scenarios.
2. Mandate `BaseApiService<T>` extension for resource-oriented HTTP services (providing signals for data, loading, error, caching).
3. Introduce a Theme Service that manages design tokens via CSS variables at the `:root` (and optionally `[data-theme]`) level, enabling dynamic theme switching without recompilation.

## Options Considered
### Grid
- Custom Angular component + CDK tables (Rejected: more assembly for common features like virtualization, filtering)
- PrimeNG / Material Table (Rejected: either limited advanced features or heavier bundle integration)
- AG Grid (Chosen: performance, feature depth, accessible patterns, column API flexibility)

### API Layer
- Each feature rolls its own service (Rejected: inconsistent error/loading logic, duplicated state handling)
- Global state manager (NgRx / signals store) first (Rejected for now: premature complexity for simple CRUD)
- Abstract base + signals (Chosen: lean, composable, aligns with signals adoption)

### Theming
- Multiple compiled SCSS themes (Rejected: larger CSS payload, no runtime switching)
- Tailwind or utility-first adoption (Deferred: may add complexity; still can complement variables later)
- CSS variables + Theme Service (Chosen: minimal runtime cost, SSR safe, progressive enhancement)

## Consequences
### Positive
- Unified grid experience and reduced rework
- Faster feature delivery by reusing base HTTP patterns
- Consistent a11y + loading states across API interactions
- Theming can adapt to user/system preferences (prefers-color-scheme) and future per-tenant branding
### Negative / Trade-offs
- AG Grid adds non-trivial bundle footprint (Mitigate: only import modules used; use community edition features judiciously)
- Base abstraction could become rigid if over-engineered (Mitigate: keep extension points simple; revisit if 80%+ customization emerges)
- Theme Service requires discipline to avoid scattering `var(--token)` usage without documentation

## Implementation Sketch
### Grid Usage Pattern
- Create `GridWrapperComponent` in `shared/components/grid` to encapsulate common AG Grid configuration (accessibility defaults, column auto-size behavior, localization hook).
- Encourage column definitions to be declared in feature components for tree-shaking, not centralized static registries.

### BaseApiService Extensions
- New API services: `@Injectable({ providedIn: 'root' }) export class ProductsApiService extends BaseApiService<Product, string> { baseUrl = environment.apiBase; resourceName = 'products'; }`
- Override / extend only when necessary (e.g., specialized endpoints `getFeatured()`).

### Theme Service
Responsibilities:
- Maintain a signal for current theme id (e.g., 'light' | 'dark' | 'high-contrast')
- Apply CSS variable maps to `document.documentElement.style`
- Optional: persist preference in localStorage via existing token
- Provide method: `setTheme(themeId)` and computed signal for `isDark` etc.
- Design tokens: color palette, spacing scale, radius, elevation, typography scale.

## Accessibility Impact
- AG Grid: ensure proper ARIA roles are configured (leverage built-in a11y features; audit key actions are keyboard accessible)
- Theme contrasts validated (AA baseline); high-contrast theme variant considered later

## Testing Impact
- Add unit tests for Theme Service (token application, persistence)
- Add integration tests for a sample grid (column render, sorting event accessible firing)
- BaseApiService already covered generically; ensure extending services are lightweight and rely on base behavior

## Security / Privacy Impact
- No direct change. Ensure no sensitive info stored in theme persistence.

## Metrics / Validation
- Bundle size diff after first grid integration (monitor; if > threshold, prune features or lazy load grid-heavy routes)
- Number of duplicated HTTP patterns should approach zero
- Theming switch latency: near-instant (no flash longer than a frame)

## Bundle Size Analysis (Updated October 2025)
**AG Grid Community Impact:**
- **Bundle Size**: 1102.73kB uncompressed (ag-grid-community v34.2.0)
- **Transfer Size**: 245kB gzipped (77% compression ratio)
- **Loading Strategy**: Lazy-loaded via GridLoaderService (does not impact initial bundle)
- **Trigger**: Only loads when user navigates to grid-enabled features
- **Performance**: Acceptable for enterprise data grid functionality

**Findings:**
- ✅ **Properly lazy-loaded** - zero impact on initial bundle (59kB)
- ✅ **Expected size** - normal for full-featured enterprise grid library
- ✅ **Good compression** - 77% size reduction with gzip
- ✅ **Justified footprint** - provides sorting, filtering, editing, export, themes
- ✅ **Well-architected** - dynamic import pattern working as designed

**Verdict**: Bundle size is acceptable and expected for AG Grid Community. The lazy loading strategy ensures no performance impact on application startup.

## Migration / Rollout
1. Introduce Theme Service scaffolding + tokens file
2. Implement GridWrapper for first feature adopting AG Grid
3. Refactor existing ad hoc API services to extend BaseApiService
4. Document usage in `AI_GUIDELINES.md` (future minor update)

## Future Revisit Triggers
- Grid bundle impact exceeds budget
- Need for offline caching or advanced state mgmt (might introduce global store)
- Theming requires per-component scoping or design token versioning

## References
- AG Grid Community docs
- Existing `BaseApiService` implementation
- `AI_GUIDELINES.md`
