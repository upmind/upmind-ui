// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/routes
 * @description WHAT a forced page intercepts: exactly the paths the module's own
 * recordings name (FE-3113). The handler list and the composable that arms it
 * both need this, and the composable may not reach `handlers.ts` — that module
 * names `msw`, and a bare page load must resolve none of it (`S12`/`AC8.1`). So
 * the derivation sits here, in a leaf carrying nothing msw-shaped.
 *
 * It used to guess at URL SHAPE in both directions, and was wrong in both. A
 * read carrying none of a fixed set of criteria keys was dismissed as a boot
 * call, which dropped a recorded detail endpoint whose query named a RELATION
 * rather than a filter — so a booted detail surface reached STAGING under a
 * forced chip, and where a module's `invalidate` is prefix-matched, arming
 * actively refetched an open dialog to the live API. Every non-GET was armed
 * unconditionally, which reached past the module the other way.
 *
 * A recording is evidence that this module talks to that endpoint. So a query
 * string never disqualifies a recorded path, and a path no recording carries is
 * never armed. Nothing here reads the URL for meaning.
 *
 * Arming a route is not answering it: `resolveCorpusRequest` still has to find a
 * recording captured at the request's own endpoint and method, and a request it
 * does not match passes through (`AC8.3`).
 */

import { filter, map, sortBy, uniq } from "lodash-es";
import type { RecordedFixture } from "./corpus.source.types";

// -----------------------------------------------------------------------------

/** A recorded id segment: a uuid, or the capture run's own `mock-uuid-N` stand-in. */
const IDENTIFIER =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|mock-uuid-\d+)$/i;

/**
 * The recorded path as a route PATTERN: every id segment parameterised, and the
 * origin left free by a leading wildcard so one pattern serves whichever brand
 * host the page is booted on.
 *
 * The parameter is named for its POSITION, never for the id it stood in for.
 * Two recordings of the same endpoint carry different ids, so an id-derived name
 * would make them two routes — and the collection they both sit under would then
 * be shadowed by whichever happened to sort first.
 */
function routePattern(path: string): string {
  const [pathname] = path.split("?");

  const segments = map(filter(pathname.split("/")), (segment, index) =>
    IDENTIFIER.test(segment) ? `:id${index}` : segment
  );

  return `*/${segments.join("/")}`;
}

// -----------------------------------------------------------------------------

/**
 * The module's own endpoints, deepest first so a member route is offered ahead
 * of the collection it sits under.
 *
 * @param bodies One module's recordings, keyed by fixture name.
 */
export function moduleRoutes(
  bodies: Record<string, RecordedFixture>
): string[] {
  return sortBy(
    uniq(map(bodies, fixture => routePattern(fixture.request.path))),
    route => -route.split("/").length
  );
}
