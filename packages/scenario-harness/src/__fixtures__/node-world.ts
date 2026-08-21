import type { FixtureModule } from "./fixture-module.types";
import type { ScenarioRegistry } from "../registry/registry.types";
import type { ScopeActor } from "../world/scope-actor";
import type { World, WorldScope } from "../world/world.types";

function readAction(
  module: FixtureModule,
  actionId: string
): (input?: unknown) => unknown {
  const actions = module.actions as Record<
    string,
    (input?: unknown) => unknown
  >;
  const action = Object.hasOwn(actions, actionId)
    ? actions[actionId]
    : undefined;

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
 *
 * Registry-generic (item 4/4a): the caller hands its own
 * `ScenarioRegistry<K, …>` in at construction — no manifest is baked into
 * this class or the package. `./fixture-registry.ts` builds the local
 * registry this package's own fixture consumes.
 */
export class NodeWorld<K extends string> implements World<K> {
  private module: FixtureModule | undefined;

  constructor(
    private readonly registry: ScenarioRegistry<
      K,
      (actor: ScopeActor) => FixtureModule
    >
  ) {}

  async boot(key: K, scope: WorldScope): Promise<void> {
    // Dispose-then-boot: a second `boot()` in one scenario tears down the
    // previous instance first rather than silently overwriting the
    // reference. `FixtureModule` itself owns nothing to tear down, but this
    // is the exemplar every real world (over a destroyable module, e.g. an
    // `AuthBoot`-shaped port with a `destroy()`) is meant to copy — without
    // this, that copy would leak a live instance into a shared registry.
    await this.dispose();

    const buildModule = this.registry[key]();

    this.module = buildModule(scope.actor);
  }

  async fire(actionId: string, input?: unknown): Promise<void> {
    await readAction(this.requireModule(), actionId)(input);
  }

  async expectMeta(expected: Record<string, boolean>): Promise<void> {
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
