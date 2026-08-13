// -----------------------------------------------------------------------------
/**
 * @module cells/__tests__/table-cell-badge-tone.spec
 * @description `D8` — a declared status badge draws in the house's TONAL
 * treatment, now that the cell RENDERER draws it rather than the retired row-cell
 * switch (`R6-36`). The oracle is the ui Badge itself, never a class string
 * copied out of its config: the same Badge is mounted directly in each treatment
 * at the rendered badge's own colour and size, so the only thing under test is
 * the variant.
 *
 * ## What Breaks If These Fail
 * Status goes back to reading as more table — outlined text against a table of
 * text — or a later edit swaps a treatment nobody notices until the operator
 * does.
 *
 * Negative controls: `table-cell-badge-tone.must-fail.patch`.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";
import text from "@upmind-automation/i18n/core/text-en.json";
import { Badge } from "@upmind-automation/upmind-ui";
import { defaultRow } from "../../../../../../tests/support/recorded-emails";
import clientEmails from "../../../../useClientEmails/client-email.scenario";
import { CellDispatcher } from "../index";
import { find, isEmpty, map } from "lodash-es";
import type { TableCellBadges } from "../../../scenario.types";
import type { BadgeProps } from "@upmind-automation/upmind-ui";
import type { VueWrapper } from "@vue/test-utils";

// -----------------------------------------------------------------------------

/** The ui Badge's own name for the soft/tonal treatment. */
const TONAL = "muted";

const BADGE_TEST_KEY = "badge";

const messages = { en: { text } };

const statusElement = find(clientEmails.presentation.table.elements, {
  type: "TableCellBadges"
}) as TableCellBadges;

const rendered = () =>
  mount(CellDispatcher, {
    props: { element: statusElement, row: defaultRow },
    global: { plugins: [createI18n({ legacy: false, locale: "en", messages })] }
  }).findAllComponents(Badge);

/** A ui Badge is a fragment (its stylesheet comment leads), so classes live on its root element. */
const classesOf = (badge: VueWrapper) =>
  badge.find(`[data-test-key="${BADGE_TEST_KEY}"]`).classes();

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

describe("D8 a declared status badge is the TONAL ui Badge", () => {
  it("raises a badge per truthy flag the declaration named", () => {
    expect(rendered().length).toBeGreaterThan(0);
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
    const declared = map(statusElement.options.badges, "color");

    for (const badge of rendered())
      expect(declared).toContain(badge.props("color"));
  });

  it("says what the declaration says, translated", () => {
    for (const badge of rendered()) expect(badge.text()).not.toContain("text.");
  });
});
