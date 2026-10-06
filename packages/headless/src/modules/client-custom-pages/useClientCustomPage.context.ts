import { computed } from "vue";
import { mapToHeadlessError } from "../../utils";
import { isEmpty } from "lodash-es";
import type { CustomPage, CustomPageQuery } from "./client-custom-pages.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-pages/useClientCustomPage.context
 * @description Single-read context — the resolved page and its captured
 * error. Query-backed: data is mapped in `client-custom-pages.services.ts`
 * via `select`, never here — the SAME mapper the collection uses.
 *
 * ERRORS ARE STATE, NOT EVENTS. `error` is the scope's captured failure,
 * exposed for the consumer to render. This layer never raises it — a 404
 * lands here as a populated `error`, never a throw (D3/AC5).
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createClientCustomPageContext(
  _actorScope: ScopeActorTypes,
  query: CustomPageQuery,
  listRow?: ComputedRef<CustomPage | undefined>
) {
  const error = computed<ResponseError | undefined>(() =>
    query.error.value ? mapToHeadlessError(query.error.value) : undefined
  );

  /**
   * @decision
   * what:     `data` substitutes `listRow` for the item row ONLY when the
   *           item row is empty AND `listRow` actually resolves one (O10);
   *           every other case — including a genuinely empty/errored item
   *           read with no list fallback available — passes `query.data`
   *           through completely unchanged. Cast to `CustomPage` — matching
   *           the platform's own `[] as TData` convention for an item query
   *           that has not resolved (`query/useQuery.ts`'s `query()`) — so
   *           `data` stays `ComputedRef<CustomPage>` rather than widening
   *           every existing consumer's type to `CustomPage | undefined`.
   * why:      O9's guard means `query.data.value` never settles for a
   *           guarded scope, so exposing it alone would silently drop the
   *           resolved page the guard exists to serve. Substituting only
   *           when `listRow` has something real keeps every OTHER empty
   *           state (never fetched, 404) exactly as it already was —
   *           AC5's "surfaces as absence, not a throw" contract is
   *           untouched by this story.
   * rejected: Substitute `listRow?.value` unconditionally whenever the item
   *           row is empty. Rejected — `listRow?.value` is `undefined` when
   *           no collection is mounted, which would replace the platform's
   *           existing `[] as TData` empty-state value with `undefined` for
   *           a plain 404, a behaviour change this story does not ask for.
   */
  const data = computed<CustomPage>(
    () =>
      (isEmpty(query.data.value?.id) && listRow?.value
        ? listRow.value
        : query.data.value) as CustomPage
  );

  // --- actor-specific context: none earned yet (clause 2). When a scope
  // earns one, add `useClientCustomPage.context.{actor}.ts` and spread it
  // LAST.

  return {
    /** The reactive resolved page this scope addresses (AC3), falling back
     * to the list row when the item read is guarded off (O10). */
    data,

    /** The scope's captured error — read, never raised. */
    error

    // The arm merges in HERE, last.
    // ...actorContext
  };
}

// Type export for consumers
export type UseClientCustomPageContext = ReturnType<
  typeof createClientCustomPageContext
>;
