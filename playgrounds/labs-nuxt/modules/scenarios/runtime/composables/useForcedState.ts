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
 * Arming changes what the tab's NEXT request is answered with, which leaves
 * every answer it already holds a lie about a page that now says it is forced.
 * So a reconcile that lands ends by invalidating the cache: the preset is only
 * visible because the page asks again through it (`AC8.4`, `R6-10`).
 */

import { computed, effectScope, nextTick, ref, watch } from "vue";
import { queryClient } from "@upmind-automation/headless";
import { usePlaygroundUrlState } from "../../../../app/composables/usePlaygroundUrlState";
import { availableModules } from "../force/corpus.source";
import { MODULE_QUERY_KEY } from "../force/routes";
import { FORCE_URL_PRESETS } from "./useForcedState.types";
import { noop, some } from "lodash-es";
import type {
  ForcePreset,
  ForceUrlPreset,
  ForceWorker,
  UseForcedState
} from "./useForcedState.types";

// -----------------------------------------------------------------------------

let state: UseForcedState | undefined;

function isUrlPreset(value: unknown): value is ForceUrlPreset {
  return some(FORCE_URL_PRESETS, preset => preset === value);
}

function create(): UseForcedState {
  const url = usePlaygroundUrlState();

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

    // DROPPED, not merely re-asked: an invalidated query keeps serving its last
    // answer until the next one lands, and `loading` never lands — the page
    // would sit on live rows wearing a Loading chip, the lie `S14` forbids. Not
    // awaited for the same reason: a chain waiting on that refetch could never
    // reconcile the preset picked after it. Scoped to what the handlers answer:
    // the whole cache is the app's too, and the chrome does not re-ask.
    void queryClient.resetQueries({ queryKey: MODULE_QUERY_KEY });
  }

  watch(
    preset,
    next => {
      // Chained, never raced: two arms in one tick would each find no worker
      // and register a second, and only one of the two would ever be
      // unregistered. A failed arm is swallowed so it cannot poison the next.
      pending = pending.catch(noop).then(() => reconcile(next));
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

    const { createForceHandlers } = await import("../force/handlers");
    worker.resetHandlers(...createForceHandlers(served));

    // Dropped for the same reason `reconcile` drops: the answers this tab
    // already holds are the collection the last pass moved to.
    void queryClient.resetQueries({ queryKey: MODULE_QUERY_KEY });
  }

  async function arm(next: ForcePreset): Promise<void> {
    // Read BEFORE the write: a preset already armed leaves the watcher nothing
    // to reconcile, so the session that has been REPLAYED INTO would carry the
    // last pass's writes into this one (`R7-4`).
    const rearmed = preset.value === next;

    url.force.value = isUrlPreset(next) ? next : undefined;
    transient.value = isUrlPreset(next) ? undefined : next;

    if (rearmed) pending = pending.catch(noop).then(restart);

    await whenReady();
  }

  async function disarm(): Promise<void> {
    url.force.value = undefined;
    transient.value = undefined;

    await whenReady();
  }

  return {
    preset,
    isAvailable: availableModules.length > 0,
    arm,
    disarm,
    whenReady
  };
}

/** The one forced-state handle. Every consumer shares its worker; nobody starts a second. */
export function useForcedState(): UseForcedState {
  // Detached, like the url writer it reads: a watcher first created inside a
  // component would stop reconciling the moment that component unmounted, and
  // the tab would keep serving the preset it was last armed with.
  if (!state) state = effectScope(true).run(create);

  return state!;
}
