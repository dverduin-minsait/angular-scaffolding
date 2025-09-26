# Architecture Decision Records (ADR)

This directory stores Architecture Decision Records: short, immutable documents capturing a single architectural choice and its context.

## Why ADRs?
- Preserve rationale for future maintainers
- Enable lightweight governance
- Avoid repeating past discussions
- Support onboarding and audits

## Conventions
- Filename: `ADR-<NNN>-<kebab-title>.md` (padded number, starting at 001)
- Status lifecycle: `Proposed` -> `Accepted` (or `Rejected / Superseded`)
- Never edit historical context—append a new ADR to supersede
- Keep each ADR under ~300 lines (preferably <150)

## Template
See `ADR-0000-template.md` for the canonical structure.

## Index
(Keep this updated when adding ADRs)  
- 001: Adopt Angular 20 Standalone + Zoneless + Signals (Accepted)
- 002: Grid Library (AG Grid) + BaseApiService Abstraction + CSS Variable Theming (Proposed)

## Authoring Workflow
1. Copy template -> new file with next sequential number
2. Fill sections
3. Open PR referencing the ADR in description
4. Discuss; finalize status (`Accepted` or `Rejected`)
5. If replacing an older ADR, mark the old one `Superseded by ADR-XYZ`

## Quick Guidance
- ADRs are for decisions that are hard to reverse (frameworks, architectural patterns, cross-cutting concerns)
- Minor refactors or naming choices usually don’t need ADRs

