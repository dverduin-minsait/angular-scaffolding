---
name: browser-check
description: "Use after making code changes to verify the result visually in the browser. Triggers: 'check in browser', 'verify visually', 'open browser', 'browser verification', 'checking changes in browser', after any template/SCSS/component change."
argument-hint: "Optional: URL path to check (e.g. /dashboard). Defaults to http://localhost:4200"
---

# Browser Check

Visually verify code changes render correctly. Screenshots + spot-check layout, theme, a11y, routing.

## Checklist

1. Dev server on localhost:4200? (start: `npm run dev:mock`)
2. Open target URL (auth → `/login/register`, dashboard → `/dashboard`, etc.)
3. Screenshot full page
4. Theme check if styles changed (`?theme=dark` or toggle)
5. A11y spot-check (focus visible, accessible labels)
6. Routing check (click affected nav)
7. Report: URL + theme + ✅/❌ + findings + action required
