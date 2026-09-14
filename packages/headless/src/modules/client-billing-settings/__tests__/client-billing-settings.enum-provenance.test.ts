// -----------------------------------------------------------------------------
/**
 * @fileoverview client-billing-settings enum provenance (AC-3)
 *
 * ## Job To Be Done
 * Pin that `InvoiceConsolidationTypes`, `InvoiceConsolidationRuleTypes` and
 * `DaysOfWeekTypes` are CONSUMED from `@upmind-automation/types`, never
 * re-declared inside this module — so a future enum change in that package
 * reaches this module without an edit here (design.md §4.2, parity row C3).
 *
 * ## What Breaks If These Fail
 * A locally re-declared enum silently drifts from the real one the moment
 * `packages/types` adds or renames a member, and this module keeps compiling
 * against a stale copy nobody notices.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

const MODULE_DIR = join(import.meta.dirname, "..");

const ENUM_NAMES = [
  "InvoiceConsolidationTypes",
  "InvoiceConsolidationRuleTypes",
  "DaysOfWeekTypes"
];

function moduleSourceFiles(): string[] {
  return readdirSync(MODULE_DIR)
    .filter(file => file.endsWith(".ts") && !file.endsWith(".d.ts"))
    .map(file => join(MODULE_DIR, file));
}

describe("client-billing-settings enum provenance (AC-3)", () => {
  it("consumes the three legacy enums from @upmind-automation/types, never re-declaring them locally", () => {
    const offenders: string[] = [];

    for (const file of moduleSourceFiles()) {
      const content = readFileSync(file, "utf-8");
      for (const name of ENUM_NAMES) {
        const redeclared = new RegExp(`\\benum\\s+${name}\\b`).test(content);
        if (redeclared) offenders.push(`${file} redeclares enum ${name}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it("never mirrors a legacy enum's members as a local object-literal copy", () => {
    const offenders: string[] = [];
    // A local object-literal stand-in for one of these enums would carry
    // every one of that enum's own member names as string values in one
    // object — e.g. `{ DISABLED: 0, ENABLED: 1, INHERIT: 2 }` for
    // InvoiceConsolidationTypes. Matching the full member set, not any one
    // key, keeps this from false-flagging an unrelated object that happens
    // to share ONE key name (e.g. `enabled`).
    const memberSets: Record<string, string[]> = {
      InvoiceConsolidationTypes: ["DISABLED", "ENABLED", "INHERIT"],
      InvoiceConsolidationRuleTypes: [
        "DAILY",
        "DATE_OF_MONTH",
        "DAY_OF_WEEK",
        "FIRST_DAY_OF_MONTH",
        "LAST_DAY_OF_MONTH"
      ],
      DaysOfWeekTypes: [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY"
      ]
    };

    for (const file of moduleSourceFiles()) {
      const content = readFileSync(file, "utf-8");
      for (const [name, members] of Object.entries(memberSets)) {
        const allPresent = members.every(member =>
          new RegExp(`\\b${member}\\b`).test(content)
        );
        if (allPresent && !content.includes(`import`)) {
          offenders.push(
            `${file} appears to mirror ${name}'s member set locally`
          );
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
