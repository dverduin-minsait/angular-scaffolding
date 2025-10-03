# Angular Architecture Blueprint (Angular 20)

Modern, production-ready Angular 20 reference application: standalone APIs, signals-first reactivity, zoneless change detection, SSR + hydration, accessibility focus, and a disciplined architecture documented through ADRs.

<!-- Badges: replace placeholder links when workflows are added -->
![CI](https://img.shields.io/badge/CI-pending-lightgrey.svg) ![Coverage](https://img.shields.io/badge/coverage-TBD-lightgrey.svg) ![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Why This Project
* Demonstrates a future-facing Angular stack (standalone + signals + zoneless) with pragmatic patterns.
* Serves as a seed / blueprint for real product teams (not a toy demo).
* Emphasizes accessibility (WCAG AA intent) and testability from the start.
* Documents architectural decisions in ADRs for transparency & evolution.

## Tech Stack
* Angular 20 (standalone, no NgModules) + zoneless change detection.
* Signals for UI state (RxJS reserved for external/event/HTTP boundary use).
* SSR + hydration (`server.ts`, platform-server integration).
* Jest + Testing Library + strict TypeScript.
* SCSS design tokens + theme foundations.
* Lightweight i18n strategy with fast translation stubs in unit tests.

## Quick Start
```bash
npm install
npm start              # Dev server: http://localhost:4200
# or include mock/local configs:
npm run start:mock     # Uses mock configuration
npm run start:local    # Local environment configuration
```

### SSR (Server-Side Rendering)
Build + run the generated server bundle (adjust if a custom script is added later):
```bash
npm run build
node dist/angular-architecture/server/server.mjs
```
Then visit http://localhost:4000 (or the configured port) if your server sets one. (Add a dedicated npm script later for ergonomics.)

## Available Scripts
| Script | Purpose |
| ------ | ------- |
| npm start | Standard dev server (HMR) |
| npm run start:mock | Dev server with mock env |
| npm run start:local | Dev server with local env |
| npm run dev | Run JSON mock API + dev server concurrently |
| npm run dev:mock | Mock API + mock env dev server |
| npm run dev:local | Mock API + local env dev server |
| npm test | Run Jest test suite |
| npm run test:watch | Jest in watch mode |
| npm run coverage | Jest with coverage report |
| npm run build | Production build |
| npm run build:prod | Explicit production build (alias) |
| npm run build:mock | Mock configuration build |
| npm run build:local | Local configuration build |
| npm run watch | Rebuild on file changes |
| npm run api | Launch JSON mock API (json-server) |
| npm run check\:i18n | Validate translation key parity across all locale JSON files |

## Architecture Snapshot
* Feature-first organization: `src/app/features/<domain>` (all lazily routed).
* `core/` holds cross-cutting infrastructure (tokens, base API service, etc.).
* `shared/` reserved for purely generic, stateless UI and utilities.
* Signals & computed values drive component view state; minimize manual subscriptions.
* HTTP layer normalizes/serializes data at the boundary (extend the existing Base API service—see codebase).
* Strict separation of business vs presentational concerns.
* ADRs in `docs/adr` record decisions (e.g., zoneless, modal architecture, design system foundations).

## Key Features
| Area | Highlights |
| ---- | ---------- |
| Reactivity | Signals-first; RxJS only at integration boundaries |
| Performance | Zoneless + OnPush semantics via signals & computed pre-derivations |
| SSR | Server build + hydration-ready entry points |
| Accessibility | Semantic elements, accessible names, focus management strategy |
| i18n | JSON translation files + fast testing stubs (no network) |
| Testing | Jest + Testing Library; role/name-first queries |
| Theming | SCSS tokens + theme toggle patterns |
| Architecture | Documented via ADRs & enforced conventions |

## Testing & Quality
* Framework: Jest + @testing-library/angular + jest-dom matchers.
* Each new component/service: happy path + at least one edge case.
* Accessibility smoke assertions (role / name queries) encouraged.
* Coverage command: `npm run coverage` (thresholds configurable in `jest.config.js`).
* i18n unit tests use translation stubs for speed & determinism.

## i18n Example (Unit Test Stub)
```ts
import { provideStubTranslationService, TranslateStubPipe } from 'src/app/testing/i18n-testing';

await TestBed.configureTestingModule({
  imports: [MyComponent, TranslateStubPipe],
  providers: [
    ...provideStubTranslationService({ 'app.title': 'Custom Title' })
  ]
});
```
Use real translations by importing the production translation module instead of stubs in integration tests.

## Accessibility Commitments
* Every interactive control has an accessible name.
* Forms: explicit labels + described-by for hints/errors.
* Decorative images: empty alt or `aria-hidden="true"`.
* Focus management after route transitions (primary landmark/heading).
* Aim for WCAG 2.1 AA contrast ratios.

## Documentation & Decisions
* Architectural Decision Records: `docs/adr`
* AI development & contribution guidelines: `AI_GUIDELINES.md`

## Roadmap
* [ ] Bundle size budgets + analyzer script
* [ ] Playwright E2E tests
* [ ] jest-axe a11y assertions
* [ ] Expanded design system components
* [ ] Logging / observability abstraction

## Contributing
1. Fork & branch using Conventional Commits (e.g., `feat:`, `fix:`).
2. Add/update ADRs if introducing or modifying an architectural decision.
3. Maintain or raise test coverage; include a11y considerations in PR description.
4. Run lint & tests locally before opening PR.
5. Keep changes scoped and documented.

## License
Released under the MIT License. See [`LICENSE`](./LICENSE).

---
If this blueprint helps you, consider opening an ADR or issue to propose improvements. Feedback and contributions welcome!