// -----------------------------------------------------------------------------
/**
 * @module testing/node-world
 * @description The IN-PROCESS `World` — the BDD execution seam driven against a
 * module's REAL scoped composables inside vitest, so one `.feature` runs in the
 * headless integration lane and in the playground without a second
 * implementation of the scenario.
 *
 * It is the THIRD executor of that one seam, and deliberately the smallest.
 * `packages/scenario-harness/src/__fixtures__/node-world.ts` drives a fixture
 * module (no framework at all, no recordings), and
 * `playgrounds/labs-nuxt/modules/scenarios/runtime/composables/useScenarioWorld.ts`
 * drives the rendered page (a stage, a beat, an editor). This one drives the
 * COMPOSABLE and nothing else: there is no screen to press, so `fire` resolves
 * `useActions()[id]` directly — exactly the branch `useScenarioWorld` falls
 * through to when no surface is mounted.
 *
 * Registry-generic, as both of those are: it holds no module knowledge at all.
 * `boot` looks the key up in the composable map its caller supplies, and
 * everything else reads the cell that resolved.
 *
 * @remarks Lives beside the harness half of the test artefacts rather than in
 * `@upmind-automation/scenario-harness`: building a cell is `.as()`/`.for()`,
 * which is headless's own scope builder, and that package is vue-free by lint
 * boundary.
 */

import { unref } from "vue";
import { matchesExpectation } from "@upmind-automation/scenario-harness";
import {
  difference,
  get,
  isEmpty,
  isFunction,
  keys,
  mapValues,
  omitBy,
  pick,
  isNil
} from "lodash-es";
import type { World, WorldScope } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/**
 * One ALREADY-SCOPED four-layer cell, structurally: what
 * `useModule().as(actor)` (and `.for(type, id)` after it) hands back. Typed
 * loosely on purpose — the seam's contract is one opaque input invoked by name
 * (`world.fire(actionId, input?)`), and every real action types its own input,
 * so no concretely-typed module is assignable to a narrower shape here. The
 * widening is this adapter's job, exactly as it is `useCompositionPort`'s.
 */
export type NodeScopedCell = {
  useActions: () => Record<string, unknown>;
  useContext: () => Record<string, unknown>;
  useMeta: () => Record<string, unknown>;
  /** Present on a module whose matrix offers a context; absent on one that does not. */
  for?: (type: string, id: string) => NodeScopedCell;
};

/** The module builder a scenario key resolves to — `useBillingSettingsManager` and its kind. */
export type NodeComposable = (...args: never[]) => {
  as: (actor: never) => NodeScopedCell;
};

/**
 * A recorded journey, by the name a `.feature`'s step asks for through
 * `WorldScope.seed`. The world holds NO journey of its own: a seed is an
 * arrangement over the caller's own recorded corpus (which fixture answers
 * which route), so the test that owns the recordings declares it and this world
 * only runs it — before the cell is built, so the boot reads the arranged wire.
 *
 * A seed naming a journey the caller did not declare is a REFUSAL, never a
 * silently-ignored field: `WorldScope.seed` is honoured by no other executor
 * today, and a world that dropped it would replay the happy path under a
 * failure scenario's name and stay green.
 */
export type NodeWorldJourneys = Record<string, () => void | Promise<void>>;

/** What a caller hands `createNodeWorld` — its own module map and its own journeys. */
export type NodeWorldSource<K extends string> = {
  /** Scenario key -> the module builder that key boots. */
  composables: Record<K, NodeComposable>;
  /** The recorded arrangements `WorldScope.seed` may name; absent means none is served. */
  journeys?: NodeWorldJourneys;
};

// -----------------------------------------------------------------------------

/** Every failure here is a harness-authoring mistake, surfaced as a plain Error. */
function fail(message: string): never {
  throw new Error(`node-world: ${message}`);
}

/** The names a message lists, or the honest word for an empty set. */
function named(values: readonly string[]): string {
  return isEmpty(values) ? "none" : values.join(", ");
}

// -----------------------------------------------------------------------------

/**
 * Builds the in-process world over a caller's own composable map.
 *
 * @param source The scenario keys this world can boot, and the recorded
 * journeys its `boot` may be seeded with.
 */
