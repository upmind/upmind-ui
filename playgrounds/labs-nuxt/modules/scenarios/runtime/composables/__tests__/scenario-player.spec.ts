// @vitest-environment jsdom
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/__tests__/scenario-player.spec
 * @description T4.2 — the transport (`AC2.5` · `AC2.6` · `AC2.7` · design
 * §3.1). Six claims, in the order a track is played:
 *   1. `arm` arms the `replay` preset BEFORE the first scene runs, resets the
 *      playhead to {@link SCENE_UNPLAYED} and the criteria to boot state —
 *      the ordering §7.2 names, because every scrub re-fires writing scenes;
 *   2. a track declaring a scope the page is not showing NAVIGATES there
 *      first: no scene runs here, and `world.boot` is never called on a scope
 *      the user cannot see (§3.1 ruling 2 — the staff-track hole);
 *   3. `play` runs the declared scenes in order, awaiting each; `next` runs
 *      exactly one; `prev`/`seek` REPLAY from scene 0, because a step is an
 *      imperative call and nothing can un-fire one (§3.1 ruling 1);
 *   4. `stop` disarms back to Live — no preset, no track, criteria at boot;
 *   5. a track plays the same way twice, and while it plays ZERO requests for
 *      the module's own endpoints leave the app (`AC2.6`);
 *   6. with no corpus to answer with (`ESC6`) nothing arms at all — Live-only
 *      is the correct degraded state, never a track replaying against staging.
 *
 * Every seam is injected: the world, the worker, the url writer, the page's
 * scope and its navigation. The tracks are synthetic `FeatureTrack`s — T4.1
 * proves the parse, this proves what the transport does with it.
 *
 * The request spy stands in for the worker the way the browser does: a request
 * made while the `replay` preset is armed is answered from the recorded corpus,
 * and one made before it is armed ESCAPES to staging. That is the whole reason
 * the arming order is load-bearing rather than cosmetic.
 *
 * ## What breaks if these fail
 * A scrub writes to staging, or the 11th track plays against a cell the user
 * cannot see while the rendered page sits there unchanged.
 *
 * Negative controls: `scenario-player.arm-order.must-fail.patch`,
 * `scenario-player.arm-foreign-scope.must-fail.patch`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref } from "vue";
import { SCOPE_ACTOR } from "@upmind-automation/scenario-harness";
import { useScenarioPlayer } from "../useScenarioPlayer";
import {
  SCENARIO_PLAYER_STATUS,
  SCENE_UNPLAYED
} from "../useScenarioPlayer.types";
import {
  filter,
  findIndex,
  includes,
  kebabCase,
  last,
  map,
  size
} from "lodash-es";
import type { PlaygroundUrlState } from "../../../../../app/composables/usePlaygroundUrlState.types";
import type { FeatureTrack, TrackScene } from "../useFeatureTracks.types";
import type { ForcePreset, UseForcedState } from "../useForcedState.types";
import type { ModulePortCriteria } from "../useModulePort.types";
import type { World, WorldScope } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const KEY = "useClientEmails";

const PAGE_SCOPE: WorldScope = { actor: SCOPE_ACTOR.CLIENT };

const FOREIGN_SCOPE: WorldScope = {
  actor: SCOPE_ACTOR.STAFF,
  context: { type: "client", id: "mock-uuid-1" }
};

/** The module's own endpoint — the one AC2.6 says never reaches staging. */
const MODULE_ENDPOINT = "https://api.upmind.io/clients/mock-uuid-1/emails";

const RECORDED_ROWS = ["mock-email-1@example.com", "mock-email-3@example.com"];

const BOOT_CRITERIA = { filters: {} };

const FILTERED_CRITERIA = { filters: { verified: { eq: false } } };

/** Every observable, in the one order they happened. */
let log: string[];

/** Requests that left the app because no preset was answering them. */
let escaped: string[];

// -----------------------------------------------------------------------------

