import { describe, expect, it } from "vitest";
import { parsePlaygroundTags } from "../tags";

const SOURCE = `
export function createModuleActions() {
  return {
    /** @playground-include */
    doThing() {},

    /** @playground-exclude lifecycle */
    destroy() {},

    /** @playground-exclude internal — never surfaced to the playground */
    resolve() {},

    /** @playground-exclude */
    brokenExclude() {},

    /** @playground-exclude retro-note-not-a-conventional-token */
    freeform() {},

    untaggedThing() {}
  };
}
`;

/**
 * @AC-7 — the `@playground-include`/`@playground-exclude` JSDoc grammar
 * (design §8). Parsing fixtures only — the coverage-gate verdict behaviours
 * themselves are `coverage-gate.test.ts`.
 */
describe("@AC-7 parsePlaygroundTags — the tag grammar parser", () => {
  const tags = parsePlaygroundTags(SOURCE);

  it("parses an include tag with no reason", () => {
    expect(tags.doThing).toStrictEqual({ kind: "include" });
  });

  it("parses an exclude tag with its reason text", () => {
    expect(tags.destroy).toStrictEqual({
      kind: "exclude",
      reason: "lifecycle"
    });
  });

  it("carries the full reason text, including free text after the conventional first token", () => {
    expect(tags.resolve).toStrictEqual({
      kind: "exclude",
      reason: "internal — never surfaced to the playground"
    });
  });

  it("surfaces a reason-less exclude as a violation, never coerced into a valid entry", () => {
    expect(tags.brokenExclude?.kind).toBe("exclude");
    expect(tags.brokenExclude?.reason).toBeUndefined();
  });

  it("carries an unconventional first token as free text, never validated against an enum", () => {
    expect(tags.freeform).toStrictEqual({
      kind: "exclude",
      reason: "retro-note-not-a-conventional-token"
    });
  });

  it("an untagged member is absent from the map, not merely undefined-valued", () => {
    expect("untaggedThing" in tags).toBe(false);
    expect(tags.untaggedThing).toBeUndefined();
  });
});
