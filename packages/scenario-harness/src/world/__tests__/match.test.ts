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

describe("matchesExpectation — refuses what asserts nothing", () => {
  it("a function or a primitive is not an expectation, and never passes", () => {
    const live = { model: { enabled: 1 } };

    expect(
      matchesExpectation(
        live,
        (() => true) as unknown as Record<string, unknown>
      )
    ).toBe(false);
    expect(
      matchesExpectation(live, "enabled" as unknown as Record<string, unknown>)
    ).toBe(false);
  });
});

describe("matchesExpectation — an array is a membership, in any order", () => {
  it("finds the named rows wherever the list draws them", () => {
    const live = {
      data: [
        { id: "a", meta: { isDefault: false } },
        { id: "b", meta: { isDefault: true } }
      ]
    };

    expect(
      matchesExpectation(live, {
        data: [{ id: "b", meta: { isDefault: true } }]
      })
    ).toBe(true);
    expect(
      matchesExpectation(live, {
        data: [{ id: "a", meta: { isDefault: true } }]
      })
    ).toBe(false);
    expect(matchesExpectation(live, { data: [{ id: "zzz" }] })).toBe(false);
  });
});
