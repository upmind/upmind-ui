// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/__tests__/force-affordance.spec
 * @description T3.13 — a forced page is unmistakable, and it is unmistakably a
 * CHOICE (`AC8.4` · `H2`). Four claims:
 *   1. with a state armed the canvas is dressed — a frame treatment plus a chip
 *      that NAMES it, drawn as the ui `Badge`;
 *   2. every colour it resolves to comes from the primary or secondary family
 *      and NONE from warning, danger or success: forcing is a mode the developer
 *      chose, never a fault the page is reporting (`H2`);
 *   3. clearing the state removes both, and the page underneath is untouched
 *      either way — the frame wraps the page, it never replaces it (`S22`);
 *   4. the chip's name is the armed state's OWN — the scenario title its
 *      feature wrote — so the picker and the chip can never call one state two
 *      things (`S21`). `replay` is the one exception, and the only name this
 *      app still owns for a forced page: no feature declares it, because the
 *      player arms it (`FORCE_REPLAY_LABEL`).
 *
 * `ESC6` is RULED (route (a), 2026-08-12), so the picker offers its states
 * unconditionally. That picker is `ScenarioMenu`: `R7-11` moved the forced
 * states into the bar's ONE dropdown, so claim 4's block reads them there
 * instead of off the never-built `ForceController` (repointed under the
 * operator ruling of 2026-08-18, re-do `W2`). They are read where the menu
 * portals them, once it is open — a closed menu renders none, so a query alone
 * would report an empty offer as a passing one.
 */

import { Badge } from "@upmind/ui";
import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { h } from "vue";
import { createI18n } from "vue-i18n";
import action from "@upmind-automation/i18n/core/action-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import labsEn from "@upmind-automation/i18n/modules/labs-en.json";
import { forcedStateSlug } from "../../force/states";
import {
  FORCE_RECIPE_KIND,
  FORCE_RECIPE_TARGET,
  FORCE_RECIPES
} from "../../force/states.types";
import { FORCE_REPLAY_LABEL } from "../ForcedCanvas.types";
import ForcedCanvas from "../ForcedCanvas.vue";
import ScenarioMenu from "../ScenarioMenu.vue";
import {
  filter,
  flatMap,
  includes,
  isEmpty,
  map,
  reject,
  some,
  split,
  trim
} from "lodash-es";
import type { ForcePreset } from "../../composables/useForcedState.types";
import type { ForcedState } from "../../force/states.types";

// -----------------------------------------------------------------------------

const PAGE = "the page underneath";

/** The families a chosen mode may wear, and the ones it may never (`H2`). */
const CHOSEN = ["primary", "secondary"];

const REPORTED = ["warning", "danger", "success"];

/** Every recipe a page can be held in, plus the one the player arms. */
const ARMABLE: ForcePreset[] = [...FORCE_RECIPES, "loading-action", "replay"];

const messages = { en: { action, labs: labsEn, text } };

const translate = createI18n({ legacy: false, locale: "en", messages }).global
  .t;

const CANVAS = '[data-test-key="forced-canvas"]';

const CHIP = '[data-test-key="forced-preset"]';

/** A state as a feature declares one: a scenario title and its condition. */
const state = (title: string): ForcedState => {
  const recipe = {
    kind: FORCE_RECIPE_KIND.ABSENT,
    target: FORCE_RECIPE_TARGET.READ
  };

  return {
    slug: forcedStateSlug(title, recipe),
    title,
    label: title,
    phrase: title,
    line: 1,
    recipe
  };
};

const ARMED = state(
  "An empty list tells me whether it is empty because I filtered it"
);

const mountCanvas = (preset?: ForcePreset, label?: string) =>
  mount(ForcedCanvas, {
    attachTo: document.body,
    props: { preset, label },
    slots: { default: () => h("p", PAGE) },
    global: {
      plugins: [createI18n({ legacy: false, locale: "en", messages })]
    }
  });

type Canvas = ReturnType<typeof mountCanvas>;

const tokensOf = (element: Element) =>
  reject(split(element.className, /\s+/), isEmpty);

/** Every class token the affordance draws itself with — frame and chip alike. */
const affordanceTokens = (wrapper: Canvas) =>
  flatMap(
    [
      ...wrapper.findAll(CANVAS),
      ...wrapper.findAll(CHIP),
      ...wrapper.findAll(`${CHIP} *`)
    ],
    node => tokensOf(node.element)
  );

const carrying = (tokens: string[], families: string[]) =>
  filter(tokens, token => some(families, family => includes(token, family)));

const named = (label: string) =>
  translate("labs.forced_preset", { preset: label });

afterEach(() => {
  // The menu portals its entries to the body, so a stale one would be read as
  // the next test's offer if the body were not cleared between mounts.
  document.body.innerHTML = "";
});

// -----------------------------------------------------------------------------

