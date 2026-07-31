import { describe, expect, it } from "vitest";
import { COMPOSABLE_KEY } from "../registry";
import type { ComposableKey } from "../registry";
import type { ComposableRegistry } from "../registry.types";

/**
 * @AC-6 — composableRegistry and the one shared key union.
 *
 * The two `@ts-expect-error` fixtures below are the bdd @AC-6 scenarios 2–3
 * (missing/extra manifest key), verified by a `tsc` pass over this file (the
 * package's own tsconfig excludes `**\/*.test.*` from its editor/lint
 * program, so this is proved by an ad hoc `tsc --noEmit` invocation at
 * read-back time, not by `vitest run`, which transpiles types away). The
 * rename mutation (bdd @AC-6 scenario 1) is a `tsc` transcript only — no
 * committed failing file — produced the same way at read-back time.
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
