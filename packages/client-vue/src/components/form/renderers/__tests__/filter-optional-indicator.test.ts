/**
 * @module form/renderers/__tests__/filter-optional-indicator
 * @description E3 — a filter is optional by definition, so no filter column
 * draws the field's "Optional" indicator. The operator saw it beside Verified
 * and read it as noise: every control in that bar is optional, so the word
 * distinguishes nothing and costs a line of chrome per column.
 *
 * Falsifiability is built into the file rather than asserted about: the same
 * `UpmForm` mount, given a plain optional control, still draws the indicator.
 * A suppression that overshot into deleting the indicator outright would turn
 * that case RED, so a green run here cannot mean the word simply stopped
 * existing.
 */

import { describe, expect, it } from "vitest";
import {
  useQuerySchema,
  useQueryUischema
} from "@upmind-automation/headless/testing/client-email/internal-kit";
import text from "@upmind-automation/i18n/core/text-en.json";
import { mountFilters, renderedStrings } from "./filter.harness";
import { includes } from "lodash-es";

// -----------------------------------------------------------------------------

/** Every column the shipped query uischema draws a filter for. */
const COLUMNS = ["email", "verified", "bounced"];

const shippedFilters = () =>
  mountFilters({ schema: useQuerySchema(), uischema: useQueryUischema() });

/** One ordinary optional control through the SAME renderer set. */
const plainControl = () =>
  mountFilters({
    schema: {
      type: "object",
      properties: { nickname: { type: "string", title: "Nickname" } }
    },
    uischema: {
      type: "VerticalLayout",
      elements: [{ type: "Control", scope: "#/properties/nickname" }]
    }
  });

// -----------------------------------------------------------------------------

describe("no filter column draws the Optional indicator (E3)", () => {
  it("says it on no column of the shipped bar", async () => {
    const { column } = await shippedFilters();

    for (const name of COLUMNS) {
      expect(includes(column(name).text(), text.optional)).toBe(false);
    }
  });

  it("puts it nowhere else in the bar either — not a label, not an attribute", async () => {
    const { wrapper } = await shippedFilters();

    expect(renderedStrings(wrapper)).not.toContain(text.optional);
  });
});

describe("the indicator is still live for the fields that earn it (E3)", () => {
  it("draws it on an ordinary optional control in the very same mount", async () => {
    const { wrapper } = await plainControl();

    expect(renderedStrings(wrapper)).toContain(text.optional);
  });
});
