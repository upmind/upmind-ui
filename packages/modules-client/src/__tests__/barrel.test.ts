// -----------------------------------------------------------------------------
/**
 * @fileoverview The curated public barrel of the `client` box
 *
 * ## Job To Be Done
 * Publish the renderer set and the rows, and nothing from the packages beneath it.
 *
 * ## What Breaks If These Fail
 * A missing export breaks a consumer build, or a lower package's symbol leaks through.
 */

import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as foundation from "@upmind-automation/foundation";
import * as headless from "@upmind-automation/headless";
import * as barrel from "../index";

// -----------------------------------------------------------------------------

const RENDERER_ENTRIES = ["clientRenderers"];

const ROWS = ["AddressItem", "CompanyItem", "PhoneItem"];

const HEADLESS_COMPOSABLES = [
  "useClientAddresses",
  "useClientAddressManager",
  "useClientEmails",
  "useClientEmailManager",
  "useClientCompanies",
  "useClientCompanyManager",
  "useClientPhones",
  "useClientPhoneManager"
];

const exported = Object.keys(barrel)
  .filter(name => name !== "default")
  .sort();

// -----------------------------------------------------------------------------

const SOURCE_ROOT = resolve(import.meta.dirname, "..");

const barrelSource = readFileSync(join(SOURCE_ROOT, "index.ts"), "utf8");

// -----------------------------------------------------------------------------

describe("the client package's curated public barrel", () => {
  it("publishes the renderer set", () => {
    expect(exported).toEqual(expect.arrayContaining(RENDERER_ENTRIES));
  });

  it("publishes the three rows the manage kit draws", () => {
    expect(exported).toEqual(expect.arrayContaining(ROWS));
  });

  it("re-exports no headless composable, so each has one import path", () => {
    const leaked = HEADLESS_COMPOSABLES.filter(name => exported.includes(name));

    expect(leaked).toEqual([]);
  });

  it("re-exports nothing at all from the packages beneath it", () => {
    const upstream = new Set([
      ...Object.keys(headless),
      ...Object.keys(foundation)
    ]);
    const passedThrough = exported.filter(name => upstream.has(name));

    expect(
      passedThrough,
      `a lower package's symbols are published from here: ${passedThrough.join(", ")}`
    ).toEqual([]);
  });

  it("re-exports nothing by wildcard", () => {
    expect(barrelSource).not.toMatch(/^\s*export\s+\*/m);
  });
});
