/**
 * @module form/renderers/__tests__/filter-optional-indicator
 * @description A filter is optional by definition, so no filter column draws the
 * field's "Optional" indicator. The operator saw it beside Verified and read it
 * as noise: every control in that bar is optional, so the word distinguishes
 * nothing and costs a line of chrome per column.
 *
 * The suppression is the UISCHEMA's — `optionalText: ""`, declared per element —
 * never a rule a renderer keeps to itself. So the same element with that option
 * lifted must draw the word again; a renderer that hardcoded the suppression
 * would keep it hidden and turn that case RED.
 *
 * Falsifiability is built into the file rather than asserted about: the same
 * `UpmForm` mount, given a plain optional control, still draws the indicator. A
 * suppression that overshot into deleting the indicator outright would turn that
 * case RED too, so a green run here cannot mean the word simply stopped
 * existing.
 */

import { describe, expect, it } from "vitest";
import text from "@upmind-automation/i18n/core/text-en.json";
import {
  clientEmailQuery,
  mountFilters,
  renderedStrings,
  uischemaWithOptions
} from "./filter.harness";
import { includes } from "lodash-es";

/** Every leaf the shipped query uischema draws a filter for. */
const COLUMNS = [
  "filters.email.like",
  "filters.verified.eq",
  "filters.bounced.eq"
];

const shippedFilters = () => mountFilters(clientEmailQuery());

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

describe("no filter column draws the Optional indicator", () => {
  it("says it on no column of the shipped bar", async () => {
    const { column } = await shippedFilters();

    for (const path of COLUMNS) {
      expect(includes(column(path).text(), text.optional)).toBe(false);
    }
  });

  it("puts it nowhere else in the bar either — not a label, not an attribute", async () => {
    const { wrapper } = await shippedFilters();

    expect(renderedStrings(wrapper)).not.toContain(text.optional);
  });
});

describe("the suppression is the uischema's option, not the renderer's rule", () => {
  it("draws the word again on the very same column once optionalText is lifted", async () => {
    const { schema, uischema } = clientEmailQuery();
    const { column } = await mountFilters({
      schema,
      uischema: uischemaWithOptions(uischema, "/verified/properties/eq", {
        format: "button-group"
      })
    });

    expect(includes(column("filters.verified.eq").text(), text.optional)).toBe(
      true
    );
  });
});

describe("the indicator is still live for the fields that earn it", () => {
  it("draws it on an ordinary optional control in the very same mount", async () => {
    const { wrapper } = await plainControl();

    expect(renderedStrings(wrapper)).toContain(text.optional);
  });
});
