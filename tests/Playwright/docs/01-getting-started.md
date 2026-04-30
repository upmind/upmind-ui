# 🚀 1. Getting Started

Everything you need to do once, before you can run the Playwright suite on a new machine.

## Prerequisites

### Node & package manager

- **Node.js** `^20.19.0` or `>=22.12.0` (declared in the root [package.json](../../package.json)).
- **pnpm** — the monorepo pins `pnpm@10.33.0` via the `packageManager` field. Use Corepack so you always get the right version:

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
```

### The testing env hosts entry

The test suite currently talks to `http://qa-automation.local:5173/` instead of `localhost`. This is deliberate — the app sets session cookies scoped to the `qa-automation.local` domain and several test helpers read those cookies directly (e.g. [auth-context.ts:39-51](../e2e/support/fixtures/auth-context.ts#L39-L51)).

Verify these lines exist in `/etc/hosts`:

```
127.0.0.1 qa-automation.local
::1 qa-automation.local
```

If they're missing, add them (you'll need `sudo` to edit `/etc/hosts`), or add your own test env details. Without this entry the dev server will start, but session cookies won't be written and almost every test will fail when polling for `upm_guest_session`.

### Install dependencies & browsers

From the monorepo root:

```bash
pnpm install
pnpm exec playwright install
```

The `playwright install` command downloads the Chromium binary Playwright needs. It only needs to be run the first time, or again after the `@playwright/test` version bumps.

## First run

1. Make sure nothing else is already serving port `5173`. The Playwright config has `reuseExistingServer: !process.env.CI`, so locally it will reuse whatever is on 5173 — which can be confusing if that server isn't the cart app.
2. From the monorepo root, run: `pnpm test:chrome`
3. Playwright will:
   - Start the cart Vite dev server via `pnpm start` inside `apps/cart`.
   - Wait for the base URL to respond.
   - Run every `*.spec.ts` file under `tests/Playwright/e2e/e2e-tests/`.
4. Once the run finishes, the HTML report lives at `tests/Playwright/e2e/reports/html/index.html`. Open it for screenshots, traces and failure details.

## What a green run should look like

Expect roughly 200+ e2e tests to run. Typical runtime is several minutes because most tests drive the real staging API — the network round-trips dominate rather than browser rendering.

## Common first-run problems

> ⚠️ **Tests hang on login or registration** — usually means the hosts file mapping is missing, or the dev server is not running. Confirm `http://qa-automation.local:5173/` loads in your browser before re-running.

> ⚠️ **Cookie-related failures** — the suite polls for either `upm_guest_session` or `upm_client_session` cookies after navigation. If you changed domains or are behind a cookie-stripping proxy, these polls time out after 30s.

> ⚠️ **Visual regression diff failures on fresh clone** — snapshots live in `tests/Playwright/e2e/snapshots/` and are git-ignored. If they're missing for your project (e.g. `chrome`), Playwright creates them on first run and "fails" the test. Re-run and they should pass. See section 6 for more detail.

> ⚠️ **Port 5173 already in use** — `lsof -i :5173` to find the process, kill it, then re-run. You might also hit this if you previously quit Playwright with a real Ctrl-C rather than letting it clean up.

## Where to go next

- If you want to understand the shape of the codebase before running anything, go to [Project Structure & Conventions](02-project-structure.md).
- If you just want to run tests now, skip to [Running Tests](03-running-tests.md).
