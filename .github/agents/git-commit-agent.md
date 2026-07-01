---
description: "Use when: writing a commit message, creating a git commit, summarizing changes for a commit, 'what should I commit?', 'generate commit message', 'commit these changes'. Inspects unstaged and staged changes and produces a Conventional Commits message with a bullet-point body."
tools: [execute, read, search]
user-invocable: true
argument-hint: "Optional: scope or area of changes (e.g. 'dashboard', 'auth')"
---

# Git Commit

Inspect diffs → choose type/scope → write Conventional Commits message (imperative, lowercase, max 72 char subject, bullet-point body).

**Don't edit files. Don't stage or commit. Only read git output and produce message.**

## Commit Types

`feat` (new feature/component) | `fix` (bug fix) | `refactor` (no behavior change) | `style` (SCSS/CSS only) | `test` (tests only) | `docs` (documentation/ADR) | `chore` (config/tooling/i18n) | `a11y` (accessibility) | `perf` (performance)

## Procedure

1. `git diff --stat HEAD` + `git status --short` → see all changes
2. `git diff HEAD -- <file>` → read meaningful diffs (focus: new/modified behavior)
3. Choose type (most significant), scope (feature/domain), subject (imperative, <72 chars)
4. Write 2-5 bullets (what + why), group related file changes
5. Output only the commit message, ready to paste

## Format

```
<type>(<scope>): <subject>

- <change 1>: <why>
- <change 2>: <why>
```
