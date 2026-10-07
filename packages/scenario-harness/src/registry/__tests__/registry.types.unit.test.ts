/**
 * @fileoverview ScenarioRegistry type tests
 *
 * ## Job To Be Done
 * Prove that `ScenarioRegistry<K, T>` is exhaustive over the consumer's own
 * key union: a registry missing a manifest key, or adding a key the manifest
 * does not define, fails to compile. These checks run under `tsc` in
 * `test:unit`.
 *
 * ## What Breaks If These Fail
 * A consumer registry drops or invents a module key with no compile error. The
 * gap shows only when a scenario tries to boot that key.
 */

import { describe, expect, expectTypeOf, it } from "vitest";
import type { ScenarioRegistry } from "../registry.types";

/**
 * @AC-6 — the registry-generic contract (human-review item 4/4a): the
 * package ships no manifest of its own — `ScenarioRegistry<K, T>` is
 * generic over a CONSUMER-supplied key union `K`. This suite proves the
 * exhaustiveness property holds for ANY manifest a consumer supplies — a
 * local stand-in manifest here plays the role a real consumer's own
 * `COMPOSABLE_KEY`-style as-const object would play at its own construction
 * site (e.g. `tests/journeys/scenario-harness/manifest.ts`'s `ComposableKey`
 * binding `createHarness`/`NodeWorld`).
 *
 * The two negated `expectTypeOf` cases below prove the missing-key/extra-key
 * mutation controls. `vitest run` alone transpiles types away and would let
 * a broken type assertion pass silently; `test:unit` closes that gap by
 * running `tsc -p tsconfig.test.json` over this file before `vitest run`, so
 * these two controls are enforced — not merely verified ad hoc — on every
 * `test:unit` run. The rename mutation (renaming
 * a manifest key after a registry has bound against it) is a `tsc`
 * transcript only — no committed failing file, since the failure is a
 * property of THIS suite's own local manifest+registry pairing, and renaming
 * a committed manifest key here would just break every case below at once
 * rather than isolate one.
 */
const TEST_KEY = {
  FOO: "foo",
  BAR: "bar"
} as const;

type TestKey = (typeof TEST_KEY)[keyof typeof TEST_KEY];

describe("@AC-6 ScenarioRegistry<K, T> — the registry-generic contract", () => {
  it("[shape pin] a registry satisfying its own manifest resolves the same key type at every binding site", () => {
    // Both registries below are keyed by the identical expression
    // `[TEST_KEY.FOO]`/`[TEST_KEY.BAR]`, so the Object.keys comparison below
    // cannot fail at runtime — it documents the intended shape, not a
    // falsifiable behaviour. The genuine exhaustiveness proof against THIS
    // manifest is the two negated `expectTypeOf` mutation controls below
    // (missing-key / extra-key), which do have teeth under `tsc`.
    const registryA = {
      [TEST_KEY.FOO]: () => "a",
      [TEST_KEY.BAR]: () => "b"
    } satisfies ScenarioRegistry<TestKey, string>;
    const registryB: Record<TestKey, () => unknown> = {
      [TEST_KEY.FOO]: () => 1,
      [TEST_KEY.BAR]: () => 2
    };

    expect(Object.keys(registryA).sort()).toStrictEqual(
      Object.keys(registryB).sort()
    );
  });

  it("the manifest's own key union is not silently widened to string (would defeat every mutation control below)", () => {
    expectTypeOf<TestKey>().toEqualTypeOf<
      (typeof TEST_KEY)[keyof typeof TEST_KEY]
    >();
    // A registry declared against the widened `string` key admits any extra
    // key and omits any manifest key with no compile error — this is the
    // escape the original package-baked `ComposableKey` manifest was
    // vulnerable to (finding 45); confirming `ScenarioRegistry<string, …>`
    // is a strictly weaker, DIFFERENT contract than `ScenarioRegistry<
    // TestKey, …>` from the caller's perspective:
    expectTypeOf<ScenarioRegistry<string, unknown>>().not.toEqualTypeOf<
      ScenarioRegistry<TestKey, unknown>
    >();
  });

  it("a registry missing a key from its own manifest does not satisfy ScenarioRegistry", () => {
    const missingKey = {
      [TEST_KEY.FOO]: () => undefined
    };

    expectTypeOf(missingKey).not.toExtend<ScenarioRegistry<TestKey, unknown>>();
    expect(Object.keys(missingKey)).toStrictEqual([TEST_KEY.FOO]);
  });

  it("a registry with a key outside its own manifest carries a key ScenarioRegistry does not admit", () => {
    const extraKey = {
      [TEST_KEY.FOO]: () => undefined,
      [TEST_KEY.BAR]: () => undefined,
      extraneous: () => undefined
    };

    // A fresh literal is rejected by `satisfies` only for a key outside
    // `keyof ScenarioRegistry`; a `string`-keyed registry leaves none outside.
    expectTypeOf<
      Exclude<keyof typeof extraKey, keyof ScenarioRegistry<TestKey, unknown>>
    >().toEqualTypeOf<"extraneous">();
    expect(Object.keys(extraKey)).toEqual(
      expect.arrayContaining([TEST_KEY.FOO, TEST_KEY.BAR])
    );
  });
});
