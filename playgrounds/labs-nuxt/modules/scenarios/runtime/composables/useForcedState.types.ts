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

import type { ForceRecipeId, ForcedState } from "../force/states.types";
import type { ComputedRef, Ref } from "vue";

// -----------------------------------------------------------------------------

/**
 * Every answer the worker can be armed with — one module's RECIPES, plus
 * replay.
 *
 * RETIRED here (operator ruling, 2026-09-12): `FORCE_URL_PRESETS`, the fixed
 * four a url used to carry. It was three things at once — the url's vocabulary,
 * the picker's labels, and the offer itself — so every page was offered the
 * same four states whatever its feature said, and a single-record FORM was
 * offered a collection's failure because its recordings held one. What a page
 * offers is now its own feature's (`force/states.ts`), what a url carries is
 * that state's SLUG, and what is left here is the recipe a fake network
 * performs: `force/states.types.ts`'s own vocabulary, consumed rather than
 * re-spelt (that file carries the `graphify-out/graph.json` citation for it).
 */
export type ForcePreset = ForceRecipeId | "replay";

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
  /**
   * The states that module's own FEATURE declares and its recordings can
   * answer, filled in by the page once its corpus lands (`force/offer.ts`).
   * A url carries a state's SLUG, so this is what one is resolved against: a
   * slug no offered state answers to arms nothing, which is the only honest
   * reading of a link naming a state this page does not have. Mints nothing —
   * `ForcedState` is `force/states.types.ts`'s own (see its
   * `graphify-out/graph.json` citation).
   */
  states?: Ref<readonly ForcedState[]>;
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
   * The feature STATE actually armed — the scenario the page is being held in,
   * carrying its own title for whatever names it on screen. Absent on Live,
   * and absent under `replay`: the player arms that one and no scenario of the
   * module's feature declares it (`graphify-out/graph.json` — `ForcedState` is
   * `force/states.types.ts`'s, consumed here).
   */
  state: ComputedRef<ForcedState | undefined>;
  /**
   * The slug the url is CARRYING, armed or not. A page measures its own offer
   * asynchronously, so a pasted link naming a state this page does not offer
   * can only be told from one that has not been measured yet by asking both:
   * this, and whether {@link UseForcedState.state} resolved.
   */
  requested: ComputedRef<string | undefined>;
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
   * Arms a forced STATE — writing its slug to the url — or `replay`, the one
   * the url cannot carry. Always from the RECORDING, so re-arming a state
   * already armed returns the corpus to it rather than continuing on the
   * collection the last pass moved. (`ForcedState` is consumed from
   * `force/states.types.ts`; see `graphify-out/GRAPH_REPORT.md`.)
   */
  arm: (next: ForcedState | "replay") => Promise<void>;
  /** Returns to Live: the worker is stopped AND its registration unregistered. */
  disarm: () => Promise<void>;
  /** Resolves once the worker matches the url, including an arm still queued. */
  whenReady: () => Promise<void>;
};
