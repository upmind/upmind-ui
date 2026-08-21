import { describe, expectTypeOf, it } from "vitest";
import type { FixtureKey } from "../../__fixtures__/fixture-registry";
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

  it("boot() takes K (the consumer's own manifest key) and a WorldScope, nothing engine-specific", () => {
    expectTypeOf<World<FixtureKey>["boot"]>()
      .parameter(0)
      .toEqualTypeOf<FixtureKey>();
    expectTypeOf<World<FixtureKey>["boot"]>()
      .parameter(1)
      .toEqualTypeOf<WorldScope>();
  });

  it("expectMeta() is a subset match over plain booleans — Record, never Partial<Record> (a typo'd/absent flag paired with undefined must be a compile error, not a vacuous pass)", () => {
    expectTypeOf<World["expectMeta"]>()
      .parameter(0)
      .toEqualTypeOf<Record<string, boolean>>();
  });

  it("WorldScope.seed is a structural SeedRef, never a DOM/browser handle", () => {
    expectTypeOf<WorldScope["seed"]>().toEqualTypeOf<SeedRef | undefined>();
    expectTypeOf<SeedRef>().toEqualTypeOf<{ journey: string }>();
  });

  it("an in-page-shaped stub typechecks against World (@AC-4 stub leg 1)", () => {
    // Deliberately unannotated: annotating this literal `: World<FixtureKey>`
    // would make the assertion below re-assert what the annotation already
    // guaranteed and could never fail independently of it. Left bare, tsc
    // infers the literal's own shape and `toMatchTypeOf` performs the real
    // structural check against `World<FixtureKey>`.
    const inPageStub = {
      async boot() {},
      async fire() {},
      async expectMeta() {},
      async expectContext() {},
      async dispose() {}
    };

    expectTypeOf(inPageStub).toMatchTypeOf<World<FixtureKey>>();
  });

  it("a stub missing dispose does not satisfy World (@AC-4 stub leg 1, negative control)", () => {
    const stubMissingDispose = {
      async boot() {},
      async fire() {},
      async expectMeta() {}
    };

    // @ts-expect-error — `World<FixtureKey>` requires `dispose`; a stub
    // missing it must not typecheck against the interface. This is the
    // control that gives the leg-1 assertion above teeth: without it,
    // widening `World` to `Record<string, unknown>` (or dropping a member)
    // would leave every case in this file green.
    expectTypeOf(stubMissingDispose).toMatchTypeOf<World<FixtureKey>>();
  });
});
