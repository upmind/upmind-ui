# 📊 8. Allure Dashboard

This suite publishes Playwright results to a team-wide Allure dashboard hosted on Google Cloud Storage. Each CI run and each developer's local run appear on a landing page, grouped by branch, so you can see at a glance how tests are doing across the project.

## What you get

- A browsable HTML report for every CI run, kept per-pipeline plus a stable "latest" pointer per branch.
- Optional ad-hoc publishing of local runs for pair-debugging or quick sharing.
- Trend graphs (pass rate, duration, retries) that accumulate across runs on the same branch.
- Every report is tagged with `source` (`ci` or `local`), `branch`, and `commit` in the Environment panel.

---

## One-time setup (per developer)

1. **Install dependencies.** The Allure 3 CLI is a project devDependency, installed automatically by `pnpm install`. To verify:
   ```bash
   pnpm install
   npx allure --version   # should print 3.x
   ```
2. **Install the Google Cloud SDK** — only needed if you want to publish local runs to the shared dashboard.
   ```bash
   brew install --cask google-cloud-sdk
   gcloud --version
   ```
3. **Get the service-account key** for the e2e-allure bucket (from ops / 1Password) and save it at:
   ```
   tests/Playwright/e2e/support/secrets/google.json
   ```
   The `tests/Playwright/e2e/support/secrets/` folder is already gitignored — never commit this file.
4. **Export the env vars** in your shell profile (`~/.zshrc` or `~/.bashrc`):
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="$(git rev-parse --show-toplevel 2>/dev/null)/tests/Playwright/e2e/support/secrets/google.json"
   export ALLURE_GCS_BUCKET=<bucket-name-from-ops>
   ```
   Then `source ~/.zshrc`.

That's it. You can now run, view, and optionally publish reports.

---

## Running tests (no workflow change)

Use the same scripts as before:

```bash
pnpm test:chrome
pnpm test:firefox
pnpm test:safari
pnpm test:all-browsers
```

When the run finishes, the Allure report is **auto-generated** at `tests/Playwright/e2e/reports/allure-report/` via Playwright's global teardown (see [global-teardown.ts](../scripts/global-teardown.ts)). No extra command is needed.

### Skipping auto-generation while iterating

If you're running the same spec repeatedly and don't want the few-second regeneration overhead:

```bash
ALLURE_SKIP_GENERATE=1 pnpm test:chrome
```

The raw `allure-results/` are still written, so you can regenerate any time with `pnpm allure:generate`.

---

## Viewing the local report

```bash
pnpm allure:open        # open the already-generated report
pnpm allure:serve       # regenerate (pulling in history) + open in one step
```

The Overview page's **Environment** panel shows:

- `source: local`
- `branch: <your-current-git-branch>`
- `commit: <sha>`

The header also shows a per-run identifier (`buildName`):
- **Local runs**: `local <ISO-timestamp> (<branch>)`
- **CI runs**: `Pipeline #<iid> (<branch>)` — clickable, links back to the GitLab pipeline.

After a few runs on the same branch, the **Trend** panel will start showing pass/fail/duration over time, with each point labelled by the run identifier so you can tell consecutive runs apart. History is preserved in `tests/Playwright/e2e/reports/.allure-history/history.jsonl` (gitignored) between runs — Allure 3 reads/writes this single JSONL file at the path configured in [allurerc.mjs](../../../allurerc.mjs).

---

## Publishing a local run to the dashboard

```bash
pnpm allure:publish:local
```

This uploads your current local report to a timestamped folder:

```
gs://<bucket>/allure/local/<branch-slug>/<your-username>/<UTC-timestamp>/report/
```

and refreshes the team landing page so the run appears in the "Local runs" section, listed newest-first under your username.

**Ground rules for local publishes:**

- Each publish creates a **new timestamped folder** — previous runs are kept, so you can compare run-to-run.
- Local uploads auto-expire after 7 days via a GCS lifecycle rule. Treat them as ephemeral; if you need a long-term record use a CI run.
- Branch name is read from git, so the dashboard shows exactly where you were.

**Use this when:**

- Pair-debugging a flaky test and a teammate needs to see the trace.
- Sharing results from an experimental branch before opening an MR.
- Sanity-check before asking for review.

**Don't use this** as a substitute for CI. CI runs are the source of truth; local publishes are for ad-hoc sharing.

---

## Viewing CI runs

Every MR pipeline and every commit to `develop` runs the e2e job defined in [.gitlab-ci/e2e-allure.yml](../../../.gitlab-ci/e2e-allure.yml). That job publishes to:

```
gs://<bucket>/allure/ci/<branch-slug>/<pipeline-id>/report/   ← the specific run
gs://<bucket>/allure/ci/<branch-slug>/latest/report/          ← most recent for this branch
```

Two ways to reach them:

1. **Landing page** — `https://storage.googleapis.com/<bucket>/index.html` lists every branch's latest CI run and every active local run. Quickest entry point.
2. **From the pipeline** — the GitLab job page has the report as a build artifact (click "Browse"). Artifacts expire after 30 days.

## Comparing branches side-by-side

Open two tabs:

- Tab 1: `.../allure/ci/develop/latest/report/`
- Tab 2: `.../allure/ci/<your-branch>/latest/report/`

