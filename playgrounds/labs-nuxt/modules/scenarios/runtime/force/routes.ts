// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/routes
 * @description WHAT a forced page intercepts, spelt once: the module's own
 * endpoints, and the query-cache domain those endpoints feed. The handler list
 * and the composable that arms it both need this, and the composable may not
 * reach `handlers.ts` — that module names `msw`, and a bare page load must
 * resolve none of it (`S12`/`AC8.1`). So the names sit here, in a leaf carrying
 * nothing msw-shaped.
 */

// -----------------------------------------------------------------------------

/**
 * The module's own endpoints, most specific first. The leading wildcard leaves
 * the origin and api prefix free, so the same list serves whichever brand host
 * the page is booted on.
 */
export const MODULE_ROUTES = [
  "*/clients/:clientId/emails/:emailId/send_verify",
  "*/clients/:clientId/emails/:emailId",
  "*/clients/:clientId/emails"
];

/**
 * The query-cache domain {@link MODULE_ROUTES} answer for. Arming changes what
 * those endpoints reply with, so those queries — and ONLY those — are the ones
 * that must be dropped and re-asked through the new transport.
 *
 * The scope is load-bearing, not tidiness: the app chrome's own queries (brand,
 * its settings, the session) are booted ONCE at init by long-lived singletons
 * that never re-ask, so dropping them leaves the header holding an undefined
 * brand for the rest of the tab's life — a broken logo over every forced page.
 */
export const MODULE_QUERY_KEY = ["client", "emails"];
