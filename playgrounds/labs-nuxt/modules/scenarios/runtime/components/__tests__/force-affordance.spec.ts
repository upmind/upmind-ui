// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/__tests__/force-affordance.spec
 * @description T3.13 — a forced page is unmistakable, and it is unmistakably a
 * CHOICE (`AC8.4` · `H2`). Four claims:
 *   1. with a preset armed the canvas is dressed — a frame treatment plus a chip
 *      that NAMES the preset, drawn as the ui `Badge`;
 *   2. every colour it resolves to comes from the primary or secondary family
 *      and NONE from warning, danger or success: forcing is a mode the developer
 *      chose, never a fault the page is reporting (`H2`);
 *   3. clearing the preset removes both, and the page underneath is untouched
 *      either way — the frame wraps the page, it never replaces it (`S22`);
 *   4. the chip's name is the catalogue's (`FORCE_PRESET_LABELS` → `labs.*`), so
 *      the picker and the chip can never call one state two things (`S21`).
 *
 * `ESC6` is RULED (route (a), 2026-08-12), so the picker offers its presets
 * unconditionally. That picker is `ScenarioMenu`: `R7-11` moved the forced states
 * into the bar's ONE dropdown, so claim 4's block reads them there instead of off
 * the never-built `ForceController` (repointed under the operator ruling of
 * 2026-08-18, re-do `W2`). They are read where the menu portals them, once it is
 * open — a closed menu renders none, so a query alone would report an empty offer
 * as a passing one.
 */

import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { h } from "vue";
import { createI18n } from "vue-i18n";
import action from "@upmind-automation/i18n/core/action-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import labsEn from "@upmind-automation/i18n/modules/labs-en.json";
import { Badge } from "@upmind/ui";
import { FORCE_URL_PRESETS } from "../../composables/useForcedState.types";
import { FORCE_PRESET_LABELS } from "../ForcedCanvas.types";
import ForcedCanvas from "../ForcedCanvas.vue";
import ScenarioMenu from "../ScenarioMenu.vue";
import {
  filter,
  flatMap,
  includes,
  isEmpty,
  keys,
  map,
  reject,
  some,
  split,
  trim
} from "lodash-es";
import type { ForcePreset } from "../../composables/useForcedState.types";

// -----------------------------------------------------------------------------

const PAGE = "the page underneath";

/** The families a chosen mode may wear, and the ones it may never (`H2`). */
const CHOSEN = ["primary", "secondary"];

const REPORTED = ["warning", "danger", "success"];

const messages = { en: { action, labs: labsEn, text } };

const translate = createI18n({ legacy: false, locale: "en", messages }).global
  .t;

const CANVAS = '[data-test-key="forced-canvas"]';

const CHIP = '[data-test-key="forced-preset"]';

const mountCanvas = (preset?: ForcePreset) =>
  mount(ForcedCanvas, {
    attachTo: document.body,
    props: { preset },
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

const named = (preset: ForcePreset) =>
  translate("labs.forced_preset", {
    preset: translate(FORCE_PRESET_LABELS[preset])
  });

// The menu portals its entries to the body, so a stale one would be read as this
// test's offer.
afterEach(() => {
  document.body.innerHTML = "";
});

// -----------------------------------------------------------------------------

describe("T3.13 an armed page says so, by name (AC8.4)", () => {
  it("dresses the canvas and names the preset on it", () => {
    const wrapper = mountCanvas("empty");

    expect(wrapper.find(CHIP).exists()).toBe(true);
    expect(wrapper.find(CHIP).text()).toBe(named("empty"));
  });

  it("names each preset from the one catalogue both halves read", () => {
    for (const preset of keys(FORCE_PRESET_LABELS) as ForcePreset[]) {
      expect(mountCanvas(preset).find(CHIP).text()).toBe(named(preset));
    }
  });

  it("draws the chip as the real ui Badge, never a hand-rolled pill", () => {
    expect(mountCanvas("empty").findAllComponents(Badge)).toHaveLength(1);
    expect(mountCanvas().findAllComponents(Badge)).toHaveLength(0);
  });

  it("names the preset the player arms too, not only the three a url carries", () => {
    expect(mountCanvas("replay").find(CHIP).text()).toBe(named("replay"));
  });
});

describe("T3.13 a chosen mode, never a reported fault (H2)", () => {
  it("resolves the whole affordance to the primary or secondary family", () => {
    const tokens = affordanceTokens(mountCanvas("empty"));

    expect(carrying(tokens, CHOSEN).length).toBeGreaterThan(0);
  });

  it("carries nothing from the families a page reports trouble in", () => {
    for (const preset of keys(FORCE_PRESET_LABELS) as ForcePreset[]) {
      expect(carrying(affordanceTokens(mountCanvas(preset)), REPORTED)).toEqual(
        []
      );
    }
  });

  it("dresses BOTH error presets in the same chosen family as the others — a forced error is still a choice (R6-19)", () => {
    for (const preset of [
      "error-action",
      "error-collection"
    ] as ForcePreset[]) {
      const forced = affordanceTokens(mountCanvas(preset));

      expect(carrying(forced, CHOSEN).length).toBeGreaterThan(0);
      expect(carrying(forced, REPORTED)).toEqual([]);
    }
  });
});

describe("T3.13 clearing it removes both (AC8.4)", () => {
  it("drops the chip and the frame treatment when no preset is armed", () => {
    const live = mountCanvas();

    expect(live.find(CHIP).exists()).toBe(false);
    expect(carrying(affordanceTokens(live), [...CHOSEN, ...REPORTED])).toEqual(
      []
    );
  });

  it("drops them again on the same instance when the preset clears", async () => {
    const wrapper = mountCanvas("empty");

    await wrapper.setProps({ preset: undefined });

    expect(wrapper.find(CHIP).exists()).toBe(false);
    expect(
      carrying(affordanceTokens(wrapper), [...CHOSEN, ...REPORTED])
    ).toEqual([]);
  });

  it("leaves the page it wraps alone in both states — the page IS the preview", () => {
    expect(mountCanvas("empty").text()).toContain(PAGE);
    expect(mountCanvas().text()).toContain(PAGE);
  });
});

describe("T3.13 the picker offers only what can actually be served (ESC6)", () => {
  const open = async () => {
    const wrapper = mount(ScenarioMenu, {
      attachTo: document.body,
      props: { tracks: [] },
      global: {
        plugins: [createI18n({ legacy: false, locale: "en", messages })]
      }
    });

    await wrapper.find('[data-test-key="scenario-menu"]').trigger("click");
    await new Promise(resolve => setTimeout(resolve, 20));
  };

  const offered = () => [
    ...document.querySelectorAll<HTMLElement>(
      '[data-test-key="force-preset-option"]'
    )
  ];

  const handles = () => map(offered(), option => option.dataset.testValue);

  const labels = () => map(offered(), option => trim(option.textContent ?? ""));

  it("offers exactly the presets a url can carry, in their own order", async () => {
    await open();

    expect(handles()).toEqual([...FORCE_URL_PRESETS]);
  });

  it("names each of them from the catalogue both halves read (S21)", async () => {
    await open();

    expect(labels()).toEqual(
      map(FORCE_URL_PRESETS, preset => translate(FORCE_PRESET_LABELS[preset]))
    );
  });

  it("never offers replay — the player arms that one, no url carries it", async () => {
    await open();

    expect(handles()).not.toContain("replay");
    expect(labels()).not.toContain(translate(FORCE_PRESET_LABELS.replay));
  });
});
