// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/useCriteriaUrlSync
 * @description Page-level opt-in persistence of the whole request state to the
 * browser url, so a refresh does not lose where you are. The mechanism
 * is the one already established in client-vue — VueUse `useUrlSearchParams`
 * at the page, never inside the list widget (`Catalogue.vue:121`,
 * `WidgetGrid.vue:190`) — and the surface stays dumb: the model remains
 * composable-owned and every write goes through the criteria's own merging
 * `set`, so a rehydrated url can no more clear a live sort than a header
 * filter can.
 *
 * It serialises the CRITERIA, one object in and one object out — the
 * schema-walking serialisation itself lives in `useCriteriaUrlSync.utils`.
 */

import { useUrlSearchParams } from "@vueuse/core";
import { watch } from "vue";
import {
  PAGINATION_PARAMS,
  SORT_PARAM,
  criteriaToParams,
  declaredPairs,
  filterParam,
  paramsToCriteria
} from "./useCriteriaUrlSync.utils";
import { assign, forEach, has, isEmpty, map } from "lodash-es";
import type { ModulePortCriteria } from "./useModulePort.types";

// -----------------------------------------------------------------------------

/**
 * The serialisation is part of this module's contract, not a private helper: a
 * caller seeding criteria from a url before the watcher exists needs the same
 * two functions the sync itself runs. Re-exported from `.utils`, which stays
 * their one home.
 */
export { criteriaToParams, paramsToCriteria };

/**
 * Reads the criteria out of the url on boot and writes it back on every
 * change.
 *
 * @param criteria The port's criteria handle, absent for a module that owns no
 * request state — in which case there is nothing to persist and this no-ops.
 * @param options `enabled` is the page-level opt-in; persistence is off unless
 * the scenario asks for it.
 */
export function useCriteriaUrlSync(
  criteria?: ModulePortCriteria,
  options: { enabled?: boolean } = {}
): void {
  // No `window` means no url to sync — a server render, or a spec that has not
  // stood a DOM up.
  if (!criteria || !options.enabled || typeof window === "undefined") return;

  const params = useUrlSearchParams<Record<string, string>>("history", {
    // `removeFalsyValues` is deliberately NOT set: a tri-state filter's `false`
    // is an ACTIVE choice, and the precedent's falsy-drop would erase it.
    removeNullishValues: true
  });

  const seeded = paramsToCriteria(criteria.schema, params);
  if (!isEmpty(seeded)) criteria.set(seeded);

  const owned = [
    ...map(declaredPairs(criteria.schema), ([column, operator]) =>
      filterParam(column, operator)
    ),
    SORT_PARAM,
    ...PAGINATION_PARAMS
  ];

  watch(
    criteria.model,
    model => {
      const next = criteriaToParams(criteria.schema, model);
      forEach(owned, param => {
        if (!has(next, param)) delete params[param];
      });
      assign(params, next);
    },
    { deep: true, immediate: true }
  );
}
