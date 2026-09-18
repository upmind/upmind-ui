// -----------------------------------------------------------------------------
/**
 * @module components/scope/useScopeLookups
 * @description The seam that lets the acting-for picker offer REAL records
 * instead of a bare id field.
 *
 * The picker is generic — it renders whatever the registered matrix declares —
 * so it cannot call a module composable itself (a composable may not be called
 * conditionally, and the bar outlives any one page). The PAGE knows its module,
 * so the scenario runtime provides the lookups its own cell publishes
 * (`useContext().lookups`) and the picker injects them, keyed by context type.
 *
 * A type with no entry keeps the plain id field — the documented fallback for a
 * relationship no module serves a list for.
 */

import { inject, provide } from "vue";
import type { InjectionKey } from "vue";

// -----------------------------------------------------------------------------

/**
 * One lookup thunk, as a control's `options.lookup.service` carries it: calling
 * it returns the once-minted query and flips it active, so nothing fetches
 * until a picker actually opens.
 */
export type ScopeLookupService = () => unknown;

/** The lookups a page publishes, keyed by the context type's own enum VALUE. */
export type ScopeLookups = Record<string, ScopeLookupService>;

const SCOPE_LOOKUPS: InjectionKey<() => ScopeLookups | undefined> =
  Symbol("scope-lookups");

/** Publish the booted cell's lookups to the scope bar. */
export function provideScopeLookups(source: () => ScopeLookups | undefined) {
  provide(SCOPE_LOOKUPS, source);
}

/** Read the page's lookups. Empty when the page publishes none. */
export function useScopeLookups(): () => ScopeLookups {
  const source = inject(SCOPE_LOOKUPS, undefined);

  return () => source?.() ?? {};
}
