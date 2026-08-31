/**
 * Shared vitest worker ceilings — the ONE place the numbers live.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Vitest defaults `maxWorkers` to `availableParallelism() - 1`. On this
 * machine (12 cores / 24 GiB) that is ELEVEN workers per run. Eight of the
 * nine vitest configs in this repo had no ceiling at all, so any one of them
 * could claim eleven heavy jsdom/Nuxt/Chromium workers, and the root
 * `pnpm -r test` fan-out could start four such runs at once. That is the
 * documented machine-crash path (receipt 2026-08-24).
 *
 * Nine hand-copied literals would drift. Every config imports from here.
 *
 * It lives at the repo root, not under `tests/`, so that every config —
 * including the two under `tests/` — can reach it by a short relative path
 * without any config depending on another package being installed.
 *
 * WHERE THE CAP MUST GO (proven from the installed vitest sources)
 * ---------------------------------------------------------------
 * vitest 3.2.4, `coverage.DL5VHqXY.js:3410-3419` — `createPool()` buckets the
 * specs of EVERY project by POOL TYPE, not by project, and memoises ONE pool
 * instance per type. `:2610-2613` then sizes that pool from the ROOT context:
 *
 *     const maxThreads = poolOptions.maxForks
 *                     ?? vitest.config.maxWorkers      // <- ROOT config
 *                     ?? threadsCount;                 // <- cores-1 = 11
 *
 * So in a multi-project config (headless, labs-nuxt) a `maxWorkers` placed
 * inside `projects[]` is SILENTLY IGNORED. It must sit on the root `test`
 * object. Do not "tidy" it into a shared project base — it will stop working
 * and nothing will fail.
 *
 * vitest 4.1.9 browser mode is the opposite — `cli-api.24X8XwN1.js:2409-2412`
 * keeps one pool PER project and `:2482` honours the per-project value:
 *
 *     if (project.config.maxWorkers) return project.config.maxWorkers;
 *
 * Both majors resolve a `"50%"` string to a number at config-resolution time
 * (v3 `coverage.DL5VHqXY.js:3533`, v4 `coverage.DM_a_rWm.js:152`), so a
 * percentage is legal — but a percentage tracks CORE COUNT and the limit we
 * are defending is MEMORY. These ceilings are therefore absolute integers.
 * (This is why `packages/headless`'s old `maxWorkers: "50%"` was not safe:
 * 50% of 12 cores is 6 workers, ~3.2 GB, well over the budget below.)
 *
 * THE BUDGET (measured, not guessed)
 * ----------------------------------
 * Per-worker resident memory, sampled with `ps` during real runs:
 *
 *   fork worker, node env .................  ~200-400 MB
 *   fork worker, jsdom / happy-dom / Nuxt ..  ~250-830 MB  (peak single 832 MB)
 *   browser worker + its Chromium ..........  ~765 MB      (6.12 GB / 8 workers)
 *   main process ...........................  ~600-830 MB
 *
 * Target: ONE run stays at or under ~2.5 GB resident. That is what the machine
 * actually has spare — measured free+inactive headroom at rest is ~5-6 GB, not
 * 24 GB, because the box idles above 90% swap utilisation.
 *
 *   node    4 x 400 MB + 800 MB main = 2.4 GB
 *   dom     3 x 550 MB + 800 MB main = 2.5 GB
 *   browser 2 x 765 MB + 800 MB main = 2.3 GB
 *
 * CONCURRENCY IS BOUNDED SEPARATELY, BY pnpm — NOT BY A LOCK.
 * The root `package.json` test scripts pass `--workspace-concurrency=1`, so
 * `pnpm -r test` runs one package at a time instead of pnpm's default FOUR.
 * That default was the crash: 4 packages x 11 workers = 44 processes started
 * within ~100ms. `design-system/package.json` already did this; the root did
 * not. The two layers are independent — this file bounds ONE run, the pnpm
 * flag bounds how many runs start at once. Neither alone is sufficient.
 *
 * There is NO cross-process lock. Nothing stops a hand-typed `npx vitest`, or
 * the VS Code vitest extension, running alongside an agent's run.
 *
 * OVERRIDING
 * ----------
 * `UPMIND_TEST_MAX_WORKERS=<int>` raises or lowers every ceiling. An ABSENT
 * variable yields the SAFE local default — never the fast one. A missing env
 * var must never be the dangerous case.
 *
 * NOTE: no CI job sets this today, so CI now runs at these local ceilings and
 * is correspondingly slower. If that matters, set it in the CI env — do not
 * raise the defaults here, which protect the dev machine.
 */