function forcedState(isAvailable = true): UseForcedState {
  const preset = ref<ForcePreset | undefined>();

  return {
    preset: computed(() => preset.value),
    isAvailable,
    arm: async next => {
      log.push(`force:${next}`);
      preset.value = next;
    },
    disarm: async () => {
      log.push("force:off");
      preset.value = undefined;
    },
    whenReady: async () => undefined
  };
}

function criteriaState(): ModulePortCriteria & { writes: unknown[] } {
  const model = ref<Record<string, unknown>>({ ...BOOT_CRITERIA });
  const writes: unknown[] = [];

  return {
    schema: {},
    uischema: {},
    writes,
    model: computed(() => model.value),
    set: next => {
      writes.push(next);
      log.push("criteria:set");
      model.value = { ...model.value, ...next };
    }
  };
}

function urlState(): PlaygroundUrlState {
  const bag = ref<Record<string, string | undefined>>({});

  const slot = (name: string) =>
    computed({
      get: () => bag.value[name],
      set: (next?: string) => {
        bag.value = { ...bag.value, [name]: next };
      }
    });

  const scene = computed({
    get: () => {
      const raw = bag.value.scene;
      return raw === undefined ? undefined : Number(raw);
    },
    set: (next?: number) => {
      bag.value = {
        ...bag.value,
        scene: next === undefined ? undefined : String(next)
      };
    }
  });

  return {
    params: computed(() => ({ ...bag.value }) as Record<string, string>),
    write: patch => {
      bag.value = { ...bag.value, ...patch };
    },
    view: slot("view"),
    track: slot("track"),
    scene,
    sheet: slot("sheet"),
    tab: slot("tab"),
    force: slot("force"),
    preserveQuery: path => path
  };
}

/**
 * The page's own cell as the world drives it: booting resets it to the recorded
 * rows, and every action asks the service for them — which is what makes an
 * unarmed replay visible as a request that escaped.
 */
function playerWorld(): World & { boots: WorldScope[] } {
  const rows = ref<string[]>([]);
  const boots: WorldScope[] = [];

  const request = async () => {
    await fetch(MODULE_ENDPOINT);
  };

  return {
    boots,
    boot: async (key, scope) => {
      boots.push(scope);
      log.push(`boot:${key}:${scope.actor}`);
      rows.value = [...RECORDED_ROWS];
      await request();
    },
    fire: async (actionId, input) => {
      log.push(`fire:${actionId}`);
      if (actionId === "ensure") {
        rows.value = [
          ...rows.value,
          String((input as { email: string }).email)
        ];
      }
      await request();
    },
    expectMeta: async () => undefined,
    expectContext: async () => undefined,
    dispose: async () => undefined,
    rows
  } as unknown as World & { boots: WorldScope[]; rows: typeof rows };
}

type Gate = { open: () => void; whenOpen: Promise<void> };

/** Lets the run reach a known point before the test acts on it. */
const until = async (ready: () => boolean): Promise<void> => {
  for (let attempt = 0; attempt < 50 && !ready(); attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, 0));
  }
};

const gate = (): Gate => {
  let open = () => undefined as void;
  const whenOpen = new Promise<void>(resolve => {
    open = resolve;
  });
  return { open, whenOpen };
};

function scene(
  index: number,
  run: (world: World) => Promise<void>,
  hold?: Gate
): TrackScene {
  return {
    kind: "When",
    text: `scene ${index}`,
    line: index + 2,
    isMatched: true,
    run: async world => {
      log.push(`scene:${index}`);
      if (hold) await hold.whenOpen;
      await run(world);
    }
  } as TrackScene;
}

