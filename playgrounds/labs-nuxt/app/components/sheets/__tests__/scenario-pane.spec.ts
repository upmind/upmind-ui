// -----------------------------------------------------------------------------
/**
 * @module sheets/__tests__/scenario-pane.spec
 * @description T3.4 — the declaration and the playlist behind the page
 * (`AC3.4` · `H4` · design §3.6 · §7.5). Four claims:
 *   1. the page's own declaration is drawn as a fence, verbatim, behind the
 *      disclosure that keeps a thousand-pixel file from burying the playlist
 *      the pane is opened for (`R6-21`);
 *   2. the Gherkin is a LINE LIST — one row per parsed step, each carrying its
 *      own line — because a markdown blob cannot carry a live highlight;
 *   3. with a playhead set on the armed track, the stop at that INDEX is the
 *      marked one and it is the ONLY one — the playhead is an index rather than
 *      a line precisely because a Background step is prefixed to every scenario
 *      it governs (`R6-24`, `ScenarioPane.types.ts`) — and the mark moves with
 *      the playhead;
 *   4. the armed track NAMES the scope it runs at (design §7.5's mitigation for
 *      the matrix/feature disagreement, `ESC5`), and with no playlist at all the
 *      pane says so through a `labs.*` key instead of drawing an empty heading —
 *      the state it is in tonight, while `ESC6` is unruled.
 *
 * The playlist is the COMMITTED client-email feature, read off disk by package
 * specifier, and every expectation is derived from the harness's own parse of
 * that text: nothing about the eleven tracks is restated here.
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";
import { ScopeActorTypes } from "@upmind-automation/headless";
import action from "@upmind-automation/i18n/core/action-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import labsEn from "@upmind-automation/i18n/modules/labs-en.json";
import { parseFeatureScenarios } from "@upmind-automation/scenario-harness";
import { Markdown } from "@upmind-automation/upmind-ui";
import ScenarioPane from "../ScenarioPane.vue";
import {
  filter,
  flatMap,
  forEach,
  groupBy,
  includes,
  last,
  map,
  size,
  sumBy,
  trim
} from "lodash-es";
import type { TrackScene } from "../../../../modules/scenarios/runtime/composables/useFeatureTracks.types";
import type { ScenarioPaneProps } from "../ScenarioPane.types";
import type { FeatureScenario } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const HEADLESS_ROOT = dirname(
  createRequire(import.meta.url).resolve(
    "@upmind-automation/headless/package.json"
  )
);

/**
 * `client-email.feature` — the ELEVEN-scenario playlist, never its
 * one-'s'-apart sibling `client-email.feature` (`D16`).
 */
const FEATURE_TEXT = readFileSync(
  join(
    HEADLESS_ROOT,
    "src/modules/client-email/__tests__/client-email.feature"
  ),
  "utf-8"
);

const TRACKS = parseFeatureScenarios(FEATURE_TEXT);

/** The staff track — the one whose declared scope the page is not on (`ESC5`). */
const ARMED = last(TRACKS)!;

const DECLARATION = `export default defineScenario({ route: "useClientEmails" });`;

const STAFF_SCOPE = {
  actor: ScopeActorTypes.STAFF,
  context: { type: "client", id: "mock-client-id" }
};

const messages = { en: { action, labs: labsEn, text } };

const translate = createI18n({ legacy: false, locale: "en", messages }).global
  .t;

const STEP = '[data-test-key="scenario-step"]';

const TRACK_SCOPE = '[data-test-key="scenario-track-scope"]';

const MARKED = "[aria-current]";

/** One frame of the disclosure's own open transition. */
const DISCLOSE_MS = 50;

function mountPane(overrides: Partial<ScenarioPaneProps> = {}) {
  return mount(ScenarioPane, {
    attachTo: document.body,
    props: {
      declaration: DECLARATION,
      featureText: FEATURE_TEXT,
      ...overrides
    },
    global: {
      plugins: [createI18n({ legacy: false, locale: "en", messages })]
    }
  });
}

type Pane = ReturnType<typeof mountPane>;

/** Every step row's own line, as the list carries it. */
const renderedLines = (wrapper: Pane) =>
  map(wrapper.findAll(STEP), row => Number(row.attributes("data-test-value")));

const trackGroups = (wrapper: Pane, name: string) =>
  wrapper.findAll(
    `[data-test-key="scenario-track"][data-test-value="${name}"]`
  );

/** The declaration is DISCLOSED, not dumped (`R6-21`) — opened to be read. */
async function disclose(wrapper: Pane): Promise<void> {
  await wrapper
    .find('[data-test-key="scenario-declaration-toggle"]')
    .trigger("click");
  await new Promise(resolve => setTimeout(resolve, DISCLOSE_MS));
}

/**
 * The armed track's stops as the PLAYER hands them over. Every field the pane
 * reads comes from the committed feature's own parse; `isMatched` and the `run`
 * thunk are the player's, and the pane never calls either.
 */
const scenesOf = (track: FeatureScenario): TrackScene[] =>
  map(
    track.steps,
    step =>
      ({
        ...step,
        isMatched: true,
        run: async () => undefined
      }) as unknown as TrackScene
  );