import { availableParallelism } from "node:os";

/**
 * Test lanes, ordered by measured cost per worker.
 *
 * - `node`    — no DOM. The cheapest lane.
 * - `dom`     — jsdom / happy-dom / Nuxt component mounting.
 * - `browser` — vitest browser mode: a REAL Chromium process per worker.
 *               Measured at 6.12 GB for one uncapped storybook run, which on
 *               its own exceeds this machine's spare memory.
 */
export type WorkerProfile = "node" | "dom" | "browser";

/** Measured-safe ceilings for a ~2.5 GB per-run budget. See the header. */
const SAFE_CEILING: Record<WorkerProfile, number> = {
  node: 4,
  dom: 3,
  browser: 2
};

/**
 * The maximum number of vitest workers a run of `profile` may start.
 *
 * Always returns an integer >= 1, clamped to the profile's own ceiling.
 *
 * BOTH majors honour environment overrides, and in v3 they OUTRANK this file:
 * `coverage.DL5VHqXY.js:2612` resolves `poolOptions.maxForks ?? maxWorkers ??
 * cores-1`, and `:3711-3752` fills `poolOptions` from `VITEST_MAX_FORKS` /
 * `VITEST_MIN_FORKS` / `VITEST_MAX_THREADS` / `VITEST_MIN_THREADS`. So a shell
 * exporting `VITEST_MAX_FORKS` silently wins over every value set here. v4
 * instead reads `VITEST_MAX_WORKERS` (`coverage.DM_a_rWm.js:380`).
 *
 * That is why `workerPool()` below sets `poolOptions.forks.maxForks` as well
 * as `maxWorkers` — so the key vitest actually reads is the one this file
 * controls, rather than the one a stale shell export happens to set.
 */
export function maxWorkers(profile: WorkerProfile): number {
  const cores = availableParallelism();
  const override = process.env.UPMIND_TEST_MAX_WORKERS;

  if (override !== undefined && override.trim() !== "") {
    // Digits ONLY. `parseInt` would read "50%" as 50 and "1e9" as 1, so a
    // percentage — the syntax vitest's own flag advertises — would raise the
    // ceiling above vitest's uncapped default instead of lowering it.
    const parsed = /^\d+$/.test(override.trim())
      ? Number.parseInt(override.trim(), 10)
      : Number.NaN;

    if (Number.isFinite(parsed) && parsed >= 1) {
      return Math.min(parsed, cores);
    }
    // A malformed override must not silently disable the ceiling.
    console.warn(
      `[vitest.workers] ignoring malformed UPMIND_TEST_MAX_WORKERS=${JSON.stringify(
        override
      )}; using the safe default for "${profile}"`
    );
  }

  return Math.max(1, Math.min(SAFE_CEILING[profile], cores));
}

/**
 * Spread the whole worker-pool block into a ROOT `test` config:
 *
 *     export default defineConfig({
 *       test: { ...workerPool("dom"), ... }
 *     });
 *
 * `pool: "forks"` is explicit because process isolation is what makes a
 * runaway worker cost one process rather than the whole run, and because a
 * fork's memory is returned to the OS when the worker is recycled.
 *
 * Browser-mode configs must NOT use this helper — they have no fork pool.
 * They take `maxWorkers: maxWorkers("browser")` on its own.
 */
export function workerPool(profile: Exclude<WorkerProfile, "browser">): {
  pool: "forks";
  maxWorkers: number;
  minWorkers: number;
  poolOptions: { forks: { maxForks: number; minForks: number } };
} {
  const ceiling = maxWorkers(profile);

  return {
    pool: "forks",
    maxWorkers: ceiling,
    minWorkers: 1,
    // `maxForks` OUTRANKS `maxWorkers` in vitest 3 (`:2612`), and is what a
    // stray `VITEST_MAX_FORKS` export would otherwise set. Setting both means
    // the winning key is this one, whatever the shell holds.
    poolOptions: { forks: { maxForks: ceiling, minForks: 1 } }
  };
}