describe("T3.13 an armed page says so, by name (AC8.4)", () => {
  it("dresses the canvas and names the armed state on it", () => {
    const wrapper = mountCanvas("empty", ARMED.label);

    expect(wrapper.find(CHIP).exists()).toBe(true);
    expect(wrapper.find(CHIP).text()).toBe(named(ARMED.label));
  });

  it("names it with the SCENARIO's own sentence, never a word of its own (S21)", () => {
    const other = state("A failed read tells me it failed, and I can retry it");

    expect(mountCanvas("error-collection", other.label).find(CHIP).text()).toBe(
      named(other.label)
    );
    expect(mountCanvas("empty", ARMED.label).find(CHIP).text()).not.toBe(
      mountCanvas("empty", other.label).find(CHIP).text()
    );
  });

  it("draws the chip as the real ui Badge, never a hand-rolled pill", () => {
    expect(
      mountCanvas("empty", ARMED.label).findAllComponents(Badge)
    ).toHaveLength(1);
    expect(mountCanvas().findAllComponents(Badge)).toHaveLength(0);
  });

  it("names the state the player arms too — the one no feature declares", () => {
    expect(mountCanvas("replay").find(CHIP).text()).toBe(
      named(translate(FORCE_REPLAY_LABEL))
    );
  });
});

describe("T3.13 a chosen mode, never a reported fault (H2)", () => {
  it("resolves the whole affordance to the primary or secondary family", () => {
    const tokens = affordanceTokens(mountCanvas("empty", ARMED.label));

    expect(carrying(tokens, CHOSEN).length).toBeGreaterThan(0);
  });

  it("carries nothing from the families a page reports trouble in", () => {
    for (const preset of ARMABLE) {
      expect(
        carrying(affordanceTokens(mountCanvas(preset, ARMED.label)), REPORTED)
      ).toEqual([]);
    }
  });

  it("dresses BOTH error presets in the same chosen family as the others — a forced error is still a choice (R6-19)", () => {
    for (const preset of [
      "error-action",
      "error-collection"
    ] as ForcePreset[]) {
      const forced = affordanceTokens(mountCanvas(preset, ARMED.label));

      expect(carrying(forced, CHOSEN).length).toBeGreaterThan(0);
      expect(carrying(forced, REPORTED)).toEqual([]);
    }
  });
});

describe("T3.13 clearing it removes both (AC8.4)", () => {
  it("drops the chip and the frame treatment when nothing is armed", () => {
    const live = mountCanvas();

    expect(live.find(CHIP).exists()).toBe(false);
    expect(carrying(affordanceTokens(live), [...CHOSEN, ...REPORTED])).toEqual(
      []
    );
  });

  it("drops them again on the same instance when the state clears", async () => {
    const wrapper = mountCanvas("empty", ARMED.label);

    await wrapper.setProps({ preset: undefined, label: undefined });

    expect(wrapper.find(CHIP).exists()).toBe(false);
    expect(
      carrying(affordanceTokens(wrapper), [...CHOSEN, ...REPORTED])
    ).toEqual([]);
  });

  it("leaves the page it wraps alone in both states — the page IS the preview", () => {
    expect(mountCanvas("empty", ARMED.label).text()).toContain(PAGE);
    expect(mountCanvas().text()).toContain(PAGE);
  });
});

describe("T3.13 the picker offers only what can actually be served (ESC6)", () => {
  const OFFERED: ForcedState[] = [
    ARMED,
    state("Know whether my list is loading, empty, or errored — loading")
  ];

  /**
   * The menu is the ui `Select`, which reka opens from the KEYBOARD; a
   * synthetic click reaches the handler through neither, because both hang off
   * pointer events jsdom does not construct. The panel is witnessed open before
   * any claim is read off it — a menu that never opened offers the same `[]` as
   * one with nothing to offer, and claim 3 below is a `not.toContain`.
   */
  const open = async (states: readonly ForcedState[] = OFFERED) => {
    const wrapper = mount(ScenarioMenu, {
      attachTo: document.body,
      props: { tracks: [], states },
      global: {
        plugins: [createI18n({ legacy: false, locale: "en", messages })]
      }
    });

    wrapper
      .find('[data-test-key="scenario-menu"]')
      .element.dispatchEvent(
        new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true })
      );
    await new Promise(resolve => setTimeout(resolve, 60));

    expect(document.querySelector('[role="listbox"]')).not.toBeNull();
  };

  const offered = () => [
    ...document.querySelectorAll<HTMLElement>(
      '[data-test-key="force-preset-option"]'
    )
  ];

  const handles = () => map(offered(), option => option.dataset.testValue);

  const labels = () => map(offered(), option => trim(option.textContent ?? ""));

  it("offers exactly the states it is handed, in their own order", async () => {
    await open();

    expect(handles()).toEqual(map(OFFERED, entry => entry.slug));
  });

  it("names each of them with the scenario's own sentence (S21)", async () => {
    await open();

    expect(labels()).toEqual(map(OFFERED, entry => entry.label));
  });

  it("never offers replay — the player arms that one, no url carries it", async () => {
    await open();

    expect(handles()).not.toContain("replay");
    expect(labels()).not.toContain(translate(FORCE_REPLAY_LABEL));
  });
});
