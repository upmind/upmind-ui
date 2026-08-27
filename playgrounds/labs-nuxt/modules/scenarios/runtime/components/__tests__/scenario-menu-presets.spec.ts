// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/__tests__/scenario-menu-presets.spec
 * @description FE-3113 — the two scenarios of
 * `force-presets-by-capability.feature`. The menu RENDERS what it is handed and
 * derives nothing: a read-only module's presets arrive without `error-action`,
 * so the entry is simply absent rather than offered-and-disabled, which is the
 * dead-alive control `S14` forbids.
 *
 * The presets are read where the menu portals them, once it is open — a closed
 * menu renders none, so a query against a shut panel would report an empty offer
 * as a passing one.
 *
 * ## What Breaks If These Fail
 * A read-only module offers `error-action`, the developer arms it, and nothing
 * happens — its feature declares no rejected mutation to serve it from. Or the
 * menu starts deriving its own list, and the picker and the spec drift apart.
 *
 * Negative control: `scenario-menu-presets.renders-vocabulary.must-fail.patch`.
 *
 * @anchor force-presets-by-capability.feature
 */

import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";
import action from "@upmind-automation/i18n/core/action-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import labsEn from "@upmind-automation/i18n/modules/labs-en.json";
import { FORCE_URL_PRESETS } from "../../composables/useForcedState.types";
import ScenarioMenu from "../ScenarioMenu.vue";
import { map, trim } from "lodash-es";
import type { ForceUrlPreset } from "../../composables/useForcedState.types";

// -----------------------------------------------------------------------------

const messages = { en: { action, labs: labsEn, text } };

/** A module whose feature declares a refused READ only (`client-email-history`). */
const READ_ONLY: ForceUrlPreset[] = ["empty", "loading", "error-collection"];

/** A module whose feature declares a rejected MUTATION (`client-email`). */
const WITH_MUTATIONS: ForceUrlPreset[] = [...FORCE_URL_PRESETS];

const open = async (presets: readonly ForceUrlPreset[]) => {
  const wrapper = mount(ScenarioMenu, {
    attachTo: document.body,
    props: { tracks: [], presets },
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

  // Witnessed open before any claim is read off it: a menu that never opened
  // offers the same nothing as one with nothing to offer.
  expect(document.querySelector('[role="listbox"]')).not.toBeNull();
};

const offered = () => [
  ...document.querySelectorAll<HTMLElement>(
    '[data-test-key="force-preset-option"]'
  )
];

const handles = () => map(offered(), option => option.dataset.testValue);

const labels = () => map(offered(), option => trim(option.textContent ?? ""));

afterEach(() => {
  document.body.innerHTML = "";
});

// -----------------------------------------------------------------------------

describe("Read-only module shows only read presets", () => {
  it("offers empty, loading and error-collection", async () => {
    await open(READ_ONLY);

    expect(handles()).toEqual(READ_ONLY);
  });

  it("does not offer error-action — its feature declares no rejected write", async () => {
    await open(READ_ONLY);

    expect(handles()).not.toContain("error-action");
  });

  it("leaves it ABSENT rather than offered-and-disabled (S14)", async () => {
    await open(READ_ONLY);

    const dead = offered().filter(
      option =>
        option.hasAttribute("disabled") ||
        option.getAttribute("aria-disabled") === "true" ||
        option.dataset.disabled !== undefined
    );

    expect(map(dead, option => option.dataset.testValue)).toEqual([]);
  });

  it("names each preset it does offer, so none renders blank", async () => {
    await open(READ_ONLY);

    expect(labels()).toHaveLength(READ_ONLY.length);
    for (const label of labels()) expect(label).not.toBe("");
  });
});

describe("Module with mutations shows all presets", () => {
  it("offers empty, loading, error-action and error-collection", async () => {
    await open(WITH_MUTATIONS);

    expect(handles()).toEqual(WITH_MUTATIONS);
  });

  it("offers error-action, the preset a declared rejected mutation earns", async () => {
    await open(WITH_MUTATIONS);

    expect(handles()).toContain("error-action");
  });
});

describe("the menu renders what it is handed and derives nothing", () => {
  it("offers a single preset when handed one — never the whole vocabulary", async () => {
    await open(["loading"]);

    expect(handles()).toEqual(["loading"]);
  });

  it("offers no force group at all when handed none (S12)", async () => {
    await open([]);

    expect(handles()).toEqual([]);
  });

  it("keeps the order it is handed, rather than re-sorting to the vocabulary", async () => {
    const reversed = [...READ_ONLY].reverse();

    await open(reversed);

    expect(handles()).toEqual(reversed);
  });

  it("never offers replay — the player arms that one, no url carries it", async () => {
    await open(WITH_MUTATIONS);

    expect(handles()).not.toContain("replay");
  });
});
