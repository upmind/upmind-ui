// -----------------------------------------------------------------------------
/**
 * @module surfaces/record/__tests__/absent-date.spec
 * @description `isAbsentDate` — whether a record's date descriptor carries a
 * REAL date or only the API's zero sentinel. The record surface draws a date
 * cell only when this reads `false`, so a null, empty or pre-1970 date collapses
 * its field rather than drawing as "127 years ago".
 *
 * ## What Breaks If These Fail
 * A contract with no end date renders a bogus "55 years ago", and a field the
 * record should hide draws a lie — the exact FE-3206 shape the record archetype
 * added this guard for.
 */

import { describe, expect, it } from "vitest";
import { isAbsentDate } from "../../../../scenario.utils";

// -----------------------------------------------------------------------------

describe("isAbsentDate — an absent date is one no field should draw", () => {
  it("reads a missing date as absent", () => {
    expect(isAbsentDate(null)).toBe(true);
    expect(isAbsentDate(undefined)).toBe(true);
    expect(isAbsentDate("")).toBe(true);
    expect(isAbsentDate({ date: null, relative: "" })).toBe(true);
    expect(isAbsentDate({ date: "", relative: "" })).toBe(true);
  });

  it("reads the API's zero sentinel as absent, however it is formatted", () => {
    expect(isAbsentDate("1899-12-30")).toBe(true);
    expect(
      isAbsentDate({ date: "1899-12-30", relative: "127 years ago" })
    ).toBe(true);
    expect(isAbsentDate({ date: "Dec 30, 1899" })).toBe(true);
  });

  it("reads anything at or before the epoch year as absent", () => {
    expect(isAbsentDate("1969-06-01")).toBe(true);
    expect(isAbsentDate({ date: "1 Jan 1970" })).toBe(true);
  });

  it("reads a real date as present, as a descriptor or a raw string", () => {
    expect(isAbsentDate({ date: "2024-06-15", relative: "last year" })).toBe(
      false
    );
    expect(isAbsentDate("15 Jun 2024")).toBe(false);
  });
});
