import { createFixtureModule } from "./fixture-module";
import type { FixtureModule } from "./fixture-module.types";
import type { ComposableRegistry } from "../registry/registry.types";
import type { ScopeActor } from "../world/scope-actor";

/**
 * This package's own fixture manifest — local to `__fixtures__`, never
 * exported from the package barrel. Proves the harness is registry-generic:
 * a consumer builds its own key union and factory map exactly like this one,
 * then hands it to `NodeWorld`/`createHarness` at construction time.
 */
export const FIXTURE_KEY = {
  SWITCH: "switch"
} as const;

export type FixtureKey = (typeof FIXTURE_KEY)[keyof typeof FIXTURE_KEY];

export const fixtureRegistry = {
  [FIXTURE_KEY.SWITCH]: () => createFixtureModule
} satisfies ComposableRegistry<
  FixtureKey,
  (actor: ScopeActor) => FixtureModule
>;
