// -----------------------------------------------------------------------------
/**
 * @module components/scope/useScopeLookups
 * @description The seam that lets the acting-for picker offer REAL records
 * instead of a bare id field.
 *
 * The picker is generic — it renders whatever the registered matrix declares —
 * so it cannot call a module composable itself (a composable may not be called
 * conditionally). The PAGE knows its module, so it registers the lookups its
 * own cell publishes (`useContext().lookups`) and the picker reads them, keyed
 * by context type.
 *
 * Module-level state, NOT provide/inject: the scope bar is app chrome mounted
 * in the LAYOUT, above the page, so nothing a page provides can reach it.
 * `useContextScopeSelector` registers the matrix the same way, for the same
 * reason.
 *
 * A type with no entry keeps the plain id field — the documented fallback for a
 * relationship no module serves a list for.
 */

import { onUnmounted, ref } from "vue";

// -----------------------------------------------------------------------------

/**
 * One lookup thunk, as a control's `options.lookup.service` carries it: calling
 * it returns the once-minted query and flips it active, so nothing fetches
 * until a picker actually opens.
 */
export type ScopeLookupService = () => unknown;

/** The lookups a page publishes, keyed by the context type's own enum VALUE. */
export type ScopeLookups = Record<string, ScopeLookupService>;

/** The lookups the CURRENT page publishes. Empty when it publishes none. */
const registered = ref<ScopeLookups>({});

/** Which page owns them, so a late unmount cannot clear a newer page's set. */
let owner: symbol | null = null;

export function useScopeLookups() {
  /** Publish the booted cell's lookups, cleared when that page unmounts. */
  function register(lookups: ScopeLookups | undefined) {
    const held = Symbol("scope-lookups-owner");
    owner = held;
    registered.value = lookups ?? {};

    onUnmounted(() => {
      if (owner === held) reset();
    });
  }

  function reset() {
    registered.value = {};
    owner = null;
  }

  return { lookups: registered, register, reset };
}
