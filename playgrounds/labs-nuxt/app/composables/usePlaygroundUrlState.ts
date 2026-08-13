// -----------------------------------------------------------------------------
/**
 * @module composables/usePlaygroundUrlState
 * @description The playground's ONE query-string writer. Which view is on,
 * which columns it draws, which track and scene are armed, which sheet and tab
 * are open and which force preset is active all live in the url, so a colleague
 * can be sent to the exact surface (`AC9.1`) — written through
 * `useUrlSearchParams("history")`, the
 * mechanism the criteria sync already established, i.e. `history.replaceState`,
 * which the router never sees, so no surface param remounts the page (`AC9.3`,
 * `P1-R2`).
 *
 * There is exactly one bag AND one flush. Two `useUrlSearchParams` instances
 * each rebuild the whole query string from their own state, so the second would
 * delete every param the first owns on its next write — which is why
 * `useCriteriaUrlSync` consumes this bag instead of minting its own. One bag is
 * necessary and not sufficient: that mechanism pauses its own write-back for
 * the rest of the flush after its first write, so a mutation landing later in
 * the same tick never reaches the url and is never replayed. Every writer
 * therefore hands its params to `write`, which merges the tick's patches and
 * commits them ONCE — so a surface write and a criteria write in the same tick
 * both survive in EITHER order, and a slot still answers with what was just
 * written to it because the uncommitted patch is read through.
 *
 * Scope stays the router's, because scope is path segments (`buildScopePath`).
 * The price of writing outside the router is that a `router.push` rebuilds the
 * query from the location it is handed, so `preserveQuery` is the one helper a
 * scope navigation carries this state through (design §7.3).
 */

import { useUrlSearchParams } from "@vueuse/core";
import { computed, effectScope, reactive } from "vue";
import {
  assign,
  castArray,
  forEach,
  isEmpty,
  isInteger,
  isString,
  isUndefined,
  keys,
  omit,
  size,
  toNumber,
  toString
} from "lodash-es";
import type {
  PlaygroundSurfaceParam,
  PlaygroundUrlParams,
  PlaygroundUrlPatch,
  PlaygroundUrlState
} from "./usePlaygroundUrlState.types";
import type { WritableComputedRef } from "vue";
import { AUTH_TARGET_PARAMS } from "~/funnels/labs.constants";

// -----------------------------------------------------------------------------

type PlaygroundUrlBag = {
  state: PlaygroundUrlState;
  reconcile: () => void;
};

let bag: PlaygroundUrlBag | undefined;
let page: string | undefined;

/**
 * Every written value is a string or an integer — the JSON-safe whitelist
 * (`D3`/`T8`). Anything else clears the param rather than reaching the url as a
 * lie, the degrade the criteria serialiser already takes on a hand-edited value.
 */
function legal(value: unknown): string | undefined {
  const written = isString(value)
    ? value
    : isInteger(value)
      ? toString(value)
      : undefined;

  return isUndefined(written) || isEmpty(written) ? undefined : written;
}

/**
 * A path carrying the current SURFACE query through, for a `buildScopePath`
 * caller to push. A param already spelt in `path` wins — a caller who wrote it
 * meant it, and a param the url repeats stays repeated: the mechanism hands a
 * repeated key back as an array, and one comma-joined value is a different
 * query. The auth target's own params (`AUTH_TARGET_PARAMS`) are the router's
 * and never ride along: a carried `fresh` re-opens the ADD-SESSION chooser on
 * the next guard rejection, which is the `H5` split it means to encode.
 */
