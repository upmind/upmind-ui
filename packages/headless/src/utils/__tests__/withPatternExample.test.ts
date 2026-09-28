// -----------------------------------------------------------------------------
/**
 * @fileoverview withPatternExample — a pattern error shows an example value
 *
 * ## Job To Be Done
 * A `pattern` validation error carries the raw regex in its data. The message
 * reads better with a value the user can copy, so the regex is swapped for the
 * smallest string that matches it. Every other error, and every regex that
 * cannot be parsed, keeps its data as it came in.
 *
 * ## What Breaks If These Fail
 * The user sees a regex (or an example that does not match it) in the error
 * text, a non-pattern error has its data rewritten, or a malformed schema
 * pattern throws while the message is built.
 */

import { describe, expect, it } from "vitest";
// -----------------------------------------------------------------------------
import { withPatternExample } from "../useValidation";

// -----------------------------------------------------------------------------

describe("withPatternExample — data it leaves alone", () => {
  it("returns the same data for a keyword that is not pattern", () => {
    const data = { pattern: "^[a-z]+$", limit: 3 };

    expect(withPatternExample("maxLength", data)).toBe(data);
    expect(data.pattern).toBe("^[a-z]+$");
  });

  it("returns undefined when a pattern error has no data", () => {
    expect(withPatternExample("pattern", undefined)).toBeUndefined();
  });

  it("returns the same data when the pattern is an empty string", () => {
    const data = { pattern: "" };

    expect(withPatternExample("pattern", data)).toBe(data);
  });

  it("returns the same data when the pattern is not a string", () => {
    const missing = { limit: 1 };
    const numeric = { pattern: 42 };

    expect(withPatternExample("pattern", missing)).toBe(missing);
    expect(withPatternExample("pattern", numeric)).toBe(numeric);
  });

  it("returns the same data when the regex cannot be parsed", () => {
    const data = { pattern: "([a-z]" };

    expect(withPatternExample("pattern", data)).toBe(data);
    expect(data.pattern).toBe("([a-z]");
  });
});

describe("withPatternExample — a parseable pattern", () => {
  it("returns a copy whose pattern is an example that matches the regex", () => {
    const regex = "^[A-Z]{2}-\\d{3,5}$";
    const data = { pattern: regex, instancePath: "/postcode" };

    const result = withPatternExample("pattern", data);

    expect(result).not.toBe(data);
    expect(result?.instancePath).toBe("/postcode");
    expect(String(result?.pattern)).toMatch(new RegExp(regex));
    expect(data.pattern).toBe(regex);
  });

  it("generates the smallest choice at every repeat, class and branch", () => {
    const result = withPatternExample("pattern", {
      pattern: "^[b-d]{2,4}(xy|z)\\d+$"
    });

    expect(result?.pattern).toBe("bbxy0");
  });

  it("gives the same example on every call", () => {
    const pattern = "^[a-f0-9]{4,8}\\.[a-z]*$";

    const first = withPatternExample("pattern", { pattern });
    const second = withPatternExample("pattern", { pattern });

    expect(first?.pattern).toBe(second?.pattern);
    expect(String(first?.pattern)).toMatch(new RegExp(pattern));
  });
});
