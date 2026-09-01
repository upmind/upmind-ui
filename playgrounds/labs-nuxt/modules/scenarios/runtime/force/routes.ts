// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/routes
 * @description WHAT a forced page intercepts: the recorded paths belonging to
 * the SUBJECT the module's own `.feature` declares (FE-3113). The handler list
 * and the composable that arms it both need this, and the composable may not
 * reach `handlers.ts` — that module names `msw`, and a bare page load must
 * resolve none of it (`S12`/`AC8.1`). So the derivation sits here, in a leaf
 * carrying nothing msw-shaped.
 *
 * Recordings alone answered this before, and they contradicted themselves in
 * both directions. A recording is evidence of every endpoint a module TOUCHED,
 * chrome included, so arming all of them armed the country and brand-config
 * reads a capture run needed to populate a form — and forcing `loading` then
 * hangs the app chrome for the tab's life. Reading the URL for meaning instead
 * was worse: a read carrying none of a fixed set of criteria keys was dismissed
 * as a boot call, which dropped a recorded detail endpoint whose query named a
 * RELATION rather than a filter, so a booted detail surface reached STAGING
 * under a forced chip.
 *
 * The `.feature` settles it, exactly as it settles the offer. Every feature
 * states its subject on its `Feature:` line, and a module arms the recorded
 * paths belonging to that subject: the recordings supply the paths, the feature
 * decides which of them are the module's own. Nothing here reads the URL for
 * meaning, and a query string never disqualifies a recorded path.
 *
 * Arming a route is not answering it: `resolveCorpusRequest` still has to find a
 * recording captured at the request's own endpoint and method, and a request it
 * does not match passes through (`AC8.3`).
 */

import {
  compact,
  filter,
  intersection,
  isEmpty,
  last,
  map,
  reject,
  size,
  some,
  sortBy,
  split,
  toLower,
  uniq,
  values,
  words
} from "lodash-es";
import { isAbsentRecordRead, isServedRead } from "./capabilities";
import type { RecordedFixture } from "./corpus.source.types";

// -----------------------------------------------------------------------------

/** A recorded id segment: a uuid, or the capture run's own `mock-uuid-N` stand-in. */
const IDENTIFIER =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|mock-uuid-\d+)$/i;

/** Gherkin states the subject once, on the feature's own `Feature:` line. */
const SUBJECT_LINE = /^[^\S\n]*Feature:[^\S\n]*(.+)$/m;

/**
 * The ACTOR a subject line opens on, in the "A <actor> <verb>s <object>" form.
 * A line opening on no article names no actor, and every word of it is subject.
 */
const SUBJECT_ACTOR = /^\s*(?:an?|the)\s+([a-z]+)/i;

/** Below it a word is an article, a preposition or a possessive, never a subject. */
const SHORTEST_TERM = 3;

/**
 * One word reduced to what it shares with its plural, so a subject naming
 * `addresses` finds the `address` segment and `companies` finds `companies`.
 */
function stem(word: string): string {
  const lowered = toLower(word);

  if (lowered.endsWith("ies") && size(lowered) > 4)
    return `${lowered.slice(0, -3)}y`;
  if (lowered.endsWith("sses")) return lowered.slice(0, -2);
  if (lowered.endsWith("s") && !lowered.endsWith("ss"))
    return lowered.slice(0, -1);

  return lowered;
}

/** A phrase or a path segment as comparable terms — `email_history` is two. */
function termsOf(text: string): string[] {
  return map(
    filter(words(text), word => size(word) >= SHORTEST_TERM),
    stem
  );
}

/**
 * What the module IS, as its feature declares it: the subject line's own terms,
 * and separately the actor those terms hang off.
 *
 * The actor is held apart because it names the CONTAINER of nearly every
 * recorded path — a client's addresses, companies and phones all sit under
 * `clients/:id` — so a module matching on it would claim every sibling resource
 * its capture run happened to read. It still names a subject where the path
 * stops there, which is the whole of a module whose surface IS the actor's own
 * record.
 */
type Subject = {
  /** The subject line's terms, actor excluded. */
  terms: string[];
  /** The actor the line opens on, where it opens on one. */
  actor?: string;
};

function subjectOf(feature: string): Subject {
  const [, line = ""] = SUBJECT_LINE.exec(feature) ?? [];
  const [, opener] = SUBJECT_ACTOR.exec(line) ?? [];
  const actor = opener ? stem(opener) : undefined;

  return { terms: reject(termsOf(line), term => term === actor), actor };
}

/** The resources a path addresses: its segments, ids and query dropped. */
function resourcesOf(path: string): string[] {
  const [pathname = ""] = split(path, "?");

  return reject(compact(split(pathname, "/")), segment =>
    IDENTIFIER.test(segment)
  );
}

function names(resource: string, terms: string[]): boolean {
  return !isEmpty(intersection(termsOf(resource), terms));
}

/** Whether the module's declared subject owns this recorded path. */
function isSubjectPath(path: string, subject: Subject): boolean {
  const resources = resourcesOf(path);

  if (some(resources, resource => names(resource, subject.terms))) return true;

  return !!subject.actor && names(last(resources) ?? "", [subject.actor]);
}

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
  const [pathname] = split(path, "?");

  const segments = map(compact(split(pathname, "/")), (segment, index) =>
    IDENTIFIER.test(segment) ? `:id${index}` : segment
  );

  return `*/${segments.join("/")}`;
}

// -----------------------------------------------------------------------------

/**
 * The module's own endpoints, deepest first so a member route is offered ahead
 * of the collection it sits under.
 *
 * A feature declaring no subject — an absent one, or a module the seam does not
 * reach — arms nothing, which leaves the page Live (`S12`).
 *
 * @param feature The module's committed `.feature` text.
 * @param bodies That module's own recordings, keyed by fixture name.
 */
export function moduleRoutes(
  feature: string,
  bodies: Record<string, RecordedFixture>
): string[] {
  const subject = subjectOf(feature);

  const own = filter(values(bodies), fixture =>
    isSubjectPath(fixture.request.path, subject)
  );

  return sortBy(
    uniq(map(own, fixture => routePattern(fixture.request.path))),
    route => -size(split(route, "/"))
  );
}

/**
 * Whether a module has a FORCEABLE surface: its declared subject owns a READ the
 * app renders a state from. Every force preset pictures a read surface — `empty`
 * and `loading` a collection or record, and both error states the failure shown
 * OVER one — so the measure is the same read the offer draws every state from:
 * {@link isServedRead} (a served collection or record) or
 * {@link isAbsentRecordRead} (a record that is not there). It is not a bare
 * method-and-status test — it is the offer's OWN read predicates, asked of the
 * subject's paths.
 *
 * A module whose subject owns only writes (an action flow: pay, 3DS, refresh) has
 * no read to picture, so it hosts no state, arms nothing, and is left Live
 * (`S12`) — exactly as one whose feature declares no subject at all. Derived,
 * never declared: no opt-out tag, no prose.
 */
export function armsForceableSurface(
  feature: string,
  bodies: Record<string, RecordedFixture>
): boolean {
  const subject = subjectOf(feature);

  return some(
    values(bodies),
    fixture =>
      isSubjectPath(fixture.request.path, subject) &&
      (isServedRead(fixture) || isAbsentRecordRead(fixture))
  );
}
