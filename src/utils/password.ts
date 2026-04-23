// -----------------------------------------------------------------------------
/**
 * @module utils/password
 * @description Pure utilities for password strength scoring, error-key
 * resolution, and cryptographically-random generation. Free of Vue or DOM deps
 * so they can be reused outside components and unit-tested directly.
 */

// --- external
import {
  every,
  filter,
  find,
  includes,
  keys,
  map,
  omitBy,
  sortBy,
  times,
  values,
  without
} from "lodash-es";
// -----------------------------------------------------------------------------

// Character pool for the generator. Excludes visually ambiguous glyphs
// (`l`, `I`, `o`, `O`, `0`, `1`) so a user transcribing a generated password
// off-screen can't confuse them. Symbols are limited to shell/URL-safe ones.
const GENERATOR_POOL =
  "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*_+-=?";

// Scoring heuristic used when no explicit `requirements` are supplied.
// Must stay in lockstep with `auth_password.requirements` in the i18n-backed
// uischema options so the meter and error text agree on the same rule set:
// min length 8, contains a letter, contains a digit, contains a symbol.
const FALLBACK_PATTERNS = [/.{8,}/, /[a-zA-Z]/, /\d/, /[^a-zA-Z0-9]/];

/** Cryptographically-random integer in [0, max), with rejection sampling to eliminate modulo bias. */
export function secureRandom(max: number): number {
  const limit = Math.floor(2 ** 32 / max) * max;
  let r: number;
  do {
    r = crypto.getRandomValues(new Uint32Array(1))[0];
  } while (r >= limit);
  return r % max;
}

function randomString(length: number, pool: string): string {
  return times(length, () => pool[secureRandom(pool.length)]).join("");
}

/**
 * Count of `requirements` patterns the value satisfies. Falls back to a
 * generic 4-point heuristic (length≥8, letter, digit, symbol) when absent.
 */
export function scorePassword(
  value?: string,
  requirements?: Record<string, string>
): number {
  const patterns = requirements
    ? map(values(requirements), p => new RegExp(p))
    : FALLBACK_PATTERNS;
  return filter(patterns, p => p.test(value ?? "")).length;
}

/**
 * Resolve unmet requirements to a composite i18n key naming the whole failure
 * set. `min_length` leads the key when length is unmet; the remaining rule
 * names are sorted alphabetically for determinism. Returns `null` when the
 * value satisfies everything.
 *
 * Examples (requirements = `{ min_length, letter, number, symbol }`):
 *   nothing unmet         → null
 *   letter unmet          → "missing_letter"
 *   number + symbol unmet → "missing_number_symbol"
 *   min_length + number   → "min_length_number"
 *   all four unmet        → "min_length_letter_number_symbol"
 */
export function getPasswordErrorKey(
  requirements: Record<string, string>,
  value?: string
): string | null {
  const unmet = keys(
    omitBy(requirements, (pattern: string) =>
      new RegExp(pattern).test(value ?? "")
    )
  );
  if (unmet.length === 0) return null;
  const hasMinLength = includes(unmet, "min_length");
  const others = sortBy(without(unmet, "min_length"));
  return hasMinLength
    ? ["min_length", ...others].join("_")
    : ["missing", ...others].join("_");
}

/** Generate a random password that satisfies every `requirements` pattern, drawing from 20 candidates. */
export function generateStrongPassword(
  length: number,
  requirements?: Record<string, string>
): string {
  const patterns = map(values(requirements ?? {}), p => new RegExp(p));
  const candidates = times(20, () => randomString(length, GENERATOR_POOL));
  return (
    find(candidates, c => every(patterns, p => p.test(c))) ?? candidates[0]
  );
}
