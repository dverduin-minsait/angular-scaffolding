# ADR-005: Adopt ngx-translate for Application Internationalization

Date: 2025-10-03
Status: Accepted

## Context
The application requires multi-language support (English, Spanish, Portuguese, Catalan, Galician) with the ability to: 
- Lazy load translations
- Support SSR + hydration
- Provide runtime language switching persisted via localStorage
- Keep bundle size minimal and avoid coupling business logic to framework i18n limitations
- Allow structured namespacing of keys (feature-based) and dynamic key composition (e.g. `app.themes.dark`)

Angular's built-in i18n (compile-time) is optimized for static translation extraction but:
- Requires build per locale (increases CI/CD complexity)
- Does not support runtime language switching without full reload
- Harder to integrate with user-specific persisted preferences
- Limited flexibility for programmatic key composition

`@ngx-translate/core` is a well-known, lightweight (~few kB gzipped) library that: 
- Supports JSON-based external translation files loaded over HTTP
- Enables runtime language switching (used during app initializer with graceful fallback)
- Plays well with SSR when guarded for browser-only APIs (we wrap localStorage + navigator access)
- Provides both pipe (`| translate`) and imperative API (`translate.instant`, `translate.use`)
- Allows hierarchical key organization aligned with our feature-first architecture

## Decision
Adopt `@ngx-translate/core` + `@ngx-translate/http-loader` as the translation layer. 

Key implementation details:
- Added `TranslateModule.forRoot({ fallbackLang: 'en' })` in `app.config.ts`.
- Added blocking `provideAppInitializer` to resolve preferred language before first paint (SSR-safe guards around `navigator` & `localStorage`).
- Translation assets stored in `public/i18n/<lang>.json` with top-level `app` namespace; feature-specific keys grouped (e.g. `app.auth.register.*`).
- UI templates updated to replace hard-coded literals with translation keys (breadcrumb, header, auth register form, theme labels, etc.).
- Added parity keys across all supported locales—missing strings are translated or seeded for translators.
- Dynamic state-driven keys (theme toggler) use string concatenation with the translate pipe.

## Alternatives Considered
1. Angular built-in i18n
   - Pros: Integrated, extraction tooling.
   - Cons: Build-per-locale, no live switching, harder dynamic composition.
2. Custom lightweight translation service
   - Pros: Total control.
   - Cons: Reinventing core i18n concerns; less mature than ngx-translate.
3. Other libraries (e.g., transloco)
   - Pros: Modern API, scoped loaders.
   - Cons: Extra abstraction not currently needed; team familiarity lower.

## Consequences
Positive:
- Fast iteration for adding new locales or keys without rebuild.
- Straightforward runtime switching respecting user preference.
- Minimal disruption to SSR (guards applied for browser-only APIs).
- Clear, hierarchical key strategy reduces naming collisions.

Negative / Mitigations:
- Pipe usage introduces runtime lookup cost (negligible; can memoize hot paths with `translate.instant` in TS if needed).
- Need discipline to maintain key parity across locales (add lint/check later).

## Follow Ups
- Add automated test ensuring all languages share same key set (diff detector).
- Consider integrating ICU pluralization where needed (ngx-translate supports messageformat plugin if required).
- Potential integration of `vitest-axe` for a11y + language attribute checks (implemented via Vitest + vitest-axe matcher setup).
- Add script to validate missing translations during CI.

---
This decision can be revisited if Angular's runtime i18n evolves or performance profiling indicates translation lookup hotspots.
