# ▶️ 3. Running Tests

All commands below are run from the **monorepo root**. The relevant scripts live in the root [package.json](../../package.json).

## The scripts at a glance

| Script | What it does |
| --- | --- |
| `pnpm test:chrome` | Runs every e2e spec under `e2e-tests/` in the `chrome` project. |
| `pnpm test:firefox` | Same, but the `firefox` project. |
| `pnpm test:safari` | Same, but the `safari` project. |
| `pnpm test:all-browsers` | Runs `e2e-tests/` across all three browser projects. |
| `pnpm test:ui` | Opens the Playwright UI runner — best for interactive development. |
| `pnpm visreg:chrome` | Runs only the visual-regression suite in Chromium. |

## Running a subset of tests

The scripts use `pnpm playwright test` under the hood, so any Playwright CLI flag works. A few useful patterns:

### Run one file

```bash
pnpm playwright test tests/Playwright/e2e/e2e-tests/checkout/payment-gateways/stripe-card.spec.ts --project=chrome
```

### Run one describe or one test by name

```bash
pnpm playwright test --project=chrome -g "Declined Cards"
pnpm playwright test --project=chrome -g "Successful Login"
```

`-g` matches against the concatenated `describe > test` title. Use quotes for anything with spaces.

### Run a test by line number

```bash
pnpm playwright test tests/Playwright/e2e/e2e-tests/login-registration/2fa.spec.ts:28 --project=chrome
```

### Exclude a directory

Use `--grep-invert` or narrow the path argument — Playwright expands globs:

```bash
pnpm playwright test "tests/Playwright/e2e/e2e-tests/checkout/**" --project=chrome
```

## Interactive debugging

### UI mode

`pnpm test:ui` opens Playwright's watch-mode UI — probably the single most useful command when writing tests. You get a trace viewer, locator picker, per-step DOM snapshots, and the ability to re-run selected tests without relaunching the browser.

### Headed mode

```bash
pnpm playwright test path/to/test.spec.ts --project=chrome --headed
```

Pops up a visible browser window. Combine with `--debug` to add inspector breakpoints.

### Playwright inspector

```bash
pnpm playwright test path/to/test.spec.ts --project=chrome --debug
```

Pauses on the first line, opens a browser window and the Playwright Inspector. Step through one action at a time, open the locator picker, or resume to end.

## Snapshots

Visual regression tests compare against committed baselines under `tests/Playwright/e2e/snapshots/`. The comparison has a tolerance of 2000 pixel diffs (`expect.toHaveScreenshot.maxDiffPixels: 2000` in the config).

### Updating snapshots

After a legitimate UI change that's expected to produce a new baseline:

```bash
pnpm playwright test tests/Playwright/e2e/visual-regression --project=chrome --update-snapshots
```

Or with a narrower filter:

```bash
pnpm playwright test tests/Playwright/e2e/visual-regression/login.spec.ts --project=chrome -g "French" --update-snapshots
```

Always diff the resulting PNG changes in the MR so the reviewer can see what changed visually.

### Paths

Baselines are templated as:

```
tests/Playwright/e2e/snapshots/{testFilePath}/{projectName}/{arg}.png
```

For example:

```
tests/Playwright/e2e/snapshots/visual-regression/login.spec.ts/chrome/English/login-1.png
```

## Reports & traces

- **HTML report:** opens with `pnpm playwright show-report tests/Playwright/e2e/reports/html` — or just open `index.html` directly.
- **Traces:** configured as `trace: 'on-first-retry'`. Since retries are 0 by default, traces are not collected by default. To force a trace for a single run, pass `--trace=on` or set retires to > 0 in the playwright config file. :

  ```bash
  pnpm playwright test path/to/test.spec.ts --project=chrome --trace=on
  ```

  Trace files land in `tests/Playwright/e2e/test-output/test-results/` and can be opened with `pnpm playwright show-trace path/to/trace.zip`.

- **Videos:** also `on-first-retry` by default. Same override applies (`--video=on`).
- **Screenshots:** captured automatically on failure (`screenshot: 'only-on-failure'`) and embedded in the HTML report.

## CI

The Playwright suite is **not run in GitLab CI**. `.gitlab-ci/cart.yml` handles build/test jobs for the cart app itself but does not spawn Playwright. The suite is currently run locally by QA on demand.

If that changes and you do wire this up to CI in the future, remember:

- `reuseExistingServer: !process.env.CI` means CI will always start a fresh webServer. The current config boots `pnpm start` in `apps/cart` via Vite, which in CI you'll need to pre-build or run differently.
- The suite expects real staging API access — CI runners must be able to reach `api.staging.upmind.io`. If that's undesirable, seeders will need to be set up to seed test data into whatever env the CI runner uses.
- The `qa-automation.local` hosts entry must be added in the job (you can do this in the `before_script`).
- The staging users in [logins.ts](../e2e/support/constants/logins.ts) have hard-coded credentials — these need to exist and be valid on the staging environment.

## Cleanup

Ad-hoc cleanup isn't usually necessary. If things look stale:

```bash
rm -rf tests/Playwright/e2e/reports tests/Playwright/e2e/test-output
```

Neither of those directories is committed.
