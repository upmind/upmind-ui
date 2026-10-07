// -----------------------------------------------------------------------------
/**
 * @module composables/useInitAction
 * @description Legacy's `?init=` deep link (`invoiceProvider.vue:433-437`,
 * `cProdProvider.vue:988-993`, `products/index.vue:139`): a link that arrives
 * with a flow named in the query opens that flow ONCE, then leaves the query
 * behind so a refresh or a back-navigation does not open it again.
 *
 * The route IS the state. There is no local "have I run it" flag to keep in
 * step — the param is read on setup, the door is dispatched, and the same turn
 * replaces the route without it, which is what makes a second run unreachable
 * rather than merely guarded.
 *
 * Both router composables are imported from `vue-router` rather than taken off
 * Nuxt's auto-import, so the symbols resolve wherever this runs: they are
 * called unconditionally at setup, and it is their USE that the flow gates.
 */

import { useRoute, useRouter } from "vue-router";
import { omit } from "lodash-es";
import type { InitQueryValue } from "~/portal/mock/actions";
import { INIT_QUERY_KEY, INIT_QUERY_VERB } from "~/portal/mock/actions";
// -----------------------------------------------------------------------------

/** Whether the query names a flow this build knows how to open. */
function isInitValue(value: unknown): value is InitQueryValue {
  return typeof value === "string" && value in INIT_QUERY_VERB;
}

/**
 * Opens the door the route's `init` query names, once. An unknown value is
 * ignored and the query is left alone — legacy opened nothing for one either.
 */
export function useInitAction(run: (value: string) => Promise<void>): void {
  const route = useRoute();
  const router = useRouter();

  const asked = route?.query?.[INIT_QUERY_KEY];
  if (!isInitValue(asked)) return;

  const verb = INIT_QUERY_VERB[asked];
  // The param goes FIRST: the door may navigate, and a replace afterwards
  // would fight the destination it chose.
  void router
    .replace({ query: omit(route.query, [INIT_QUERY_KEY]) })
    .then(() => run(verb));
}
