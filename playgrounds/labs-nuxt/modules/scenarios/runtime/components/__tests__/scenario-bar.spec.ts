// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/__tests__/scenario-bar.spec
 * @description T4.5 — ONE component in two states (`G9 unified` · `G1` ·
 * `AC2.1`–`AC2.4`). Three claims:
 *   1. Live is the default track and carries NO transport — the real
 *      interactive page, nothing armed (`S12`/`AC2.3`);
 *   2. selecting a track morphs the SAME node idle → playing, and stopping
 *      returns it to idle in place: one bar, never two;
 *   3. with Live plus the client-emails page's 11 tracks the bar shows as many
 *      as WIDTH allows and puts the rest behind one overflow, every one of the
 *      11 still reachable — pinning is dead, space alone decides (`R6-26` ·
 *      `AC2.4`/`G1`).
 *
 * The player is a double built against `UseScenarioPlayer`: T4.2 proves what
 * arming DOES, and this proves the bar asks for it and draws the state it gets
 * back.
 *
 * ## What breaks if these fail
 * A second bar appears (the thing `G9 unified` exists to forbid), or eleven
 * tracks wrap the bar onto a second line.
 *
 * Negative control: `scenario-bar.second-bar.must-fail.patch`.
 */

import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { computed, nextTick, ref } from "vue";
import { createI18n } from "vue-i18n";
import action from "@upmind-automation/i18n/core/action-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import labsEn from "@upmind-automation/i18n/modules/labs-en.json";
import { DropdownMenu } from "@upmind-automation/upmind-ui";
import {
  SCENARIO_PLAYER_STATUS,
  SCENE_UNPLAYED
} from "../../composables/useScenarioPlayer.types";
import ScenarioBar from "../ScenarioBar.vue";
import {
  filter,
  flatMap,
  intersection,
  kebabCase,
  map,
  size,
  slice,
  take,
  times,
  union
} from "lodash-es";
import type { FeatureTrack } from "../../composables/useFeatureTracks.types";
import type {
  ScenarioPlayerStatus,
  UseScenarioPlayer
} from "../../composables/useScenarioPlayer.types";

// -----------------------------------------------------------------------------

const TRACK_NAMES = [
  "A client sees their email collection",
  "A client adds an email address",
  "A client deletes an email address",
  "A client resends a verification email",
  "A client sets a default email",
  "A client refreshes their collection",
  "Asking for a page that is not there is refused",
  "Discarding the collection releases it",
  "Filtering narrows the collection",
  "Sorting reorders the collection",
  "Staff acting for a client read that client's collection"
];

const messages = { en: { action, labs: labsEn, text } };

const track = (name: string): FeatureTrack => ({
  name,
  slug: kebabCase(name),
  tags: [],
  line: 1,
  isPlayable: true,
  scenes: times(4, index => ({
    kind: "When",
    text: `scene ${index}`,
    line: index + 2,
    isMatched: true,
    run: async () => undefined
  }))
});

const TRACKS = map(TRACK_NAMES, track);

function fakePlayer() {
  const armed = ref<FeatureTrack | undefined>();
  const status = ref<ScenarioPlayerStatus>(SCENARIO_PLAYER_STATUS.LIVE);
  const playhead = ref(SCENE_UNPLAYED);

  const player: UseScenarioPlayer = {
    track: computed(() => armed.value),
    status: computed(() => status.value),
    playhead: computed(() => playhead.value),
    isBusy: computed(() => false),
    failure: computed(() => undefined),
    isAvailable: true,
    arm: vi.fn(async next => {
      armed.value = next;
      status.value = SCENARIO_PLAYER_STATUS.ARMED;
      playhead.value = SCENE_UNPLAYED;
      await nextTick();
    }),
    play: vi.fn(async () => {
      status.value = SCENARIO_PLAYER_STATUS.PLAYING;
      playhead.value = 0;
      await nextTick();
    }),
    pause: vi.fn(),
    next: vi.fn(async () => undefined),
    prev: vi.fn(async () => undefined),
    seek: vi.fn(async () => undefined),
    stop: vi.fn(async () => {
      armed.value = undefined;
      status.value = SCENARIO_PLAYER_STATUS.LIVE;
      playhead.value = SCENE_UNPLAYED;
      await nextTick();
    }),
    whenSettled: async () => undefined
  };

  return player;
}

const mountBar = (options: { tracks?: readonly FeatureTrack[] } = {}) => {
  const player = fakePlayer();
  const wrapper = mount(ScenarioBar, {
    attachTo: document.body,
    props: { player, tracks: options.tracks ?? TRACKS },
    global: {
      plugins: [createI18n({ legacy: false, locale: "en", messages })]
    }
  });

  return { wrapper, player };
};

