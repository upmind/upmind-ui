> Companion to the upmind-agent skill /test-run-suite — Upmind-monorepo-specific bindings/overrides.

Suite lives at `tests/Playwright/e2e/`. All commands run from the monorepo root.

## Pre-flight bindings

- **Host mapping (pre-flight #3)** — `qa-automation.local` must resolve to localhost. Check: `getent hosts qa-automation.local 2>/dev/null || grep qa-automation /etc/hosts`. If missing, instruct the user to add `127.0.0.1 qa-automation.local` to `/etc/hosts` — do NOT edit it yourself.
- **Dev-server port (pre-flight #4)** — the `apps/cart` dev server auto-starts on port `5173`. If already bound, the Playwright config reuses it (outside CI). Warn if a non-cart process holds it.

## Run commands (scope → command)

| scope | command |
| --- | --- |
| `chrome` (default) | `pnpm test:chrome` |
| `firefox` | `pnpm test:firefox` |
| `safari` | `pnpm test:safari` |
| `all-browsers` | `pnpm test:all-browsers` |

These wrap `tests/Playwright/scripts/run-e2e.sh <browser>` per the root `package.json`.

## Report commands (post-run)

- Generate: `pnpm allure:generate`
- Open dashboard: `pnpm allure:open` (serves `tests/Playwright/e2e/reports/allure-report`)
- Combine both: `pnpm allure:serve`

## Artifact hygiene (pre-flight #5)

Delete before each run (regenerable, exactly these three):

- `tests/Playwright/e2e/reports/allure-results`
- `tests/Playwright/e2e/reports/allure-report`
- `tests/Playwright/e2e/reports/html`

Never touch:

- `tests/Playwright/e2e/reports/.allure-history` — Allure's cross-run trend data, not a per-run artifact.
- Loose `*.md` in the `reports/` root (`regression-findings-*.md`, `fix-*.md`, `manual-verification-*.md`, etc.) — hand-written triage history, never regenerated.

Never `rm -rf` `tests/Playwright/e2e/reports/` itself.

## Failure-mode bindings

- **Web server can't start** — check `apps/cart` has dependencies installed; suggest `pnpm install` from root.
- **Stale dist / build artefacts** — `pnpm -r clean && pnpm install`, then retry.
- Backend-API hiccups here are staging-API network errors — re-run before assuming a code regression.

## Related (repo)

- `/test-smoke` — fast happy-path subset only, run on every MR/PR.
- Visual regression (pixel diffs): `pnpm visreg:chrome`, separate suite at `/visual-regression`.
