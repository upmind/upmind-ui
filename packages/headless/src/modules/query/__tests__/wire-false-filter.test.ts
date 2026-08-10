// -----------------------------------------------------------------------------
/**
 * @fileoverview `translateQuery` — the filter half of the wire
 *
 * ## Job To Be Done
 * The translator walks the schema's DECLARED `(column, operator)` pairs, so a
 * column the schema never declares is unspellable and a declared one always has
 * a key. This proves what each declared operator puts on that key against
 * client-email-history's real filter vocabulary: `false` wires as the API's
 * `"0"` rather than vanishing as a falsy value, `true` as `"1"`, a `like`
 * needle wrapped in the translator's own `%` wildcards, and an unset column as
 * the empty sentinel the request layer then drops.
 *
 * That the empty sentinel really does leave the URL — rather than shipping a
 * bare `filter[col|op]=` — is a claim about the request layer, not this one,
 * and is proven on the wire in each migrated module's `*.criteria.int.test.ts`.
 *
 * ## What Breaks If This Fails
 * `false` collapsing to the same value as unset is the invisible one: "show me
 * the emails that did NOT bounce" silently becomes "show me everything", and
 * the user reads a filtered list that was never filtered.
 */

import { describe, expect, it } from "vitest";
import { translateQuery } from "..";
import type { JsonSchema7 } from "@jsonforms/core";

// -----------------------------------------------------------------------------

/** client-email-history's real filter vocabulary. */
const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    filters: {
      type: "object",
      additionalProperties: false,
      properties: {
        subject: { type: "object", properties: { like: {} } },
        sent: { type: "object", properties: { eq: {} } },
        bounced: { type: "object", properties: { eq: {} } },
        error_id: { type: "object", properties: { neq: {} } }
      }
    }
  }
} as JsonSchema7;

describe("translateQuery — boolean columns", () => {
  it("wires false as 0 rather than dropping it", () => {
    const props = translateQuery(schema, {
      filters: { bounced: { eq: false } }
    });

    expect(props.filters?.["filter[bounced|eq]"]).toBe("0");
  });

  it("wires true as 1", () => {
    const props = translateQuery(schema, { filters: { sent: { eq: true } } });

    expect(props.filters?.["filter[sent|eq]"]).toBe("1");
  });

  it("tells an unset boolean column apart from a false one", () => {
    const props = translateQuery(schema, { filters: { sent: { eq: false } } });

    expect(props.filters?.["filter[sent|eq]"]).toBe("0");
    expect(props.filters?.["filter[bounced|eq]"]).toBe("");
  });
});

describe("translateQuery — free text and equality columns", () => {
  it("wraps a like needle in the translator's own % wildcards", () => {
    const props = translateQuery(schema, {
      filters: { subject: { like: "welcome" } }
    });

    expect(props.filters?.["filter[subject|like]"]).toBe("%welcome%");
  });

  it("leaves a neq value alone — no wildcards on an inequality", () => {
    const props = translateQuery(schema, {
      filters: { error_id: { neq: "null" } }
    });

    expect(props.filters?.["filter[error_id|neq]"]).toBe("null");
  });

  it("emits no key for a column the schema does not declare", () => {
    const props = translateQuery(schema, {
      filters: { recipient_id: { eq: "mock-uuid-1" } }
    });

    expect(props.filters?.["filter[recipient_id|eq]"]).toBeUndefined();
  });

  it("emits a key per DECLARED pair, every unset one carrying the empty sentinel", () => {
    const props = translateQuery(schema, {});

    expect(Object.keys(props.filters ?? {})).toEqual([
      "filter[subject|like]",
      "filter[sent|eq]",
      "filter[bounced|eq]",
      "filter[error_id|neq]"
    ]);
    expect(Object.values(props.filters ?? {})).toEqual(["", "", "", ""]);
  });
});
