// -----------------------------------------------------------------------------
/**
 * @fileoverview The layout the Nuxt cart's domain search page draws for the template it is handed
 *
 * ## Job To Be Done
 * Given the template the DAC organism hands its page, the page draws the layout
 * that name carries, and the full layout for no name, an empty name, a template
 * the organism draws itself, or a name no domain layout carries.
 *
 * ## What Breaks If These Fail
 * A domain search page handed no template, or one it does not lay out, draws
 * no layout and no way to search.
 */

import { describe, expect, it } from "vitest";
import { DOMAIN_TEMPLATE } from "@upmind-automation/domain";
import { domainTemplate } from "../app/shell/modules/domain/shell";
import DomainFull from "../app/shell/modules/domain/templates/DomainFull.template.vue";

// -----------------------------------------------------------------------------

describe("domainTemplate", () => {
  it("draws the layout the full template carries", () => {
    expect(domainTemplate(DOMAIN_TEMPLATE.FULL)).toBe(DomainFull);
  });

  it.each([
    ["no template", undefined],
    ["an empty template", ""]
  ])("draws the full layout for %s", (_case, template) => {
    expect(domainTemplate(template)).toBe(DomainFull);
  });

  it.each([DOMAIN_TEMPLATE.DRAWER, DOMAIN_TEMPLATE.WIDGET])(
    "draws the full layout for the %s template the organism draws itself",
    template => {
      expect(domainTemplate(template)).toBe(DomainFull);
    }
  );

  it.each([
    ["a template only other pages carry", "two-column-rtl"],
    ["a name no layout carries", "not-a-template"]
  ])("draws the full layout for %s", (_case, template) => {
    expect(domainTemplate(template)).toBe(DomainFull);
  });
});