function buildTrack(
  name: string,
  options: {
    scope?: WorldScope;
    isPlayable?: boolean;
    hold?: { index: number; gate: Gate };
  } = {}
): FeatureTrack {
  const held = (index: number) =>
    options.hold?.index === index ? options.hold.gate : undefined;

  return {
    name,
    slug: kebabCase(name),
    tags: [],
    line: 1,
    scope: options.scope,
    isPlayable: options.isPlayable ?? true,
    scenes: [
      scene(0, world => world.boot(KEY, options.scope ?? PAGE_SCOPE), held(0)),
      scene(
        1,
        world => world.fire("ensure", { email: "mock-email-9@example.com" }),
        held(1)
      ),
      scene(
        2,
        async world => {
          criteria.set(FILTERED_CRITERIA);
          await world.fire("filterBy", FILTERED_CRITERIA);
        },
        held(2)
      ),
      scene(3, world => world.fire("refresh"), held(3))
    ]
  };
}

let criteria: ReturnType<typeof criteriaState>;
let forced: UseForcedState;
let url: PlaygroundUrlState;
let world: ReturnType<typeof playerWorld>;
let navigate: ReturnType<typeof vi.fn>;
let pageScope: WorldScope;

function build(tracks: FeatureTrack[], available = true) {
  forced = forcedState(available);
  world = playerWorld();

  return useScenarioPlayer({
    tracks,
    criteria,
    world,
    forced,
    url,
    scope: () => pageScope,
    navigate
  });
}

const rowsOf = () => [
  ...(world as unknown as { rows: { value: string[] } }).rows.value
];

