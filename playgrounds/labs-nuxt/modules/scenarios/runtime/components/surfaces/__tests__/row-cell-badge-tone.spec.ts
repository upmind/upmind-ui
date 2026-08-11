// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC3 a status badge draws in the house's TONAL treatment (D8).
 *
 * ## Job To Be Done
 * The operator's badges rendered outlined/plain against a table of plain text,
 * so status read as more table rather than as status. The ruling is the ui
 * Badge's soft/tonal variant — the tinted-background one the rest of the house
 * uses. The oracle here is the ui component itself, never a class string copied
 * out of `badge.config`: the same Badge is rendered directly in the tonal and in
 * the solid treatment, and the badge the declaration produced must be the tonal
 * one, class for class. That keeps this honest in jsdom (nothing is painted) and
 * keeps it true the day the house re-tunes what tonal looks like.
 *
 * ## What Breaks If These Fail
 * Status goes back to reading as text, or a later edit silently swaps a
 * treatment nobody notices until the operator does.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { Badge } from "@upmind-automation/upmind-ui";
import { defaultRow } from "../../../../../../tests/support/recorded-emails";
import clientEmails from "../../../../useClientEmails/scenario";
import { RowCellTypes } from "../../../scenario.types";
import RowCell from "../RowCell.vue";
import { find, isEmpty, map } from "lodash-es";
import type { RowElement } from "../../../scenario.types";
import type { BadgeProps } from "@upmind-automation/upmind-ui";
import type { VueWrapper } from "@vue/test-utils";

// -----------------------------------------------------------------------------

/** The ui Badge's own name for the soft/tonal treatment. */
const TONAL = "muted";

const BADGE_TEST_KEY = "badge";

/** The one declared element that draws as badges — found by its treatment. */
const statusElement = find(clientEmails.presentation.row.elements, {
  options: { cell: RowCellTypes.BADGES }
}) as RowElement;

/** The badges the recorded default row actually raises, in declaration order. */
const rendered = () =>
  mount(RowCell, {
    props: { element: statusElement, row: defaultRow }
  }).findAllComponents(Badge);

/** A ui Badge is a fragment (its stylesheet comment leads), so classes live on its root element. */
const classesOf = (badge: VueWrapper) =>
  badge.find(`[data-test-key="${BADGE_TEST_KEY}"]`).classes();

/**
 * The SAME ui Badge drawn directly, in one treatment, at the rendered badge's
 * own colour and size — so the only thing this oracle supplies is the variant,
 * which is the whole of what D8 rules on.
 */
const reference = (badge: VueWrapper, variant: BadgeProps["variant"]) =>
  classesOf(
    mount(Badge, {
      props: {
        variant,
        color: badge.props("color") as BadgeProps["color"],
        size: badge.props("size") as BadgeProps["size"],
        label: "reference"
      }
    })
  );

// -----------------------------------------------------------------------------

describe("@AC3 a declared status badge is the TONAL ui Badge (D8)", () => {
  it("raises a badge per truthy flag the declaration named", () => {
    const badges = rendered();

    expect(badges.length).toBeGreaterThan(0);
    expect(isEmpty(statusElement.options.badges)).toBe(false);
  });

  it("draws exactly what the ui Badge's tonal treatment draws", () => {
    for (const badge of rendered())
      expect(classesOf(badge)).toEqual(reference(badge, TONAL));
  });

  it("draws none of them in the solid or the outlined treatment", () => {
    for (const badge of rendered()) {
      expect(classesOf(badge)).not.toEqual(reference(badge, "solid"));
      expect(classesOf(badge)).not.toEqual(reference(badge, "minimal"));
    }
  });

  it("keeps each badge's DECLARED colour — the tone is the variant, not a repaint", () => {
    const badges = rendered();
    const declared = map(statusElement.options.badges, "color");

    for (const badge of badges)
      expect(declared).toContain(badge.props("color"));
  });

  it("says what the declaration says, translated", () => {
    const badges = rendered();

    for (const badge of badges) expect(badge.text()).not.toContain("text.");
  });
});
