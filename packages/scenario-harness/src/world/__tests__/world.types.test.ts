import { describe, expectTypeOf, it } from "vitest";
import type { ComposableKey } from "../../registry/registry";
import type { SeedRef, World, WorldScope } from "../world.types";

/**
 * @AC-4 — the `world` interface every step definition speaks. `expectTypeOf`
 * assertions are type-level only: they document and pin the contract here,
 * but (like the @AC-6 `@ts-expect-error` fixtures) need a real `tsc` pass to
 * have teeth — `vitest run` alone transpiles types away. `test:unit` runs
 * `tsc -p tsconfig.test.json` over this file before `vitest run`, so these
 * assertions are enforced on every `test:unit` run, not merely verified ad
 * hoc.
 */
describe("@AC-4 World — type surface", () => {
  it("every member returns a Promise (never a DOM/Playwright shape)", () => {
    expectTypeOf<ReturnType<World["boot"]>>().toEqualTypeOf<Promise<void>>();
    expectTypeOf<ReturnType<World["fire"]>>().toEqualTypeOf<Promise<void>>();
    expectTypeOf<ReturnType<World["expectMeta"]>>().toEqualTypeOf<
      Promise<void>
    >();
    expectTypeOf<ReturnType<World["dispose"]>>().toEqualTypeOf<Promise<void>>();
  });

  it("boot() takes a ComposableKey and a WorldScope, nothing engine-specific", () => {
    expectTypeOf<World["boot"]>().parameter(0).toEqualTypeOf<ComposableKey>();
    expectTypeOf<World["boot"]>().parameter(1).toEqualTypeOf<WorldScope>();
  });

  it("expectMeta() is a subset match over plain booleans", () => {
    expectTypeOf<World["expectMeta"]>()
      .parameter(0)
      .toEqualTypeOf<Partial<Record<string, boolean>>>();
  });

  it("WorldScope.seed is a structural SeedRef, never a DOM/browser handle", () => {
    expectTypeOf<WorldScope["seed"]>().toEqualTypeOf<SeedRef | undefined>();
    expectTypeOf<SeedRef>().toEqualTypeOf<{ journey: string }>();
  });

  it("an in-page-shaped stub typechecks against World (@AC-4 stub leg 1)", () => {
    const inPageStub: World = {
      async boot() {},
      async fire() {},
      async expectMeta() {},
      async expectContext() {},
      async dispose() {}
    };

    expectTypeOf(inPageStub).toMatchTypeOf<World>();
  });
});
