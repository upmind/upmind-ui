/**
 * The `@scenario-include`/`@scenario-exclude` JSDoc grammar.
 * This story owns the grammar; FE-2968's stamper is the emitter — it writes
 * a tag only where none exists (auto-derived + overridable, ADR-027 Am.6).
 */
export const SCENARIO_JSDOC_TAG = {
  INCLUDE: "@scenario-include",
  EXCLUDE: "@scenario-exclude"
} as const;

export const TAG_KIND = {
  INCLUDE: "include",
  EXCLUDE: "exclude"
} as const;

export type PlaygroundTagKind = (typeof TAG_KIND)[keyof typeof TAG_KIND];

/**
 * One parsed tag. `reason` is present only for a well-formed exclude; a bare
 * `@scenario-exclude` with no reason text parses to `reason` absent — never
 * coerced into a valid entry (the gate reads that as `missing-reason`).
 * `reason` is the remainder of the TAG'S OWN doc-comment line only — a reason
 * written on a following line is not picked up. Conventional first tokens
 * (`lifecycle | internal | delegated`) are carried as free text inside
 * `reason`, never validated against an enum.
 */
export type PlaygroundTag = {
  kind: PlaygroundTagKind;
  reason?: string;
};

/** Action member name → its parsed tag; an untagged member is absent (not `undefined`-valued). */
export type PlaygroundTagMap = Record<string, PlaygroundTag | undefined>;
