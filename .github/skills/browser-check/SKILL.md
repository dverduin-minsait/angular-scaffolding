---
name: browser-check
description: "Use after making code changes to verify the result visually in the browser. Triggers: 'check in browser', 'verify visually', 'open browser', 'browser verification', 'checking changes in browser', after any template/SCSS/component change."
argument-hint: "Optional: URL path to check (e.g. /dashboard). Defaults to http://localhost:4200"
---

# Browser Check

Visually verify that code changes render correctly in the running Angular dev server.

## When to Use

- After any change to a component template (`.html`, inline `template:`)
- After any change to styles (`.scss`, CSS custom properties, theme tokens)
- After adding or changing a route
- After fixing a layout or accessibility issue
- Whenever the orchestrator or user asks to "check changes in browser"

## Prerequisite: Dev Server

The Angular dev server must be running on **http://localhost:4200**.  
If it is not running, start it:

```bash
npm run dev:mock
```

This starts both the mock API (port 3000) and the Angular dev server (port 4200).

## Procedure

1. **Start server if needed** — Check whether localhost:4200 is responding. If not, start `npm run dev:mock` in an async terminal before proceeding.

2. **Open page** — Navigate to the relevant URL for the changed feature. Use the full path if known (e.g. `http://localhost:4200/dashboard`). Default to `http://localhost:4200`.

3. **Take screenshot** — Capture the current state of the page.

4. **Verify layout** — Check that:
   - The changed component renders without visible errors
   - Layout and spacing look correct
   - No broken elements (missing images, collapsed containers, overflow)

5. **Theme check (if styles changed)** — If SCSS or theme tokens were modified, also check dark mode by appending `?theme=dark` or using the theme switcher in the UI.

6. **Accessibility spot-check (if markup changed)** — Verify that interactive elements have visible focus indicators and accessible labels visible on the page.

7. **Console errors** — Read the page source for any Angular error indicators (`ng-reflect-*` errors, `ERROR` text, red borders from error boundaries).

8. **Navigate affected routes** — If routing was changed, click through the affected navigation paths to confirm they load correctly.

9. **Report findings** — Summarize:
   - What was checked (URL, component, feature)
   - What looks correct
   - Any visual issues found (with screenshot reference)
   - Recommended follow-up if issues exist

## Check Targets by Change Type

| Changed file type | URL(s) to check |
|---|---|
| `src/app/features/auth/**` | `/login`, `/register` |
| `src/app/features/dashboard/**` | `/dashboard` |
| `src/app/features/clothes/**` | `/clothes` |
| `src/app/shared/components/header/**` | Any page (header is global) |
| `src/styles.scss`, `src/app/themes/**` | Home + one feature page, light & dark |
| `src/app/app.html`, `src/app/app.ts` | `/` (root) |
| Any other feature | The feature's primary route |

## Output Format

```
### Browser Check — [changed component/feature]

**URL checked:** http://localhost:4200/[path]
**Screenshot:** [attached or description]

✅ Renders correctly / ❌ Issue found

**Findings:**
- [observation 1]
- [observation 2]

**Action required:** [none | description of fix needed]
```
