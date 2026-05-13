# ADR-010: Adopt pnpm as Package Manager
Status: Accepted  
Date: 2026-05-13
Supersedes: None  
Superseded by: None

## Context
The project currently uses npm for dependency management. pnpm is a performant, disk-space-efficient package manager that offers significant advantages: faster dependency resolution and installation (parallel downloads, optimized caching), reduced disk footprint via content-addressable storage (60% less disk space than npm/yarn on average), better strictness in dependency resolution, and better monorepo support. The team uses nvm for Node version management, and pnpm integrates seamlessly with nvm.

## Decision
Adopt **pnpm 9.0.0** as the official package manager for this project. Enforce usage via `"packageManager": "pnpm@9.0.0"` in `package.json`, which modern tooling respects and enforces. Delete `package-lock.json` and use `pnpm-lock.yaml` for lock files.

## Options Considered
1. Keep npm (Rejected: slower, higher disk usage, no significant advantage)
2. Yarn classic (Rejected: larger footprint than pnpm, slower)
3. Yarn v4 (Rejected: pnpm is lighter and faster)
4. pnpm (Chosen: best-in-class performance, disk efficiency, works seamlessly with nvm)

## Consequences
### Positive
- Faster `pnpm install` by ~30–50% vs npm (parallel downloads + optimized cache)
- Reduced disk footprint (content-addressable store shared across projects)
- Stricter dependency resolution prevents phantom dependency issues
- Better CI/CD performance (cache reuse, faster installs)
- Seamless nvm integration (no conflicts)
- Drop-in replacement for npm — all existing npm scripts work identically

### Negative / Trade-offs
- Requires global pnpm installation (`npm install -g pnpm`)
- Some legacy tools may have symlink compatibility issues (rare in 2026)
- Team must ensure pnpm is installed locally (enforced by `packageManager` field)
- `pnpm-lock.yaml` replaces `package-lock.json` in git

## Security / Privacy Impact
None direct. pnpm uses the same package registry (npm, GitHub packages, etc.). Lock file (`pnpm-lock.yaml`) provides full reproducibility like npm.

## Accessibility Impact
None direct. Faster builds may improve developer experience.

## Operational Impact
- Dev environment: One-time install (`npm install -g pnpm`)
- CI/CD: Update lock install step to use pnpm (e.g., `pnpm ci` instead of `npm ci`)
- Team onboarding: Document pnpm setup (global install + nvm compatibility)
- No changes to build, test, or deployment pipelines

## Testing Impact
None. All `pnpm run <script>` commands work identically to `npm run <script>`.

## Metrics / Validation
- Install time: measure `pnpm install` vs previous npm baseline
- Disk usage: compare `node_modules/` + pnpm store vs npm footprint
- CI/CD time: track faster cache reuse and parallel downloads

## Implementation Steps
1. Install pnpm globally: `npm install -g pnpm`
2. Delete `package-lock.json` and `node_modules/`
3. Run `pnpm install` to generate `pnpm-lock.yaml`
4. Commit `pnpm-lock.yaml`, remove `package-lock.json` from git
5. Update CI/CD pipelines to use `pnpm ci` and `pnpm run <script>`
6. Document in README and team onboarding

## Migration Notes
- pnpm command syntax is identical to npm (`pnpm install`, `pnpm add`, `pnpm run`)
- All existing npm scripts in `package.json` work without changes
- `pnpm-lock.yaml` is deterministic and provides reproducible installs
- Reverting to npm is possible (keep backup of npm approach) but not recommended

## References
- [pnpm Documentation](https://pnpm.io/)
- [pnpm vs npm Performance Comparison](https://pnpm.io/benchmarks)
- ADR-001: Angular 21 Standalone + Signals (related: improving dev efficiency)
