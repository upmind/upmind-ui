/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-11, 6795 nodes) — no
 * `useForcedState` / `ForcePreset` / `ForceWorker` node exists anywhere in the
 * tree, and the only msw nodes belong to the node-lane recorder
 * (`tests/fixtures/msw-handlers.ts` → `buildHandlers()`), which loads fixtures
 * off disk and cannot run in a browser. Every shape here is minted rather than
 * consumed. See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/useForcedState.types
 * @description What a forced page can be armed with, and the handle the
 * affordance and the scenario player drive it through.
 */

import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------

/**
 * The presets a url carries (design §3.4's whitelist). `replay` is deliberately
 * absent: the player arms it and `track=` is already the link that reproduces
 * it, so a second param would be a second spelling of the same state.
 *
 * The two failures are named apart because they are different states of the
 * surface, and one preset serving both is what made a row's refusal read as the
 * collection vanishing (`R6-19`): `error-action` leaves the list loaded and
 * fails the row's own write, `error-collection` fails the READ so the surface
 * draws its error state with no rows at all.
 */
export const FORCE_URL_PRESETS = [
  "empty",
  "loading",
  "error-action",
  "error-collection"
] as const;

export type ForceUrlPreset = (typeof FORCE_URL_PRESETS)[number];

/** Every answer the worker can be armed with — the three url presets, plus replay. */
export type ForcePreset = ForceUrlPreset | "replay";

export type ForceWorkerStartOptions = {
  /** Whatever the handlers do not name reaches staging untouched (`AC8.3`). */
  onUnhandledRequest: "bypass";
};

/**
 * The slice of msw's browser worker arming uses. Declared here rather than
 * imported so this composable names no `msw` specifier at all: a static import
 * is the very thing `AC8.1` forbids, and even a type-only one would put the
 * word in the import list the no-worker proof reads.
 */
export type ForceWorker = {
  start(
    options: ForceWorkerStartOptions
  ): Promise<ServiceWorkerRegistration | undefined>;
  stop(): void;
  resetHandlers(...handlers: unknown[]): void;
};

export type UseForcedState = {
  /**
   * The preset actually armed — absent on Live, the state the page boots into
   * (`S12`), and absent while the corpus is unreachable (`ESC6`), where a url
   * still carrying `force=` intercepts nothing.
   */
  preset: ComputedRef<ForcePreset | undefined>;
  /**
   * Whether a preset has anything to answer with. False while the recorded
   * corpus cannot reach app runtime (`ESC6`), which leaves the page Live-only.
   */
  isAvailable: boolean;
  /**
   * Arms `preset`, writing it to the url when the url can carry it — always
   * from the RECORDING, so re-arming a preset already armed returns the corpus
   * to it rather than continuing on the collection the last pass moved.
   */
  arm: (preset: ForcePreset) => Promise<void>;
  /** Returns to Live: the worker is stopped AND its registration unregistered. */
  disarm: () => Promise<void>;
  /** Resolves once the worker matches the url, including an arm still queued. */
  whenReady: () => Promise<void>;
};
