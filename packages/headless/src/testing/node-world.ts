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
 * It holds one live cell PER scenario key: booting a key replaces only THAT
 * key's cell, and cells under different keys live together — a list and any
 * number of editors at once (two image editors re-uploading independently,
 * client-custom-fields AC-22). A step addresses a cell by its scenario key
 * (`fire` / `expectMeta` / `expectContext`'s optional `key`); with none, the
 * last-booted cell answers.
 *
 * @remarks Lives beside the harness half of the test artefacts rather than in
 * `@upmind-automation/scenario-harness`: building a cell is `.as()`/`.for()`,
 * which is headless's own scope builder, and that package is vue-free by lint
 * boundary.
 */

import { unref } from "vue";
import {
  fireArgv,
  matchesExpectation
} from "@upmind-automation/scenario-harness";
import {
  difference,
  get,
  isEmpty,
  isFunction,
  isNumber,
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
  /**
   * Present on a module whose matrix offers a context; absent on one that does
   * not. The `id` is present for a RETARGET member and absent for a SELECTOR
   * one, mirroring `WorldScope.context`.
   */
  for?: (type: string, id?: string) => NodeScopedCell;
  /** Present on a single read: marks the ONE record it fetches (`WorldScope.id`). */
  withId?: (id: string) => NodeScopedCell;
  /**
   * Spawns a DISTINCT instance, never the scope registry's cached one — the
   * builder's own `.fresh()`. A list and its editor register under one module
   * name, so a bare `{ actor }` editor booted beside a live list would otherwise
   * adopt the list's cached cell; `.fresh()` gives it its own instance.
   */
  fresh?: () => NodeScopedCell;
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

/**
 * Serialises an already-unwrapped layer snapshot to a searchable string,
 * dropping cycles (a published `query` handle holds circular reactive refs) so
 * a whole-layer substring search never throws on them.
 */
function searchable(snapshot: unknown): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(snapshot, (_key, val) => {
    if (typeof val === "object" && val !== null) {
      if (seen.has(val)) return undefined;
      seen.add(val);
    }
    return val;
  });
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
  /** One live cell per scenario key — cells under different keys coexist. */
  const live = new Map<K, NodeScopedCell>();

  /** The key booted last — the cell a step addresses when it names no key. */
  let lastKey: K | undefined;

  /** The action a `fireHold` left running on a cell, awaited by `settle`. */
  const inflight = new Map<NodeScopedCell, Promise<unknown>>();

  /**
   * The cell a step targets: the one booted under `key` when a step names one,
   * else the last-booted cell. A named key that no live cell booted is a
   * REFUSAL, not a silent fall-through to the wrong cell.
   */
  function targetCell(key?: K): NodeScopedCell {
    if (key !== undefined) {
      const cell = live.get(key);
      if (!cell)
        fail(
          `no live cell for key "${key}" — booted ${named([...live.keys()])}`
        );
      return cell;
    }

    if (lastKey === undefined || !live.has(lastKey))
      fail("boot() has not been called yet");
    return live.get(lastKey)!;
  }

  /**
   * Resolves an action off a cell and calls it with the argv `fireArgv` derives:
   * a spread `args(...)` envelope, an empty argv for a bare `undefined` (an
   * optional-parameter action called bare), or the lone value otherwise. Returns
   * the action's own result so `fireHold` can park the pending promise.
   */
  function invoke(
    cell: NodeScopedCell,
    actionId: string,
    input?: unknown
  ): unknown {
    const actions = cell.useActions();
    const action = get(actions, actionId);

    if (!isFunction(action))
      fail(
        `unknown action "${actionId}" — the booted composable publishes ${named(keys(actions))}`
      );

    return (action as (...values: unknown[]) => unknown)(...fireArgv(input));
  }

  /**
   * The meta layer unwrapped ONE `unref` pass deep, then read PER expectation:
   * a key the step expects as a number keeps its raw value (a count reads as
   * itself); every other key is coerced to a real boolean, so a truthy
   * non-boolean cannot satisfy a `true` expectation by identity alone. The
   * unwrap-not-deep-walk rule is `useCompositionPort`'s, for its reason: the
   * four-layer contract puts refs at the TOP of a layer over plain values.
   */
  function liveMeta(
    cell: NodeScopedCell,
    expected: Record<string, boolean | number>
  ): Record<string, unknown> {
    return mapValues(cell.useMeta(), (flag, name) =>
      isNumber(get(expected, name)) ? unref(flag) : !!unref(flag)
    );
  }

  /**
   * The context layer unwrapped the same way, with callables dropped: a context
   * legitimately publishes functions (`default`, `findOne`), and `isMatch` over
   * a closure can only ever compare identity.
   */
  function liveContext(cell: NodeScopedCell): Record<string, unknown> {
    return omitBy(mapValues(cell.useContext(), unref), isFunction);
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

  /**
   * Destroys ONE cell: `destroy()` stops the machine AND deregisters the scope
   * entry, so the next `boot` at the same scope key builds a genuinely fresh
   * instance rather than adopting the previous scenario's settled one.
   */
  function disposeCell(cell: NodeScopedCell | undefined): void {
    const destroy = get(cell?.useActions() ?? {}, "destroy");
    if (isFunction(destroy)) (destroy as () => void)();
  }

  async function dispose(): Promise<void> {
    for (const cell of live.values()) disposeCell(cell);
    live.clear();
    inflight.clear();
    lastKey = undefined;
  }

  return {
    async boot(key: K, scope: WorldScope) {
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
      const actorScoped = composable().as(scope.actor as never);

      // A bare boot (no context, no id) keys under the module's BASE scope key,
      // which a list and its editor share (they register under one module name).
      // With any other cell already live, the scope registry would hand this boot
      // that cell rather than build a new one — a second editor adopting the
      // first, or the editor adopting the live list. `.fresh()` forces a distinct
      // instance so cells under different keys coexist, exactly as the labs
      // new-record editor opens (`useModulePort` `fresh`).
      const based =
        live.size > 0 &&
        !scope.context &&
        !scope.id &&
        isFunction(actorScoped.fresh)
          ? actorScoped.fresh()
          : actorScoped;

      // `.withId(id)` marks the ONE record a single read fetches, exactly as
      // the labs port applies it (`useModulePort.ts`): after `.as()`, before
      // `.for()`, because the two compose (FE-3095).
      const scoped =
        scope.id && isFunction(based.withId) ? based.withId(scope.id) : based;

      // `.for(type, id)` names an entity the ACTOR acts upon; a module whose
      // matrix offers no context publishes no `.for`, and a scope that names
      // none never reaches for it.
      // The world is generic over every module, so the cell's `.for` is read
      // through the one signature both patterns share: `(type, id?)` — a
      // context with no id retargets by type alone (develop, FE-3029).
      const retarget = (
        scoped as { for?: (type: string, id?: string) => NodeScopedCell }
      ).for;
      const built =
        scope.context && isFunction(retarget)
          ? isNil(scope.context.id)
            ? retarget(scope.context.type)
            : retarget(scope.context.type, scope.context.id)
          : scoped;

      // Keep every other key's live cell; dispose only a PREVIOUS cell booted
      // under THIS key. A keyed re-boot that resolves to the SAME cached instance
      // (`built === held`) is left in place rather than destroyed — never tearing
      // down the cell just handed back.
      const held = live.get(key);
      if (held && held !== built) disposeCell(held);

      live.set(key, built);
      lastKey = key;
    },

    async fire(actionId: string, input?: unknown, key?: K) {
      await invoke(targetCell(key), actionId, input);
    },

    async fireHold(actionId: string, input?: unknown, key?: K) {
      const cell = targetCell(key);
      // Start the action WITHOUT awaiting it: the response is held open
      // (`replayStep`'s `delayMs`), so this returns while the machine sits in
      // `processing`, letting the next step observe `isProcessing`. The pending
      // promise is parked per cell for `settle` to await — its rejection is
      // swallowed here so an unhandled rejection cannot escape between the two
      // steps; `settle` is the one that surfaces (or, per AC13, ignores) it.
      const pending = Promise.resolve(invoke(cell, actionId, input)).catch(
        () => undefined
      );
      inflight.set(cell, pending);
    },

    async settle(key?: K) {
      const cell = targetCell(key);
      const pending = inflight.get(cell);
      if (!pending) return;
      inflight.delete(cell);
      await pending;
    },

    async expectMeta(expected: Record<string, boolean | number>, key?: K) {
      const cell = targetCell(key);
      expectSubset("meta", liveMeta(cell, expected), expected);
    },

    async expectContext(expected: Record<string, unknown>, key?: K) {
      expectSubset("context", liveContext(targetCell(key)), expected);
    },

    async expectAbsent(value: string, key?: K) {
      const cell = targetCell(key);
      const published = {
        context: omitBy(mapValues(cell.useContext(), unref), isFunction),
        meta: omitBy(mapValues(cell.useMeta(), unref), isFunction)
      };
      if (searchable(published).includes(value))
        fail(
          `expected "${value}" to appear nowhere in the addressed cell's published context or meta, but it does`
        );
    },

    dispose
  };
}