Compare pass rates on the Overview pages. Drill into Suites/Tests to see which specific tests differ. The Environment panel confirms which branch + commit each tab represents.

> The OSS Allure Report is single-run by design — there is no built-in cross-branch matrix view. The two-tab workflow is the pragmatic answer. See the note on future options at the end of this doc if that becomes a real pain point.

---

## Reading a report

The panels you'll use most:

| Panel | What it's for |
| --- | --- |
| **Overview** | Top-line pass/fail count + the Environment block (source/branch/commit). |
| **Trend** | Pass rate, duration, retries across recent runs on this branch. |
| **Suites** | The Playwright `describe` hierarchy — best for finding a specific test. |
| **Categories** | Failures grouped by type (e.g. broken vs product defect). Configure via `categories` in [allurerc.mjs](../../../allurerc.mjs). |
| **Behaviors** | Epics/features/stories. Populated when tests are tagged with `allure.epic()` / `allure.feature()` / `allure.story()`. |
| **Packages** | Mirror of the spec file tree. |
| **Timeline** | Per-worker test execution timeline. |
| **Charts** | Status, severity, and duration breakdowns (accessed via the **Report** button, top-left, in the Allure 3 UI). |

Allure 3 also exposes three features we're not using yet but can opt into via [allurerc.mjs](../../../allurerc.mjs):
- **Environments** — multi-environment grouping (e.g. staging vs prod) within a single report.
- **Known Issues** — flag tests as known failures so trends stop counting them as regressions.
- **Quality Gate** — fail the CI pipeline if pass rate or other metrics drop below a threshold.

---

## Troubleshooting

**"No report found at tests/Playwright/e2e/reports/allure-report"**
No tests have been run in this workspace yet, or the teardown failed silently. Run `pnpm test:chrome` then `pnpm allure:generate`.

**`allure: command not found`**
Run `pnpm install` to install the project dev dependencies. Verify with `npx allure --version`.

**`gcloud: command not found`**
Install with `brew install --cask google-cloud-sdk`. Verify with `gcloud --version`.

**`ALLURE_GCS_BUCKET is not set`**
You skipped the one-time setup. Export the var in `~/.zshrc` and reload your shell.

**`Service-account key file not found`**
You're missing `tests/Playwright/e2e/support/secrets/google.json`. Ask ops for the key and place it there. Make sure `GOOGLE_APPLICATION_CREDENTIALS` points at the absolute path.

**`gcloud storage` returns "AccessDeniedException"**
The service account doesn't have permission on the bucket. It needs at minimum `roles/storage.objectAdmin` on the target bucket (or `objectCreator` + `objectViewer`).

**Trend panel is empty after several runs**
The `.allure-history/history.jsonl` file was wiped (e.g. you cleared the `reports/` folder). Trends rebuild from the next run forward — not a bug, just a reset.

**My local run isn't on the dashboard**
The auto-generated report lives on your machine until you explicitly run `pnpm allure:publish:local`. Auto-publish from local is not enabled by design.

**`pnpm test:ui` doesn't generate a report**
It does — but not until you close the Playwright UI window. Global teardown only fires when the test session fully ends.

**CI job failed but I still want to see the report**
The publish job is configured with `when: always`, so it runs even when tests fail. Check `gs://<bucket>/allure/ci/<branch>/<pipeline-id>/report/` or click the failed branch on the landing page.

---

## Command reference

| Command | What it does |
| --- | --- |
| `pnpm test:chrome` (etc.) | Run e2e tests; auto-generates report |
| `ALLURE_SKIP_GENERATE=1 pnpm test:chrome` | Run tests without regenerating the report |
| `pnpm allure:generate` | Regenerate report from existing results (carries history) |
| `pnpm allure:open` | Open the local report |
| `pnpm allure:serve` | Regenerate + open in one step |
| `pnpm allure:publish:local` | Upload local report to the shared dashboard |
| `pnpm allure:index` | Rebuild the landing page (called automatically after publish) |

---

## Implementation pointers

If you need to understand or modify how this works:

- [playwright.config.ts](../../../playwright.config.ts) — Allure reporter, `environmentInfo`, `globalTeardown` wiring.
- [allurerc.mjs](../../../allurerc.mjs) — Allure 3 config: report name, output path, history JSONL path.
- [allure-generate.sh](../scripts/allure-generate.sh) — thin wrapper around `npx allure generate` that picks up `allurerc.mjs`.
- [global-teardown.ts](../scripts/global-teardown.ts) — calls the generate script after every test run.
- [allure-publish-local.sh](../scripts/allure-publish-local.sh) — packages + uploads local report to GCS.
- [allure-index.mjs](../scripts/allure-index.mjs) — generates the landing `index.html` from the GCS listing.
- [.gitlab-ci/e2e-allure.yml](../../../.gitlab-ci/e2e-allure.yml) — CI jobs: test (Playwright image) + publish (`google/cloud-sdk:alpine`).

## Future options

Allure Report (the OSS tool we use) is per-run by design. If cross-branch / per-release analytics become a recurring need:

- **ReportPortal** (free, self-hosted) — ingests the raw `allure-results/` archives we already publish. Migration path exists.
- **Allure TestOps** (paid) — same capability, vendor-managed.

Raw `allure-results/` are archived as `results.tar.gz` alongside every CI and local publish, so switching tools later doesn't lose historical data.
