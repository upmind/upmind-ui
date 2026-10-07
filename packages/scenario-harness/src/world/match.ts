import {
  every,
  get,
  isArray,
  isEqual,
  isNil,
  isPlainObject,
  some,
  toPairs
} from "lodash-es";
// -----------------------------------------------------------------------------
/**
 * @module world/match
 * @description The ONE reading of an expectation every `World` grades
 * `expectMeta` / `expectContext` with, so the in-page playground and the Node
 * replay agree. Expectations are plain data (they cross the Playwright bridge),
 * never predicates, so the reading itself carries the three meanings a step
 * needs:
 *
 * - an OBJECT is a subset: every key it names must hold;
 * - an ARRAY is a membership: every element it names must match SOME live
 *   element, in any order — a list's order is presentation, and a step saying
 *   "this row is now the default" is not saying which row is drawn first;
 * - `null` is CLEARED: a manager compacts its model, so a value saved as
 *   `null` comes back absent, and both are the one empty field.
 *
 * Anything that is not a plain object asserts nothing and is refused: lodash
 * reads zero own keys off a function and answers `true`, which would let a
 * predicate passed by mistake pass every scenario.
 */

function satisfies(live: unknown, wanted: unknown): boolean {
  if (wanted === null) return isNil(live);
  if (isArray(wanted))
    return (
      isArray(live) &&
      every(wanted, item => some(live, candidate => satisfies(candidate, item)))
    );
  if (isPlainObject(wanted))
    return (
      isPlainObject(live) &&
      every(toPairs(wanted as Record<string, unknown>), ([key, item]) =>
        satisfies(get(live, key), item)
      )
    );

  return isEqual(live, wanted);
}

/**
 * Whether `live` carries every value `expected` names, read as above.
 *
 * @param live The unwrapped layer as the module publishes it now.
 * @param expected The values a step asserts — a plain object, always.
 */
export function matchesExpectation(
  live: Record<string, unknown>,
  expected: Record<string, unknown>
): boolean {
  if (!isPlainObject(expected)) return false;

  return satisfies(live, expected);
}
