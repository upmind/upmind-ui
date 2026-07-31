/**
 * The `@playground-include`/`@playground-exclude` JSDoc grammar (design §8).
 * This story owns the grammar; FE-2968's stamper is the emitter — it writes
 * a tag only where none exists (auto-derived + overridable, ADR-027 Am.6).
 */
export const PLAYGROUND_JSDOC_TAG = {
  INCLUDE: "@playground-include",
  EXCLUDE: "@playground-exclude"
} as const;

export type PlaygroundTagKind = "include" | "exclude";

/**
 * One parsed tag. `reason` is present only for a well-formed exclude; a bare
 * `@playground-exclude` with no reason text parses to `reason` absent — never
 * coerced into a valid entry (the gate reads that as `missing-reason`).
 * Conventional first tokens (`lifecycle | internal | delegated`) are carried
 * as free text inside `reason`, never validated against an enum.
 */
export interface PlaygroundTag {
  kind: PlaygroundTagKind;
  reason?: string;
}

/** Action member name → its parsed tag; an untagged member is absent (not `undefined`-valued). */
export type PlaygroundTagMap = Record<string, PlaygroundTag | undefined>;
