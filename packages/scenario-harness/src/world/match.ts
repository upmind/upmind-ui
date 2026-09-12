import { forEach, get, isMatch, isNil, isPlainObject, set } from "lodash-es";
// -----------------------------------------------------------------------------
/**
 * @module world/match
 * @description The ONE subset match every `World` grades `expectMeta` /
 * `expectContext` with, so the in-page playground and the Node replay read an
 * expectation the same way.
 *
 * An expected `null` means CLEARED. A manager compacts its model, so a value
 * saved as `null` comes back absent, and absent and `null` are the one picture
 * the form draws — an empty field. Lodash's own `isMatch` refuses an absent key
 * before any customizer runs, so the live layer is padded with `null` exactly
 * where the expectation says `null` and the live value is missing. Every other
 * value compares as itself.
 */

function padCleared(live: unknown, expected: unknown): unknown {
  if (!isPlainObject(expected)) return live;

  const padded: Record<string, unknown> = isPlainObject(live)
    ? { ...(live as Record<string, unknown>) }
    : {};

  forEach(expected as Record<string, unknown>, (wanted, key) => {
    if (wanted === null && isNil(get(padded, key))) set(padded, key, null);
    else if (isPlainObject(wanted))
      set(padded, key, padCleared(get(padded, key), wanted));
  });

  return padded;
}

/**
 * Whether `live` carries every value `expected` names — a deep subset match in
 * which an expected `null` is satisfied by a cleared (absent) value.
 *
 * @param live The unwrapped layer as the module publishes it now.
 * @param expected The values a step asserts.
 */
export function matchesExpectation(
  live: Record<string, unknown>,
  expected: Record<string, unknown>
): boolean {
  return isMatch(padCleared(live, expected) as object, expected);
}