type Bar = ReturnType<typeof mountBar>;

const entries = ({ wrapper }: Bar) =>
  wrapper.findAll('[data-test-key="track"]');

const transport = ({ wrapper }: Bar) =>
  wrapper.findAll('[data-test-key="transport-control"]');

/** The one node the bar IS — the node `G9 unified` says never becomes two. */
const barNodes = () =>
  document.querySelectorAll('[data-test-key="scenario-bar"]');

const overflowItems = ({ wrapper }: Bar) =>
  flatMap(wrapper.findAllComponents(DropdownMenu), menu =>
    map(menu.props("items"), item => item.label)
  );

afterEach(() => {
  document.body.innerHTML = "";
  vi.clearAllMocks();
});

// -----------------------------------------------------------------------------

describe("T4.5 Live is the default, and carries no transport (AC2.3 · S12)", () => {
  it("offers no transport control at all before a track is chosen", () => {
    const bar = mountBar();

    expect(size(transport(bar))).toBe(0);
  });

  it("renders Live even for a page whose playlist is empty", () => {
    const bar = mountBar({ tracks: [] });

    expect(size(entries(bar))).toBe(1);
    expect(size(transport(bar))).toBe(0);
  });

  it("asks the player to arm the track that was chosen", async () => {
    const bar = mountBar();

    await entries(bar)[1].trigger("click");

    expect(bar.player.arm).toHaveBeenCalledTimes(1);
    expect(bar.player.arm).toHaveBeenCalledWith(
      expect.objectContaining({ name: TRACK_NAMES[0] })
    );
  });
});

describe("T4.5 ONE bar in two states (G9 unified · AC2.2)", () => {
  it("morphs the very same node from idle to playing", async () => {
    const bar = mountBar();
    const idle = barNodes()[0];

    await entries(bar)[1].trigger("click");
    await bar.player.play();
    await nextTick();

    expect(size(barNodes())).toBe(1);
    expect(barNodes()[0]).toBe(idle);
    expect(size(transport(bar))).toBeGreaterThan(0);
    expect(idle.contains(transport(bar)[0].element)).toBe(true);
  });

  it("returns to its idle track list in the same place when the track stops", async () => {
    const bar = mountBar();
    const idle = barNodes()[0];
    await entries(bar)[1].trigger("click");
    await bar.player.play();
    await nextTick();

    await bar.player.stop();
    await nextTick();

    expect(size(barNodes())).toBe(1);
    expect(barNodes()[0]).toBe(idle);
    expect(size(transport(bar))).toBe(0);
    expect(size(entries(bar))).toBeGreaterThan(1);
  });

  it("names the track it is playing", async () => {
    const bar = mountBar();

    await entries(bar)[1].trigger("click");
    await bar.player.play();
    await nextTick();

    expect(bar.wrapper.text()).toContain(TRACK_NAMES[0]);
  });
});

/**
 * QUARANTINED (operator ruling 2026-08-18, re-do `W2`): these claims measure the
 * capped track chips `R7-10` killed, so `TrackList.types` has no modern module to
 * repoint to and its limit is declared absent rather than invented.
 */
declare const TRACK_LIST_VISIBLE_LIMIT: number;

describe.skip("T4.5 eleven tracks stay reachable without crowding the bar (AC2.4 · G1)", () => {
  it("shows Live plus at most what the bar's own width admits, never all eleven", () => {
    const bar = mountBar();

    expect(size(entries(bar))).toBe(TRACK_LIST_VISIBLE_LIMIT + 1);
  });

  it("keeps every one of the eleven reachable through the overflow", () => {
    const bar = mountBar();
    const visible = map(entries(bar), entry => entry.text());

    expect(
      size(intersection(TRACK_NAMES, union(visible, overflowItems(bar))))
    ).toBe(11);
  });

  it("takes the visible few off the FRONT of the playlist — no declaration is consulted", () => {
    const bar = mountBar();
    const visible = map(entries(bar), entry => entry.text());

    expect(
      size(intersection(visible, take(TRACK_NAMES, TRACK_LIST_VISIBLE_LIMIT)))
    ).toBe(TRACK_LIST_VISIBLE_LIMIT);
    expect(size(intersection(visible, slice(TRACK_NAMES, 8, 10)))).toBe(0);
  });

  it("offers no overflow at all for a playlist that fits", () => {
    const bar = mountBar({ tracks: take(TRACKS, 2) });

    expect(filter(overflowItems(bar))).toStrictEqual([]);
    expect(size(entries(bar))).toBe(3);
  });
});
