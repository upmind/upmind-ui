// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/routes
 * @description WHAT a forced page intercepts, DERIVED from the module's own
 * recordings (FE-3113) rather than spelt as a hand-written list. The handler
 * list and the composable that arms it both need this, and the composable may
 * not reach `handlers.ts` — that module names `msw`, and a bare page load must
 * resolve none of it (`S12`/`AC8.1`). So the derivation sits here, in a leaf
 * carrying nothing msw-shaped.
 *
 * ## Which recordings name a module's OWN endpoints
 *
 * Not all of them. A module's `__tests__/fixtures/` also holds the CHROME's
 * boot calls — `/brand/settings`, `/config/brand/values`, `/org/modules` —
 * captured because the capture run booted an app to reach the subject. Arming
 * over those is the defect `AC8.3` names: the chrome's singletons boot once and
 * never re-ask, so a forced page that answered them would hold an undefined
 * brand for the rest of the tab's life.
 *
 * The recordings say which is which, and they say it LOCALLY — no list, and no
 * count across other modules' corpora, which would make one module's new
 * recording silently move another module's routes. A capture belongs to the
 * subject when it is
 *
 * - a WRITE (the chrome's boot calls are all reads), or
 * - a read carrying CRITERIA (`filter[…]`, `order`, `limit`, `offset`, `query`)
 *   or a `case=` capture label — the marks of a surface being driven, which is
 *   exactly what the capture run was there to drive.
 *
 * A read with neither is a boot call the run passed through on its way, and it
 * is left to reach staging untouched.
 */

import { filter, map, sortBy, toUpper, uniq } from "lodash-es";
import type { RecordedFixture } from "./corpus.source.types";

// -----------------------------------------------------------------------------

/** A recorded id segment: a uuid, or the capture run's own `mock-uuid-N` stand-in. */
const IDENTIFIER =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|mock-uuid-\d+)$/i;

/** The marks of a read the capture run DROVE, as opposed to one it booted through. */
const DRIVEN = /(^|&)(filter\[|order=|limit=|offset=|query=|case=)/;

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

/** Whether this recording captured the module's SUBJECT rather than the chrome's boot. */
function isSubject(fixture: RecordedFixture): boolean {
  if (toUpper(fixture.request.method) !== "GET") return true;

  const [, search = ""] = fixture.request.path.split("?");

  return DRIVEN.test(search);
}

// -----------------------------------------------------------------------------

/**
 * The module's own endpoints, most specific first — the leading wildcard leaves
 * the origin and api prefix free. Deepest first so a member route is offered
 * ahead of the collection it sits under, exactly as the hand-written list was
 * ordered.
 *
 * @param bodies One module's recordings, keyed by fixture name.
 */
export function moduleRoutes(
  bodies: Record<string, RecordedFixture>
): string[] {
  const subject = filter(bodies, isSubject);

  return sortBy(
    uniq(map(subject, fixture => routePattern(fixture.request.path))),
    route => -route.split("/").length
  );
}
