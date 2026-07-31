import { COMPOSABLE_KEY } from "../registry/registry";
import { createFixtureModule } from "./fixture-module";
import type { FixtureModule } from "./fixture-module";
import type { ComposableKey } from "../registry/registry";
import type { ComposableRegistry } from "../registry/registry.types";
import type { ScopeActor } from "../world/scope-actor";
import type { World, WorldScope } from "../world/world.types";

/**
 * Test-local factory registry: binds the exemplar fixture to the existing
 * `COMPOSABLE_KEY.AUTH` manifest entry rather than adding a fixture-only key
 * to the shared manifest — the manifest stays single-sourced. Each entry
 * returns the per-actor builder, mirroring the real adapter's "invoke the
 * builder once with `.as(actor)`" shape without a second key source
 * anywhere.
 */
const fixtureRegistry = {
  [COMPOSABLE_KEY.AUTH]: () => createFixtureModule
} satisfies ComposableRegistry<(actor: ScopeActor) => FixtureModule>;

function readAction(
  module: FixtureModule,
  actionId: string
): (input?: unknown) => unknown {
  const action = (
    module.actions as Record<string, (input?: unknown) => unknown>
  )[actionId];

  if (typeof action !== "function") {
    throw new Error(`node-world: unknown action "${actionId}"`);
  }

  return action;
}

function readMeta(module: FixtureModule): Record<string, boolean> {
  return module.meta as unknown as Record<string, boolean>;
}

/**
 * The in-process Node `World` — the @AC-5 exemplar's execution
 * channel. Wraps the fixture module directly (no bridge, no browser): `boot`
 * builds one instance per scenario, `fire`/`expectMeta` read and drive it
 * through plain data, `dispose` drops the reference so the next `boot` starts
 * clean.
 */
export class NodeWorld implements World {
  private module: FixtureModule | undefined;

  async boot(key: ComposableKey, scope: WorldScope): Promise<void> {
    const buildModule = fixtureRegistry[key]();

    this.module = buildModule(scope.actor);
  }

  async fire(actionId: string, input?: unknown): Promise<void> {
    await readAction(this.requireModule(), actionId)(input);
  }

  async expectMeta(expected: Partial<Record<string, boolean>>): Promise<void> {
    const live = readMeta(this.requireModule());

    for (const [flag, value] of Object.entries(expected)) {
      if (live[flag] !== value) {
        throw new Error(
          `node-world: expected meta "${flag}" to be ${value}, got ${live[flag]}`
        );
      }
    }
  }

  async dispose(): Promise<void> {
    this.module = undefined;
  }

  private requireModule(): FixtureModule {
    if (!this.module) {
      throw new Error("node-world: boot() has not been called yet");
    }

    return this.module;
  }
}
