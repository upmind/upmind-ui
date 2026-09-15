// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/__tests__/scenario-menu-presets.spec
 * @description The menu RENDERS what it is handed and derives nothing: a module
 * whose feature never names a refused write arrives without that state, so the
 * entry is simply absent rather than offered-and-disabled, which is the
 * dead-alive control `S14` forbids.
 *
 * What a module may be forced into is declared by that module's own
 * `<module>.feature` in `packages/headless`, read by `force/states.ts` and
 * filtered by what its recordings can answer (`force/offer.ts`). A labs-side
 * feature restating it would be a second copy of the same contract, so this
 * file anchors to none.
 *
 * Each option is NAMED by the scenario it came from, so this spec never asks
 * the menu to translate anything: the label on screen is the feature's own
 * sentence, and the handle in the DOM is that state's slug.
 *
 * The states are read where the menu portals them, once it is open — a closed
 * menu renders none, so a query against a shut panel would report an empty
 * offer as a passing one.
 *
 * ## What Breaks If These Fail
 * A read-only module offers a refused write, the developer arms it, and nothing
 * happens — no rejected mutation is on record to serve it from. Or the menu
 * starts deriving its own list, and the picker and the offer drift apart.
 */

import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";
import action from "@upmind-automation/i18n/core/action-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import labsEn from "@upmind-automation/i18n/modules/labs-en.json";
import { forcedStateSlug } from "../../force/states";
import {
  FORCE_RECIPE_KIND,
  FORCE_RECIPE_TARGET
} from "../../force/states.types";
import ScenarioMenu from "../ScenarioMenu.vue";
import { map, trim } from "lodash-es";
import type {
  ForceRecipeKind,
  ForceRecipeTarget,
  ForcedState
} from "../../force/states.types";

// -----------------------------------------------------------------------------

const messages = { en: { action, labs: labsEn, text } };

/**
 * One state as a feature would have declared it — a scenario title, and the
 * transport condition that title names. Built through the runtime's own slug
 * derivation, so a state here is addressed exactly as one off a real feature.
 */
const state = (
  title: string,
  kind: ForceRecipeKind,
  target: ForceRecipeTarget = FORCE_RECIPE_TARGET.READ
): ForcedState => {
  const recipe = { kind, target };

  return {
    slug: forcedStateSlug(title, recipe),
    title,
    label: title,
    phrase: title,
    line: 1,
    recipe
  };
};

/** A module whose feature names its read states and no failing write. */
const READ_ONLY: ForcedState[] = [
  state(
    "Know whether my list is loading, empty, or errored",
    FORCE_RECIPE_KIND.PENDING
  ),
  state("An empty list tells me it is empty", FORCE_RECIPE_KIND.ABSENT),
  state("A failed read tells me it failed", FORCE_RECIPE_KIND.REFUSED)
];

/** A module whose feature also names a save that fails. */
const WITH_MUTATIONS: ForcedState[] = [
  ...READ_ONLY,
  state(
    "I am told when a save fails, where I am working",
    FORCE_RECIPE_KIND.REFUSED,
    FORCE_RECIPE_TARGET.WRITE
  )
];

const slugs = (states: ForcedState[]) => map(states, entry => entry.slug);

const open = async (states: readonly ForcedState[]) => {
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

  // A menu that never opened offers the same nothing as one with nothing to
  // offer, so every claim is read only after the panel is witnessed open.
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

describe("Read-only module shows only the states its feature names", () => {
  it("offers each of them, by its own slug", async () => {
    await open(READ_ONLY);

    expect(handles()).toEqual(slugs(READ_ONLY));
  });

  it("does not offer a refused write — its feature never names one", async () => {
    await open(READ_ONLY);

    expect(handles()).not.toContain(slugs(WITH_MUTATIONS)[3]);
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

  it("names each state with the scenario's own sentence (S21)", async () => {
    await open(READ_ONLY);

    expect(labels()).toEqual(map(READ_ONLY, entry => entry.label));
    for (const label of labels()) expect(label).not.toBe("");
  });
});

describe("A module whose feature names a failing save shows that state too", () => {
  it("offers every state it is handed", async () => {
    await open(WITH_MUTATIONS);

    expect(handles()).toEqual(slugs(WITH_MUTATIONS));
  });

  it("offers the refused write, the state a recorded refusal earns", async () => {
    await open(WITH_MUTATIONS);

    expect(handles()).toContain(slugs(WITH_MUTATIONS)[3]);
  });
});

describe("the menu renders what it is handed and derives nothing", () => {
  it("offers a single state when handed one — never a vocabulary of its own", async () => {
    await open([READ_ONLY[0]!]);

    expect(handles()).toEqual([READ_ONLY[0]!.slug]);
  });

  it("offers no force group at all when handed none (S12)", async () => {
    await open([]);

    expect(handles()).toEqual([]);
  });

  it("keeps the order it is handed — the feature's own", async () => {
    const reversed = [...READ_ONLY].reverse();

    await open(reversed);

    expect(handles()).toEqual(slugs(reversed));
  });

  it("never offers replay — the player arms that one, no url carries it", async () => {
    await open(WITH_MUTATIONS);

    expect(handles()).not.toContain("replay");
  });
});