beforeEach(() => {
  log = [];
  escaped = [];
  criteria = criteriaState();
  url = urlState();
  pageScope = PAGE_SCOPE;
  navigate = vi.fn(async (scope: WorldScope) => {
    log.push(`navigate:${scope.actor}`);
  });

  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string) => {
      if (forced.preset.value !== "replay") escaped.push(String(input));
      log.push("request");
      return { ok: true } as Response;
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// -----------------------------------------------------------------------------

describe("T4.2 arm arms the worker BEFORE scene 0 (§3.1 ruling 1 · §7.2)", () => {
  it("arms the replay preset ahead of the first scene, never after it", async () => {
    const track = buildTrack("Filtering narrows the collection");
    const player = build([track]);

    await player.arm(track);
    await player.play();

    expect(findIndex(log, entry => entry === "force:replay")).toBeGreaterThan(
      -1
    );
    expect(findIndex(log, entry => entry === "force:replay")).toBeLessThan(
      findIndex(log, entry => entry === "scene:0")
    );
  });

  it("puts the playhead back to unplayed and names the track it armed", async () => {
    const track = buildTrack("Filtering narrows the collection");
    const player = build([track]);

    await player.arm(track);

    expect(player.playhead.value).toBe(SCENE_UNPLAYED);
    expect(player.track.value?.slug).toBe(track.slug);
    expect(player.status.value).toBe(SCENARIO_PLAYER_STATUS.ARMED);
    expect(url.track.value).toBe(track.slug);
  });

  it("resets the criteria to the state the player was created at", async () => {
    const track = buildTrack("Filtering narrows the collection");
    const player = build([track]);
    await player.arm(track);
    await player.play();
    criteria.writes.length = 0;

    await player.arm(track);

    expect(criteria.writes).toContainEqual(BOOT_CRITERIA);
    expect(criteria.model.value).toStrictEqual(BOOT_CRITERIA);
  });

  it("resets the criteria before the first scene runs, not after it", async () => {
    const track = buildTrack("Filtering narrows the collection");
    const player = build([track]);
    await player.arm(track);
    await player.play();
    log.length = 0;

    await player.arm(track);
    await player.next();

    expect(findIndex(log, entry => entry === "criteria:set")).toBeLessThan(
      findIndex(log, entry => entry === "scene:0")
    );
  });
});

describe("T4.2 a foreign-scope track navigates FIRST (§3.1 ruling 2)", () => {
  it("takes the page to the track's own scope instead of booting it here", async () => {
    const track = buildTrack("Staff acting for a client", {
      scope: FOREIGN_SCOPE
    });
    const player = build([track]);

    await player.arm(track);
    await player.whenSettled();

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(FOREIGN_SCOPE);
  });

  it("never calls world.boot on a scope the page is not showing", async () => {
    const track = buildTrack("Staff acting for a client", {
      scope: FOREIGN_SCOPE
    });
    const player = build([track]);

    await player.arm(track);
    await player.play();
    await player.whenSettled();

    expect(world.boots).toStrictEqual([]);
    expect(filter(log, entry => includes(entry, "scene:"))).toStrictEqual([]);
    expect(escaped).toStrictEqual([]);
  });

  it("writes the track to the url BEFORE navigating, so it arms on the other side", async () => {
    const track = buildTrack("Staff acting for a client", {
      scope: FOREIGN_SCOPE
    });
    const player = build([track]);

    await player.arm(track);
    await player.whenSettled();

    expect(url.track.value).toBe(track.slug);
    expect(findIndex(log, entry => entry === "criteria:set")).toBeLessThan(
      findIndex(log, entry => includes(entry, "navigate:"))
    );
  });

  it("boots in place for a track declaring the scope the page already shows", async () => {
    const track = buildTrack("A client sees their collection", {
      scope: PAGE_SCOPE
    });
    const player = build([track]);

    await player.arm(track);
    await player.play();

    expect(navigate).not.toHaveBeenCalled();
    expect(map(world.boots, scope => scope.actor)).toStrictEqual([
      PAGE_SCOPE.actor
    ]);
  });

  it("plays a track that declares no scope against the page's own", async () => {
    const track = buildTrack("A scenario that arranges nothing");
    const player = build([track]);

    await player.arm(track);
    await player.play();

    expect(navigate).not.toHaveBeenCalled();
    expect(size(world.boots)).toBe(1);
  });
});

describe("T4.2 play · next · prev · seek (AC2.5 · §3.1 ruling 1)", () => {
  it("runs every remaining scene in declared order, awaiting each", async () => {
    const track = buildTrack("Filtering narrows the collection");
    const player = build([track]);

    await player.arm(track);
    await player.play();

    expect(filter(log, entry => includes(entry, "scene:"))).toStrictEqual([
      "scene:0",
      "scene:1",
      "scene:2",
      "scene:3"
    ]);
    expect(player.playhead.value).toBe(3);
  });

  it("runs exactly one scene on next, and moves the playhead one step", async () => {
    const track = buildTrack("Filtering narrows the collection");
    const player = build([track]);
    await player.arm(track);

    await player.next();

    expect(filter(log, entry => includes(entry, "scene:"))).toStrictEqual([
      "scene:0"
    ]);
    expect(player.playhead.value).toBe(0);
  });

  it("REPLAYS from scene 0 on seek — no time travel", async () => {
    const track = buildTrack("Filtering narrows the collection");
    const player = build([track]);
    await player.arm(track);
    await player.play();
    log.length = 0;

    await player.seek(2);

    expect(filter(log, entry => includes(entry, "scene:"))).toStrictEqual([
      "scene:0",
      "scene:1",
      "scene:2"
    ]);
    expect(player.playhead.value).toBe(2);
  });

  it("steps back by replaying up to the scene before", async () => {
    const track = buildTrack("Filtering narrows the collection");
    const player = build([track]);
    await player.arm(track);
    await player.next();
    await player.next();
    log.length = 0;

    await player.prev();

    expect(filter(log, entry => includes(entry, "scene:"))).toStrictEqual([
      "scene:0"
    ]);
    expect(player.playhead.value).toBe(0);
  });

  it("carries the playhead in the url, so the link reproduces the scene", async () => {
    const track = buildTrack("Filtering narrows the collection");
    const player = build([track]);
    await player.arm(track);

    await player.seek(1);

    expect(url.scene.value).toBe(1);
  });

  it("reports the control it is busy for while a scene is in flight (E12 · S14)", async () => {
    const held = gate();
    const track = buildTrack("Filtering narrows the collection", {
      hold: { index: 0, gate: held }
    });
    const player = build([track]);
    await player.arm(track);

    const running = player.next();
    await Promise.resolve();
    expect(player.isBusy.value).toBe(true);

    held.open();
    await running;

    expect(player.isBusy.value).toBe(false);
  });

  it("pauses after the scene in flight, leaving the track armed where it stopped", async () => {
    const held = gate();
    const track = buildTrack("Filtering narrows the collection", {
      hold: { index: 1, gate: held }
    });
    const player = build([track]);
    await player.arm(track);

    const running = player.play();
    await until(() => includes(log, "scene:1"));
    player.pause();
    held.open();
    await running;
    await player.whenSettled();

    expect(filter(log, entry => includes(entry, "scene:"))).toStrictEqual([
      "scene:0",
      "scene:1"
    ]);
    expect(player.playhead.value).toBe(1);
    expect(player.status.value).toBe(SCENARIO_PLAYER_STATUS.PAUSED);
  });
});

describe("T4.2 stop returns the page to Live (AC2.3 · §3.1 ruling 3)", () => {
  it("drops the track, the preset and the playhead", async () => {
    const track = buildTrack("Filtering narrows the collection");
    const player = build([track]);
    await player.arm(track);
    await player.play();

    await player.stop();

    expect(player.status.value).toBe(SCENARIO_PLAYER_STATUS.LIVE);
    expect(player.track.value).toBeUndefined();
    expect(player.playhead.value).toBe(SCENE_UNPLAYED);
    expect(forced.preset.value).toBeUndefined();
    expect(last(filter(log, entry => includes(entry, "force:")))).toBe(
      "force:off"
    );
  });

  it("clears the track from the url and puts the criteria back to boot state", async () => {
    const track = buildTrack("Filtering narrows the collection");
    const player = build([track]);
    await player.arm(track);
    await player.play();

    await player.stop();

    expect(url.track.value).toBeUndefined();
    expect(criteria.model.value).toStrictEqual(BOOT_CRITERIA);
  });
});

describe("T4.2 replay is deterministic and never touches the service (AC2.6)", () => {
  it("renders exactly the same rows the second time it is played", async () => {
    const track = buildTrack("Filtering narrows the collection");
    const player = build([track]);

    await player.arm(track);
    await player.play();
    const first = rowsOf();

    await player.arm(track);
    await player.play();

    expect(rowsOf()).toStrictEqual(first);
    expect(size(first)).toBe(size(RECORDED_ROWS) + 1);
  });

  it("lets ZERO request for the module's endpoints leave the app while a track plays", async () => {
    const track = buildTrack("Filtering narrows the collection");
    const player = build([track]);

    await player.arm(track);
    await player.play();
    await player.seek(1);

    expect(escaped).toStrictEqual([]);
    expect(size(filter(log, entry => entry === "request"))).toBeGreaterThan(0);
  });
});

describe("T4.2 nothing arms without a corpus to answer with (ESC6 · S12)", () => {
  it("refuses to arm at all while the recorded corpus cannot be reached", async () => {
    const track = buildTrack("Filtering narrows the collection");
    const player = build([track], false);

    await player.arm(track);
    await player.play();

    expect(player.isAvailable).toBe(false);
    expect(player.status.value).toBe(SCENARIO_PLAYER_STATUS.LIVE);
    expect(filter(log, entry => includes(entry, "scene:"))).toStrictEqual([]);
    expect(escaped).toStrictEqual([]);
  });

  it("refuses a track the catalog cannot fully run", async () => {
    const track = buildTrack("A track with an unmatched scene", {
      isPlayable: false
    });
    const player = build([track]);

    await player.arm(track);
    await player.play();

    expect(player.track.value).toBeUndefined();
    expect(filter(log, entry => includes(entry, "scene:"))).toStrictEqual([]);
  });
});
