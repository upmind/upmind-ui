// -----------------------------------------------------------------------------
/**
 * @fileoverview parseDomain — wildcard ccTLD regression
 *
 * ## Job To Be Done
 * A domain under a wildcard ccTLD such as .bd parses to its first label and the
 * rest of the domain, the same as a domain under .com.bd.
 *
 * ## What Breaks If These Fail
 * parseDomain returns undefined for upmindtesting.bd, and the domains page
 * crashes when the basket holds that domain.
 */

import { describe, it, expect, vi } from "vitest";

// Circular import through the barrel: this leaf module must be stubbed for ../utils to load.
vi.mock("../../client/emailHistory/services", () => ({ default: {} }));

import { parseDomain } from "../utils";
import type { DomainModel } from "../types";

// -----------------------------------------------------------------------------

const CASES: Array<[string, DomainModel]> = [
  [
    "upmindtesting.bd",
    { sld: "upmindtesting", tld: ".bd", domain: "upmindtesting.bd" }
  ],
  [
    "upmindtesting.com.bd",
    { sld: "upmindtesting", tld: ".com.bd", domain: "upmindtesting.com.bd" }
  ]
];

describe("parseDomain wildcard ccTLD", () => {
  it.each(CASES)(
    "@AC2 parses %s to its SLD and TLD instead of undefined",
    (input, expected) => {
      expect(parseDomain(input)).toEqual(expected);
    }
  );

  it.each(CASES)(
    "@AC2 parses { domain: %s } to its SLD and TLD instead of undefined",
    (input, expected) => {
      expect(parseDomain({ domain: input })).toEqual(expected);
    }
  );
});
