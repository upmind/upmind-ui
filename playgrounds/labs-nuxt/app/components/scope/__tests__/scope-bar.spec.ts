// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC1.1 @G11 @D9 the scope bar is ONE grouped cluster of three
 * segments (T2.1).
 *
 * ## Job To Be Done
 * A developer must be able to read, in one glance at the app chrome, which
 * brand · identity · acting-for the page is at — and reach each of them from
 * the same control. That is a CLUSTER, not three neighbours: one group with one
 * accessible name, and a rule only where two rendered segments actually meet.
 *
 * ## What is NOT claimed here
 * What each segment offers when opened — brand-segment, session-switcher and
 * acting-for-segment specs own their own panels. This spec never opens one.
 *
 * ## What Breaks If These Fail
 * The cluster degrades into loose controls that read as unrelated chrome, or
 * the bar trails a rule against an empty segment on any page whose identity or
 * acting-for segment has nothing to draw (`P13`).
 */

import { describe, expect, it, afterEach, beforeEach, vi } from "vitest";
import { AccessRoleTypes } from "@upmind-automation/types";
import { Separator } from "@upmind-automation/upmind-ui";
import { compact, filter, map, some } from "lodash-es";
import type { Bench } from "./harness";

vi.mock("@upmind-automation/headless", async importOriginal => {
  const real = (await importOriginal()) as object;
  const { headlessDouble } = await import("./harness");
  return headlessDouble(real);
});

const { benchOn, labs, node, resetDom, seedPool } = await import("./harness");
const ScopeBar = (await import("../ScopeBar.vue")).default;

// -----------------------------------------------------------------------------

const SEGMENT_TRIGGERS = ["brand-segment", "session-switcher", "acting-for"];

/**
 * Tailwind states a rule's condition as an arbitrary variant, so the condition
 * is carried on the element itself: read the selector back off the class and
 * ask the DOM. `&` is the element under test; `_` is the variant's space.
 *
 * The element is anchored by a temporary id, not by `:scope` or an attribute:
 * nwsapi (jsdom's engine) resolves `:has()` and `:empty` faithfully, but
 * answers `false` to a bare `:scope` and fails to parse an attribute selector
 * on the right of a sibling combinator.
 */
const ARBITRARY_VARIANT = /^\[(.+)\]:[^:]+$/;
const MARKER = "rule-under-test";

const isShown = (rule: Element): boolean => {
  const original = rule.id;
  rule.id = MARKER;

  try {
    return some(rule.className.split(/\s+/), token => {
      const selector = token.match(ARBITRARY_VARIANT)?.[1];
      if (!selector) return false;

      const anchored = selector.replace(/&/g, `#${MARKER}`).replace(/_/g, " ");

      return some(
        Array.from(document.querySelectorAll(anchored)),
        match => match === rule
      );
    });
  } finally {
    rule.id = original;
  }
};

const bar = (): HTMLElement =>
  document.querySelector<HTMLElement>("[role='group']")!;

const barChildren = (): Element[] => Array.from(bar().children);

const segments = (): Element[] =>
  filter(barChildren(), child => child.hasAttribute("data-segment"));

const drawnSegments = (): Element[] =>
  filter(segments(), segment => !segment.matches(":empty"));

const rules = (): Element[] =>
  filter(barChildren(), child => !child.hasAttribute("data-segment"));

const shownRules = (): Element[] => filter(rules(), isShown);

const POOL = [
  { id: "s1", actor: AccessRoleTypes.STAFF, publicName: "Sam Staff" },
  { id: "c1", actor: AccessRoleTypes.CLIENT, publicName: "Cara Client" }
];

let bench: Bench;

beforeEach(() => {
  seedPool(POOL, { active: "c1" });
});

afterEach(() => {
  bench?.wrapper.unmount();
  resetDom();
});

// -----------------------------------------------------------------------------

describe("@AC1.1 @G11 the three segments are ONE cluster", () => {
  it("groups brand, identity and acting-for inside a single named group", async () => {
    bench = await benchOn(ScopeBar);

    expect(document.querySelectorAll("[role='group']")).toHaveLength(1);
    expect(bar().dataset.testKey).toBe("scope-bar");
    expect(map(SEGMENT_TRIGGERS, key => bar().contains(node(key)))).toEqual([
      true,
      true,
      true
    ]);
  });

  it("names the cluster from the catalogue rather than a template string", async () => {
    bench = await benchOn(ScopeBar);

    expect(bar().getAttribute("aria-label")).toBe(labs("scope_bar"));
  });

  it("draws its rules with the ui separator, not a hand-rolled divider", async () => {
    bench = await benchOn(ScopeBar);

    expect(map(bench.wrapper.findAllComponents(Separator), "element")).toEqual(
      rules()
    );
  });
});

describe("@AC1.1 @D9 a rule is earned only BETWEEN two rendered segments", () => {
  it("shows one rule per join when every segment draws something", async () => {
    bench = await benchOn(ScopeBar);

    expect(drawnSegments()).toHaveLength(3);
    expect(shownRules()).toHaveLength(2);
  });

  it("drops the rule that would trail against a segment with nothing to draw", async () => {
    seedPool(POOL, { active: "c1", available: false });
    bench = await benchOn(ScopeBar);

    expect(drawnSegments()).toHaveLength(2);
    expect(shownRules()).toHaveLength(1);
  });

  it("never shows a rule at either end of the cluster", async () => {
    seedPool(POOL, { active: "c1", available: false });
    bench = await benchOn(ScopeBar);

    const children = barChildren();
    const ends = compact([children[0], children[children.length - 1]]);

    expect(filter(ends, isShown)).toEqual([]);
  });
});
