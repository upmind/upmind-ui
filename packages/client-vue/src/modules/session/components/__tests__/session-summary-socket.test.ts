// -----------------------------------------------------------------------------
/**
 * @fileoverview The session templates and the basket-summary aside the cart hands the auth pages.
 *
 * ## Job To Be Done
 * The record holds one template for every arrangement a brand can pick and
 * nothing else; the aside the cart puts in the `summary` slot is this package's
 * own component, not a template.
 *
 * ## What Breaks If These Fail
 * A brand's chosen arrangement has no page, or the basket summary is drawn as a
 * page template.
 */

import { describe, expect, it } from "vitest";
import { AUTH_TEMPLATE } from "@upmind-automation/auth";
import { includes, keys, sortBy, values } from "lodash-es";

// -----------------------------------------------------------------------------

async function sessionBarrel() {
  return import("../../index");
}

describe("the session templates and the summary aside", () => {
  it("holds a template for every arrangement a brand can pick", async () => {
    const { SESSION_TEMPLATES } = await sessionBarrel();

    for (const arrangement of values(AUTH_TEMPLATE)) {
      expect(SESSION_TEMPLATES[arrangement], arrangement).toBeTruthy();
    }
  }, 30000);

  it("holds nothing but the arrangements", async () => {
    const { SESSION_TEMPLATES } = await sessionBarrel();

    expect(sortBy(keys(SESSION_TEMPLATES))).toEqual(
      sortBy(values(AUTH_TEMPLATE))
    );
  });

  it("hands the summary slot this package's own aside, not a template", async () => {
    const { SESSION_TEMPLATES, UpmSessionSummary } = await sessionBarrel();
    const { default: SessionSummary } = await import("../SessionSummary.vue");

    expect(UpmSessionSummary).toBe(SessionSummary);
    expect(includes(values(SESSION_TEMPLATES), UpmSessionSummary)).toBe(false);
  });
});
