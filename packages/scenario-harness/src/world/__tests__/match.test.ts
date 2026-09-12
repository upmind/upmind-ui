import { describe, expect, it } from "vitest";
import { matchesExpectation } from "../match";

describe("matchesExpectation — the World's one subset match", () => {
  it("matches a deep subset and rejects a differing value", () => {
    const live = { model: { enabled: 1, brand: { enabled: true } }, id: "x" };

    expect(matchesExpectation(live, { model: { enabled: 1 } })).toBe(true);
    expect(matchesExpectation(live, { model: { enabled: 2 } })).toBe(false);
    expect(matchesExpectation(live, { id: "y" })).toBe(false);
  });

  it("reads an expected null as cleared: null or absent both satisfy it", () => {
    expect(
      matchesExpectation(
        { model: { enabled: 1 } },
        { model: { baseRule: null } }
      )
    ).toBe(true);
    expect(
      matchesExpectation(
        { model: { baseRule: null } },
        { model: { baseRule: null } }
      )
    ).toBe(true);
    expect(
      matchesExpectation(
        { model: { baseRule: "daily" } },
        { model: { baseRule: null } }
      )
    ).toBe(false);
  });

  it("never pads a non-null expectation — an absent value is still a mismatch", () => {
    expect(matchesExpectation({ model: {} }, { model: { enabled: 1 } })).toBe(
      false
    );
    expect(matchesExpectation({}, { isDirty: false })).toBe(false);
  });
});
