# ADR-008: Adopt Vitest for Angular Testing
Status: Accepted  
Date: 2026-01-29  
Supersedes: (if any)  
Superseded by: (if any)

## Context
The project targets a modern Angular stack (standalone components, signals, zoneless change detection, SSR) and needs a fast, reliable test runner that:
- Works well with the Angular 21 toolchain and the modern `@angular/build` ecosystem.
- Provides a good developer experience (watch mode speed, clear failure output, good IDE integration).
- Supports `jsdom` for component/unit tests.
- Produces coverage reports suitable for CI (HTML + lcov) with predictable thresholds.
- Avoids legacy Karma/Jasmine patterns and reduces maintenance burden.

Historically, the project used Jest (and `jest-axe` for accessibility assertions). We migrated away from Jest to align with the current testing approach used across the repo.

## Decision
Adopt Vitest as the primary test runner for unit/integration tests.

Implementation notes:
- Vitest runs with `environment: 'jsdom'`.
- Angular TestBed is initialized via `@analogjs/vitest-angular/setup-testbed` (zoneless enabled).
- Accessibility assertions use `vitest-axe` and a global matcher registration in `src/test-setup.ts`.
- `ng test` is wired to Vitest via the `@analogjs/vitest-angular:test` builder.

## Options Considered
1. Keep Jest
   - Rejected: additional maintenance and duplication with the Angular/Vite-era toolchain.
2. Karma/Jasmine
   - Rejected: legacy ecosystem and patterns; slower feedback loop for this repo’s goals.
3. Vitest
   - Chosen: fast runner, modern ecosystem, good TypeScript support, and integrates cleanly with Vite-era tooling.

## Consequences
### Positive
- Faster local feedback (watch runs, incremental transforms).
- Cleaner alignment with modern Angular tooling and the repo’s zoneless + signals approach.
- Simpler setup: one runner for `npm test` and `ng test`.
- Accessibility testing is supported via `vitest-axe`.

### Negative / Trade-offs
- Some libraries/tools assume Jest matchers/types; these require small shims or updates.
- A few configuration edge-cases exist with Vite dependency scanning; the repo mitigates this in `vitest.config.ts`.

## Security / Privacy Impact
N/A.

## Accessibility Impact
Positive: enables automated a11y checks in unit/integration tests via `vitest-axe`.

## Operational Impact
- CI should run `npm test` (Vitest) for unit/integration coverage.
- Coverage is generated via V8 coverage provider.

## Testing Impact
- New tests should use Vitest APIs (`vi.fn()`, `vi.spyOn()`, Vitest matchers).
- For a11y tests, use `axe()` from `vitest-axe` and `expect(...).toHaveNoViolations()`.
- Avoid Jasmine/Karma-specific patterns.

## Metrics / Validation
- `npm test` passes with stable exit codes.
- Coverage thresholds in `vitest.config.ts` are enforced in CI.
- Developer feedback loop improves (watch mode speed and test runtime).

## References
- `vitest.config.ts`
- `src/test-setup.ts`
- `package.json` scripts (`test`, `test:ng`)
