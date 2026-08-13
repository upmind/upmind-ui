// -----------------------------------------------------------------------------
/**
 * @module sheets/__tests__/scenario-pane.spec
 * @description T3.4 — the declaration and the playlist behind the page
 * (`AC3.4` · `H4` · design §3.6 · §7.5). Four claims:
 *   1. the page's own declaration is drawn as a fence, verbatim;
 *   2. the Gherkin is a LINE LIST — one row per parsed step, each carrying its
 *      own line — because a markdown blob cannot carry a live highlight;
 *   3. with a playhead set on the armed track, the row whose line matches is the
 *      marked one, it is the ONLY one (a Background step is prefixed to every
 *      track, so a line alone names one row per track), and the mark moves with
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
import { parseFeatureScenarios } from "@upmind-automation/scenario-harness";
import { Markdown } from "@upmind-automation/upmind-ui";
import labsEn from "../../../assets/locales/en/labs.json";
import ScenarioPane from "../ScenarioPane.vue";
import { flatMap, includes, last, map, sumBy, trim } from "lodash-es";
import type { ScenarioPaneProps } from "../ScenarioPane.types";

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

const trackRows = (wrapper: Pane, name: string) =>
  wrapper.findAll(`[data-test-value="${name}"] ${STEP}`);

// -----------------------------------------------------------------------------

describe("T3.4 the page's own declaration (AC3.4)", () => {
  it("draws it as a fence, verbatim", () => {
    const wrapper = mountPane();
    const source = wrapper
      .findComponent(Markdown)
      .props("modelValue") as string;

    expect(source).toContain(DECLARATION);
    expect(source).toContain("```");
  });
});

describe("T3.4 the Gherkin is a line list, not a blob (H4 · design §3.6)", () => {
  it("draws one row per parsed step of the whole playlist", () => {
    const wrapper = mountPane();

    expect(wrapper.findAll(STEP)).toHaveLength(sumBy(TRACKS, "steps.length"));
  });

  it("carries every track the playlist declares, by its own name", () => {
    const wrapper = mountPane();

    for (const track of TRACKS) {
      expect(trackRows(wrapper, track.name).length).toBe(track.steps.length);
    }
  });

  it("gives each row the line it was parsed at, in the file's own order", () => {
    const wrapper = mountPane();

    expect(renderedLines(wrapper)).toEqual(
      flatMap(TRACKS, track => map(track.steps, "line"))
    );
  });

  it("draws each step's own text beside its line", () => {
    const wrapper = mountPane();
    const rows = trackRows(wrapper, ARMED.name);

    expect(map(rows, row => trim(row.text()))).toEqual(
      map(ARMED.steps, step => expect.stringContaining(step.text))
    );
  });
});

describe("T3.4 the playhead marks the line being run (AC3.4 · H4)", () => {
  it("marks the row whose line the player is on", () => {
    const step = ARMED.steps[1]!;
    const wrapper = mountPane({
      trackName: ARMED.name,
      playheadLine: step.line
    });

    const marked = wrapper.findAll(MARKED);
    expect(marked).toHaveLength(1);
    expect(marked[0]!.attributes("data-test-value")).toBe(String(step.line));
    expect(includes(marked[0]!.text(), step.text)).toBe(true);
  });

  it("marks it on the ARMED track alone, where a Background line names one row per track", () => {
    const background = ARMED.steps[0]!;
    const wrapper = mountPane({
      trackName: ARMED.name,
      playheadLine: background.line
    });

    expect(wrapper.findAll(MARKED)).toHaveLength(1);
    expect(
      wrapper.find(`[data-test-value="${ARMED.name}"]`).find(MARKED).exists()
    ).toBe(true);
  });

  it("moves the mark with the playhead", async () => {
    const wrapper = mountPane({
      trackName: ARMED.name,
      playheadLine: ARMED.steps[1]!.line
    });

    await wrapper.setProps({ playheadLine: ARMED.steps[2]!.line });

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
    const wrapper = mountPane({
      trackName: ARMED.name,
      trackScope: STAFF_SCOPE
    });
    const scope = wrapper.find(TRACK_SCOPE);

    expect(scope.exists()).toBe(true);
    expect(scope.text()).toContain(
      trim(translate("labs.scenario_track_scope", { scope: "" }))
    );
    expect(scope.text()).toContain(STAFF_SCOPE.context.id);
  });

  it("says nothing about scope where the track declared none", () => {
    const wrapper = mountPane({ trackName: ARMED.name });

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

  it("still draws the page's own declaration while the playlist is unreachable", () => {
    const wrapper = mountPane({ featureText: undefined });

    expect(
      wrapper.findComponent(Markdown).props("modelValue") as string
    ).toContain(DECLARATION);
    expect(wrapper.text()).toContain(
      translate("labs.scenario_feature_pending")
    );
  });
});