/** The pane as the player hands it over with stop `playhead` in flight. */
const armedAt = (playhead: number): Partial<ScenarioPaneProps> => ({
  trackName: ARMED.name,
  scenes: scenesOf(ARMED),
  playhead
});

// -----------------------------------------------------------------------------

describe("T3.4 the page's own declaration (AC3.4 · R6-21)", () => {
  it("draws it as a fence, verbatim, once its disclosure is opened", async () => {
    const wrapper = mountPane();

    await disclose(wrapper);
    const source = wrapper
      .findComponent(Markdown)
      .props("modelValue") as string;

    expect(source).toContain(DECLARATION);
    expect(source).toContain("```");
  });

  it("keeps the fence shut until it is asked for, so the playlist is what opens", () => {
    const wrapper = mountPane();

    expect(wrapper.findComponent(Markdown).exists()).toBe(false);
    expect(wrapper.findAll(STEP).length).toBeGreaterThan(0);
  });
});

describe("T3.4 the Gherkin is a line list, not a blob (H4 · design §3.6)", () => {
  it("draws one row per parsed step of the whole playlist", () => {
    const wrapper = mountPane();

    expect(wrapper.findAll(STEP)).toHaveLength(sumBy(TRACKS, "steps.length"));
  });

  it("carries every track the playlist declares, by its own name", () => {
    const wrapper = mountPane();

    // A Scenario Outline expands to one track per example, so a name is NOT
    // unique — the groups sharing a name are read against the tracks sharing it.
    forEach(groupBy(TRACKS, "name"), (tracks, name) => {
      expect(
        map(trackGroups(wrapper, name), group => group.findAll(STEP).length)
      ).toEqual(map(tracks, track => track.steps.length));
    });
  });

  it("gives each row the line it was parsed at, in the file's own order", () => {
    const wrapper = mountPane();

    expect(renderedLines(wrapper)).toEqual(
      flatMap(TRACKS, track => map(track.steps, "line"))
    );
  });

  it("draws each step's own text beside its line", () => {
    const wrapper = mountPane();
    const rows = trackGroups(wrapper, ARMED.name)[0]!.findAll(STEP);

    expect(map(rows, row => trim(row.text()))).toEqual(
      map(ARMED.steps, step => expect.stringContaining(step.text))
    );
  });
});

describe("T3.4 the playhead marks the line being run (AC3.4 · H4)", () => {
  it("marks the stop the player is at", () => {
    const step = ARMED.steps[1]!;
    const wrapper = mountPane(armedAt(1));

    const marked = wrapper.findAll(MARKED);
    expect(marked).toHaveLength(1);
    expect(marked[0]!.attributes("data-test-value")).toBe(String(step.line));
    expect(includes(marked[0]!.text(), step.text)).toBe(true);
  });

  it("marks exactly one stop where its LINE recurs across the playlist (R6-24)", () => {
    const background = ARMED.steps[0]!;
    const wrapper = mountPane(armedAt(0));

    expect(
      sumBy(TRACKS, track =>
        size(filter(track.steps, { line: background.line }))
      )
    ).toBeGreaterThan(1);
    expect(wrapper.findAll(MARKED)).toHaveLength(1);
    expect(trackGroups(wrapper, ARMED.name)[0]!.find(MARKED).exists()).toBe(
      true
    );
  });

  it("moves the mark with the playhead", async () => {
    const wrapper = mountPane(armedAt(1));

    await wrapper.setProps({ playhead: 2 });

    expect(wrapper.find(MARKED).attributes("data-test-value")).toBe(
      String(ARMED.steps[2]!.line)
    );
  });

  it("marks nothing at all while no track is playing", () => {
    const wrapper = mountPane();

    expect(wrapper.findAll(MARKED)).toHaveLength(0);
  });
});

describe("T3.4 the armed track names the scope it runs at (design §7.5 · ESC5)", () => {
  it("says where the track runs, so a greyed actor row and a playable track do not silently disagree", () => {
    const wrapper = mountPane({ ...armedAt(0), trackScope: STAFF_SCOPE });
    const scope = wrapper.find(TRACK_SCOPE);

    expect(scope.exists()).toBe(true);
    expect(scope.text()).toContain(
      trim(translate("labs.scenario_track_scope", { scope: "" }))
    );
    expect(scope.text()).toContain(STAFF_SCOPE.context.id);
  });

  it("says nothing about scope where the track declared none", () => {
    const wrapper = mountPane(armedAt(0));

    expect(wrapper.find(TRACK_SCOPE).exists()).toBe(false);
  });
});

describe("T3.4 no playlist yet — the ESC6 state, reported rather than blank", () => {
  it("renders cleanly and says why there is nothing to play", () => {
    const wrapper = mountPane({ featureText: "" });

    expect(wrapper.findAll(STEP)).toHaveLength(0);
    expect(wrapper.text()).toContain(
      translate("labs.scenario_feature_pending")
    );
  });

  it("still draws the page's own declaration while the playlist is unreachable", async () => {
    const wrapper = mountPane({ featureText: undefined });

    await disclose(wrapper);

    expect(
      wrapper.findComponent(Markdown).props("modelValue") as string
    ).toContain(DECLARATION);
    expect(wrapper.text()).toContain(
      translate("labs.scenario_feature_pending")
    );
  });
});
