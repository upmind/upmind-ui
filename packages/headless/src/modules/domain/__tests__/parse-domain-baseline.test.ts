// -----------------------------------------------------------------------------
/**
 * @fileoverview parseDomain — baseline of the spec contract table
 *
 * ## Job To Be Done
 * Pin what parseDomain returns for every input of the spec baseline table:
 * the domain splits at its first dot.
 *
 * ## What Breaks If These Fail
 * A domain no longer parses, or parses to another SLD/TLD,
 * and the order and domain pages show the wrong domain or none.
 */

import { describe, it, expect, vi } from "vitest";

// Circular import through the barrel: this leaf module must be stubbed for ../utils to load.
vi.mock("../../client/emailHistory/services", () => ({ default: {} }));

import { parseDomain } from "../utils";
import type { DomainModel } from "../types";

// -----------------------------------------------------------------------------

const SPLIT_CASES: Array<[string, DomainModel]> = [
  ["example.com", { sld: "example", tld: ".com", domain: "example.com" }],
  ["example.co.uk", { sld: "example", tld: ".co.uk", domain: "example.co.uk" }],
  [
    "example.com.au",
    { sld: "example", tld: ".com.au", domain: "example.com.au" }
  ],
  ["example.uk", { sld: "example", tld: ".uk", domain: "example.uk" }],
  [
    "example.photography",
    { sld: "example", tld: ".photography", domain: "example.photography" }
  ],
  ["EXAMPLE.COM", { sld: "example", tld: ".com", domain: "example.com" }],
  ["my-site.com", { sld: "my-site", tld: ".com", domain: "my-site.com" }],
  ["123.com", { sld: "123", tld: ".com", domain: "123.com" }],
  [
    "xn--bcher-kva.com",
    { sld: "xn--bcher-kva", tld: ".com", domain: "xn--bcher-kva.com" }
  ],
  [
    "example.blogspot.com",
    { sld: "example", tld: ".blogspot.com", domain: "example.blogspot.com" }
  ],
  ["www.example.com", { sld: "example", tld: ".com", domain: "example.com" }],
  [
    "www.example.co.uk",
    { sld: "example", tld: ".co.uk", domain: "example.co.uk" }
  ],
  [
    "upmindtesting.com.bd",
    { sld: "upmindtesting", tld: ".com.bd", domain: "upmindtesting.com.bd" }
  ],
  [
    "upmindtesting.bd",
    { sld: "upmindtesting", tld: ".bd", domain: "upmindtesting.bd" }
  ],
  ["example.ck", { sld: "example", tld: ".ck", domain: "example.ck" }],
  ["example.er", { sld: "example", tld: ".er", domain: "example.er" }],
  ["example.fk", { sld: "example", tld: ".fk", domain: "example.fk" }],
  ["example.jm", { sld: "example", tld: ".jm", domain: "example.jm" }],
  ["example.kh", { sld: "example", tld: ".kh", domain: "example.kh" }],
  ["example.mm", { sld: "example", tld: ".mm", domain: "example.mm" }],
  ["example.np", { sld: "example", tld: ".np", domain: "example.np" }],
  ["example.pg", { sld: "example", tld: ".pg", domain: "example.pg" }],
  [
    "shop.example.com",
    { sld: "shop", tld: ".example.com", domain: "shop.example.com" }
  ],
  ["-example.com", { sld: "example", tld: ".com", domain: "example.com" }],
  ["exa mple.com", { sld: "example", tld: ".com", domain: "example.com" }],
  ["example..com", { sld: "example", tld: ".com", domain: "example.com" }],
  [
    "https://example.com",
    { sld: "example", tld: ".com", domain: "example.com" }
  ],
  ["example.com-", { sld: "example", tld: ".com", domain: "example.com" }],
  [
    "_dmarc.example.com",
    { sld: "dmarc", tld: ".example.com", domain: "dmarc.example.com" }
  ],
  ["co.uk", { sld: "co", tld: ".uk", domain: "co.uk" }]
];

const UNPARSED_CASES = ["example", "", "www.com"];

describe("parseDomain baseline", () => {
  it.each(SPLIT_CASES)(
    "@AC2 splits %j into its SLD and TLD",
    (input, expected) => {
      expect(parseDomain(input)).toEqual(expected);
    }
  );

  it.each(SPLIT_CASES)(
    "@AC2 splits object input { domain: %j } into its SLD and TLD",
    (input, expected) => {
      expect(parseDomain({ domain: input })).toEqual(expected);
    }
  );

  it.each(UNPARSED_CASES)("@AC2 returns undefined for %j", input => {
    expect(parseDomain(input)).toBeUndefined();
  });

  it.each(UNPARSED_CASES)(
    "@AC2 returns undefined for object input { domain: %j }",
    input => {
      expect(parseDomain({ domain: input })).toBeUndefined();
    }
  );
});
