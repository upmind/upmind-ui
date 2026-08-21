// @vitest-environment jsdom
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/__tests__/world-adopt.spec
 * @description T4.3 — `boot` ADOPTS the page's own live cell (`AC2.5` ·
 * `AC2.6` · design §3.1 ruling 2 · §7.1). Two branches, one seam:
 *   1. booting the SAME key at the SAME scope adopts the live port — the
 *      page's own cached cell is never destroyed, and the world keeps driving
 *      the very cell the user is looking at;
 *   2. a DIFFERENT key or a DIFFERENT scope disposes exactly as it does today
 *      — without which a track drives an invisible second instance.
 *
 * Scope sameness is by VALUE: the player hands `boot` a scope object it built
 * this tick, never the one the page booted with, so an identity check would
 * dispose the page's cell on every arm.
 *
 * `K12` is why this spec exists at all: the Playwright bridge lane mints one
 * world per page load, so its first `boot` always runs with no live port and
 * the adopt branch is never executed there. The lane stays green whether this
 * rule is right or wrong; this spec is the adopt branch's ONLY net.
 *
 * The bindings are synthetic — a cell cache keyed by scope, which is what the
 * real scope registry gives the page and the world alike (`tests/e2e/catalogs.ts`
 * says so, and it is why an e2e step moves the operator's rows).
 *
 * ## What breaks if these fail
 * Arming a track either tears the rendered page down mid-track (unconditional
 * dispose) or plays it against a cell nobody can see (adopt across scopes).
 *
 * Negative controls: `world-adopt.dispose-shared-cell.must-fail.patch`,
 * `world-adopt.adopt-across-scope.must-fail.patch`.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { computed, ref } from "vue";
import { ScopeActorTypes } from "@upmind-automation/headless";
import { useScenarioWorld } from "../useScenarioWorld";
import { filter, first, get, last, map, size } from "lodash-es";
import type { ScenarioBinding, ScenarioKey } from "../../scenario.types";
import type { LiveCompositionCell } from "../useCompositionPort.types";
import type { WorldScope } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const COLLECTION: ScenarioKey = "useClientEmails";
const EDITOR: ScenarioKey = "useClientEmail";

const CLIENT: WorldScope = { actor: ScopeActorTypes.CLIENT };

const STAFF_FOR_CLIENT: WorldScope = {
  actor: ScopeActorTypes.STAFF,
  context: { type: "client", id: "mock-uuid-1" }
};

const STAFF_FOR_ANOTHER_CLIENT: WorldScope = {
  actor: ScopeActorTypes.STAFF,
  context: { type: "client", id: "mock-uuid-2" }
};

type SpyCell = LiveCompositionCell & {
  key: string;
  destroyed: number;
  fired: string[];
  for(type: string, id: string): SpyCell;
};

/**
 * The tree's own registry behaviour in miniature: a cell is CACHED by its scope
 * key, so the page and the world booting the same scope hold one instance —
 * which is exactly why disposing it takes the rendered page with it.
 */
function scopeRegistry() {
  const cells = new Map<string, SpyCell>();

  const cellFor = (key: string): SpyCell => {
    const cached = cells.get(key);
    if (cached) return cached;

    const rows = ref<string[]>(["mock-email-1@example.com"]);
    const cell: SpyCell = {
      key,
      destroyed: 0,
      fired: [],
      for: (type, id) => cellFor(`${key}/${type}:${id}`),
      useActions: () => ({
        destroy: () => {
          cell.destroyed += 1;
        },
        ensure: (input?: unknown) => {
          cell.fired.push(`ensure:${get(input, "email", "")}`);
        },
        isReady: () => cell.fired.push("isReady")
      }),
      useContext: () => ({ rows: computed(() => rows.value), key: cell.key }),
      useMeta: () => ({ isAvailable: true, isEmpty: false, hasError: false })
    };

    cells.set(key, cell);
    return cell;
  };

  const bindings: Record<ScenarioKey, ScenarioBinding> = {
    [COLLECTION]: {
      useList: () => ({ as: actor => cellFor(`${COLLECTION}/${actor}`) }),
      scope: { actor: ScopeActorTypes.CLIENT, contextType: "client" }
    },
    [EDITOR]: {
      useList: () => ({ as: actor => cellFor(`${EDITOR}/${actor}`) }),
      scope: { actor: ScopeActorTypes.CLIENT, contextType: "client" }
    }
  } as unknown as Record<ScenarioKey, ScenarioBinding>;

  return {
    bindings,
    built: () => size([...cells.keys()]),
    cell: (key: string) => cells.get(key),
    live: () =>
      last(filter([...cells.values()], entry => entry.destroyed === 0)),
    destroyedKeys: () =>
      map(
        filter([...cells.values()], entry => entry.destroyed > 0),
        entry => entry.key
      )
  };
}

let registry: ReturnType<typeof scopeRegistry>;

const world = () => useScenarioWorld(registry.bindings);

const CLIENT_CELL = `${COLLECTION}/${ScopeActorTypes.CLIENT}`;
const STAFF_CELL = `${COLLECTION}/${ScopeActorTypes.STAFF}/client:mock-uuid-1`;

beforeEach(() => {
  registry = scopeRegistry();
});

// -----------------------------------------------------------------------------

describe("T4.3 booting the same key+scope ADOPTS the page's live cell (§3.1 ruling 2)", () => {
  it("never destroys the cell the page is rendering", async () => {
    const live = world();
    await live.boot(COLLECTION, CLIENT);

    await live.boot(COLLECTION, { ...CLIENT });

    expect(registry.destroyedKeys()).toStrictEqual([]);
    expect(registry.cell(CLIENT_CELL)?.destroyed).toBe(0);
  });

  it("compares scopes by value — a freshly built, equal scope is the SAME scope", async () => {
    const live = world();
    await live.boot(COLLECTION, STAFF_FOR_CLIENT);

    await live.boot(COLLECTION, {
      actor: ScopeActorTypes.STAFF,
      context: { type: "client", id: "mock-uuid-1" }
    });

    expect(registry.destroyedKeys()).toStrictEqual([]);
    expect(registry.built()).toBe(2);
  });

  it("keeps driving that same cell after the adopt — the track moves the rendered rows", async () => {
    const live = world();
    await live.boot(COLLECTION, CLIENT);
    await live.fire("ensure", { email: "before@example.com" });

    await live.boot(COLLECTION, { ...CLIENT });
    await live.fire("ensure", { email: "after@example.com" });

    expect(registry.cell(CLIENT_CELL)?.fired).toStrictEqual([
      "ensure:before@example.com",
      "ensure:after@example.com"
    ]);
  });
});

describe("T4.3 a different key or scope DISPOSES, exactly as today", () => {
  it("disposes the live cell when the actor changes", async () => {
    const live = world();
    await live.boot(COLLECTION, CLIENT);

    await live.boot(COLLECTION, STAFF_FOR_CLIENT);

    expect(registry.destroyedKeys()).toStrictEqual([CLIENT_CELL]);
    expect(registry.cell(STAFF_CELL)?.destroyed).toBe(0);
  });

  it("disposes the live cell when only the context id changes", async () => {
    const live = world();
    await live.boot(COLLECTION, STAFF_FOR_CLIENT);

    await live.boot(COLLECTION, STAFF_FOR_ANOTHER_CLIENT);

    expect(registry.destroyedKeys()).toStrictEqual([STAFF_CELL]);
  });

  it("disposes the live cell when the key changes at the same scope", async () => {
    const live = world();
    await live.boot(COLLECTION, CLIENT);

    await live.boot(EDITOR, { ...CLIENT });

    expect(registry.destroyedKeys()).toStrictEqual([CLIENT_CELL]);
    expect(registry.built()).toBe(2);
  });

  it("drives the newly booted cell, and only it", async () => {
    const live = world();
    await live.boot(COLLECTION, CLIENT);

    await live.boot(COLLECTION, STAFF_FOR_CLIENT);
    await live.fire("ensure", { email: "staff@example.com" });

    expect(registry.cell(CLIENT_CELL)?.fired).toStrictEqual([]);
    expect(registry.cell(STAFF_CELL)?.fired).toStrictEqual([
      "ensure:staff@example.com"
    ]);
  });
});

describe("T4.3 dispose is still dispose", () => {
  it("destroys the live cell when the world is disposed outright", async () => {
    const live = world();
    await live.boot(COLLECTION, CLIENT);

    await live.dispose();

    expect(registry.cell(CLIENT_CELL)?.destroyed).toBe(1);
  });

  it("boots afresh after a dispose rather than adopting a destroyed cell", async () => {
    const live = world();
    await live.boot(COLLECTION, CLIENT);
    await live.dispose();

    await live.boot(COLLECTION, { ...CLIENT });
    await live.fire("ensure", { email: "reboot@example.com" });

    expect(first(registry.cell(CLIENT_CELL)?.fired)).toBe(
      "ensure:reboot@example.com"
    );
  });
});
