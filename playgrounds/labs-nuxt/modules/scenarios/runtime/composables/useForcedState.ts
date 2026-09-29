// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/useForcedState
 * @description Arms and disarms the forced page. Live is the default and no
 * worker is registered until something asks for a preset (`S12`/`AC8.1`), so
 * `msw/browser` is reached through a DYNAMIC import on the first arm: a bare
 * load ships none of it and registers nothing.
 *
 * The url is the state (`S11`) — `force=` is this composable's INPUT, not a
 * mirror of it, so a pasted link arms on boot (`AC8.2`) and the back button
 * disarms. `replay` is the one preset the url does not carry: the player arms
 * it and `track=` is what reproduces it (design §3.4).
 *
 * There is one worker per tab, so the handle is a detached singleton — the
 * reconciling watcher and the registration both outlive whichever component
 * asked first.
 *
 * A preset is PAGE-scoped, and only half of that scoping is the url's.
 * `force=` is dropped by the url bag's OWN reconcile, because the page just
 * opened does not spell it. `transient` is the preset the url cannot carry, so
 * that pass has no param to find missing — no url reconcile, however timely,
 * ever clears it. So the handle takes the bag's trick for itself: it remembers
 * the pathname it last answered on, and a consumer calling in on a different
 * one drops the transient preset before it can force a module nobody armed.
 *
 * Page scoping is not enough on its own, because a scope navigation carries the
 * whole query across on purpose (`preserveQuery`) and a preset then rode onto
 * whatever the sidebar opened next — including modules that never offered it. So
 * the deeper scope is the MODULE: {@link ForcedStateHandle.serves} takes the one
 * the page has booted, and a page booting a different one returns the tab to
 * Live first (FE-3113 R). Same module, different scope segments, keeps the
 * preset; a pasted link on a cold load keeps it too.
 *
 * Arming changes what the tab's NEXT request is answered with, which leaves
 * every answer it already holds a lie about a page that now says it is forced.
 * So a reconcile that lands ends by CLEARING the cache: the preset is only
 * visible because the page asks again through it (`AC8.4`, `R6-10`).
 *
 * WHICH cache is the booted module's own answer, never this file's (FE-3113).
 * A module keys its queries by domain and publishes a `reset` action already
 * bound to that key, so the page hands its own in and forcing learns no key at
 * all — the last concrete module reference in `runtime/` goes with the constant
 * it fed.
 *
 * `reset` and not the module's `invalidate`: invalidating refetches while
 * KEEPING the rows, so `loading` never left `isLoading` false and a failed read
 * drew its error above the stale rows it never returned. Only removing the
 * entry puts the surface back in the state the preset names.
 *
 * That swap is not instant, and `isSettling` is the whole window the page holds
 * its own controls behind (FE-3113 M): the corpus load, the worker registration,
 * and the clear that ends it. Until it closes the rows on screen are the
 * transport the arm is replacing, so a row action fired at one is refused
 * against a record the clear is in the middle of taking away.
 */

import { computed, effectScope, nextTick, ref, watch } from "vue";
import { usePlaygroundUrlState } from "../../../../app/composables/usePlaygroundUrlState";
import { availableModules } from "../force/corpus.source";
import { forcedStateAt, forcedStateRecipeId } from "../force/states";
import { isString, noop } from "lodash-es";
import type {
  ForceReset,
  ForcedStateSource,
  ForcePreset,
  ForceWorker,
  UseForcedState
} from "./useForcedState.types";
import type { ForcedState } from "../force/states.types";

// -----------------------------------------------------------------------------

type ForcedStateHandle = {
  state: UseForcedState;
  reset: () => void;
  /** Registers the module a page has just booted, and what forcing needs of it. */
  serves: (source: ForcedStateSource) => void;
};

/** The one armed state no feature declares: the player's, and no url carries it. */
const REPLAY = "replay" as const;

let handle: ForcedStateHandle | undefined;

/** The pathname the handle last answered on — the page `reset` scopes to. */
let page: string | undefined;

