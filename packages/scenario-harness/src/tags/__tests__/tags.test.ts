import { describe, expect, it } from "vitest";
import { parsePlaygroundTags } from "../tags";
import { TAG_KIND } from "../tags.types";

const SOURCE = `
export function createModuleActions() {
  return {
    /** @scenario-include */
    doThing() {},

    /** @scenario-exclude lifecycle */
    destroy() {},

    /** @scenario-exclude internal — never surfaced to the playground */
    resolve() {},

    /** @scenario-exclude */
    brokenExclude() {},

    /** @scenario-exclude retro-note-not-a-conventional-token */
    freeform() {},

    untaggedThing() {}
  };
}
`;

/**
 * @AC-7 — the `@scenario-include`/`@scenario-exclude` JSDoc grammar.
 * Parsing fixtures only — the coverage-gate verdict behaviours themselves
 * are `coverage-gate.test.ts`.
 */
describe("@AC-7 parsePlaygroundTags — the tag grammar parser", () => {
  const tags = parsePlaygroundTags(SOURCE);

  it("parses an include tag with no reason", () => {
    expect(tags.doThing).toStrictEqual({ kind: TAG_KIND.INCLUDE });
  });

  it("parses an exclude tag with its reason text", () => {
    expect(tags.destroy).toStrictEqual({
      kind: TAG_KIND.EXCLUDE,
      reason: "lifecycle"
    });
  });

  it("carries the full reason text, including free text after the conventional first token", () => {
    expect(tags.resolve).toStrictEqual({
      kind: TAG_KIND.EXCLUDE,
      reason: "internal — never surfaced to the playground"
    });
  });

  it("surfaces a reason-less exclude as a violation, never coerced into a valid entry", () => {
    expect(tags.brokenExclude?.kind).toBe(TAG_KIND.EXCLUDE);
    expect(tags.brokenExclude?.reason).toBeUndefined();
  });

  it("carries an unconventional first token as free text, never validated against an enum", () => {
    expect(tags.freeform).toStrictEqual({
      kind: TAG_KIND.EXCLUDE,
      reason: "retro-note-not-a-conventional-token"
    });
  });

  it("an untagged member is absent from the map, not merely undefined-valued", () => {
    expect("untaggedThing" in tags).toBe(false);
    expect(tags.untaggedThing).toBeUndefined();
  });
});

describe("@AC-7 parsePlaygroundTags — anchored detection", () => {
  it("a prose mention of the tag mid-sentence, not at the start of a doc-comment line, is not parsed as a tag", () => {
    const source = `
export function createModuleActions() {
  return {
    /** This member mentions @scenario-exclude only in passing prose, not as a tag. */
    proseMention() {}
  };
}
`;
    const tags = parsePlaygroundTags(source);

    expect("proseMention" in tags).toBe(false);
    expect(tags.proseMention).toBeUndefined();
  });

  it("a reason written on the line following the tag is not picked up — reason is the tag's own line only", () => {
    const source = `
export function createModuleActions() {
  return {
    /**
     * @scenario-exclude
     * lifecycle — this reason text sits on the following doc-comment line
     */
    followingLineReason() {}
  };
}
`;
    const tags = parsePlaygroundTags(source);

    expect(tags.followingLineReason?.kind).toBe(TAG_KIND.EXCLUDE);
    expect(tags.followingLineReason?.reason).toBeUndefined();
  });

  it("refuses to bind a tag to a member it is not directly attached to, rather than binding it to the wrong member", () => {
    const source = `
export function createModuleActions() {
  return {
    /** @scenario-exclude lifecycle */
    // a plain comment sits between the tag and the member it might otherwise attach to
    unattachedFollower() {}
  };
}
`;
    const tags = parsePlaygroundTags(source);

    expect("unattachedFollower" in tags).toBe(false);
    expect(tags.unattachedFollower).toBeUndefined();
  });
});

describe("@AC-7 parsePlaygroundTags — prototype safety", () => {
  it("an own `__proto__`-named member is parsed as its own entry and never pollutes the map's prototype", () => {
    const source = `
export function createModuleActions() {
  return {
    /** @scenario-exclude lifecycle */
    __proto__() {},

    /** @scenario-include */
    doThing() {}
  };
}
`;
    const tags = parsePlaygroundTags(source);

    expect(Object.getPrototypeOf({})).not.toHaveProperty("kind");
    expect(Object.hasOwn(tags, "__proto__")).toBe(true);
    expect(tags.__proto__).toStrictEqual({
      kind: TAG_KIND.EXCLUDE,
      reason: "lifecycle"
    });
    expect(tags.doThing).toStrictEqual({ kind: TAG_KIND.INCLUDE });
  });

  it("an untagged `toString`-named member reads as absent, never as Object.prototype's own toString", () => {
    const source = `
export function createModuleActions() {
  return {
    toString() {}
  };
}
`;
    const tags = parsePlaygroundTags(source);

    expect(Object.hasOwn(tags, "toString")).toBe(false);
    expect(tags.toString).toBeUndefined();
  });
});
