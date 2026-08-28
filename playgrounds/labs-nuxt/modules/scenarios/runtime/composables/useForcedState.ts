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
 * That clear is not instant, and `isSettling` is what the page holds its own
 * controls behind while it runs (FE-3113 M). An arm loads the corpus, registers
 * a worker and only THEN drops the cache — seconds during which the surface is
 * still drawing the rows the arm is about to take away. A row action fired into
 * that window is answered by the armed transport, and the refusal it draws is
 * then wiped by the clear landing on top of it, which is the one thing the
 * recorded refusal's own contract forbids: `error-action` serves the read as
 * recorded so the collection stays intact. Held, an action can only be fired
 * once the arm has settled, and the re-read that arm starts leaves no rows to
 * fire one at until it lands — so a refusal is never in flight beside a clear.
 */

import { computed, effectScope, nextTick, ref, watch } from "vue";
import { usePlaygroundUrlState } from "../../../../app/composables/usePlaygroundUrlState";
import { availableModules } from "../force/corpus.source";
import { FORCE_URL_PRESETS } from "./useForcedState.types";
import { noop, some } from "lodash-es";
import type {
  ForceReset,
  ForcePreset,
  ForceUrlPreset,
  ForceWorker,
  UseForcedState
} from "./useForcedState.types";

// -----------------------------------------------------------------------------

type ForcedStateHandle = {
  state: UseForcedState;
  reset: () => void;
  /** Points the handle's cache clear at the module the page has just booted. */
  serves: (clearCache: ForceReset | undefined) => void;
  /** The corpus arm every later reconcile waits behind (FE-3113). */
  arms: (whenArmed: Promise<unknown>) => void;
};

let handle: ForcedStateHandle | undefined;

/** The pathname the handle last answered on — the page `reset` scopes to. */
let page: string | undefined;

function isUrlPreset(value: unknown): value is ForceUrlPreset {
  return some(FORCE_URL_PRESETS, preset => preset === value);
}

function create(): ForcedStateHandle {
  const url = usePlaygroundUrlState();
  if (typeof window !== "undefined") page = window.location.pathname;

  // The preset the url cannot carry, so it cannot be read back off one either.
  const transient = ref<ForcePreset | undefined>();

  const preset = computed<ForcePreset | undefined>(() => {
    // Nothing is armed while the corpus is unreachable (`ESC6`), so nothing may
    // READ as armed either: the page is Live, and a chip over live rows naming
    // a preset nobody is serving is the lie `S14` forbids — inventing a body to
    // make it true is the one `S13` does.
    if (availableModules.length === 0) return undefined;

    return (
      transient.value ??
      (isUrlPreset(url.force.value) ? url.force.value : undefined)
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

  // What the tab is actually being answered with. The immediate watch below
  // fires with Live, which is what a booting tab already is, so nothing is
  // re-read on load — only a genuine change of transport invalidates.
  let served: ForcePreset | undefined;

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

      const { createForceHandlers } = await import("../force/handlers");
      const handlers = createForceHandlers(next);

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
    // Not awaited — a chain waiting on that refetch could never reconcile the
    // preset picked after it. Scoped to the booted module by construction: the
    // whole cache is the app chrome's too, and the chrome's singletons boot
    // once and never re-ask.
    void clearCache?.();
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

    const { createForceHandlers } = await import("../force/handlers");
    worker.resetHandlers(...createForceHandlers(served));

    // After the swap, for the same reason `reconcile` clears after it: the
    // answers this tab holds are the collection the last pass moved to.
    void clearCache?.();
  }

  async function arm(next: ForcePreset): Promise<void> {
    // Read BEFORE the write: a preset already armed leaves the watcher nothing
    // to reconcile, so the session that has been REPLAYED INTO would carry the
    // last pass's writes into this one (`R7-4`).
    const rearmed = preset.value === next;

    url.force.value = isUrlPreset(next) ? next : undefined;
    transient.value = isUrlPreset(next) ? undefined : next;

    if (rearmed) queue(restart);

    await whenReady();
  }

  async function disarm(): Promise<void> {
    url.force.value = undefined;
    transient.value = undefined;

    await whenReady();
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
   * Points the cache clear at the module the caller has just booted. The handle
   * is per TAB and a page hosts one module, so the latest registration wins —
   * a page navigated away from must not keep claiming it.
   */
  function serves(next: ForceReset | undefined): void {
    clearCache = next;
  }

  /**
   * Holds every later reconcile behind the caller's corpus arm. Registered
   * synchronously by the page, so it is in place before the immediate watcher's
   * first reconcile leaves the microtask queue.
   */
  function arms(whenArmed: Promise<unknown>): void {
    armed = whenArmed;
  }

  return {
    arms,
    reset,
    serves,
    state: {
      preset,
      isAvailable: availableModules.length > 0,
      isSettling: computed(() => unsettled.value > 0),
      arm,
      disarm,
      whenReady
    }
  };
}

/**
 * The one forced-state handle. Every consumer shares its worker; nobody starts
 * a second.
 *
 * @param clearCache The caller's OWN booted module's `reset`, for the one
 * consumer that boots a module — the page. The bar and the player read the same
 * handle without one, and passing none leaves whatever the page registered
 * standing rather than clearing it (FE-3113).
 * @param whenArmed That same caller's corpus arm. Arming may not report success
 * before its handlers are installed, and there are none to install until this
 * resolves.
 */
export function useForcedState(
  clearCache?: ForceReset,
  whenArmed?: Promise<unknown>
): UseForcedState {
  // Detached, like the url writer it reads: a watcher first created inside a
  // component would stop reconciling the moment that component unmounted, and
  // the tab would keep serving the preset it was last armed with.
  if (!handle) handle = effectScope(true).run(create)!;
  else handle.reset();

  if (clearCache) handle.serves(clearCache);
  if (whenArmed) handle.arms(whenArmed);

  return handle.state;
}