export function createNodeWorld<K extends string>(
  source: NodeWorldSource<K>
): World<K> {
  let cell: NodeScopedCell | undefined;

  function requireCell(): NodeScopedCell {
    if (!cell) fail("boot() has not been called yet");
    return cell;
  }

  /**
   * One `unref` pass per layer, never a deep walk — `useCompositionPort`'s own
   * rule, and for its reason: the four-layer contract puts refs at the TOP of a
   * layer over plain values. Meta is coerced to real booleans because
   * `expectMeta` is typed `Record<string, boolean>`, so a truthy non-boolean
   * can never satisfy a `true` expectation by identity alone.
   */
  function liveMeta(): Record<string, boolean> {
    return mapValues(requireCell().useMeta(), flag => !!unref(flag));
  }

  /**
   * The context layer unwrapped the same way, with callables dropped: a context
   * legitimately publishes functions (`default`, `findOne`), and `isMatch` over
   * a closure can only ever compare identity.
   */
  function liveContext(): Record<string, unknown> {
    return omitBy(mapValues(requireCell().useContext(), unref), isFunction);
  }

  /**
   * The subset match both expectations share. An expected key the live layer
   * does not publish AT ALL is called out by name rather than left to read as a
   * value mismatch: a renamed flag (`hasError` for a manager's `hasErrors`) is
   * the failure this replay exists to catch, and `{}` is not a diagnosis.
   *
   * The match itself is the harness's `matchesExpectation` — the one reading
   * every World shares, in which an expected `null` is a CLEARED value.
   */
  function expectSubset(
    layer: string,
    live: Record<string, unknown>,
    expected: Record<string, unknown>
  ): void {
    const unknown = difference(keys(expected), keys(live));

    if (!isEmpty(unknown))
      fail(
        `unknown ${layer} member(s) ${named(unknown)} — the booted composable publishes ${named(keys(live))}`
      );

    if (!matchesExpectation(live, expected))
      fail(
        `${layer} mismatch — expected ${JSON.stringify(expected)}, got ${JSON.stringify(pick(live, keys(expected)))}`
      );
  }

  async function dispose(): Promise<void> {
    // `destroy()` stops the machine AND deregisters the scope entry, so the
    // next `boot` at the same scope key builds a genuinely fresh instance
    // rather than adopting the previous scenario's settled one.
    const destroy = get(cell?.useActions() ?? {}, "destroy");
    if (isFunction(destroy)) (destroy as () => void)();
    cell = undefined;
  }

  return {
    async boot(key: K, scope: WorldScope) {
      // Dispose-then-boot, never adopt: the playground adopts because the cell
      // it holds IS the rendered surface, and destroying it would tear the page
      // down mid-track. Nothing is rendered here, and a scenario's arrangement
      // wants the instance its own `Given` built — not the Background's.
      await dispose();

      const composable = get(source.composables, key) as
        | NodeComposable
        | undefined;

      if (!isFunction(composable))
        fail(
          `unknown scenario key "${key}" — this replay boots ${named(keys(source.composables))}`
        );

      // Before the cell, deliberately: a journey arranges the wire the boot is
      // about to read.
      if (scope.seed) {
        const journey = get(source.journeys ?? {}, scope.seed.journey);

        if (!isFunction(journey))
          fail(
            `the scenario boots the "${scope.seed.journey}" journey, which this replay declares no arrangement for — declare it beside the recording it replays, never around it. Declared journeys: ${named(keys(source.journeys ?? {}))}`
          );

        await (journey as () => void | Promise<void>)();
      }

      // The harness's `ScopeActor` is a documented mirror of headless's own
      // `ScopeActorTypes` over the vue-free source enum
      // (`scenario-harness/src/world/scope-actor.ts`) and shares its wire
      // values, so a feature may name the actor and it lands as the enum the
      // scope builder takes.
      const scoped = composable().as(scope.actor as never);

      // `.for(type, id)` names an entity the ACTOR acts upon; a module whose
      // matrix offers no context publishes no `.for`, and a scope that names
      // none never reaches for it.
      // The world is generic over every module, so the cell's `.for` is read
      // through the one signature both patterns share: `(type, id?)`.
      const retarget = (
        scoped as { for?: (type: string, id?: string) => NodeScopedCell }
      ).for;
      cell = scoped;
      if (scope.context && isFunction(retarget)) {
        cell = isNil(scope.context.id)
          ? retarget(scope.context.type)
          : retarget(scope.context.type, scope.context.id);
      }
    },

    async fire(actionId: string, input?: unknown) {
      const actions = requireCell().useActions();
      const action = get(actions, actionId);

      if (!isFunction(action))
        fail(
          `unknown action "${actionId}" — the booted composable publishes ${named(keys(actions))}`
        );

      const call = action as (value?: unknown) => unknown;

      // Called bare when the step carried no input: an action with an optional
      // parameter reads an explicit `undefined` as a supplied one.
      await (input === undefined ? call() : call(input));
    },

    async expectMeta(expected: Record<string, boolean>) {
      expectSubset("meta", liveMeta(), expected);
    },

    async expectContext(expected: Record<string, unknown>) {
      expectSubset("context", liveContext(), expected);
    },

    dispose
  };
}