function preserveQuery(params: PlaygroundUrlParams, path: string): string {
  // The base is discarded: only the path, its query and its hash are returned.
  const url = new URL(path, "http://playground.invalid");

  forEach(omit(params, AUTH_TARGET_PARAMS), (value, param) => {
    if (url.searchParams.has(param)) return;
    forEach(castArray(value), one =>
      url.searchParams.append(param, toString(one))
    );
  });

  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * The url wins on a page change. The bag outlives any one page (there is only
 * one) while VueUse re-reads only on `popstate`, which a router navigation does
 * not fire — so a param written on the page just left would otherwise be
 * re-stamped onto the next one, the tick's uncommitted patch included. A
 * same-path write is never touched, which is what keeps a criteria write and a
 * surface write in one tick both alive.
 *
 * The auth target's params are dropped rather than adopted (`S11`/`S18`): they
 * are the ROUTER's instruction to the overlay, and the funnel hands them back
 * on the parent route once that overlay resolves. Deleting them from the bag is
 * what erases them from the url, since the bag is the query's one writer.
 */
function reconcile(
  params: PlaygroundUrlParams,
  pending: PlaygroundUrlPatch
): void {
  if (typeof window === "undefined" || window.location.pathname === page)
    return;
  page = window.location.pathname;

  const url = new URLSearchParams(window.location.search);
  forEach(keys(pending), param => delete pending[param]);
  forEach(keys(params), param => {
    if (!url.has(param)) delete params[param];
  });
  forEach([...url.keys()], param => {
    const values = url.getAll(param);
    params[param] = size(values) > 1 ? values : toString(values[0]);
  });
  forEach(AUTH_TARGET_PARAMS, param => delete params[param]);
}

function create(): PlaygroundUrlBag {
  const params = useUrlSearchParams<PlaygroundUrlParams>("history", {
    // `removeFalsyValues` is deliberately NOT set: a tri-state filter's `false`
    // is an ACTIVE choice, and the precedent's falsy-drop would erase it.
    removeNullishValues: true
  });
  if (typeof window !== "undefined") page = window.location.pathname;

  const pending = reactive<PlaygroundUrlPatch>({});
  let queued = false;

  const current = computed<PlaygroundUrlParams>(() => {
    const merged = assign({}, params) as PlaygroundUrlParams;
    forEach(pending, (value, param) => {
      if (isUndefined(value)) delete merged[param];
      else merged[param] = value;
    });
    return merged;
  });

  function commit(): void {
    queued = false;
    forEach(keys(pending), param => {
      const value = pending[param];
      if (isUndefined(value)) delete params[param];
      else params[param] = value;
      delete pending[param];
    });
  }

  function write(patch: PlaygroundUrlPatch): void {
    assign(pending, patch);
    if (queued) return;
    queued = true;
    // A macrotask, not `nextTick`: the mechanism resumes its paused write-back
    // on a microtask, so only a commit past the microtask queue is guaranteed
    // to land outside the window an earlier write closed.
    setTimeout(commit);
  }

  function slot(
    param: PlaygroundSurfaceParam
  ): WritableComputedRef<string | undefined> {
    return computed({
      get: () => {
        const value = current.value[param];
        return isString(value) ? value : undefined;
      },
      set: value => write({ [param]: legal(value) })
    });
  }

  return {
    reconcile: () => reconcile(params, pending),
    state: {
      params: current,
      write,
      view: slot("view"),
      columns: slot("columns"),
      track: slot("track"),
      scene: computed({
        get: () => {
          const raw = current.value.scene;
          if (!isString(raw) || isEmpty(raw)) return undefined;
          const value = toNumber(raw);
          return isInteger(value) ? value : undefined;
        },
        set: value => write({ scene: legal(value) })
      }),
      sheet: slot("sheet"),
      tab: slot("tab"),
      force: slot("force"),
      preserveQuery: path => preserveQuery(current.value, path)
    }
  };
}

/** The one writer. Every consumer shares its bag; nobody else opens a second. */
export function usePlaygroundUrlState(): PlaygroundUrlState {
  // Minted in a DETACHED scope: VueUse's popstate listener and its write-back
  // watcher are effect-scoped, so a bag first created inside a component would
  // stop writing the moment that component unmounted.
  if (!bag) bag = effectScope(true).run(create)!;
  else bag.reconcile();

  return bag.state;
}
