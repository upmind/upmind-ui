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

/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-28, re-queried for
 * FE-3113 K1) — no cache-drop callback contract exists in the tree to consume.
 * The only cache nodes are `invalidateQueryByKey()` and its new sibling
 * `resetQueryByKey()` (`packages/headless/src/modules/query/query.utils.ts`),
 * CURRIED factories whose APPLIED result is what a module publishes as its
 * `invalidate` / `reset` action; that applied shape carries no exported name,
 * and `query.utils.ts` is a headless internal app runtime may not reach. The
 * nearest neighbour, `CookieChangeCallback` (`utils/useCookies.ts` L11), is an
 * unrelated cookie subscriber. So this NAMES the applied result rather than
 * minting a rival mechanism. See `graphify-out/GRAPH_REPORT.md`.
 */
/**
 * The booted module's OWN cache CLEAR, handed IN (FE-3113). A module keys its
 * queries by DOMAIN — `client-email-history` reads `/api/self/email_history`
 * but caches under `["client","emailHistory"]` — so the key spells neither the
 * url nor a recorded path, and `queryKey` is not barrel-exported. The module's
 * published `reset` action already IS that key, bound.
 *
 * `reset`, never `invalidate`: invalidating marks the entry stale and refetches
 * while KEEPING the rows, so the surface redraws the same data it already had
 * and a forced `loading` never renders. Only removing the entry returns the
 * surface to the pending state the preset is named for, and only removing it
 * stops a failed read from being drawn beside the rows it did not return.
 *
 * Handed in rather than reached because the handle is a detached singleton —
 * one worker per tab, outliving whichever component armed first. Absent, an arm
 * still swaps the transport; the page simply keeps the answers it already
 * holds.
 */
export type ForceReset = () => unknown;

/**
 * @graphify-citation `graphify query "existing contract for registering a booted
 * module with a detached singleton composable"` (2026-08-29, FE-3113 R) — the
 * only neighbours are the labs test lane's own `pageRegistering()` harness
 * (`app/components/scope/__tests__/harness.ts` L347) and unrelated import nodes;
 * no registration contract exists to consume. This GROUPS the two arguments the
 * handle already took, plus the module they are both a fact about, rather than
 * minting a rival mechanism. See `graphify-out/GRAPH_REPORT.md`.
 */
/**
 * What the PAGE registers about the module it has just booted — the facts
 * forcing needs and cannot reach for itself, handed over together because they
 * are one module's: the arm loads that module's recordings, the reset clears
 * that module's cache, and a preset is a fact about that module's corpus alone.
 *
 * The module's NAME is what makes leaving one disarm (FE-3113 R): a preset
 * cannot mean anything on a different corpus, and on one that never offered it
 * there is nothing that can honestly answer it. A page registering a module the
 * handle was not already serving returns the tab to Live before it arms
 * anything of its own.
 */
export type ForcedStateSource = {
  /** The module whose recordings the page's presets are measured off. */
  module?: string;
  /** That module's own published cache clear. */
  reset?: ForceReset;
  /**
   * That module's corpus arm. Arming may not report success before its handlers
   * are installed, and there are none to install until this resolves.
   */
  whenArmed?: Promise<unknown>;
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
   * @graphify-citation `graphify query "is there an existing in-flight or
   * settling or pending boolean flag on a composable state contract"`
   * (2026-08-28, `graphify-out/graph.json`) — the only neighbour is
   * `inFlight` (`packages/headless/src/utils/useCalculate.ts` L71), a local
   * `let` inside one debounced calculator with no exported contract, and
   * `PENDING` (`force/presets.ts` L56) is a served ANSWER rather than a
   * transport state. Nothing to consume, so this member is minted on the
   * existing handle rather than as a rival type. See
   * `graphify-out/GRAPH_REPORT.md`.
   *
   * Whether the tab's transport is mid-change — a preset armed, re-armed or
   * disarmed, up to and including the cache clear that swap ends on. The page
   * holds its own controls behind it: an arm is not instant, and an action
   * fired before one settles draws a refusal the clear then wipes (FE-3113 M).
   */
  isSettling: ComputedRef<boolean>;
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
