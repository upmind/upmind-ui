import { castArray, find, get, isEmpty, isNil, omit } from "lodash-es";

export type TestAttrsOptions = {
  key?: string; // optional: omit to emit only what dataAttrs/overrides provide (Vue drops undefined-valued attrs)
  value?: (string | unknown) | (string | unknown)[]; // cascade values, in priority order
  dataAttrs?: Record<string, string | unknown>; // defined bag of data attributes
};

/**
 * Generates the `data-test-key`/`data-test-value` pair for a component, and
 * strips them (returns `{}`) in production builds.
 *
 * Pure function of its `input` — it does NOT read `useAttrs()`, so it is not
 * bound to `setup` and is safe to call inline, in a `computed`, or from a
 * template helper, and re-evaluates reactively wherever it is called.
 *
 * A parent overrides a component's own key/value by passing them through the
 * component's `dataAttrs` prop (`input.dataAttrs`), NOT by fallthrough — a
 * fallthrough `data-test-*` would auto-inherit onto every nested element and
 * collide (e.g. one key matching 20+ descendants under strict-mode locators).
 *
 * @param input - key, value cascade, and optional dataAttrs override bag.
 * @returns the test-attribute pair (dev) or an empty object (production).
 */
export function useTestAttrs(input: TestAttrsOptions) {
  // Strip data-test-* from the override bag so the pair below is the single
  // source of the key/value (no duplication when spread onto an element).
  const dataAttrs = omit(input.dataAttrs ?? {}, [
    "data-test-key",
    "data-test-value"
  ]) as Record<string, any>;

  // In production, emit only the non-test data attributes.
  if (import.meta.env.PROD) return dataAttrs;

  const overrideKey = get(input.dataAttrs ?? {}, "data-test-key");
  const overrideValue = get(input.dataAttrs ?? {}, "data-test-value");

  const key = overrideKey || input.key;
  // NB: guard the override with isNil (not truthiness) — a valid numeric 0
  // override (e.g. an action index passed via dataAttrs) is falsy, so a plain
  // `overrideValue || …` would silently drop it and fall through to the cascade.
  // NB: the cascade itself accepts numbers explicitly — lodash isEmpty() is
  // true for every number, so a plain !isEmpty predicate would drop them too.
  const value = !isNil(overrideValue)
    ? overrideValue
    : find(castArray(input.value), v => typeof v === "number" || !isEmpty(v));

  const testAttrs: Record<string, string> = {};
  // Only emit defined keys — an undefined entry bound via v-bind would clash
  // with (and can clear) a parent's fallthrough attr of the same name. Omitting
  // it makes a keyless useTestAttrs() a true no-op that fallthrough passes through.
  if (key != null) testAttrs["data-test-key"] = key as string;
  if (value != null) testAttrs["data-test-value"] = value as string;

  return { ...dataAttrs, ...testAttrs };
}