function create(): ForcedStateHandle {
  const url = usePlaygroundUrlState();
  if (typeof window !== "undefined") page = window.location.pathname;

  // The preset the url cannot carry, so it cannot be read back off one either.
  const transient = ref<ForcePreset | undefined>();

  // The states the page has OFFERED — what a url slug is resolved against.
  // Empty until the page's corpus lands, so a pasted link arms nothing until
  // the offer it names has been measured (`AC8.2`).
  const offered = ref<readonly ForcedState[]>([]);

  const requested = computed(() =>
    isString(url.force.value) ? url.force.value : undefined
  );

  const state = computed<ForcedState | undefined>(() => {
    // Nothing is armed while the corpus is unreachable (`ESC6`), so nothing may
    // READ as armed either: the page is Live, and a chip over live rows naming
    // a state nobody is serving is the lie `S14` forbids — inventing a body to
    // make it true is the one `S13` does.
    if (availableModules.length === 0) return undefined;

    return forcedStateAt(offered.value, requested.value);
  });

  const preset = computed<ForcePreset | undefined>(() => {
    if (availableModules.length === 0) return undefined;

    // The recipe, never the state: what the worker serves is the one thing a
    // fake network can do, and the sentence naming it is the picker's.
    return (
      transient.value ??
      (state.value ? forcedStateRecipeId(state.value.recipe) : undefined)
    );
  });

  let worker: ForceWorker | undefined;
  let registration: ServiceWorkerRegistration | undefined;
  let pending: Promise<void> = Promise.resolve();

  // A COUNT, not a flag: a preset picked while an earlier arm is still settling
  // queues behind it, and the first of the two to finish must not report the
  // page settled while the second is still swapping its transport.
  const unsettled = ref(0);

  // The booted module's own cache clear. Absent until a page registers one —
  // the bar and the player share this handle but boot no module, so only the
  // playground has one to give.
  let clearCache: ForceReset | undefined;

  // The page's corpus arm, for the same reason and from the same one caller.
  // The seam's loaders are lazy, so until this lands there are no recordings to
  // build handlers from.
  let armed: Promise<unknown> | undefined;

  // The module the handle is currently answering FOR — what a preset is a fact
  // about, and so what it may not outlive.
  let servedModule: string | undefined;

  // What the tab is actually being answered with. The immediate watch below
  // fires with Live, which is what a booting tab already is, so nothing is
  // re-read on load — only a genuine change of transport invalidates.
  let served: ForcePreset | undefined;

  // The scenario a `replay` arm plays (FE-3145) — whose first step's answers
  // the arm installs, and whose steps `replayStep` arms after it.
  let replayed: string | undefined;

  // The capture gaps the armed scenario has hit — requests no step of it
  // recorded. Emptied on every arm.
  const gaps: string[] = [];

  /**
   * Returns the tab to Live. `stop()` alone leaves the service worker
   * registered, so a read-back in the SAME tab would still find one — which is
   * exactly what `AC8.1` reads back.
   */
  async function release(): Promise<void> {
    worker?.stop();
    worker = undefined;

    await registration?.unregister();
    registration = undefined;
  }

  /**
   * The handler list `preset` is armed with. A track replaying a module that
   * records its scenarios one by one (FE-3145) starts on the scenario wall, and
   * each scene then arms its own step (`replayStep`); every other preset is
   * answered from the module's corpus.
   */
  async function handlersFor(preset: ForcePreset): Promise<unknown[]> {
    const { createForceHandlers, createScenarioWall, createStepHandlers } =
      await import("../force/handlers");
    const { runtimeRecordsScenarios, runtimeStepFixtures } =
      await import("../force/corpus");

    if (preset !== REPLAY || !replayed || !runtimeRecordsScenarios())
      return createForceHandlers(preset);

    // The scenario's FIRST step armed with the wall, ahead of it: the clear
    // every arm ends on re-reads the page at once, and that read is the
    // scenario's opening one — answered by the wall alone, it fails.
    return [
      ...createStepHandlers(await runtimeStepFixtures(replayed, 0)),
      ...createScenarioWall(gaps)
    ];
  }

  async function reconcile(next: ForcePreset | undefined): Promise<void> {
    if (typeof window === "undefined" || next === served) return;

    if (!next) await release();
    else {
      // BEFORE the handlers are built, never beside them: a pasted `force=`
      // link arms on boot (`AC8.2`) in the same tick the page starts loading
      // its corpus, and the handler list is read from recordings that are not
      // there yet. Winning that race registers a worker with an EMPTY list —
      // the page then reports armed while every request reaches staging.
      await armed;

      const handlers = await handlersFor(next);

      if (worker) worker.resetHandlers(...handlers);
      else {
        const { setupWorker } = await import("msw/browser");
        const armed: ForceWorker = setupWorker(...handlers);

        // Held before it starts: a `start()` that throws still leaves a worker
        // this tab can stop.
        worker = armed;
        registration = await armed.start({ onUnhandledRequest: "bypass" });
      }
    }

    served = next;

    // LAST, and only once the transport above is in place: a clear that ran
    // first would refetch through the handlers it is racing and refill the
    // cache from the live API, leaving the arm looking right over stale rows.
    clear();
  }

  /**
   * Drops the answers the swap just contradicted, and holds the page unsettled
   * until the re-read that clear starts has landed.
   *
   * Off the `pending` chain deliberately: a queued reconcile waiting on that
   * refetch could never answer the preset picked after it. `unsettled` is not
   * that chain, so the page's own controls wait where the next reconcile must
   * not — the window a row action must not be fired into runs from the arm to
   * the moment the rows on screen are the armed transport's own.
   *
   * Scoped to the booted module by construction: the whole cache is the app
   * chrome's too, and the chrome's singletons boot once and never re-ask.
   */
  function clear(): void {
    if (!clearCache) return;

    unsettled.value += 1;
    void Promise.resolve(clearCache())
      .catch(noop)
      .finally(() => {
        unsettled.value -= 1;
      });
  }

  /**
   * Runs one transport step, and reports the page unsettled for its whole run.
   * @param step The swap to run.
   * @param holds Whether this step changes the transport at all — a reconcile
   * that finds the worker already serving `next` swaps nothing, so a bare Live
   * load must not read as a page mid-arm.
   */
  function queue(step: () => Promise<void>, holds = true): void {
    if (holds) unsettled.value += 1;

    // Chained, never raced: two arms in one tick would each find no worker and
    // register a second, and only one of the two would ever be unregistered. A
    // failed arm is swallowed so it cannot poison the next.
    pending = pending
      .catch(noop)
      .then(step)
      .finally(() => {
        if (holds) unsettled.value -= 1;
      });
  }

  watch(
    preset,
    next => {
      queue(() => reconcile(next), next !== served);
    },
    { immediate: true }
  );

  async function whenReady(): Promise<void> {
    // The tick first: a caller that has just written `force=` waits for the
    // reconcile that write schedules, not for the one before it.
    await nextTick();
    await pending;
  }

  /**
   * A fresh handler list, and with it a fresh corpus session — the preset back
   * to the recording it was armed on. Only a re-arm needs it: a preset the
   * watcher sees CHANGE is reconciled into new handlers anyway.
   */
  async function restart(): Promise<void> {
    if (!worker || !served) return;

    await armed;

    worker.resetHandlers(...(await handlersFor(served)));

    // After the swap, for the same reason `reconcile` clears after it: the
    // answers this tab holds are the collection the last pass moved to.
    clear();
  }

  async function arm(
    next: ForcedState | "replay",
    scenario?: string
  ): Promise<void> {
    const armed = next === "replay" ? undefined : next;
    replayed = armed ? undefined : scenario;
    gaps.length = 0;

    // Read BEFORE the write: a state already armed leaves the watcher nothing
    // to reconcile, so the session that has been REPLAYED INTO would carry the
    // last pass's writes into this one (`R7-4`).
    const rearmed = armed
      ? state.value?.slug === armed.slug
      : transient.value === REPLAY;

    // The url carries the STATE's slug — the scenario, not the recipe. Two
    // scenarios of one feature can name the same transport condition, and a
    // link naming the recipe could not tell the operator which of them they
    // were sent to look at.
    url.force.value = armed?.slug;
    transient.value = armed ? undefined : REPLAY;

    // A state armed from the picker is offered by definition, but the offer is
    // what a pasted slug resolves against — so an arm registers it too, and a
    // page that armed before its own measurement landed still reads as armed.
    if (armed && !forcedStateAt(offered.value, armed.slug))
      offered.value = [...offered.value, armed];

    if (rearmed) queue(restart);

    await whenReady();
  }

  async function disarm(): Promise<void> {
    url.force.value = undefined;
    transient.value = undefined;

    await whenReady();
  }

  async function replayStep(index: number): Promise<void> {
    await whenReady();

    const { runtimeRecordsScenarios, runtimeStepFixtures } =
      await import("../force/corpus");
    if (!worker || served !== REPLAY || !replayed || !runtimeRecordsScenarios())
      return;

    const { createStepHandlers } = await import("../force/handlers");
    worker.use(
      ...createStepHandlers(await runtimeStepFixtures(replayed, index))
    );
  }

  /**
   * The page wins on a page change. The handle outlives any one page — there is
   * one worker per tab — so a `replay` armed on the page just left would
   * otherwise still be answering THIS page's requests, forcing a module nobody
   * armed. It is the half no url pass can reach: `transient` is the preset the
   * url cannot carry, so the bag's reconcile has no param to find missing.
   *
   * The url half is deliberately left alone. `force=` on the page just opened
   * is a pasted link arming it (`AC8.2`), so clearing it here would disarm the
   * very preset the url was sent to carry; the bag's own reconcile is what
   * drops a `force=` the new query does NOT spell. A same-path call is never
   * touched, so a preset armed on this page survives every later consumer.
   *
   * Releasing the worker is left to the watcher above, the one place a change
   * of transport is serialised — a release from here could not be chained.
   */
  function reset(): void {
    if (typeof window === "undefined" || window.location.pathname === page)
      return;
    page = window.location.pathname;

    transient.value = undefined;
  }

  /**
   * Registers the module the caller has just booted, and both of the things
   * forcing needs of it — the cache clear the arm ends on, and the corpus arm
   * every later reconcile waits behind. The latter is registered synchronously
   * by the page, so it is in place before the immediate watcher's first
   * reconcile leaves the microtask queue.
   *
   * LEAVING A MODULE DISARMS (FE-3113 R). A preset is a fact about one module's
   * recorded corpus: carried onto another it means nothing, and onto one that
   * never offered it there is nothing that can honestly answer it. So a
   * registration naming a module this handle was not already serving returns the
   * tab to Live — the url half included, which no pathname pass can reach once a
   * navigation carries the query across.
   *
   * The FIRST registration is never a departure: a cold load on a pasted
   * `force=` link boots its module here, and reading that as leaving one would
   * disarm the very link the url was sent to carry (`AC8.2`).
   *
   * A new module's registration REPLACES the last one's whole, absences
   * included. A cache clear is bound to the key its own module publishes it
   * under, so keeping the page just left's would clear a cache this page does
   * not own.
   */
  function serves(source: ForcedStateSource): void {
    const isMoved = !!source.module && source.module !== servedModule;

    if (isMoved && servedModule) {
      transient.value = undefined;
      url.force.value = undefined;
      offered.value = [];
    }

    if (source.module) servedModule = source.module;
    if (isMoved || source.reset) clearCache = source.reset;
    if (isMoved || source.whenArmed) armed = source.whenArmed;

    // The page's own offer, followed rather than copied: it is measured after
    // the corpus loads, and a pasted `force=` link must arm the moment the
    // state it names is offered — not on whatever the list held at boot.
    if (source.states) {
      const states = source.states;
      watch(states, next => (offered.value = next), { immediate: true });
    }
  }

  return {
    reset,
    serves,
    state: {
      preset,
      state,
      requested,
      isAvailable: availableModules.length > 0,
      isSettling: computed(() => unsettled.value > 0),
      arm,
      disarm,
      replayStep,
      captureGaps: () => [...gaps],
      whenReady
    }
  };
}

/**
 * The one forced-state handle. Every consumer shares its worker; nobody starts
 * a second.
 *
 * @param source The caller's OWN booted module, for the one consumer that boots
 * one — the page. The bar and the player read the same handle without a source,
 * which leaves whatever the page registered standing rather than clearing it.
 */
export function useForcedState(source?: ForcedStateSource): UseForcedState {
  // Detached, like the url writer it reads: a watcher first created inside a
  // component would stop reconciling the moment that component unmounted, and
  // the tab would keep serving the preset it was last armed with.
  if (!handle) handle = effectScope(true).run(create)!;
  else handle.reset();

  if (source) handle.serves(source);

  return handle.state;
}
