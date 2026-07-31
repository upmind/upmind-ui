import { describe, expect, it } from "vitest";
import { COMPOSABLE_KEY } from "../registry";
import type { ComposableKey } from "../registry";
import type { ComposableRegistry } from "../registry.types";

/**
 * @AC-6 — composableRegistry and the one shared key union.
 *
 * The two `@ts-expect-error` fixtures below prove the missing-key/extra-key
 * mutation controls. `vitest run` alone transpiles types away and would let
 * a removed or wrong `@ts-expect-error` directive pass silently; `test:unit`
 * closes that gap by running `tsc -p tsconfig.test.json` over this file
 * before `vitest run`, so these two fixtures are enforced — not merely
 * verified ad hoc — on every `test:unit` run. The rename mutation (renaming
 * `COMPOSABLE_KEY.AUTH` itself) is a `tsc` transcript only — no committed
 * failing file, since renaming the real, committed key would break this
 * whole suite's imports, not just one case.
 */
describe("@AC-6 composableRegistry — the one shared key union", () => {
  it("COMPOSABLE_KEY is the single defining manifest", () => {
    expect(COMPOSABLE_KEY).toStrictEqual({ AUTH: "auth" });
    expect(Object.keys(COMPOSABLE_KEY)).toStrictEqual(["AUTH"]);
  });

  it("both executor registries and a steps fixture resolve to the same key type", () => {
    const executorA = {
      [COMPOSABLE_KEY.AUTH]: () => "a"
    } satisfies ComposableRegistry<string>;
    const executorB: Record<ComposableKey, () => unknown> = {
      [COMPOSABLE_KEY.AUTH]: () => 1
    };

    expect(Object.keys(executorA)).toStrictEqual(Object.keys(executorB));
  });

  it("an executor registry missing a manifest key fails compilation (bdd @AC-6 scenario 2)", () => {
    // @ts-expect-error — `Record<ComposableKey, () => unknown>` requires the
    // `auth` entry; a registry that omits a manifest key must not satisfy
    // `ComposableRegistry`.
    const missingKey = {} satisfies ComposableRegistry<unknown>;

    expect(missingKey).toStrictEqual({});
  });

  it("an executor registry with a key outside the manifest fails compilation (bdd @AC-6 scenario 3)", () => {
    const extraKey = {
      [COMPOSABLE_KEY.AUTH]: () => undefined,
      // @ts-expect-error — `extraneous` is not a `ComposableKey`; a registry
      // adding a key the manifest does not define must not satisfy
      // `ComposableRegistry` (excess-property check on the fresh literal).
      extraneous: () => undefined
    } satisfies ComposableRegistry<unknown>;

    expect(Object.keys(extraKey)).toContain(COMPOSABLE_KEY.AUTH);
  });
});
