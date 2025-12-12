# ADR-001: Adopt Angular 21 Standalone + Zoneless Change Detection + Signals
Status: Accepted  
Date: 2025-09-26
Supersedes: None  
Superseded by: None

## Context
The project requires: high performance, minimized bundle size, faster mental model, a11y focus, SSR/hydration readiness, and reduced framework boilerplate. Angular 21 provides mature standalone APIs, zoneless change detection via `provideZonelessChangeDetection`, and first-class signals for fine-grained reactivity. Traditional NgModule-based + Zone.js approach adds overhead, implicit change detection costs, and complexity.

## Decision
Use Angular 21 standalone component architecture everywhere for new code; enable zoneless change detection globally; adopt signals + computed values as primary reactive primitives; restrict RxJS usage to external async sources, HTTP interactions, or cross-component streams that require multicasting.

## Options Considered
1. Keep Zone.js + NgModules (Rejected: more boilerplate, less predictable perf)
2. Partial migration (hybrid) (Rejected: cognitive complexity, inconsistent patterns)
3. Full standalone + zoneless + signals (Chosen: aligns with goals, modern Angular direction)

## Consequences
### Positive
- Reduced change detection overhead
- Simpler mental model & testability (no TestBed module assembly for many cases)
- Fine-grained reactivity improves template performance
- Lower bundle size potential by trimming zone-related code
### Negative / Trade-offs
- Some third-party libs may still assume Zone.js (mitigate via polyfills or selective zone shims if ever required)
- Team learning curve on signals & zoneless quirks

## Security / Privacy Impact
None direct. Simpler architecture lowers surface for misconfiguration.

## Accessibility Impact
Improved responsiveness can aid perceived accessibility; no adverse effects.

## Operational Impact
Simplifies SSR since fewer zone timing surprises. Monitoring unaffected.

## Testing Impact
Tests emphasize direct instantiation & signal inspection; fewer asynchronous stability hacks.

## Metrics / Validation
- Bundle size tracked (target: keep initial main bundle lean; add analyzer later)
- Time-to-interaction improvements expected vs zone-based baseline
- Test execution time reduced (anecdotally measure once baseline exists)

## References
- Angular docs on standalone APIs & signals
- Internal `AI_GUIDELINES.md`
